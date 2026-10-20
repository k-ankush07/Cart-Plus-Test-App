import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {

  console.log("[orders/paid] webhook received at", new Date().toISOString());

  let shop, payload, session;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
    payload = result.payload;
    session = result.session;
  } catch (err) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!payload) {
    return new Response();
  }

  try {
    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
    const apiSecret =
      process.env.API_SECRET_KEY || process.env.VITE_API_SECRET_KEY || "";
    const apiHeaders = {
      "Content-Type": "application/json",
      "x-api-key": apiSecret,
    };

    // 1) Check that the cart-drawer app embed is enabled in the live theme.
    let appEmbedInstalled = false;
    try {
      const accessToken = session?.accessToken;
      console.log(
        `[orders/paid] embed-check: session=${!!session} token=${!!accessToken}`,
      );
      if (!accessToken) {
        throw new Error("missing access token in webhook session");
      }

      const restHeaders = {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      };

      // Find the main (live) theme via REST.
      const themesRes = await fetch(
        `https://${shop}/admin/api/2025-10/themes.json?role=main`,
        { headers: restHeaders },
      );
      if (!themesRes.ok) {
        throw new Error(
          `themes.json failed status=${themesRes.status} body=${(await themesRes.text())?.slice(0, 200)}`,
        );
      }
      const themesData = await themesRes.json();
      const mainThemeId =
        themesData?.themes?.find((t) => t.role === "main")?.id ||
        themesData?.themes?.[0]?.id;
      if (!mainThemeId) {
        throw new Error("no main theme found");
      }

      const assetRes = await fetch(
        `https://${shop}/admin/api/2025-10/themes/${mainThemeId}/assets.json?asset[key]=config/settings_data.json`,
        { headers: restHeaders },
      );
      if (!assetRes.ok) {
        throw new Error(
          `assets.json failed status=${assetRes.status} body=${(await assetRes.text())?.slice(0, 200)}`,
        );
      }
      const assetData = await assetRes.json();
      if (!assetData?.asset?.value) {
        throw new Error(
          `theme asset missing — body=${JSON.stringify(assetData)?.slice(0, 200)}`,
        );
      }
      const settings = JSON.parse(assetData.asset.value);
      const blocks = settings?.current?.blocks || {};
      for (const key in blocks) {
        const block = blocks[key];
        if (block?.type?.includes("shopify://apps/cart-plus/")) {
          if (!block?.disabled) appEmbedInstalled = true;
          break;
        }
      }
    } catch (e) {
      let detail = e?.message;
      // If a Response was thrown, read its body for context.
      if (e instanceof Response) {
        try {
          detail = `Response status=${e.status} body=${(await e.text())?.slice(0, 300)}`;
        } catch {
          detail = `Response status=${e.status}`;
        }
      }
      console.error(
        "[orders/paid] app-embed check failed:",
        detail || e?.toString?.() || JSON.stringify(e),
      );
    }

    if (!appEmbedInstalled) {
      console.log(
        `[orders/paid] #${payload.order_number} skipped — app embed not enabled for ${shop}`,
      );
      return new Response();
    }

    // 2) Check that the shop has at least one published cart.
    let hasPublishedCart = false;
    try {
      const statusRes = await fetch(
        `${apiUrl}/api/get-carts?shop=${encodeURIComponent(shop)}`,
        { headers: apiHeaders },
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const carts = statusData?.data || [];
        hasPublishedCart = carts.some((c) => c.status === "published");
      } else {
        console.error(
          `[orders/paid] get-carts failed status=${statusRes.status} body=${(await statusRes.text())?.slice(0, 200)}`,
        );
      }
    } catch (e) {
      console.error("[orders/paid] published-cart check failed:", e.message);
    }

    if (!hasPublishedCart) {
      console.log(
        `[orders/paid] #${payload.order_number} skipped — no published cart for ${shop}`,
      );
      return new Response();
    }

    let lineItems = payload.line_items || [];

    // The webhook payload sometimes omits selling_plan_allocation. Fetch the
    // order via Admin REST to get authoritative selling_plan_id per line.
    try {
      const accessToken = session?.accessToken;
      if (accessToken) {
        const orderRes = await fetch(
          `https://${shop}/admin/api/2025-10/orders/${payload.id}.json?fields=line_items`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          },
        );
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const adminItems = orderData?.order?.line_items || [];
          const planById = new Map(
            adminItems.map((li) => [String(li.id), li.selling_plan_allocation || (li.selling_plan_id ? { selling_plan: { id: li.selling_plan_id } } : null)]),
          );
          lineItems = lineItems.map((li) => ({
            ...li,
            selling_plan_allocation:
              li.selling_plan_allocation || planById.get(String(li.id)) || null,
          }));
        } else {
          console.warn(
            `[orders/paid] admin order fetch failed status=${orderRes.status}`,
          );
        }
      }
    } catch (e) {
      console.error("[orders/paid] admin order fetch error:", e?.message);
    }

    let upsellRevenue = 0;
    let addonRevenue = 0;
    let subscriptionRevenue = 0;
    let baseRevenue = 0;

    for (const item of lineItems) {
      const lineTotal = parseFloat(item.price || 0) * (item.quantity || 1);

      const props = (item.properties || []).reduce((acc, p) => {
        acc[p.name] = p.value;
        return acc;
      }, {});

      const isSubscription =
        !!item.selling_plan_allocation || !!props._hub_subscription;

      if (props._hub_addon || props.__upcartAddon) {
        addonRevenue += lineTotal;
      } else if (props.__upcartRecommendation) {
        upsellRevenue += lineTotal;
      } else if (isSubscription) {
        subscriptionRevenue += lineTotal;
      } else if (props._hub_reward || props._triggered_reward) {
        // tracked but contributes no revenue
      } else {
        baseRevenue += lineTotal;
      }
    }

    const totalRevenue = upsellRevenue + addonRevenue + subscriptionRevenue;

    const res = await fetch(`${apiUrl}/api/order-revenue`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        shop,
        orderId: String(payload.id),
        orderNumber: payload.order_number,
        currency: payload.currency || "USD",
        cartToken: payload.cart_token || String(payload.id),
        totalRevenue,
        upsellRevenue,
        addonRevenue,
        subscriptionRevenue,
        baseRevenue,
      }),
    });

    console.log("[orders/paid] line_items:", JSON.stringify(lineItems.map(i => ({
      title: i.title,
      selling_plan_allocation: i.selling_plan_allocation,
      properties: i.properties,
    }))));

    const data = await res.json().catch(() => ({}));
    console.log(
      `[orders/paid] #${payload.order_number} response status=${res.status} body=`,
      JSON.stringify(data),
    );
  } catch (err) {
    console.error("[orders/paid] processing error:", err.message);
  }

  return new Response();
};
