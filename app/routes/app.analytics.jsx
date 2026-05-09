import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import {
  Page, Card, Text, InlineStack, BlockStack,
  Box, Button, DataTable, Layout, Tooltip, Icon
} from "@shopify/polaris";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip as ChartTooltip,
} from "chart.js";
import { useState, useCallback } from "react";
import DateRangePicker from "./components/ui/DateRangePicker";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: currency,
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

  while (current <= end) {
    labels.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return labels;
}

function FlatIcon() {
  return (
    <svg viewBox="0 0 11 16" height="14" width="11"
      style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M0.519531 1.79395H12.0039V0.249023H0.519531V1.79395Z"
        fill="#8c9196" transform="translate(0,7)" />
    </svg>
  );
}

// ─── filter pill ──────────────────────────────────────────────────────────────

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

// ─── chart options ────────────────────────────────────────────────────────────

function getChartOpts(currency = "USD") {
  const currencySymbol = new Intl.NumberFormat("en-US", { style: "currency", currency })
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
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, currency)}`,  // ✅ dynamic currency
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
          callback: function (val) { return this.getLabelForValue(val); },
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

const convOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "index", intersect: false,
      backgroundColor: "#ffffff",
      titleColor: "#202223", bodyColor: "#202223",
      borderColor: "#e1e3e5", borderWidth: 1,
      padding: 10, boxPadding: 4, usePointStyle: true,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
      },
    },
  },
  interaction: { mode: "index", intersect: false },
  scales: {
    x: {
      ticks: { color: "#70707b", font: { size: 12 }, maxTicksLimit: 6 },
      grid: { display: false },
      border: { display: false },
      stepSize: 500,
      padding: 10,
    },
    y: {
      min: 0,
      max: 100,
      ticks: {
        color: "#70707b",
        font: { size: 12 },
        stepSize: 100,
        callback: (v) => v.toFixed(2) + "%",
      },
      grid: { color: "#eeeeef" },
      border: { display: false },
    },
  },
};

// ─── SmallCard ────────────────────────────────────────────────────────────────

function SmallCard({ title, value, tooltip, valueTooltip, icon }) {
  return (
    <Card>
      <Box
        paddingBlockStart="100"
        paddingBlockEnd="100"
        paddingInlineStart="300"
        paddingInlineEnd="300">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>

          {/* Left: title + value */}
          <BlockStack gap="100">
            <Tooltip content={valueTooltip} hasUnderline activatorWrapper="span">
              <Text variant="bodyMd" tone="subdued" as="span">{title}</Text>
            </Tooltip>
            <InlineStack align="left" gap="200" blockAlign="center">
              <Text variant="headingLg" as="h5">{value}</Text>
              <Tooltip content={tooltip} hasUnderline activatorWrapper="span">
                <FlatIcon />
              </Tooltip>
            </InlineStack>
          </BlockStack>

          {/* Right: icon */}
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
// ─── loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
  try {
    const res = await fetch(`${apiUrl}/api/revenue-stats?shop=${session.shop}`);
    const json = await res.json();
    return { stats: json.data || null, shop: session.shop };
  } catch {
    return { stats: null, shop: session.shop };
  }
};

// ─── main component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const { stats } = useLoaderData();
  const navigate = useNavigate();

  const today = new Date();

  const currency = stats?.revenue?.totals?.currency ?? "USD";
  const chartOpts = getChartOpts(currency);

  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  const [range, setRange] = useState({
    start: defaultStart,
    end: today,
  });

  const totals = stats?.revenue?.totals ?? {};
  const daily = stats?.revenue?.daily ?? [];
  const analytics = stats?.analytics ?? {};

  const cartImpressions = analytics.cart_impression ?? 0;
  const checkouts = analytics.checkout_initiated ?? 0;
  const checkoutComplate = stats?.checkoutsCompleted ?? 0;

  console.log(checkoutComplate, stats)

  const [filters, setFilters] = useState({ addons: true, upsells: true, subscriptions: true });
  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalRevenue =
    (filters.upsells ? (totals.upsellRevenue ?? 0) : 0) +
    (filters.addons ? (totals.addonRevenue ?? 0) : 0) +
    (filters.subscriptions ? (totals.subscriptionRevenue ?? 0) : 0);

  const labels = getLabelsFromRange(range.start, range.end);
  const dayMap = buildDailyMap(daily);

  const upsellSeries = labels.map((l) => dayMap[l]?.upsellRevenue ?? 0);
  const addonSeries = labels.map((l) => dayMap[l]?.addonRevenue ?? 0);
  const subSeries = labels.map((l) => dayMap[l]?.subscriptionRevenue ?? 0);

  // Conversion rate ko 100% pe cap karo
  const checkoutConvRate = cartImpressions > 0
    ? Math.min((checkouts / cartImpressions) * 100, 100)
    : 0;

  const orderConvRate = checkouts > 0
    ? Math.min((checkoutComplate / checkouts) * 100, 100)
    : 0;

  const abandonedCart = cartImpressions - checkouts; // carts that didn't reach checkout

  // For the chart — spread real conversion rates across the last day (today)
  const checkoutConv = labels.map((_, i) => (i === 29 ? checkoutConvRate : 0));
  const orderConv = labels.map((_, i) => (i === 29 ? orderConvRate : 0));

  // Displayed conversion rate (checkout conversion)
  const conversionRate =
    cartImpressions > 0
      ? checkoutConvRate.toFixed(2) + "%"
      : "0.00%";

  // full date labels: "Apr 3, 2026"
  const shortLabels = labels.map((l) => {
    const d = new Date(l + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  });

  const revenueChartData = {
    labels: shortLabels,
    datasets: [
      filters.upsells && {
        label: "Upsells",
        data: upsellSeries,
        borderColor: "#01679B",
        backgroundColor: "rgba(1,103,155,0.12)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 1,
      },
      filters.subscriptions && {
        label: "Subscriptions",
        data: subSeries,
        borderColor: "#0B710E",
        backgroundColor: "rgba(11,113,14,0.09)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 2,
      },
      filters.addons && {
        label: "Add-ons",
        data: addonSeries,
        borderColor: "#93319B",
        backgroundColor: "rgba(147,49,155,0.10)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, order: 3,
      },
    ].filter(Boolean),
  };

  const convChartData = {
    labels: shortLabels,
    datasets: [
      {
        label: "Checkout",
        data: checkoutConv,
        borderColor: "#93319B",
        backgroundColor: "rgba(147,49,155,0.08)",
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
      },
      {
        label: "Order",
        data: orderConv,
        borderColor: "#01679B",
        backgroundColor: "rgba(1,103,155,0.07)",
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
      },
    ],
  };

  const tableRows = (stats?.topProducts ?? []).map((p) => [
    p.name, p.quantity, fmt(p.revenue, currency), p.module,
  ]);

  // ─── Download helper ──────────────────────────────────────────────────────────
  function downloadCSV(data, filename, isPercentage = false) {
    const headers = ["Date", ...data.datasets.map((d) => d.label)];
    const rows = data.labels.map((label, i) =>
      [
        `"${label}"`,
        ...data.datasets.map((d) => {
          const val = d.data[i] ?? 0;
          return isPercentage ? val.toFixed(2) + "%" : val;
        })
      ]
    );
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Page
        backAction={{ onAction: () => navigate("/app") }}
        title="Analytics"
        primaryAction={
          <InlineStack gap="200">
            <DateRangePicker value={range} onChange={setRange} />
            {/* <Button icon={CalendarCheckIcon} disclosure>Compare: None</Button> */}
          </InlineStack>
        }
      >
        <BlockStack gap="400">

          {/* ── Revenue chart card ── */}
          <Card padding="0">
            <Box padding="400">
              <InlineStack gap="600" wrap={false} blockAlign="start">

                {/* Chart — left, with download button top-right */}
                <Box style={{ flexGrow: 1, minWidth: 0, height: 260, position: "relative" }}>
                  {/* ← Download button top-right of chart */}
                  <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
                    <Button
                      icon={DownloadIcon}
                      size="slim"
                      accessibilityLabel="Download revenue data"
                      onClick={() => downloadCSV(revenueChartData, "revenue.csv", false)}
                    />
                  </div>
                  <Line data={revenueChartData} options={chartOpts} />
                </Box>

                {/* Right info panel — same as before */}
                <Box width="180px">
                  <BlockStack gap="400">
                    <BlockStack gap="100">
                      <InlineStack gap="100" blockAlign="center">
                        <Tooltip content="This is the total revenue generated by Upcart." hasUnderline activatorWrapper="span">
                          <Text variant="bodyMd">Revenue</Text>
                        </Tooltip>
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="center">
                        <Text variant="headingLg" as="h4">{fmt(totalRevenue, currency)}</Text>
                        <Tooltip
                          content={`Change in revenue compared to previous period. Previous revenue: ${fmt(0, currency)}`}
                          hasUnderline
                          activatorWrapper="span"
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
                  value={cartImpressions}
                  icon="https://hubsyntax.com/cart-images/Layer_1.png"
                  valueTooltip="An impression is a unique time a customer has seen the cart."
                  tooltip={`Change in cart impressions compared to previous period. Previous cart impressions: ${cartImpressions}`}
                />
                <SmallCard
                  title="Checkouts completed"
                  value={checkoutComplate}
                  icon="https://hubsyntax.com/cart-images/Layer_1%20(1).png"
                  valueTooltip="This is the number of items orders completed."
                  tooltip={`Change in checkouts compared to previous period. Previous checkouts: ${checkoutComplate}`}
                />
                {/* <SmallCard
                  title="Abandoned cart"
                  value={abandonedCart}
                  valueTooltip="Number of carts that were opened but did not proceed to checkout."
                  tooltip="Change in abandoned carts compared to previous period. Previous abandoned carts: 0"
                /> */}
                <SmallCard
                  title="Cart Checkout"
                  value={checkouts}
                  icon="https://hubsyntax.com/cart-images/Group%201707479976.png"
                  valueTooltip="Number of times a customer initiated the checkout process."
                  tooltip={`Change in cart checkouts compared to previous period. Previous cart checkouts: ${checkouts}`}
                />
              </BlockStack>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                      <Text variant="bodyMd" tone="subdued">Conversion rate</Text>
                      <InlineStack gap="100" blockAlign="center">
                        <Text variant="headingLg" as="h5">{conversionRate}</Text>
                        <FlatIcon />
                      </InlineStack>
                    </BlockStack>
                    <Button icon={DownloadIcon} size="slim" onClick={() => downloadCSV(convChartData, "conversion.csv", true)}
                      accessibilityLabel="Download conversion data" />
                  </InlineStack>
                  <Box style={{ height: 210 }}>
                    <Line data={convChartData} options={convOpts} />
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
    </>
  );
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M17.28 12.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.75-1.75a.75.75 0 1 1 1.06-1.06l1.22 1.22 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
    </svg>
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