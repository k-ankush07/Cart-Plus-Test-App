import {
  Page,
  Text,
  InlineStack,
  Badge,
  IndexTable,
  Button,
  Tooltip,
  BlockStack,
  Box,
  Collapsible,
  ProgressBar,
  Divider,
} from "@shopify/polaris";

import { getCarts, getCartStats } from "../services/apiRoutes";
import { shopLoader } from "./components/shop.server";
import DateRangePicker from "./components/ui/DateRangePicker";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import CartHoverCard from "./components/ui/CartHoverCard"

function SetupTask({ title, description, actionLabel, completed, isEmbedStarted, onAction }) {
  return (
    <Box paddingBlockStart="400" paddingBlockEnd="400" paddingInlineStart="500" paddingInlineEnd="500">
      <InlineStack align="space-between" blockAlign="start" gap="400">
        <BlockStack gap="150">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="semibold">{title}</Text>
            <InlineStack gap="200" blockAlign="center">

              {completed ? (
                <Badge tone="success">Completed</Badge>
              ) : isEmbedStarted ? (
                <Badge tone="warning">In Progress</Badge>
              ) : (
                <Badge tone="info">Recommended</Badge>
              )}
            </InlineStack>
          </InlineStack>
          <Text variant="bodySm" tone="subdued">{description}</Text>
        </BlockStack>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <Button size="slim" onClick={onAction}>{actionLabel}</Button>
        </div>
      </InlineStack>
    </Box>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────

function buildSetupTasks(liveCart, navigate, shop, appEmbedId, mainThemeId, appEmbedInstalled, appEmbedStarted) {
  const cartId = liveCart?.cartId;
  const goTo = (module) => () => cartId && navigate(`/app/cart-editor/${cartId}?module=${module}`);
  const storeHandle = shop?.myshopifyDomain?.replace(".myshopify.com", "") || "";
  const themeId = mainThemeId || "current";

  return [
    {
      title: "Add upsells",
      description: "Boost your AOV by using Upcart's high converting upsell offers. Head over to the cart editor to add upsells to your cart drawer.",
      actionLabel: "Add upsells",
      completed: liveCart?.upsellsSettings?.enabled === true,
      onAction: goTo("upsells"),
    },
    {
      title: "Add rewards",
      description: "Add a rewards module to offer urge customers to shop more. Create a free shipping bar, offer a free gift, or other rewards.",
      actionLabel: "Add rewards",
      completed: liveCart?.rewardsSettings?.enabled === true,
      onAction: goTo("rewards"),
    },
    {
      title: "Add triggered rewards",
      description: "Create advanced reward rules that combine multiple conditions (cart value, products, collections, subscriptions, etc.) and apply powerful discounts through our discount function system.",
      actionLabel: "Add triggered rewards",
      completed: Array.isArray(liveCart?.rewards) && liveCart.rewards.length > 0,
      onAction: goTo("triggered-rewards"),
    },
    {
      title: "Upcart App Embed Installation",
      description: "Before enabling Upcart, you need to first set up the Upcart app embed in your Shopify theme.",
      actionLabel: "Install Upcart app embed",
      completed: appEmbedInstalled,
      isEmbedStarted: appEmbedStarted,
      onAction: () => window.open(`https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`, "_blank"),
    },
    {
      title: "Activate Upcart",
      description: "Go to the cart editor and activate Upcart by switching it from 'Disabled' to 'Active'.",
      actionLabel: "Activate Upcart",
      completed: !!liveCart,
      onAction: () => navigate("/app/carts"),
    },
  ];
}

export const loader = async ({ request }) => {
  const { shop, apiUrl, accessToken, currency, admin } = await shopLoader(request);

  let appEmbedId = process.env.SHOPIFY_API_KEY || "";
  let mainThemeId = "current";

  let appEmbedInstalled = false;
  let appEmbedStarted = false;

  try {
    const themeRes = await admin.graphql(`
      { themes(first: 5, roles: [MAIN]) { nodes { id } } }
    `);
    const themeData = await themeRes.json();
    const rawId = themeData?.data?.themes?.nodes?.[0]?.id || "";
    mainThemeId = rawId.split("/").pop() || "current";
  } catch (e) {
    // fallback to "current"
  }

  try {
    const assetRes = await fetch(
      `https://${shop.myshopifyDomain}/admin/api/2025-10/themes/${mainThemeId}/assets.json?asset[key]=config/settings_data.json`,
      { headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" } }
    );
    const assetData = await assetRes.json();
    const settings = JSON.parse(assetData.asset.value);
    const blocks = settings?.current?.blocks || {};
    const embedUuid = process.env.SHOPIFY_APP_EMBED_ID || "af3da5fb-f5f7-40ec-8273-41bf50059d4b";
    for (const key in blocks) {
      const block = blocks[key];
      if (block?.type?.startsWith("shopify://apps/cart-drawer/")) {
        appEmbedStarted = true;

        if (block?.disabled === false) {
          appEmbedInstalled = true;
        }

        break;
      }
    }
  } catch (e) {
  }

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  let carts = [];
  let cartStats = {};
  let shopRevenue = { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 };

  try {
    const cartsData = await getCarts(apiUrl, shop.myshopifyDomain);
    carts = cartsData.data || [];
  } catch (err) {
    console.error("GET CARTS ERROR:", err);
  }

  try {
    const statsData = await getCartStats(
      apiUrl,
      shop.myshopifyDomain,
      defaultStart.toISOString(),
      today.toISOString()
    );
    cartStats = statsData.data || {};
    shopRevenue = statsData.shopRevenue || shopRevenue;
  } catch (err) {
    console.error("GET CART STATS ERROR:", err);
  }

  return Response.json({ shop, apiUrl, accessToken, currency, carts, cartStats, shopRevenue, appEmbedId, mainThemeId, appEmbedInstalled, appEmbedStarted });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start, end };
}

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Number(n ?? 0));

// ─── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ type = "flat" }) {
  const paths = {
    spike: { line: "M2,38 L62,38 L65,26 L67.5,2 L70,38", area: "M2,38 L62,38 L65,26 L67.5,2 L70,38 L70,40 L2,40Z", cy: "38" },
    peak: { line: "M2,38 L62,38 L65,2 L67.5,37 L70,38", area: "M2,38 L62,38 L65,2 L67.5,37 L70,38 L70,40 L2,40Z", cy: "38" },
    flat: { line: "M2,20 L70,20", area: "M2,20 L70,20 L70,40 L2,40Z", cy: "20" },
  };
  const p = paths[type] || paths.flat;
  return (
    <svg width="72" height="36" viewBox="0 0 72 40" fill="none">
      <path d={p.area} fill="#C20075" fillOpacity="0.12" />
      <path d={p.line} stroke="#C20075" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="70" cy={p.cy} r="2" fill="#C20075" />
    </svg>
  );
}

function LiveDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12 }}>
      <style>{`@keyframes upcart-pulse{0%{transform:scale(.8);opacity:.7}100%{transform:scale(1.8);opacity:0}}`}</style>
      <span style={{ position: "absolute", width: 12, height: 12, borderRadius: "50%", background: "#008060", opacity: 0.4, animation: "upcart-pulse 1.5s ease-out infinite" }} />
      <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#008060" }} />
    </span>
  );
}

function StatTile({ label, value, sparklineType }) {
  return (
    <div
      style={{ flex: 1, padding: "14px 16px", cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f6f6f7")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <InlineStack align="space-between" blockAlign="center">
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="semibold">{value}</Text>
            <Badge>—</Badge>
          </InlineStack>
        </BlockStack>
        <div style={{ flexShrink: 0 }}>
          <Sparkline type={sparklineType} />
        </div>
      </InlineStack>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { shop, apiUrl, carts: initialCarts, cartStats: initialCartStats, shopRevenue: initialShopRevenue, appEmbedId, mainThemeId, appEmbedInstalled, appEmbedStarted } = useLoaderData();
  const navigate = useNavigate();
  const [carts, setCarts] = useState(initialCarts || []);
  const [cartStats, setCartStats] = useState(initialCartStats || {});
  const [shopRevenue, setShopRevenue] = useState(initialShopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 });
  const [range, setRange] = useState(getDefaultRange);
  const isFirstRender = useRef(true);
  const [setupOpen, setSetupOpen] = useState(true);

  const liveCarts = carts
    .filter((cart) => cart.status === "published")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const setupTasks = buildSetupTasks(liveCarts[0] || null, navigate, shop, appEmbedId, mainThemeId, appEmbedInstalled, appEmbedStarted);

  const handleSetupToggle = useCallback(() => setSetupOpen((v) => !v), []);
  const completedCount = setupTasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / setupTasks.length) * 100);

  useEffect(() => { setCarts(initialCarts); }, [initialCarts]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          shop: shop.myshopifyDomain,
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
        });
        const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setCartStats(data.data || {});
          setShopRevenue(data.shopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 });
        }
      } catch (err) {
        console.error("STATS FETCH ERROR:", err);
      }
    };
    fetchStats();
  }, [range.start, range.end]);

  return (
    <Page
      title="Welcome to Upcart 🎉"
      primaryAction={
        <InlineStack align="end" gap="300">
          <DateRangePicker value={range} onChange={setRange} />
          <Button variant="primary" onClick={() => navigate("/app/carts")}>
            Manage all carts
          </Button>
        </InlineStack>
      }
    >
      <BlockStack gap="400">
        {/* ── Live carts ── */}
        <BlockStack gap="200">
          <InlineStack gap="200" blockAlign="center">
            <LiveDot />
            <Text variant="headingMd">Live carts</Text>
          </InlineStack>
          <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex" }}>
              <StatTile
                label="Add-ons revenue"
                value={`$${(shopRevenue.addonRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sparklineType="spike"
              />
              <div style={{ width: "1px", background: "#e1e3e5", flexShrink: 0, margin: "12px 0" }} />
              <StatTile
                label="Upsell revenue"
                value={`$${(shopRevenue.upsellRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sparklineType="peak"
              />
              <div style={{ width: "1px", background: "#e1e3e5", flexShrink: 0, margin: "12px 0" }} />
              <StatTile
                label="Subscriptions revenue"
                value={`$${(shopRevenue.subscriptionRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sparklineType="flat"
              />
            </div>
          </div>
        </BlockStack>

        <BlockStack>
          {/* Cart table inside the same card */}
          {liveCarts.length > 0 && (
            <div
              className="compact-cart-table"
              style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--p-color-border)" }}
            >
              <div style={{ padding: "0" }}>
                <IndexTable
                  resourceName={{ singular: "cart", plural: "carts" }}
                  itemCount={liveCarts.length}
                  headings={[
                    { title: "Cart name" },
                    { title: "Status" },
                    {
                      title: (
                        <Tooltip content="The percentage of cart impressions that resulted in a completed purchase.">
                          <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>Cart conversion rate (%)</span>
                        </Tooltip>
                      ),
                    },
                    {
                      title: (
                        <Tooltip content="Revenue generated by Upcart offers in the selected period.">
                          <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>Added revenue</span>
                        </Tooltip>
                      ),
                    },
                    { title: "" },
                  ]}
                  selectable={false}
                >
                  {liveCarts.map((cart, i) => (
                    <IndexTable.Row key={cart.cartId} id={cart.cartId} position={i}>
                      <IndexTable.Cell>
                        <CartHoverCard cart={cart}>
                          <div style={{ maxWidth: "150px", cursor: "pointer" }} onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)}>
                            <Text truncate as="span">{cart.cartName || "Untitled cart"}</Text>
                            <Text as="span" tone="subdued" variant="bodySm">
                              {cart.updatedAt
                                ? `Last edited: ${new Date(cart.updatedAt)
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, "-")}`
                                : ""}
                            </Text>
                          </div>
                        </CartHoverCard>
                      </IndexTable.Cell>
                      <IndexTable.Cell><Badge tone="success">Live</Badge></IndexTable.Cell>
                      <IndexTable.Cell>
                        {cartStats?.[cart.cartId]?.conversionRate != null
                          ? cartStats[cart.cartId].conversionRate.toFixed(2) + "%"
                          : "—"}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {cartStats?.[cart.cartId]?.revenue != null
                          ? fmt(cartStats[cart.cartId].revenue)
                          : "—"}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <InlineStack gap="200" align="end">
                          <Button size="slim" onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)}>Edit cart</Button>
                          <Button size="slim" onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)}>Preview cart</Button>
                        </InlineStack>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </div>
            </div>
          )}
        </BlockStack>
      </BlockStack>

      {/* ── Help & Support ── */}
      <Box paddingInlineStart="200" paddingBlockStart="400">
        <BlockStack gap="200">
          <Text variant="headingMd">Help &amp; Support</Text>

          {/* Setup guide collapsible */}
          <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, overflow: "hidden" }}>
            <button
              type="button"
              onClick={handleSetupToggle}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <Text variant="headingMd">Setup guide</Text>
              <Text tone="subdued">{completedCount} of {setupTasks.length} tasks complete</Text>
              <div style={{ flex: 1 }} />
              <div style={{ width: 200 }}>
                <ProgressBar progress={progressPercent} size="small" tone="primary" />
              </div>
              <span style={{
                display: "inline-block", width: 10, height: 10, flexShrink: 0,
                borderRight: "2px solid #6d7175", borderBottom: "2px solid #6d7175",
                transform: setupOpen ? "rotate(-135deg)" : "rotate(45deg)",
                marginTop: setupOpen ? 3 : -1, marginLeft: 8,
                transition: "transform 0.2s",
              }} />
            </button>

            <Collapsible open={setupOpen} id="setup-guide">
              <div style={{ borderTop: "1px solid #e1e3e5" }}>
                {setupTasks.map((task, i) => (
                  <div key={task.title}>
                    <SetupTask {...task} />
                    {i < setupTasks.length - 1 && <Divider />}
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        </BlockStack>
      </Box>
    </Page>
  );
}
