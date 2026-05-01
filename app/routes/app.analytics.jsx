import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  DataTable,
  Box,
  Badge,
  EmptyState,
} from "@shopify/polaris";

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

function fmt(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function pct(part, total) {
  if (!total) return "0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

function SummaryCard({ title, value, sub, color }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text variant="bodyMd" tone="subdued">
          {title}
        </Text>
        <Text
          variant="headingXl"
          fontWeight="bold"
          style={{ color: color || "inherit" }}
        >
          {value}
        </Text>
        {sub && (
          <Text variant="bodySm" tone="subdued">
            {sub}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export default function Analytics() {
  const { stats } = useLoaderData();

  if (!stats || stats.totals?.orderCount === 0) {
    return (
      <Page title="Revenue Analytics">
        <EmptyState
          heading="No revenue data yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Revenue breakdown will appear here after customers check out through
            the cart drawer.
          </p>
        </EmptyState>
      </Page>
    );
  }

  const { totals, daily } = stats;
  const currency = "USD";

  const hubRevenue =
    (totals.upsellRevenue || 0) +
    (totals.addonRevenue || 0) +
    (totals.subscriptionRevenue || 0);

  const dailyRows = (daily || []).map((d) => [
    d._id,
    fmt(d.upsellRevenue, currency),
    fmt(d.addonRevenue, currency),
    fmt(d.subscriptionRevenue, currency),
    fmt(d.total, currency),
  ]);

  return (
    <Page title="Revenue Analytics">
      <BlockStack gap="500">
        {/* Summary cards */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <SummaryCard
            title="Total Cart Revenue"
            value={fmt(totals.totalRevenue, currency)}
            sub={`${totals.orderCount} checkout${totals.orderCount !== 1 ? "s" : ""}`}
          />
          <SummaryCard
            title="Upsell Revenue"
            value={fmt(totals.upsellRevenue, currency)}
            sub={pct(totals.upsellRevenue, totals.totalRevenue) + " of total"}
            color="#2C6ECB"
          />
          <SummaryCard
            title="Add-on Revenue"
            value={fmt(totals.addonRevenue, currency)}
            sub={pct(totals.addonRevenue, totals.totalRevenue) + " of total"}
            color="#008060"
          />
          <SummaryCard
            title="Subscription Revenue"
            value={fmt(totals.subscriptionRevenue, currency)}
            sub={pct(totals.subscriptionRevenue, totals.totalRevenue) + " of total"}
            color="#9C6ADE"
          />
        </InlineGrid>

        {/* Revenue split breakdown */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" fontWeight="semibold">
                  Revenue Split
                </Text>

                {[
                  {
                    label: "Base Items",
                    amount: totals.baseRevenue,
                    badge: "info",
                  },
                  {
                    label: "Upsells",
                    amount: totals.upsellRevenue,
                    badge: "attention",
                  },
                  {
                    label: "Add-ons",
                    amount: totals.addonRevenue,
                    badge: "success",
                  },
                  {
                    label: "Subscriptions",
                    amount: totals.subscriptionRevenue,
                    badge: "new",
                  },
                ].map(({ label, amount, badge }) => (
                  <Box
                    key={label}
                    borderBlockEndWidth="025"
                    borderColor="border"
                    paddingBlockEnd="300"
                  >
                    <InlineGrid columns="1fr auto" alignItems="center">
                      <Text variant="bodyMd">{label}</Text>
                      <BlockStack gap="100" inlineAlign="end">
                        <Text variant="bodyMd" fontWeight="semibold">
                          {fmt(amount, currency)}
                        </Text>
                        <Badge tone={badge}>
                          {pct(amount, totals.totalRevenue)}
                        </Badge>
                      </BlockStack>
                    </InlineGrid>
                  </Box>
                ))}

                <Box>
                  <InlineGrid columns="1fr auto" alignItems="center">
                    <Text variant="bodyMd" fontWeight="bold">
                      Hub-attributed Revenue
                    </Text>
                    <BlockStack gap="100" inlineAlign="end">
                      <Text variant="bodyMd" fontWeight="bold">
                        {fmt(hubRevenue, currency)}
                      </Text>
                      <Badge tone="success">
                        {pct(hubRevenue, totals.totalRevenue)} of total
                      </Badge>
                    </BlockStack>
                  </InlineGrid>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" fontWeight="semibold">
                  Visual Breakdown
                </Text>

                {[
                  {
                    label: "Upsells",
                    amount: totals.upsellRevenue,
                    color: "#2C6ECB",
                  },
                  {
                    label: "Add-ons",
                    amount: totals.addonRevenue,
                    color: "#008060",
                  },
                  {
                    label: "Subscriptions",
                    amount: totals.subscriptionRevenue,
                    color: "#9C6ADE",
                  },
                  {
                    label: "Base",
                    amount: totals.baseRevenue,
                    color: "#B5B5B5",
                  },
                ].map(({ label, amount, color }) => {
                  const width = totals.totalRevenue
                    ? ((amount / totals.totalRevenue) * 100).toFixed(1)
                    : 0;
                  return (
                    <BlockStack key={label} gap="100">
                      <InlineGrid columns="1fr auto">
                        <Text variant="bodySm">{label}</Text>
                        <Text variant="bodySm" tone="subdued">
                          {width}%
                        </Text>
                      </InlineGrid>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: "#F1F1F1",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${width}%`,
                            background: color,
                            borderRadius: 4,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </BlockStack>
                  );
                })}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Last 30 days daily table */}
        {dailyRows.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" fontWeight="semibold">
                Daily Breakdown (Last 30 Days)
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                headings={["Date", "Upsells", "Add-ons", "Subscriptions", "Total"]}
                rows={dailyRows}
              />
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
