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
  Icon,
  InlineGrid,
  Card,
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { ChevronDownIcon, HeartIcon, NoteIcon, ExternalIcon } from "@shopify/polaris-icons";

import { getCarts, getCartStats } from "../services/apiRoutes";
import { shopLoader } from "./components/shop.server";
import DateRangePicker from "./components/ui/DateRangePicker";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Await, useLoaderData, useNavigate, Link } from "react-router-dom";
import CartHoverCard from "./components/ui/CartHoverCard";
import LiveDot from "./components/ui/LiveDot";

// ─── pulse animation ───────────────────────────────────────────────────────────

const pulseStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
`;

function SkeletonCell({ width = 64 }) {
  return (
    <div
      style={{
        width,
        height: 16,
        background: "#e1e3e5",
        borderRadius: 4,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

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
      <InlineGrid columns={{ xs: 1, sm: ["twoThirds", "oneThird"] }} gap="300" alignItems="center">
        <BlockStack gap="150">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="semibold">{title}</Text>
            {completed ? (
              <Badge tone="success">Completed</Badge>
            ) : isEmbedStarted ? (
              <Badge tone="warning">In Progress</Badge>
            ) : hideIncompleteBadge ? null : (
              <Badge tone="info">Recommended</Badge>
            )}
          </InlineStack>
          <Text variant="bodySm" tone="subdued">{description}</Text>
        </BlockStack>
        <InlineStack align="end">
          <Button size="slim" onClick={onAction}>{actionLabel}</Button>
        </InlineStack>
      </InlineGrid>
    </Box>
  );
}

// ─── Setup Tasks Data ──────────────────────────────────────────────────────────

function buildSetupTasks(liveCart, navigate, shop, appEmbedId, mainThemeId, appEmbedInstalled, appEmbedStarted) {
  const cartId = liveCart?.cartId;
  const goTo = (module) => () => cartId && navigate(`/app/cart-editor/${cartId}?from=home&module=${module}`);
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
          "_top"
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

async function checkAppEmbed(shopDomain, accessToken, themeId) {
  try {
    const assetRes = await fetch(
      `https://${shopDomain}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
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
        return { started: true, installed: !block?.disabled };
      }
    }
  } catch (_) { }
  return { started: false, installed: false };
}

export const loader = async ({ request }) => {
  const { shop, apiUrl, accessToken, currency, mainThemeId } =
    await shopLoader(request);

  const appEmbedId = process.env.SHOPIFY_API_KEY || "";

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  const fallbackRevenue = {
    addonRevenue: 0,
    upsellRevenue: 0,
    subscriptionRevenue: 0,
  };

  const dataPromise = getCarts(apiUrl, shop.myshopifyDomain).then((cartsRes) => {
    const allCarts = cartsRes?.data || [];
    const publishedCartIds = allCarts
      .filter((c) => c.status === "published")
      .map((c) => c.cartId);

    return Promise.allSettled([
      Promise.resolve(cartsRes),
      getCartStats(apiUrl, shop.myshopifyDomain, defaultStart.toISOString(), today.toISOString(), publishedCartIds),
      checkAppEmbed(shop.myshopifyDomain, accessToken, mainThemeId),
    ]).then(([cartsResult, statsResult, embedResult]) => ({
      carts:
        cartsResult.status === "fulfilled" ? cartsResult.value?.data || [] : [],
      cartStats:
        statsResult.status === "fulfilled" ? statsResult.value?.data || {} : {},
      shopRevenue:
        statsResult.status === "fulfilled"
          ? statsResult.value?.shopRevenue || fallbackRevenue
          : fallbackRevenue,
      appEmbedInstalled:
        embedResult.status === "fulfilled" ? embedResult.value.installed : false,
      appEmbedStarted:
        embedResult.status === "fulfilled" ? embedResult.value.started : false,
    }));
  });

  return { shop, apiUrl, currency, appEmbedId, mainThemeId, dataPromise };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start, end };
}

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(n ?? 0));

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ type = "flat", value = 0 }) {
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

    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.transition = "none";
    area.style.opacity = "0";
    dot.style.opacity = "0";
    dot.style.transform = "scale(0)";
    dot.style.transformOrigin = "70px " + p.cy + "px";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.style.transition = "stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)";
        line.style.strokeDashoffset = "0";
        setTimeout(() => {
          area.style.transition = "opacity 0.4s ease";
          area.style.opacity = "1";
        }, 300);
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

// ─── StatTile ──────────────────────────────────────────────────────────────────

function StatTile({ label, value, sparklineType, rawValue, onClick, borderLeft, loading }) {
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
        borderLeft: borderLeft ? "1px solid #e1e3e5" : "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f6f6f7")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" truncate>{label}</Text>
          <InlineStack gap="300" align="left" blockAlign="center">
            {loading ? (
              <div style={{ width: 80, height: 20, background: "#e1e3e5", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : (
              <>
                <Text variant="bodyMd" fontWeight="semibold">{value}</Text>
                <Badge>—</Badge>
              </>
            )}
          </InlineStack>
        </BlockStack>
        <div style={{ flexShrink: 0, paddingInlineStart: "8px" }}>
          {loading ? (
            <div style={{ width: 72, height: 36, background: "#e1e3e5", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <Sparkline type={sparklineType} value={rawValue} />
          )}
        </div>
      </InlineStack>
    </div>
  );
}

// ─── DashboardSkeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <Page title="Welcome to Custom Cart 🎉">
      <style>{pulseStyle}</style>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <SkeletonDisplayText size="small" />
          <div
            style={{
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              {[0, 1, 2, 3].map((i) => (
                <BlockStack gap="200" key={i}>
                  <SkeletonBodyText lines={1} />
                  <SkeletonDisplayText size="small" />
                </BlockStack>
              ))}
            </InlineGrid>
          </div>
        </BlockStack>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <SkeletonBodyText lines={5} />
        </div>
      </BlockStack>
    </Page>
  );
}

// ─── Dashboard (shell) ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const loaderData = useLoaderData();
  return (
    <>
      <style>{pulseStyle}</style>
      <Suspense fallback={<DashboardSkeleton />}>
        <Await
          resolve={loaderData.dataPromise}
          errorElement={<DashboardSkeleton />}
        >
          {(data) => <DashboardInner {...loaderData} {...data} />}
        </Await>
      </Suspense>
    </>
  );
}

// ─── DashboardInner ────────────────────────────────────────────────────────────

function DashboardInner({
  shop,
  apiUrl,
  carts: initialCarts,
  cartStats: initialCartStats,
  shopRevenue: initialShopRevenue,
  appEmbedId,
  mainThemeId,
  appEmbedInstalled,
  appEmbedStarted,
  currency,
}) {
  const navigate = useNavigate();

  const authHeaders = () => ({
    "x-api-key": import.meta.env.VITE_API_SECRET_KEY || "",
  });

  const [carts, setCarts] = useState(initialCarts || []);
  const [cartStats, setCartStats] = useState(initialCartStats || {});
  const [shopRevenue, setShopRevenue] = useState(
    initialShopRevenue || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 }
  );
  const [range, setRange] = useState(getDefaultRange);
  const [setupOpen, setSetupOpen] = useState(false);

  // ← true on first render so skeleton shows until first fetch completes
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    setCarts(initialCarts);
  }, [initialCarts]);

  // ← no isFirstRangeRender guard — runs on mount AND on range change
  useEffect(() => {
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const publishedCartIds = liveCarts.map((c) => c.cartId);
      const params = new URLSearchParams({
        shop: shop.myshopifyDomain,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      });
      if (publishedCartIds.length > 0) {
        params.append("cartIds", publishedCartIds.join(","));
      }
      const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, {
        credentials: "include",
        headers: authHeaders(),
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
    } finally {
      setStatsLoading(false);
    }
  };

  fetchStats();
}, [range.start, range.end]);

  const AppEmbedLink = () => (
    <Tooltip content="Enable the app embed to start showing this cart on your storefront. Click to enable in your theme editor.">
      <span>
        <a
          href={`https://${shop.myshopifyDomain}/admin/themes/${mainThemeId}/editor?context=apps&activateAppId=${appEmbedId}/app-embed`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: "2px", textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.querySelector(".embed-icon").style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.querySelector(".embed-icon").style.opacity = "0"; }}
        >
          <Badge tone="warning">App embed off</Badge>
          <span className="embed-icon" style={{ opacity: 0, transition: "opacity 0.15s" }}>
            <Icon source={ExternalIcon} tone="subdued" />
          </span>
        </a>
      </span>
    </Tooltip>
  );

  const sparkType = (val) => (val ?? 0) > 0 ? "spike" : "flat";

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
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }}>
              <StatTile
                loading={statsLoading}
                label="Add-ons revenue"
                value={fmt(shopRevenue.addonRevenue ?? 0, currency)}
                rawValue={shopRevenue.addonRevenue ?? 0}
                sparklineType={sparkType(shopRevenue.addonRevenue)}
                onClick={() => navigate("/app/analytics")}
              />
              <StatTile
                borderLeft
                loading={statsLoading}
                label="Upsell revenue"
                value={fmt(shopRevenue.upsellRevenue ?? 0, currency)}
                rawValue={shopRevenue.upsellRevenue ?? 0}
                sparklineType={sparkType(shopRevenue.upsellRevenue)}
                onClick={() => navigate("/app/analytics")}
              />
              <StatTile
                borderLeft
                loading={statsLoading}
                label="Subscriptions revenue"
                value={fmt(shopRevenue.subscriptionRevenue ?? 0, currency)}
                rawValue={shopRevenue.subscriptionRevenue ?? 0}
                sparklineType={sparkType(shopRevenue.subscriptionRevenue)}
                onClick={() => navigate("/app/analytics")}
              />
              <StatTile
                borderLeft
                loading={statsLoading}
                label="Total revenue"
                value={fmt(
                  (shopRevenue.addonRevenue ?? 0) +
                  (shopRevenue.upsellRevenue ?? 0) +
                  (shopRevenue.subscriptionRevenue ?? 0),
                  currency
                )}
                rawValue={
                  (shopRevenue.addonRevenue ?? 0) +
                  (shopRevenue.upsellRevenue ?? 0) +
                  (shopRevenue.subscriptionRevenue ?? 0)
                }
                sparklineType={sparkType(
                  (shopRevenue.addonRevenue ?? 0) +
                  (shopRevenue.upsellRevenue ?? 0) +
                  (shopRevenue.subscriptionRevenue ?? 0)
                )}
                onClick={() => navigate("/app/analytics")}
              />
            </InlineGrid>
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
                  { title: "Cart name", id: "cart-name" },
                  { title: "Status", id: "status" },
                  {
                    id: "impressions",
                    title: (
                      <Tooltip hasUnderline activatorWrapper="span" content={
                        <BlockStack gap="200">
                          <Text as="p" fontWeight="bold">Impressions</Text>
                          <Text as="p" variant="bodyMd">Number of times this cart was shown to a shopper.</Text>
                          <Text as="p" variant="bodyMd">Values shown are for the date range selected at the top of the page.</Text>
                        </BlockStack>
                      }>
                        <Text variant="bodySm" tone="subdued" as="span" fontWeight="medium"> Impressions</Text>
                      </Tooltip>
                    ),
                  },
                  {
                    id: "conversion-rate",
                    title: (
                      <Tooltip hasUnderline activatorWrapper="span" content={
                        <BlockStack gap="200">
                          <Text as="p" fontWeight="bold">Cart conversion rate (%)</Text>
                          <Text as="p" variant="bodySm">The percentage of cart impressions that resulted in a completed purchase.</Text>
                        </BlockStack>
                      }>
                        <Text variant="bodySm" tone="subdued" as="span" fontWeight="medium">  Cart conversion rate (%)</Text>
                      </Tooltip>
                    ),
                  },
                  {
                    id: "added-revenue",
                    title: (
                      <Tooltip hasUnderline activatorWrapper="span" content={
                        <BlockStack gap="200">
                          <Text as="p" fontWeight="bold">Added revenue</Text>
                          <Text as="p" variant="bodySm">The percentage of cart impressions that resulted in a completed purchase.</Text>
                        </BlockStack>
                      }>
                        <Text variant="bodySm" tone="subdued" as="span" fontWeight="medium">  Added revenue</Text>
                      </Tooltip>
                    ),
                  },
                  { title: "", id: "actions" },
                ]}
                selectable={false}
              >
                {liveCarts.map((cart, i) => {
                  const safeId =
                    (cart.cartId && cart.cartId.trim() !== "" && cart.cartId.trim()) ||
                    (cart._id && cart._id.toString().trim() !== "" && cart._id.toString().trim()) ||
                    `row-${i}`;

                  const cartEditorPath = `/app/cart-editor/${cart.cartId}?from=home`;

                  return (
                    <IndexTable.Row
                      key={safeId}
                      id={safeId}
                      position={i}
                      onClick={() => navigate(cartEditorPath)}
                    >
                      <IndexTable.Cell>
                        <Link
                          to={cartEditorPath}
                          prefetch="intent"
                          style={{ position: "absolute", inset: 0, zIndex: 0 }}
                          aria-label={`Edit cart ${cart.cartName || "Untitled cart"}`}
                        />
                        <CartHoverCard cart={cart}>
                          <div style={{ maxWidth: "150px", cursor: "pointer", position: "relative", zIndex: 1 }}>
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

                      <IndexTable.Cell>
                        <InlineStack gap="200" blockAlign="center">
                          {appEmbedInstalled ? (
                            <Badge tone="success">Live</Badge>
                          ) : (
                            <span style={{ position: "relative", zIndex: 1 }}>
                              <AppEmbedLink />
                            </span>
                          )}
                        </InlineStack>
                      </IndexTable.Cell>

                      {/* Impressions */}
                      <IndexTable.Cell>
                        {statsLoading ? (
                          <SkeletonCell width={48} />
                        ) : cartStats?.[cart.cartId]?.impressions != null ? (
                          cartStats[cart.cartId].impressions.toLocaleString()
                        ) : "—"}
                      </IndexTable.Cell>

                      {/* Conversion rate */}
                      <IndexTable.Cell>
                        {statsLoading ? (
                          <SkeletonCell width={56} />
                        ) : cartStats?.[cart.cartId]?.conversionRate != null ? (
                          cartStats[cart.cartId].conversionRate.toFixed(2) + "%"
                        ) : "—"}
                      </IndexTable.Cell>

                      {/* Revenue */}
                      <IndexTable.Cell>
                        {statsLoading ? (
                          <SkeletonCell width={72} />
                        ) : cartStats?.[cart.cartId]?.revenue != null ? (
                          fmt(cartStats[cart.cartId].revenue, currency)
                        ) : "—"}
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <InlineStack gap="200" align="end" style={{ position: "relative", zIndex: 1 }}>
                          <Link to={cartEditorPath} prefetch="intent" style={{ textDecoration: "none" }}>
                            <Button size="slim">Edit cart</Button>
                          </Link>
                          <Button
                            size="slim"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://${shop.myshopifyDomain}`, "_blank");
                            }}
                          >
                            Preview
                          </Button>
                        </InlineStack>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  );
                })}
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
        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
          <Card padding="400">
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap={false}>
              <InlineStack gap="300" blockAlign="start" wrap={false}>
                <div style={{ width: 44, height: 44, background: "#EDEDEE", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #C5C5C5" }}>
                  <Icon source={HeartIcon} />
                </div>
                <BlockStack gap="050">
                  <Text variant="headingXs">Questions or need help? </Text>
                  <Text variant="bodySm" tone="subdued">Chat with our support team.</Text>
                </BlockStack>
              </InlineStack>
              <Button>Chat with us</Button>
            </InlineStack>
          </Card>

          <Card padding="400">
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap={false}>
              <InlineStack gap="300" blockAlign="start" wrap={false}>
                <div style={{ width: 44, height: 44, background: "#EDEDEE", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #C5C5C5" }}>
                  <Icon source={NoteIcon} />
                </div>
                <BlockStack gap="050">
                  <Text variant="headingXs">Explore our docs</Text>
                  <Text variant="bodySm" tone="subdued">Find detailed guides and help articles.</Text>
                </BlockStack>
              </InlineStack>
              <Button>View docs</Button>
            </InlineStack>
          </Card>
        </InlineGrid>
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
            style={{ width: "127px", height: "82px", objectFit: "contain", flexShrink: 0, display: "block" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text variant="headingMd" as="h4">{title}</Text>
              {tag?.label && <Badge tone={tag.tone || "warning"}>{tag.label}</Badge>}
            </div>
            <Text variant="bodySm" tone="subdued" as="p">{subtitle}</Text>
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