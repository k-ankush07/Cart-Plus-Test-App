import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {

  let shop, payload;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
    payload = result.payload;
  } catch (err) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!payload) {
    return new Response();
  }

  try {
    const lineItems = payload.line_items || [];

    let upsellRevenue = 0;
    let addonRevenue = 0;
    let subscriptionRevenue = 0;
    let baseRevenue = 0;
    let hubTouched = false;

    for (const item of lineItems) {
      const lineTotal = parseFloat(item.price || 0) * (item.quantity || 1);

      const props = (item.properties || []).reduce((acc, p) => {
        acc[p.name] = p.value;
        return acc;
      }, {});

      if (props._hub_addon || props.__upcartAddon) {
        addonRevenue += lineTotal;
        hubTouched = true;
      } else if (props.__upcartRecommendation) {
        upsellRevenue += lineTotal;
        hubTouched = true;
      } else if (props._hub_subscription) {
        subscriptionRevenue += lineTotal;
        hubTouched = true;
      } else if (props._hub_reward || props._triggered_reward) {
        hubTouched = true;
      } else {
        baseRevenue += lineTotal;
      }
    }

    // Skip orders where the cart drawer was not involved at all
    if (!hubTouched) {
      console.log(`[orders/paid] #${payload.order_number} skipped — no cart drawer items`);
      return new Response();
    }

    const totalRevenue = upsellRevenue + addonRevenue + subscriptionRevenue;

    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();

    const res = await fetch(`${apiUrl}/api/order-revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    const data = await res.json();
    console.log(`[orders/paid] #${payload.order_number} saved:`, JSON.stringify(data));
  } catch (err) {
    console.error("[orders/paid] processing error:", err.message);
  }

  return new Response();
};
