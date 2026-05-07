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
  Icon
} from "@shopify/polaris";
import { ChevronDownIcon, HeartIcon, NoteIcon, ExternalIcon } from "@shopify/polaris-icons";

import { getCarts, getCartStats } from "../services/apiRoutes";
import { shopLoader } from "./components/shop.server";
import DateRangePicker from "./components/ui/DateRangePicker";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useNavigate, Link } from "react-router-dom";
import CartHoverCard from "./components/ui/CartHoverCard";

// ─── SetupTask ─────────────────────────────────────────────────────────────────

function SetupTask({
  title,
  description,
  actionLabel,
  completed,
  isEmbedStarted,
  onAction,
  hideIncompleteBadge,
}) {
  return (
    <Box padding="500">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(auto, 500px) auto minmax(300px, 30%)",
          alignItems: "start",
          gap: "16px",
        }}
      >
        <BlockStack gap="150">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="semibold">
              {title}
            </Text>
            {completed ? (
              <Badge tone="success">Completed</Badge>
            ) : isEmbedStarted ? (
              <Badge tone="warning">In Progress</Badge>
            ) : hideIncompleteBadge ? null : (
              <Badge tone="info">Recommended</Badge>
            )}
          </InlineStack>
          <Text variant="bodySm" tone="subdued">
            {description}
          </Text>
        </BlockStack>
        <div />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="slim" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </Box>
  );
}

// ─── Setup Tasks Data ──────────────────────────────────────────────────────────

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
      completed: liveCart?.upsellsSettings?.enabled === false,
      onAction: goTo("upsells"),
    },
    {
      title: "Add rewards",
      description: "Add a rewards module to offer urge customers to shop more. Create a free shipping bar, offer a free gift, or other rewards.",
      actionLabel: "Add rewards",
      completed: liveCart?.rewardsSettings?.enabled === false,
      onAction: goTo("rewards"),
    },
    {
      title: "Add triggered rewards",
      description: "Create advanced reward rules that combine multiple conditions (cart value, products, collections, subscriptions, etc.) and apply powerful discounts through our discount function system.",
      actionLabel: "Add triggered rewards",
      completed: Array.isArray(liveCart?.triggeredRewardsSettings?.rewards) && liveCart.triggeredRewardsSettings.rewards.length > 0,
      onAction: goTo("triggered-rewards"),
    },
    {
      title: "Upcart App Embed Installation",
      description: "Before enabling Upcart, you need to first set up the Upcart app embed in your Shopify theme.",
      actionLabel: "Install Upcart app embed",
      completed: appEmbedInstalled,
      isEmbedStarted: false,
      hideIncompleteBadge: true,
      onAction: () =>
        window.open(
          `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
          "_blank"
        ),
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

// ─── Loader ────────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
  const { shop, apiUrl, accessToken, currency, admin } = await shopLoader(request);

  const appEmbedId = process.env.SHOPIFY_API_KEY || "";

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  // ── Run all independent fetches in parallel ────────────────────────────────
  const [themeResult, cartsResult, statsResult] = await Promise.allSettled([
    // 1) Get main theme ID
    admin.graphql(`{ themes(first: 5, roles: [MAIN]) { nodes { id } } }`),
    // 2) Get carts
    getCarts(apiUrl, shop.myshopifyDomain),
    // 3) Get cart stats
    getCartStats(apiUrl, shop.myshopifyDomain, defaultStart.toISOString(), today.toISOString()),
  ]);

  // ── Parse theme ID ─────────────────────────────────────────────────────────
  let mainThemeId = "current";
  if (themeResult.status === "fulfilled") {
    try {
      const themeData = await themeResult.value.json();
      const rawId = themeData?.data?.themes?.nodes?.[0]?.id || "";
      mainThemeId = rawId.split("/").pop() || "current";
    } catch (_) { }
  }

  // ── Check app embed (depends on mainThemeId, run after) ───────────────────
  let appEmbedInstalled = false;
  let appEmbedStarted = false;

  try {
    const assetRes = await fetch(
      `https://${shop.myshopifyDomain}/admin/api/2025-10/themes/${mainThemeId}/assets.json?asset[key]=config/settings_data.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    const assetData = await assetRes.json();
    const settings = JSON.parse(assetData.asset.value);
    const blocks = settings?.current?.blocks || {};

    for (const key in blocks) {
      const block = blocks[key];
      if (block?.type?.includes("shopify://apps/cart-drawer/")) {
        appEmbedStarted = true;
        if (!block?.disabled) appEmbedInstalled = true;
        break;
      }
    }
  } catch (_) { }

  // ── Parse carts & stats ────────────────────────────────────────────────────
  const carts =
    cartsResult.status === "fulfilled" ? cartsResult.value?.data || [] : [];

  const cartStats =
    statsResult.status === "fulfilled" ? statsResult.value?.data || {} : {};

  const shopRevenue =
    statsResult.status === "fulfilled"
      ? statsResult.value?.shopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 }
      : { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 };

  return Response.json({
    shop,
    apiUrl,
    accessToken,
    currency,
    carts,
    cartStats,
    shopRevenue,
    appEmbedId,
    mainThemeId,
    appEmbedInstalled,
    appEmbedStarted,
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start, end };
}

const DEFAULT_RANGE = getDefaultRange();

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(n ?? 0));

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ type = "flat", value = 0 }) {
  // If value is zero, always show flat line regardless of type
  if (Number(value) === 0) type = "flat";
  const lineRef = useRef(null);
  const areaRef = useRef(null);
  const dotRef = useRef(null);

  const paths = {
    spike: {
      line: "M2,38 L62,38 L65,26 L67.5,2 L70,38",
      area: "M2,38 L62,38 L65,26 L67.5,2 L70,38 L70,40 L2,40Z",
      cy: "38",
    },
    peak: {
      line: "M2,38 L62,38 L65,2 L67.5,37 L70,38",
      area: "M2,38 L62,38 L65,2 L67.5,37 L70,38 L70,40 L2,40Z",
      cy: "38",
    },
    flat: {
      line: "M2,20 L70,20",
      area: "M2,20 L70,20 L70,40 L2,40Z",
      cy: "20",
    },
  };
  const p = paths[type] || paths.flat;

  useEffect(() => {
    const line = lineRef.current;
    const area = areaRef.current;
    const dot = dotRef.current;
    if (!line) return;

    // Get total length for stroke-dasharray animation
    const len = line.getTotalLength();

    // Line: draw from left to right
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.transition = "none";

    // Area: fade in after line draws
    area.style.opacity = "0";
    dot.style.opacity = "0";
    dot.style.transform = "scale(0)";
    dot.style.transformOrigin = "70px " + p.cy + "px";

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.style.transition = "stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)";
        line.style.strokeDashoffset = "0";

        // Fade in area slightly after line starts
        setTimeout(() => {
          area.style.transition = "opacity 0.4s ease";
          area.style.opacity = "1";
        }, 300);

        // Pop in dot at end of line
        setTimeout(() => {
          dot.style.transition = "opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
          dot.style.opacity = "1";
          dot.style.transform = "scale(1)";
        }, 650);
      });
    });
  }, [type]);

  return (
    <svg width="72" height="36" viewBox="0 0 72 40" fill="none">
      <path ref={areaRef} d={p.area} fill="#1271A3" fillOpacity="0.12" />
      <path
        ref={lineRef}
        d={p.line}
        stroke="#1271A3"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle ref={dotRef} cx="70" cy={p.cy} r="2" fill="#1271A3" />
    </svg>
  );
}

function LiveDot() {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 12,
        height: 12,
      }}
    >
      <style>{`@keyframes upcart-pulse{0%{transform:scale(.8);opacity:.7}100%{transform:scale(1.8);opacity:0}}`}</style>
      <span
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#008060",
          opacity: 0.4,
          animation: "upcart-pulse 1.5s ease-out infinite",
        }}
      />
      <span
        style={{
          position: "relative",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#008060",
        }}
      />
    </span>
  );
}

function StatTile({ label, value, sparklineType, rawValue, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "background 0.15s",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f6f6f7")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" truncate>{label}</Text>
          <InlineStack gap="300" align="left" blockAlign="center">
            <Text variant="bodyMd" fontWeight="semibold">{value}</Text>
            <Badge>—</Badge>
          </InlineStack>
        </BlockStack>
        <div style={{ flexShrink: 0, marginLeft: 8 }}>
          <Sparkline type={sparklineType} value={rawValue} />
        </div>
      </InlineStack>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    shop,
    apiUrl,
    carts: initialCarts,
    cartStats: initialCartStats,
    shopRevenue: initialShopRevenue,
    appEmbedId,
    mainThemeId,
    appEmbedInstalled,
    appEmbedStarted,
    currency
  } = useLoaderData();

  const navigate = useNavigate();

  const [carts, setCarts] = useState(initialCarts || []);
  const [cartStats, setCartStats] = useState(initialCartStats || {});
  const [shopRevenue, setShopRevenue] = useState(
    initialShopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 }
  );
  const [range, setRange] = useState(getDefaultRange);
  const [setupOpen, setSetupOpen] = useState(false);

  const storeHandle = shop?.myshopifyDomain?.replace(".myshopify.com", "") || "";
  const themeId = mainThemeId || "current";

  const liveCarts = carts
    .filter((cart) => cart.status === "published")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const setupTasks = buildSetupTasks(
    liveCarts[0] || null,
    navigate,
    shop,
    appEmbedId,
    mainThemeId,
    appEmbedInstalled,
    appEmbedStarted
  );

  const handleSetupToggle = useCallback(() => setSetupOpen((v) => !v), []);
  const completedCount = setupTasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / setupTasks.length) * 100);
  const allCompleted = completedCount === setupTasks.length;

  // Sync carts if loader data changes
  useEffect(() => {
    setCarts(initialCarts);
  }, [initialCarts]);

  // ── Fetch stats only when range actually changes from default ──────────────
  useEffect(() => {
    // Skip if range matches the initial default (loader already fetched this)
    if (
      isSameDay(range.start, DEFAULT_RANGE.start) &&
      isSameDay(range.end, DEFAULT_RANGE.end)
    ) {
      return;
    }

    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          shop: shop.myshopifyDomain,
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
        });
        const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setCartStats(data.data || {});
          setShopRevenue(
            data.shopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 }
          );
        }
      } catch (err) {
        console.error("STATS FETCH ERROR:", err);
      }
    };

    fetchStats();
  }, [range.start, range.end, apiUrl, shop.myshopifyDomain]);

  return (
    <Page
      title="Welcome to Custom Cart 🎉"
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

          {/* Revenue tiles */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex" }}>
              <StatTile
                label="Add-ons revenue"
                value={fmt(shopRevenue.addonRevenue ?? 0, currency)}
                rawValue={shopRevenue.addonRevenue ?? 0}
                sparklineType="spike"
                onClick={() => navigate("/app/analytics")}
              />
              <div style={{ width: "1px", background: "#e1e3e5", flexShrink: 0, margin: "12px 0" }} />
              <StatTile
                label="Upsell revenue"
                value={fmt(shopRevenue.upsellRevenue ?? 0, currency)}
                rawValue={shopRevenue.upsellRevenue ?? 0}
                sparklineType="peak"
                onClick={() => navigate("/app/analytics")}
              />
              <div style={{ width: "1px", background: "#e1e3e5", flexShrink: 0, margin: "12px 0" }} />
              <StatTile
                label="Subscriptions revenue"
                value={fmt(shopRevenue.subscriptionRevenue ?? 0, currency)}
                rawValue={shopRevenue.subscriptionRevenue ?? 0}
                sparklineType="flat"
                onClick={() => navigate("/app/analytics")}
              />
              <div style={{ width: "1px", background: "#e1e3e5", flexShrink: 0, margin: "12px 0" }} />
              <StatTile
                label="Total revenue"
                value={fmt(
                  (shopRevenue.addonRevenue ?? 0) +
                  (shopRevenue.upsellRevenue ?? 0) +
                  (shopRevenue.subscriptionRevenue ?? 0),
                  currency
                )}
                rawValue={(shopRevenue.addonRevenue ?? 0) + (shopRevenue.upsellRevenue ?? 0) + (shopRevenue.subscriptionRevenue ?? 0)}
                sparklineType="peak"
                onClick={() => navigate("/app/analytics")}
              />
            </div>
          </div>
        </BlockStack>

        {/* ── Cart table ── */}
        <BlockStack>
          {liveCarts.length > 0 ? (
            <div
              className="compact-cart-table"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--p-color-border)",
              }}
            >
              <IndexTable
                resourceName={{ singular: "cart", plural: "carts" }}
                itemCount={liveCarts.length}
                headings={[
                  { title: "Cart name" },
                  { title: "Status" },
                  {
                    title: (
                      <Tooltip content="The percentage of cart impressions that resulted in a completed purchase.">
                        <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>
                          Cart conversion rate (%)
                        </span>
                      </Tooltip>
                    ),
                  },
                  {
                    title: (
                      <Tooltip content="Revenue generated by Upcart offers in the selected period.">
                        <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>
                          Added revenue
                        </span>
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
                        {/* ── Use Link for instant prefetch on hover ── */}
                        <Link
                          to={`/app/cart-editor/${cart.cartId}`}
                          prefetch="intent"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <div style={{ maxWidth: "150px", cursor: "pointer" }}>
                            <Text truncate as="span">
                              {cart.cartName || "Untitled cart"}
                            </Text>
                            <Text as="span" tone="subdued" variant="bodySm">
                              {cart.updatedAt
                                ? `Last edited: ${new Date(cart.updatedAt)
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, "-")}`
                                : ""}
                            </Text>
                          </div>
                        </Link>
                      </CartHoverCard>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      <Badge tone="success">Live</Badge>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {cartStats?.[cart.cartId]?.conversionRate != null
                        ? cartStats[cart.cartId].conversionRate.toFixed(2) + "%"
                        : "—"}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {cartStats?.[cart.cartId]?.revenue != null
                        ? fmt(cartStats[cart.cartId].revenue, currency)
                        : "—"}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      <InlineStack gap="200" align="end">
                        {/* ── Slim link-based buttons avoid navigate() delay ── */}
                        <Link
                          to={`/app/cart-editor/${cart.cartId}`}
                          prefetch="intent"
                          style={{ textDecoration: "none" }}
                        >
                          <Button size="slim">Edit cart</Button>
                        </Link>
                        <Button
                          size="slim"
                          onClick={() =>
                            window.open(`https://${shop.myshopifyDomain}`, "_blank")
                          }
                        >
                          Preview
                        </Button>
                      </InlineStack>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </div>
          ) : (
            <EmptyState
              title="No live carts configured"
              subtitle="Publish your cart to see it live, and start earning with your cart."
              tag={!appEmbedInstalled ? { label: "App embed off", tone: "warning" } : null}
              primaryAction={{
                label: "Enable app embed",
                onAction: () =>
                  window.open(
                    `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
                    "_blank"
                  ),
              }}
              secondaryAction={{
                label: "Manage carts",
                onAction: () => navigate("/app/carts"),
              }}
            />
          )}
        </BlockStack>
      </BlockStack>

      {/* ── Help & Support ── */}
      <Box paddingBlockStart="400">
        <BlockStack gap="200">
          <Text variant="headingMd">Help &amp; Support</Text>

          {/* Setup guide collapsible — hidden when all tasks done */}
          {!allCompleted && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e1e3e5",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={handleSetupToggle}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Text variant="headingMd">Setup guide</Text>
                <Text tone="subdued">
                  {completedCount} of {setupTasks.length} tasks complete
                </Text>
                <div style={{ flex: 1 }} />
                <div style={{ width: 200 }}>
                  <ProgressBar progress={progressPercent} size="small" tone="primary" />
                </div>
                <div
                  style={{
                    transition: "transform 0.2s",
                    transform: setupOpen ? "rotate(180deg)" : "rotate(0deg)",
                    display: "flex",
                  }}
                >
                  <Icon source={ChevronDownIcon} />
                </div>
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
          )}
        </BlockStack>
      </Box>

      {/* ── Help cards ── */}
      <Box paddingBlockStart="400">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap={false}>
              <InlineStack gap="300" blockAlign="start" wrap={false}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: "#EDEDEE",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid #C5C5C5",
                  }}
                >
                  <Icon source={HeartIcon} />
                </div>
                <BlockStack gap="050">
                  <Text variant="headingXs">Need help?</Text>
                  <Text variant="bodySm" tone="subdued">
                    Chat with us for hands-on help.
                  </Text>
                </BlockStack>
              </InlineStack>
              <Button>Chat with us</Button>
            </InlineStack>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap={false}>
              <InlineStack gap="300" blockAlign="start" wrap={false}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: "#EDEDEE",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid #C5C5C5",
                  }}
                >
                  <Icon source={NoteIcon} />
                </div>
                <BlockStack gap="050">
                  <Text variant="headingXs">See our docs</Text>
                  <Text variant="bodySm" tone="subdued">
                    Browse our documentation and guides.
                  </Text>
                </BlockStack>
              </InlineStack>
              <Button>View docs</Button>
            </InlineStack>
          </div>
        </div>
      </Box>
    </Page>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

const EmptyState = ({ title, subtitle, tag, primaryAction, secondaryAction }) => (
  <Box paddingBlockStart="300">
    <Box
      borderStyle="dashed"
      borderColor="border"
      borderWidth="050"
      borderRadius="200"
      background="bg-surface-secondary"
      paddingBlockStart="500"
      paddingInlineStart="800"
      paddingBlockEnd="500"
    >
      <InlineStack align="space-between" blockAlign="center" gap="1000">
        <InlineStack align="start" blockAlign="center" gap="400">
          <img
            src="https://hubsyntax.com/cart-images/Clip%20path%20group.png"
            alt={title}
            style={{
              width: "127px",
              height: "82px",
              objectFit: "contain",
              flexShrink: 0,
              display: "block",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text variant="headingMd" as="h4">
                {title}
              </Text>
              {tag?.label && <Badge tone={tag.tone || "warning"}>{tag.label}</Badge>}
            </div>
            <Text variant="bodySm" tone="subdued" as="p">
              {subtitle}
            </Text>
          </div>
        </InlineStack>

        <div style={{ flexShrink: 0, paddingRight: "24px" }}>
          <InlineStack gap="200" blockAlign="center">
            {tag?.label && (
              <Button icon={ExternalIcon} onClick={primaryAction.onAction}>
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onAction}>{secondaryAction.label}</Button>
            )}
          </InlineStack>
        </div>
      </InlineStack>
    </Box>
  </Box>
);