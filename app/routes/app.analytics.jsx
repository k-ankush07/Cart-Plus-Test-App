import { useLoaderData, useNavigate } from "react-router";
import {
  Page, Card, Text, InlineStack, BlockStack,
  Box, Button, DataTable, Layout, Tooltip,
} from "@shopify/polaris";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip as ChartTooltip,
} from "chart.js";
import { useState, useEffect } from "react";
import DateRangePicker from "./components/ui/DateRangePicker";
import { shopLoader } from "./components/shop.server";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n ?? 0));
}

function buildDailyMap(daily = []) {
  const map = {};
  daily.forEach((d) => { map[d._id] = d; });
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
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`
    );
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return labels;
}

// ─── API key header helper (server-side: process.env) ─────────────────────────

const apiAuthHeaders = (extra = {}) => ({
  "x-api-key": process.env.API_SECRET_KEY || "",
  ...extra,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlatIcon() {
  return (
    <svg viewBox="0 0 11 16" height="14" width="11"
      style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M0.519531 1.79395H12.0039V0.249023H0.519531V1.79395Z"
        fill="#8c9196" transform="translate(0,7)" />
    </svg>
  );
}

const pillStyles = {
  addons: { active: { background: "#FBE8FD", color: "#93319B" }, inactive: { background: "#F6F6F7", color: "#6D7175" } },
  upsells: { active: { background: "#CAE6FE", color: "#01679B" }, inactive: { background: "#F6F6F7", color: "#6D7175" } },
  subscriptions: { active: { background: "#E4FFE5", color: "#0B710E" }, inactive: { background: "#F6F6F7", color: "#6D7175" } },
};

function FilterPill({ type, label, active, onToggle }) {
  const s = active ? pillStyles[type].active : pillStyles[type].inactive;
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderRadius: "0.5rem", padding: "0.4rem 0.75rem",
      width: "100%", userSelect: "none", cursor: "pointer", ...s,
    }}>
      <Text variant="bodySm" fontWeight="semibold" as="span">{label}</Text>
      {active && (
        <svg viewBox="0 0 20 20" width={16} height={16} fill={s.color}>
          <path fillRule="evenodd" d="M15.78 5.97a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.97-5.97a.75.75 0 0 1 1.06 0Z" />
        </svg>
      )}
    </div>
  );
}

function SmallCard({ title, valueTooltip, value, icon }) {
  return (
    <Card>
      <Box paddingBlockStart="100" paddingBlockEnd="100" paddingInlineStart="300" paddingInlineEnd="300">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <BlockStack gap="100">
            <Tooltip content={valueTooltip} hasUnderline activatorWrapper="span">
              <Text variant="bodyMd" tone="subdued" as="span">{title}</Text>
            </Tooltip>
            <InlineStack align="left" gap="200" blockAlign="center">
              <Text variant="headingLg" as="h5">{value}</Text>
            </InlineStack>
          </BlockStack>
          {icon && (
            <img src={icon} alt="" style={{ height: "50px", width: "50px", objectFit: "contain" }} />
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

// ─── Empty state placeholder for charts ──────────────────────────────────────

function EmptyChartPlaceholder({ message = "No data for this period" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", flexDirection: "column", gap: "8px",
    }}>
      <svg width="32" height="32" viewBox="0 0 20 20" fill="#c9cccf">
        <path d="M2 14l4-4 3 3 4-5 5 6H2z" />
      </svg>
      <Text tone="subdued" variant="bodySm">{message}</Text>
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
        mode: "index", intersect: false, position: "nearest",
        backgroundColor: "#ffffff", titleColor: "#202223", bodyColor: "#202223",
        borderColor: "#e1e3e5", borderWidth: 1, padding: 10, boxPadding: 4,
        usePointStyle: true,
        filter: (item) => item.dataset.label !== "Previous Period",
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, currency)}`,
        },
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: {
          color: "#70707b", font: { size: 12 }, maxTicksLimit: 6, padding: 10,
          callback: function (val) { return this.getLabelForValue(val); }
        },
        grid: { display: false }, border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#70707b", font: { size: 12 }, stepSize: 500,
          callback: (v) => currencySymbol + Number(v).toLocaleString()
        },
        grid: { color: "#eeeeef" }, border: { display: false },
      },
    },
  };
}

const convOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "index", intersect: false,
      backgroundColor: "#ffffff", titleColor: "#202223", bodyColor: "#202223",
      borderColor: "#e1e3e5", borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true,
      callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%` },
    },
  },
  interaction: { mode: "index", intersect: false },
  scales: {
    x: {
      ticks: { color: "#70707b", font: { size: 12 }, maxTicksLimit: 6, padding: 10 },
      grid: { display: false }, border: { display: false },
    },
    y: {
      min: 0, max: 100,
      ticks: {
        color: "#70707b", font: { size: 12 }, stepSize: 20,
        callback: (v) => v.toFixed(0) + "%"
      },
      grid: { color: "#eeeeef" }, border: { display: false },
    },
  },
};

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
  const { shop, apiUrl } = await shopLoader(request);
  const shopDomain = shop?.myshopifyDomain;
  const currency = shop?.currencyCode || "USD";

  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultEnd.getDate() - 29);

  const defaultStartISO = defaultStart.toISOString();
  const defaultEndISO = defaultEnd.toISOString();

  const initialStats = await (async () => {
    try {
      const url = new URL(`${apiUrl}/api/revenue-stats`);
      url.searchParams.set("shop", shopDomain);
      url.searchParams.set("startDate", defaultStartISO);
      url.searchParams.set("endDate", defaultEndISO);

      const res = await fetch(url.toString(), { headers: apiAuthHeaders() });
      const json = await res.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  })();

  return { initialStats, shop: shopDomain, apiUrl, currency, defaultStartISO, defaultEndISO };
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
  const [loading, setLoading] = useState(false);

  const chartOpts = getChartOpts(currency);

  const clientApiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_SECRET_KEY) ||
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

        const res = await fetch(url.toString(), { headers: clientAuthHeaders() });
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
    return () => { cancelled = true; };
  }, [startISO, endISO, shop, apiUrl]);

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
    })
  );

  const [filters, setFilters] = useState({ addons: true, upsells: true, subscriptions: true });
  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  // Aggregate totals using normalised keys
  const cartImpressions = labels.reduce((sum, l) =>
    sum + (normalisedDailyAnalytics[l]?.cart_impression ?? 0), 0);

  const checkouts = labels.reduce((sum, l) =>
    sum + (normalisedDailyAnalytics[l]?.checkout_initiated ?? 0), 0);

  const checkoutComplete = labels.reduce((sum, l) =>
    sum + (normalisedDailyAnalytics[l]?.checkout_completed ?? 0), 0);

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

  // FIX: Guard against checkouts > impressions (data integrity).
  // Conversion = checkouts initiated / cart impressions, capped at 100%.
  const rangeConversionRate =
    cartImpressions > 0 && checkouts <= cartImpressions
      ? (checkouts / cartImpressions) * 100
      : cartImpressions > 0 && checkouts > cartImpressions
        ? 100  // data anomaly – cap visually but don't hide it
        : 0;

  const checkoutConv = labels.map((l) => {
    const day = normalisedDailyAnalytics[l] ?? {};
    const imp = day.cart_impression ?? 0;
    const ini = day.checkout_initiated ?? 0;
    // FIX: if initiated > impression the day's data is suspect; cap at 100
    return imp > 0 ? Math.min((ini / imp) * 100, 100) : 0;
  });

  const orderConv = labels.map((l) => {
    const day = normalisedDailyAnalytics[l] ?? {};
    const ini = day.checkout_initiated ?? 0;
    const com = day.checkout_completed ?? 0;
    return ini > 0 ? Math.min((com / ini) * 100, 100) : 0;
  });

  const shortLabels = labels.map((l) => {
    // Parse as UTC noon to avoid DST boundary issues
    const d = new Date(l + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  });

  // ── Determine whether each chart has any real data ────────────────────────

  const hasRevenueData = totalRevenue > 0 ||
    upsellSeries.some(Boolean) ||
    addonSeries.some(Boolean) ||
    subSeries.some(Boolean);

  const hasConversionData = checkoutConv.some(Boolean) || orderConv.some(Boolean);

  // ── Chart datasets ────────────────────────────────────────────────────────

  const revenueChartData = {
    labels: shortLabels,
    datasets: [
      filters.upsells && {
        label: "Upsells", data: upsellSeries,
        borderColor: "#01679B", backgroundColor: "rgba(1,103,155,0.12)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 1,
      },
      filters.subscriptions && {
        label: "Subscriptions", data: subSeries,
        borderColor: "#0B710E", backgroundColor: "rgba(11,113,14,0.09)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 2,
      },
      filters.addons && {
        label: "Add-ons", data: addonSeries,
        borderColor: "#93319B", backgroundColor: "rgba(147,49,155,0.10)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 3,
      },
    ].filter(Boolean),
  };

  const convChartData = {
    labels: shortLabels,
    datasets: [
      {
        label: "Checkout", data: checkoutConv,
        borderColor: "#93319B", backgroundColor: "rgba(147,49,155,0.08)",
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
      },
      {
        label: "Order", data: orderConv,
        borderColor: "#01679B", backgroundColor: "rgba(1,103,155,0.07)",
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
      },
    ],
  };

  const tableRows = (stats?.topProducts ?? []).map((p) => [
    p.name, p.quantity, fmt(p.revenue, resolvedCurrency), p.module,
  ]);

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
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Page
      backAction={{ onAction: () => navigate("/app") }}
      title="Analytics"
      primaryAction={
        <InlineStack gap="200">
          <DateRangePicker value={range} onChange={setRange} />
        </InlineStack>
      }
    >
      <BlockStack gap="400">

        {/* ── Revenue chart card ── */}
        <Card padding="0">
          <Box padding="400">
            <InlineStack gap="600" wrap={false} blockAlign="start">

              {/* Chart area */}
              <Box style={{ flexGrow: 1, minWidth: 0, height: 260, position: "relative" }}>
                <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
                  <Button
                    icon={DownloadIcon}
                    size="slim"
                    accessibilityLabel="Download revenue data"
                    onClick={() => downloadCSV(revenueChartData, "revenue.csv", false)}
                    disabled={!hasRevenueData}
                  />
                </div>

                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#70707b" }}>
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
                      <Tooltip content="Total revenue generated by Upcart in the selected period." hasUnderline activatorWrapper="span">
                        <Text variant="bodyMd">Revenue</Text>
                      </Tooltip>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <Text variant="headingLg" as="h4">
                        {loading ? "—" : fmt(totalRevenue, resolvedCurrency)}
                      </Text>
                      <Tooltip
                        content={`Change in revenue compared to previous period. Previous revenue: ${fmt(0, resolvedCurrency)}`}
                        hasUnderline activatorWrapper="span"
                      >
                        <FlatIcon />
                      </Tooltip>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text variant="bodyMd" tone="subdued">Filters</Text>
                    <BlockStack gap="150">
                      <FilterPill type="addons" label="Add-ons" active={filters.addons} onToggle={() => toggleFilter("addons")} />
                      <FilterPill type="upsells" label="Upsells" active={filters.upsells} onToggle={() => toggleFilter("upsells")} />
                      <FilterPill type="subscriptions" label="Subscriptions" active={filters.subscriptions} onToggle={() => toggleFilter("subscriptions")} />
                    </BlockStack>
                  </BlockStack>
                </BlockStack>
              </Box>

            </InlineStack>
          </Box>
        </Card>

        {/* ── Stats row ── */}
        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <SmallCard
                title="Cart impressions"
                value={loading ? "—" : cartImpressions}
                icon="https://hubsyntax.com/cart-images/Layer_1.png"
                valueTooltip="Unique times a customer has seen the cart."
              />
              <SmallCard
                title="Checkouts completed"
                value={loading ? "—" : checkoutComplete}
                icon="https://hubsyntax.com/cart-images/Layer_1%20(1).png"
                valueTooltip="Number of orders completed."
              />
              <SmallCard
                title="Cart Checkout"
                value={loading ? "—" : checkouts}
                icon="https://hubsyntax.com/cart-images/Group%201707479976.png"
                valueTooltip="Number of times a customer initiated checkout."
              />
            </BlockStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="100">
                    <Tooltip
                      content="Conversion rate = checkout initiated ÷ cart impressions. A high rate may indicate a small sample size."
                      hasUnderline activatorWrapper="span"
                    >
                      <Text variant="bodyMd" tone="subdued">Conversion rate</Text>
                    </Tooltip>
                    <InlineStack gap="100" blockAlign="center">
                      {/* FIX: show "—" when there are no impressions so we don't display a misleading 0% or 100% */}
                      <Text variant="headingLg" as="h5">
                        {loading
                          ? "—"
                          : cartImpressions === 0
                            ? "—"
                            : rangeConversionRate.toFixed(2) + "%"}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                  <Button
                    icon={DownloadIcon}
                    size="slim"
                    onClick={() => downloadCSV(convChartData, "conversion.csv", true)}
                    accessibilityLabel="Download conversion data"
                    disabled={!hasConversionData}
                  />
                </InlineStack>

                <Box style={{ height: 208 }}>
                  {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#70707b" }}>
                      <Text tone="subdued">Loading…</Text>
                    </div>
                  ) : !hasConversionData ? (
                    <EmptyChartPlaceholder message="No conversion data for this period" />
                  ) : (
                    <Line data={convChartData} options={convOpts} />
                  )}
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* ── Top products ── */}
        {tableRows.length > 0 && (
          <Card padding="0">
            <Box padding="400">
              <Text variant="headingMd" as="h4">Top performing products</Text>
            </Box>
            <DataTable
              columnContentTypes={["text", "numeric", "numeric", "text"]}
              headings={["Product", "Quantity sold", "Revenue", "Module"]}
              rows={tableRows}
            />
          </Card>
        )}

      </BlockStack>
    </Page>
  );
}