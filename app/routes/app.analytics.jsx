import { useLoaderData, useNavigate } from "react-router";
import {
  Page,
  Card,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Button,
  DataTable,
  Tooltip,
} from "@shopify/polaris";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from "chart.js";
import { useState, useEffect } from "react";
import DateRangePicker from "./components/ui/DateRangePicker";
import { requireShopData } from "./components/shop.server";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));
}

function buildDailyMap(daily = []) {
  const map = {};
  daily.forEach((d) => {
    map[d._id] = d;
  });
  return map;
}

function getLabelsFromRange(start, end) {
  const labels = [];
  const current = new Date(start);
  // Normalise to midnight UTC so label strings are always YYYY-MM-DD
  current.setUTCHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setUTCHours(23, 59, 59, 999);

  while (current <= endNorm) {
    labels.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`,
    );
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return labels;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlatIcon() {
  return (
    <svg
      viewBox="0 0 11 16"
      height="14"
      width="11"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M0.519531 1.79395H12.0039V0.249023H0.519531V1.79395Z"
        fill="#8c9196"
        transform="translate(0,7)"
      />
    </svg>
  );
}

const pillStyles = {
  addons: {
    active: { background: "#FBE8FD", color: "#93319B" },
    inactive: { background: "#F6F6F7", color: "#6D7175" },
  },
  upsells: {
    active: { background: "#CAE6FE", color: "#01679B" },
    inactive: { background: "#F6F6F7", color: "#6D7175" },
  },
  subscriptions: {
    active: { background: "#E4FFE5", color: "#0B710E" },
    inactive: { background: "#F6F6F7", color: "#6D7175" },
  },
};

function FilterPill({ type, label, active, onToggle }) {
  const s = active ? pillStyles[type].active : pillStyles[type].inactive;
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "0.5rem",
        padding: "0.4rem 0.75rem",
        width: "100%",
        userSelect: "none",
        cursor: "pointer",
        ...s,
      }}
    >
      <Text variant="bodySm" fontWeight="semibold" as="span">
        {label}
      </Text>
      {active && (
        <svg viewBox="0 0 20 20" width={16} height={16} fill={s.color}>
          <path
            fillRule="evenodd"
            d="M15.78 5.97a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.97-5.97a.75.75 0 0 1 1.06 0Z"
          />
        </svg>
      )}
    </div>
  );
}

function SmallCard({ title, valueTooltip, value, icon }) {
  return (
    <Card>
      <Box
        paddingBlockStart="100"
        paddingBlockEnd="100"
        paddingInlineStart="300"
        paddingInlineEnd="300"
      >
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <BlockStack gap="100">
            <Tooltip
              content={valueTooltip}
              hasUnderline
              activatorWrapper="span"
            >
              <Text variant="bodyMd" tone="subdued" as="span">
                {title}
              </Text>
            </Tooltip>
            <InlineStack align="left" gap="200" blockAlign="center">
              <Text variant="headingLg" as="h5">
                {value}
              </Text>
            </InlineStack>
          </BlockStack>
          {icon && (
            <img
              src={icon}
              alt=""
              style={{ height: "50px", width: "50px", objectFit: "contain" }}
            />
          )}
        </InlineStack>
      </Box>
    </Card>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M10.75 4.25a.75.75 0 0 0-1.5 0v6.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V4.25Z" />
      <path d="M16.5 13.75a.75.75 0 0 0-1.5 0v.8a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75v-.8a.75.75 0 0 0-1.5 0v.8A2.25 2.25 0 0 0 5.75 16.8h8.5a2.25 2.25 0 0 0 2.25-2.25v-.8Z" />
    </svg>
  );
}

// ─── Funnel chart (cart conversion breakdown) ────────────────────────────────

function FunnelChart({ steps, loading }) {
  const W = 400, H = 170, gap = 10;
  const n = steps.length;
  const colW = (W - gap * (n - 1)) / n;
  const heightOf = (p) => (p > 0 ? Math.max((p / 100) * H, 3) : 0);

  return (
    <BlockStack gap="300">
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>
        {steps.map((s) => (
          <BlockStack key={s.label} gap="050">
            <Tooltip content={s.tip} hasUnderline activatorWrapper="span">
              <Text variant="bodySm" tone="subdued" as="span">{s.label}</Text>
            </Tooltip>
            <Text variant="headingLg" as="p">{loading ? "—" : `${s.percent.toFixed(1)}%`}</Text>
            <Text variant="bodySm" tone="subdued" as="p">{loading ? "—" : s.count}</Text>
          </BlockStack>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Cart conversion funnel">
        {steps.map((s, i) => {
          const x = i * (colW + gap);
          const h = heightOf(s.percent);
          const next = steps[i + 1];
          const nh = next ? heightOf(next.percent) : 0;
          return (
            <g key={s.label}>
              {next && (
                <polygon
                  points={`${x + colW},${H - h} ${x + colW + gap},${H - nh} ${x + colW + gap},${H} ${x + colW},${H}`}
                  fill="#a9aef0"
                />
              )}
              <rect x={x} y={H - h} width={colW} height={h} fill="#4b59e8" />
            </g>
          );
        })}
      </svg>
    </BlockStack>
  );
}

// ─── Donut chart (total sales by source) ─────────────────────────────────────

function DonutChart({ segments, total, totalLabel, formatValue }) {
  const R = 60, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <InlineStack gap="600" blockAlign="center" wrap={false}>
      <svg viewBox="0 0 160 160" width="160" height="160" style={{ flexShrink: 0 }}>
        <circle cx="80" cy="80" r={R} fill="none" stroke="#ebebeb" strokeWidth="22" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="80" cy="80" r={R} fill="none"
                stroke={s.color} strokeWidth="22"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="80" y="86" textAnchor="middle" fontSize="16" fontWeight="600" fill="#202223">
          {totalLabel}
        </text>
      </svg>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <BlockStack gap="200">
          {segments.map((s) => (
            <InlineStack key={s.label} align="space-between" blockAlign="center" wrap={false}>
              <InlineStack gap="200" blockAlign="center" wrap={false}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                <Text variant="bodyMd" as="span">{s.label}</Text>
              </InlineStack>
              <Text variant="bodyMd" as="span">{formatValue(s.value)}</Text>
            </InlineStack>
          ))}
        </BlockStack>
      </div>
    </InlineStack>
  );
}

// ─── Empty state placeholder for charts ──────────────────────────────────────

function EmptyChartPlaceholder({ message = "No data for this period" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 20 20" fill="#c9cccf">
        <path d="M2 14l4-4 3 3 4-5 5 6H2z" />
      </svg>
      <Text tone="subdued" variant="bodySm">
        {message}
      </Text>
    </div>
  );
}

// ─── Chart options ────────────────────────────────────────────────────────────

function getChartOpts(currency = "USD") {
  const currencySymbol =
    new Intl.NumberFormat("en-US", { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "$";

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        position: "nearest",
        backgroundColor: "#ffffff",
        titleColor: "#202223",
        bodyColor: "#202223",
        borderColor: "#e1e3e5",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        filter: (item) => item.dataset.label !== "Previous Period",
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, currency)}`,
        },
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: {
          color: "#70707b",
          font: { size: 12 },
          maxTicksLimit: 6,
          padding: 10,
          callback: function (val) {
            return this.getLabelForValue(val);
          },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#70707b",
          font: { size: 12 },
          stepSize: 500,
          callback: (v) => currencySymbol + Number(v).toLocaleString(),
        },
        grid: { color: "#eeeeef" },
        border: { display: false },
      },
    },
  };
}


// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
  const { shop, apiUrl } = await requireShopData(request);
  const shopDomain = shop?.myshopifyDomain;
  const currency = shop?.currencyCode || "USD";

  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultEnd.getDate() - 29);

  const defaultStartISO = defaultStart.toISOString();
  const defaultEndISO = defaultEnd.toISOString();

  return {
    initialStats: null,
    shop: shopDomain,
    apiUrl,
    currency,
    defaultStartISO,
    defaultEndISO,
  };
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();

  const apiUrl = loaderData.apiUrl;
  const shop = loaderData.shop;
  const currency = loaderData.currency;

  const [range, setRange] = useState(() => ({
    start: new Date(loaderData.defaultStartISO),
    end: new Date(loaderData.defaultEndISO),
  }));

  const [stats, setStats] = useState(loaderData.initialStats);
  // Start in loading state when we have no preloaded stats (we no longer fetch
  // in the loader), so the page shows "Loading…" instead of an empty flash.
  const [loading, setLoading] = useState(!loaderData.initialStats);

  const chartOpts = getChartOpts(currency);

  const clientApiKey =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_SECRET_KEY) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_API_SECRET_KEY) ||
    "";

  const clientAuthHeaders = (extra = {}) => ({
    "x-api-key": clientApiKey,
    ...extra,
  });

  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const url = new URL(`${apiUrl}/api/revenue-stats`);
        url.searchParams.set("shop", shop);
        url.searchParams.set("startDate", startISO);
        url.searchParams.set("endDate", endISO);

        const res = await fetch(url.toString(), {
          headers: clientAuthHeaders(),
        });
        const json = await res.json();

        if (!cancelled) {
          setStats(json.data ?? null);
        }
      } catch (error) {
        console.error("Analytics fetch error:", error);
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO, shop, apiUrl]);

  // Product images for "Best-performing products" (same lookup as the Activity page)
  const [productImages, setProductImages] = useState({});
  useEffect(() => {
    const ids = [
      ...new Set(
        [
          ...(stats?.topProducts ?? []).map((p) => p.productId),
          ...(stats?.recentOrders ?? []).flatMap((o) =>
            (o.items ?? []).map((i) => i.productId),
          ),
        ].filter(Boolean),
      ),
    ];
    if (!ids.length) return;
    let cancelled = false;
    const idOf = (id) => String(id || "").split("/").pop();

    (async () => {
      try {
        const res = await fetch("/shopify/get-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, productIds: ids }),
        });
        const json = await res.json();
        const products =
          json.products || json.data?.products || json.data || [];
        const map = {};
        products.forEach((p) => {
          map[idOf(p.id)] =
            p.featuredImage?.url ||
            p.images?.edges?.[0]?.node?.url ||
            p.image?.src ||
            (typeof p.image === "string" ? p.image : "") ||
            "";
        });
        if (!cancelled) setProductImages(map);
      } catch (error) {
        console.error("Analytics product images error:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stats, shop]);

  // ── Derived data ──────────────────────────────────────────────────────────

  // Use the currency from stats if available, fall back to loader currency
  const resolvedCurrency = stats?.revenue?.totals?.currency ?? currency;

  const daily = stats?.revenue?.daily ?? [];
  const dailyAnalytics = stats?.dailyAnalytics ?? {};

  const labels = getLabelsFromRange(range.start, range.end);
  const dayMap = buildDailyMap(daily);

  // FIX: Normalise dailyAnalytics keys to YYYY-MM-DD (zero-padded) so they
  // always match the labels produced by getLabelsFromRange.
  // The API may return keys like "2026-5-3" — normalise them here.
  const normalisedDailyAnalytics = Object.fromEntries(
    Object.entries(dailyAnalytics).map(([key, val]) => {
      const parts = key.split("-");
      if (parts.length === 3) {
        const normalised = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        return [normalised, val];
      }
      return [key, val];
    }),
  );

  const [filters, setFilters] = useState({
    addons: true,
    upsells: true,
    subscriptions: true,
  });
  const toggleFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  // Aggregate totals using normalised keys
  const cartImpressions = labels.reduce(
    (sum, l) => sum + (normalisedDailyAnalytics[l]?.cart_impression ?? 0),
    0,
  );

  const checkouts = labels.reduce(
    (sum, l) => sum + (normalisedDailyAnalytics[l]?.checkout_initiated ?? 0),
    0,
  );

  const checkoutComplete = labels.reduce(
    (sum, l) => sum + (normalisedDailyAnalytics[l]?.checkout_completed ?? 0),
    0,
  );

  // ── Overview metrics ──────────────────────────────────────────────────────
  const pct = (n, d) => (d > 0 ? Math.min((n / d) * 100, 100) : 0);
  const totals = stats?.revenue?.totals ?? {};
  const uniq = stats?.uniqueSessions ?? {};

  const cartViews = cartImpressions;
  const totalCarts = uniq.cart_impression ?? 0;
  const checkoutInitiations = checkouts;
  const abandonedCarts = Math.max(
    totalCarts - (uniq.checkout_initiated ?? 0),
    0,
  );
  const convertedCarts = checkoutComplete;
  const abandonedCheckouts = Math.max(checkoutInitiations - convertedCarts, 0);
  const overallConversionRate = pct(convertedCarts, totalCarts);
  const upsellToggleRevenue = totals.upsellRevenue ?? 0;

  // Funnel: percentages are relative to cart views, capped at 100%
  const funnelSteps = [
    { label: "Cart views", count: cartViews, percent: cartViews > 0 ? 100 : 0, tip: "Times the cart was displayed." },
    { label: "Added to cart", count: totalCarts, percent: pct(totalCarts, cartViews), tip: "Unique shopper sessions with an active cart." },
    { label: "Checkout initiated", count: checkoutInitiations, percent: pct(checkoutInitiations, cartViews), tip: "Times a customer clicked checkout." },
    { label: "Order complete", count: convertedCarts, percent: pct(convertedCarts, cartViews), tip: "Checkouts completed as orders." },
  ];

  // Sales by source (only sources the backend tracks)
  const salesSegments = [
    { label: "Upsell", value: totals.upsellRevenue ?? 0, color: "#01679B" },
    { label: "Add-ons", value: totals.addonRevenue ?? 0, color: "#93319B" },
    { label: "Subscriptions", value: totals.subscriptionRevenue ?? 0, color: "#0B710E" },
  ];
  const salesTotal = salesSegments.reduce((sum, s) => sum + s.value, 0);

  const totalRevenue = labels.reduce((sum, l) => {
    const day = dayMap[l] ?? {};
    return (
      sum +
      (filters.upsells ? (day.upsellRevenue ?? 0) : 0) +
      (filters.addons ? (day.addonRevenue ?? 0) : 0) +
      (filters.subscriptions ? (day.subscriptionRevenue ?? 0) : 0)
    );
  }, 0);

  const upsellSeries = labels.map((l) => dayMap[l]?.upsellRevenue ?? 0);
  const addonSeries = labels.map((l) => dayMap[l]?.addonRevenue ?? 0);
  const subSeries = labels.map((l) => dayMap[l]?.subscriptionRevenue ?? 0);




  const shortLabels = labels.map((l) => {
    // Parse as UTC noon to avoid DST boundary issues
    const d = new Date(l + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });

  // ── Determine whether each chart has any real data ────────────────────────

  const hasRevenueData =
    totalRevenue > 0 ||
    upsellSeries.some(Boolean) ||
    addonSeries.some(Boolean) ||
    subSeries.some(Boolean);


  // ── Chart datasets ────────────────────────────────────────────────────────

  const revenueChartData = {
    labels: shortLabels,
    datasets: [
      filters.upsells && {
        label: "Upsells",
        data: upsellSeries,
        borderColor: "#01679B",
        backgroundColor: "rgba(1,103,155,0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        order: 1,
      },
      filters.subscriptions && {
        label: "Subscriptions",
        data: subSeries,
        borderColor: "#0B710E",
        backgroundColor: "rgba(11,113,14,0.09)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        order: 2,
      },
      filters.addons && {
        label: "Add-ons",
        data: addonSeries,
        borderColor: "#93319B",
        backgroundColor: "rgba(147,49,155,0.10)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        order: 3,
      },
    ].filter(Boolean),
  };


  const tableRows = (stats?.topProducts ?? []).slice(0, 5).map((p) => [
    <InlineStack key={`${p.name}-${p.module}`} gap="300" blockAlign="center" wrap={false}>
      {productImages[String(p.productId || "")] ? (
        <img
          src={productImages[String(p.productId || "")]}
          alt=""
          style={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "#f1f1f1",
            flexShrink: 0,
          }}
        />
      )}
      <span>{p.name}</span>
    </InlineStack>,
    p.quantity,
    fmt(p.revenue, resolvedCurrency),
    p.module,
  ]);

  const recentOrderRows = (stats?.recentOrders ?? []).slice(0, 5).map((o) => {
    // one thumbnail per distinct product in the order (max 3, then "+N")
    const seen = new Set();
    const thumbs = (o.items ?? []).filter((i) => {
      const key = String(i.productId || i.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const shown = thumbs.slice(0, 3);
    const extra = thumbs.length - shown.length;
    const orderLabel = o.orderNumber
      ? `#${o.orderNumber}`
      : `…${String(o.orderId).slice(-6)}`;
    return [
    <InlineStack key={o.orderId} gap="200" blockAlign="center" wrap={false}>
      <InlineStack gap="100" wrap={false}>
        {shown.map((i, idx) => {
          const src = productImages[String(i.productId || "")];
          return src ? (
            <img
              key={idx}
              src={src}
              alt=""
              title={i.title}
              style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
            />
          ) : (
            <div
              key={idx}
              title={i.title}
              style={{ width: 32, height: 32, borderRadius: 6, background: "#f1f1f1", flexShrink: 0 }}
            />
          );
        })}
        {extra > 0 && (
          <Text as="span" tone="subdued" variant="bodySm">
            +{extra}
          </Text>
        )}
      </InlineStack>
      <span>{orderLabel}</span>
    </InlineStack>,
    new Date(o.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    fmt(o.upsellRevenue, o.currency),
    fmt(o.addonRevenue, o.currency),
    fmt(o.subscriptionRevenue, o.currency),
    fmt(o.totalRevenue, o.currency),
    ];
  });

  // ── CSV download ──────────────────────────────────────────────────────────

  function downloadCSV(data, filename, isPercentage = false) {
    const headers = ["Date", ...data.datasets.map((d) => d.label)];
    const rows = data.labels.map((label, i) => [
      `"${label}"`,
      ...data.datasets.map((d) => {
        const val = d.data[i] ?? 0;
        return isPercentage ? val.toFixed(2) + "%" : val;
      }),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="_page_yc9hy_1">
      <Page
        fullWidth
        backAction={{ onAction: () => navigate("/app") }}
        title="Analytics"
        primaryAction={
          <InlineStack gap="200">
            <DateRangePicker value={range} onChange={setRange} />
          </InlineStack>
        }
      >
        <BlockStack gap="400">
          {/* ── Overview metrics ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              [
                "Total Carts",
                totalCarts,
                "Unique shopper sessions that saw the cart.",
              ],
              ["Cart Views", cartViews, "Total times the cart was displayed."],
              [
                "Abandoned Carts",
                abandonedCarts,
                "Carts that were viewed but never reached checkout.",
              ],
              [
                "Checkout Initiations",
                checkoutInitiations,
                "Times a customer clicked checkout from the cart.",
              ],
              [
                "Abandoned Checkouts",
                abandonedCheckouts,
                "Checkouts initiated that did not complete as an order.",
              ],
              [
                "Converted Carts",
                convertedCarts,
                "Checkouts that were completed as orders.",
              ],
              [
                "Conversion Rate",
                `${overallConversionRate.toFixed(2)}%`,
                "Converted carts ÷ total carts.",
              ],
              [
                "Upsell Toggle Revenue",
                fmt(upsellToggleRevenue, resolvedCurrency),
                "Revenue generated from upsell items.",
              ],
            ].map(([title, value, tip]) => (
              <SmallCard
                key={title}
                title={title}
                value={loading ? "—" : value}
                valueTooltip={tip}
              />
            ))}
          </div>

          {/* ── Revenue chart card ── */}
          <Card padding="0">
            <Box padding="400">
              <InlineStack gap="600" wrap={false} blockAlign="start">
                {/* Chart area */}
                <Box
                  style={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: 260,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      zIndex: 10,
                    }}
                  >
                    <Button
                      icon={DownloadIcon}
                      size="slim"
                      accessibilityLabel="Download revenue data"
                      onClick={() =>
                        downloadCSV(revenueChartData, "revenue.csv", false)
                      }
                      disabled={!hasRevenueData}
                    />
                  </div>

                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#70707b",
                      }}
                    >
                      <Text tone="subdued">Loading…</Text>
                    </div>
                  ) : !hasRevenueData ? (
                    <EmptyChartPlaceholder message="No revenue data for this period" />
                  ) : (
                    <Line data={revenueChartData} options={chartOpts} />
                  )}
                </Box>

                {/* Sidebar: revenue total + filters */}
                <Box width="180px">
                  <BlockStack gap="400">
                    <BlockStack gap="100">
                      <InlineStack gap="100" blockAlign="center">
                        <Tooltip
                          content="Total revenue generated by Upcart in the selected period."
                          hasUnderline
                          activatorWrapper="span"
                        >
                          <Text variant="bodyMd">Revenue</Text>
                        </Tooltip>
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="center">
                        <Text variant="headingLg" as="h4">
                          {loading ? "—" : fmt(totalRevenue, resolvedCurrency)}
                        </Text>
                        <Tooltip
                          content={`Change in revenue compared to previous period. Previous revenue: ${fmt(0, resolvedCurrency)}`}
                          hasUnderline
                          activatorWrapper="span"
                        >
                          <FlatIcon />
                        </Tooltip>
                      </InlineStack>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text variant="bodyMd" tone="subdued">
                        Filters
                      </Text>
                      <BlockStack gap="150">
                        <FilterPill
                          type="addons"
                          label="Add-ons"
                          active={filters.addons}
                          onToggle={() => toggleFilter("addons")}
                        />
                        <FilterPill
                          type="upsells"
                          label="Upsells"
                          active={filters.upsells}
                          onToggle={() => toggleFilter("upsells")}
                        />
                        <FilterPill
                          type="subscriptions"
                          label="Subscriptions"
                          active={filters.subscriptions}
                          onToggle={() => toggleFilter("subscriptions")}
                        />
                      </BlockStack>
                    </BlockStack>
                  </BlockStack>
                </Box>
              </InlineStack>
            </Box>
          </Card>

          {/* ── Cart conversion breakdown + Total sales by source ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h4">
                  Cart conversion breakdown
                </Text>
                <Text variant="headingXl" as="p">
                  {loading ? "—" : `${overallConversionRate.toFixed(1)}%`}
                </Text>
                <Box borderBlockStartWidth="025" borderColor="border" paddingBlockStart="300">
                  <FunnelChart steps={funnelSteps} loading={loading} />
                </Box>
              </BlockStack>
            </Card>

            {/* <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h4">
                  Total sales by source
                </Text>
                <Text variant="headingXl" as="p">
                  {loading ? "—" : fmt(salesTotal, resolvedCurrency)}
                </Text>
                <Box borderBlockStartWidth="025" borderColor="border" paddingBlockStart="300">
                  <DonutChart
                    segments={salesSegments}
                    total={salesTotal}
                    totalLabel={loading ? "—" : fmt(salesTotal, resolvedCurrency)}
                    formatValue={(v) => fmt(v, resolvedCurrency)}
                  />
                </Box>
              </BlockStack>
            </Card> */}
          </div>

          {/* ── Best-performing products ── */}
          <Card padding="0">
            <Box padding="400">
              <BlockStack gap="100">
                <Text variant="headingMd" as="h4">
                  Best-performing products
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  All products sold (upsells, add-ons, subscriptions and regular
                  products), ranked by revenue in the selected period.
                </Text>
              </BlockStack>
            </Box>
            {loading ? (
              <Box padding="400">
                <Text tone="subdued">Loading…</Text>
              </Box>
            ) : tableRows.length === 0 ? (
              <Box padding="400" paddingBlockStart="0">
                <Text tone="subdued">
                  No product sales were recorded in this period yet.
                </Text>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "text"]}
                headings={["Product", "Quantity sold", "Revenue", "Source"]}
                rows={tableRows}
              />
            )}
          </Card>

          {/* ── Most recent orders ── */}
          <Card padding="0">
            <Box padding="400">
              <Text variant="headingMd" as="h4">
                Most recent orders
              </Text>
            </Box>
            {loading ? (
              <Box padding="400">
                <Text tone="subdued">Loading…</Text>
              </Box>
            ) : recentOrderRows.length === 0 ? (
              <Box padding="400" paddingBlockStart="0">
                <Text tone="subdued">
                  No orders were recorded in this period yet.
                </Text>
              </Box>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric", "numeric", "numeric"]}
                headings={["Order", "Date", "Upsell", "Add-ons", "Subscriptions", "Order revenue"]}
                rows={recentOrderRows}
              />
            )}
          </Card>
        </BlockStack>
      </Page>
    </div>
  );
}
