import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import {
  Page, Card, Text, InlineStack, BlockStack, Box, Thumbnail, Link, Divider,
} from "@shopify/polaris";
import { requireShopData } from "./components/shop.server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_LABELS = {
  item_added: "Item added to cart",
  item_removed: "Item removed from cart",
  product_viewed: "Product viewed",
  page_viewed: "Page viewed",
  cart_impression: "Cart opened",
  checkout_initiated: "Checkout started",
  checkout_completed: "Checkout completed",
};

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
}

function formatDay(value) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function describeDevice(ua = "") {
  if (!ua) return "—";
  const os = /Windows/i.test(ua) ? "Windows"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Android/i.test(ua) ? "Android"
    : /Mac OS/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux" : "Unknown OS";
  const browser = /Edg\//i.test(ua) ? "Edge"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Safari\//i.test(ua) ? "Safari" : "Unknown browser";
  return `${browser} on ${os}`;
}

function InfoRow({ label, value }) {
  return (
    <InlineStack align="space-between" gap="400" wrap={false}>
      <Text tone="subdued" as="span">{label}</Text>
      <Text as="span">{value}</Text>
    </InlineStack>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request, params }) => {
  const { shop, apiUrl } = await requireShopData(request);
  return { shop: shop?.myshopifyDomain, apiUrl, sessionId: params.sessionId };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartDetails() {
  const { shop, apiUrl, sessionId } = useLoaderData();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const clientApiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_SECRET_KEY) || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${apiUrl}/api/cart-activity/session`);
        url.searchParams.set("shop", shop);
        url.searchParams.set("sessionId", sessionId);
        const res = await fetch(url.toString(), { headers: { "x-api-key": clientApiKey } });
        const json = await res.json();
        if (!json.success) throw new Error("Request failed");
        if (!cancelled) setData(json.data);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiUrl, shop, sessionId, clientApiKey]);

  const timeline = data?.timeline ?? [];
  // Newest first, grouped by day
  const grouped = [...timeline].reverse().reduce((acc, ev) => {
    const day = formatDay(ev.at);
    (acc[day] ||= []).push(ev);
    return acc;
  }, {});

  return (
    <Page
      title="Cart Details"
      backAction={{ onAction: () => navigate("/app/activity") }}
    >
      <BlockStack gap="400">
        {loading ? (
          <Card><Text tone="subdued" as="p">Loading…</Text></Card>
        ) : error || !data ? (
          <Card><Text tone="critical" as="p">Could not load this cart.</Text></Card>
        ) : (
          <>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Customer information</Text>
                <Divider />
                <InfoRow
                  label="Customer"
                  value={data.customerId ? `Customer #${data.customerId}` : "Guest"}
                />
                <InfoRow
                  label="Location"
                  value={data.timezone ? data.timezone.replace(/_/g, " ") : "—"}
                />
                <InfoRow label="Device" value={describeDevice(data.userAgent)} />
                <InfoRow
                  label="Started"
                  value={data.startedAt ? formatDateTime(data.startedAt) : "—"}
                />
                <InfoRow label="Session" value={data.sessionId} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Customer journey</Text>
                {timeline.length === 0 ? (
                  <Text tone="subdued" as="p">No events recorded for this cart.</Text>
                ) : (
                  Object.entries(grouped).map(([day, items]) => (
                    <BlockStack key={day} gap="200">
                      <Text variant="headingSm" tone="subdued" as="h4">{day}</Text>
                      {items.map((ev, i) => (
                        <Box
                          key={`${ev.at}-${i}`}
                          padding="300"
                          borderWidth="025"
                          borderColor="border"
                          borderRadius="200"
                        >
                          <InlineStack align="space-between" blockAlign="center" gap="300" wrap={false}>
                            <InlineStack gap="300" blockAlign="center" wrap={false}>
                              {(ev.type === "item_added" || ev.type === "item_removed" || ev.type === "product_viewed") && (
                                <Thumbnail source={ev.image || ""} alt="" size="small" />
                              )}
                              <BlockStack gap="050">
                                <Text fontWeight="semibold" as="span">
                                  {EVENT_LABELS[ev.type] || ev.type}
                                </Text>
                                {(ev.type === "item_added" || ev.type === "item_removed") &&
                                  ev.productTitle && (
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    {ev.handle ? (
                                      <Link url={`https://${shop}/products/${ev.handle}`} target="_blank">
                                        {ev.productTitle}
                                      </Link>
                                    ) : ev.productTitle}
                                    {ev.variantTitle ? ` · ${ev.variantTitle}` : ""}
                                    {` · Quantity: ${ev.quantity}`}
                                  </Text>
                                )}
                                {(ev.type === "product_viewed" || ev.type === "page_viewed") && (
                                  <BlockStack gap="050">
                                    <Text variant="bodySm" as="span">
                                      {ev.type === "page_viewed" ? ev.pageTitle : ev.productTitle}
                                      {ev.type === "product_viewed" && ev.price > 0
                                        ? ` · ${`${ev.currency || ""} ${Number(ev.price).toFixed(2)}`.trim()}`
                                        : ""}
                                    </Text>
                                    {ev.url && (
                                      <div style={{ wordBreak: "break-all", fontSize: 12 }}>
                                        <Link url={ev.url} target="_blank">{ev.url}</Link>
                                      </div>
                                    )}
                                  </BlockStack>
                                )}
                              </BlockStack>
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued" as="span">
                              {formatDateTime(ev.at)}
                            </Text>
                          </InlineStack>
                        </Box>
                      ))}
                    </BlockStack>
                  ))
                )}
              </BlockStack>
            </Card>
          </>
        )}
      </BlockStack>
    </Page>
  );
}
