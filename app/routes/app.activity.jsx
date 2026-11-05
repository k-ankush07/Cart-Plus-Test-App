import { useCallback, useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Select,
  Box,
  Badge,
  Thumbnail,
  Link,
  Pagination,
} from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import DateRangePicker from "./components/ui/DateRangePicker";
import { requireShopData } from "./components/shop.server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHOW_ALL_ACTIVITY = false;

const ACTIVITY_TYPES = SHOW_ALL_ACTIVITY
  ? [
      { label: "Cart Activity", value: "cart" },
      { label: "All Activity", value: "all" },
    ]
  : [{ label: "Cart Activity", value: "cart" }];

// Non-cart events shown under "All Activity"
const EVENT_META = {
  cart_impression: { label: "Opened cart", tone: "info" },
  checkout_initiated: { label: "Started checkout", tone: "attention" },
  checkout_completed: { label: "Completed checkout", tone: "success" },
};

// Whole days in the viewer's local time: start of first day → end of last day
function getRange(range) {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function LastUpdated({ value }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now()); // value badalte hi turant sync
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [value]);

  if (!value) return null;

  const sec = Math.max(0, Math.floor((now - value) / 1000));
  let label;
  if (sec < 60) label = `${sec}s ago`;
  else if (sec < 3600) label = `${Math.floor(sec / 60)}m ago`;
  else if (sec < 86400) label = `${Math.floor(sec / 3600)}h ago`;
  else label = `${Math.floor(sec / 86400)}d ago`;

  return (
    <Text variant="bodyMd" tone="subdued" as="span">
      Last updated: {label}
    </Text>
  );
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgoLong(value, now) {
  const sec = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  const unit = (n, name) => `${n} ${name}${n === 1 ? "" : "s"} ago`;
  if (sec < 60) return unit(sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return unit(min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 24) return unit(hr, "hour");
  return unit(Math.floor(hr / 24), "day");
}

const FEED_TITLES = {
  added: "Item Added to Cart",
  removed: "Item Removed from Cart",
  product_viewed: "Product Viewed",
  page_viewed: "Page Viewed",
  cart_impression: "Cart Opened",
  checkout_initiated: "Checkout Started",
  checkout_completed: "Checkout Completed",
};

// "All Activity": one card-style row per event (views, cart changes, checkout)
function priceLabel(value, currency) {
  if (value === null || value === undefined || Number(value) === 0) return "—";
  const safeCurrency = currency || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: safeCurrency,
    currencyDisplay: "symbol",
  }).format(Number(value));
}

function FeedList({ events, now, navigate, currency }) {
  return (
    <div
      style={{
        border: "1px solid #e3e3e3",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {events.map((e, i) => {
        const kind = e.kind === "event" ? e.eventType : e.action;
        const isCartChange = kind === "added" || kind === "removed";
        const customer = e.customerId ? `Customer #${e.customerId}` : "Guest";
        const name = kind === "page_viewed" ? e.pageTitle : e.productTitle;
        return (
          <div
            key={e._id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "start",
              columnGap: 16,
              padding: "14px 16px",
              borderTop: i === 0 ? "none" : "1px solid #f1f1f1",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <Text fontWeight="semibold" as="span">
                {FEED_TITLES[kind] || kind}
              </Text>
              {name && (
                <Text as="span">
                  <span style={{ textAlign: "left" }}>{name}</span>
                </Text>
              )}
              {e.url && (
                <div
                  style={{
                    width: "100%",
                    overflowWrap: "anywhere",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  <Link url={e.url} target="_blank">
                    {e.url}
                  </Link>
                </div>
              )}
              {isCartChange && (
                <Text variant="bodySm" tone="subdued" as="span">
                  {`Qty: ${kind === "added" ? "+" : "-"}${e.quantity}`}
                  {e.price > 0
                    ? ` · Price: ${priceLabel(e.price, e.currency || currency)}`
                    : ""}
                </Text>
              )}
              {!isCartChange && e.price > 0 && (
                <Text variant="bodySm" tone="subdued" as="span">
                  {priceLabel(e.price, e.currency || currency)}
                </Text>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <Text variant="bodySm" tone="subdued" as="span">
                  {customer}
                </Text>
                <Link
                  onClick={() =>
                    navigate(`/app/activity/${encodeURIComponent(e.sessionId)}`)
                  }
                >
                  {`#${String(e.sessionId).slice(-6).toUpperCase()}`}
                </Link>
              </div>
            </div>
            <div style={{ whiteSpace: "nowrap", textAlign: "right" }}>
              <Text variant="bodySm" tone="subdued" as="span">
                {timeAgoLong(e.createdAt, now)}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const cellStyle = { padding: "12px 6px", verticalAlign: "middle" };
const headStyle = {
  ...cellStyle,
  textAlign: "left",
  fontWeight: 500,
  color: "#303030",
  fontSize: 13,
};

function TopProductsCard({
  title,
  subtitle,
  items,
  loading,
  valueText,
  valueOrder,
  valueHeading = "Total",
  shop,
  showImage,
  orderHeading = "Times",
  bestSellingProductHeading = "Times",
  valueOrderFalse = true,
}) {
  const titleClip = {
    display: "inline-block",
    maxWidth: 250,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
  };

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="050">
          <Text variant="headingMd" as="h3">
            {title}
          </Text>
          <Text variant="bodySm" tone="subdued" as="p">
            {subtitle}
          </Text>
        </BlockStack>

        {loading ? (
          <Text tone="subdued" as="p">
            Loading…
          </Text>
        ) : items.length === 0 ? (
          <Box padding="400">
            <Text tone="subdued" alignment="center" as="p">
              No data in this period yet.
            </Text>
          </Box>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e3e3e3",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 320,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e3e3e3" }}>
                  {/* <th style={{ ...headStyle, width: 40, paddingLeft: 16 }}>
                    #
                  </th> */}
                  <th style={headStyle}>Product</th>
                  {valueOrderFalse && (
                    <th
                      style={{
                        ...headStyle,
                        textAlign: "right",
                        paddingRight: 16,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {orderHeading}
                    </th>
                  )}
                  {valueOrderFalse && (
                    <th
                      style={{
                        ...headStyle,
                        textAlign: "right",
                        paddingRight: 16,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {valueHeading}
                    </th>
                  )}
                  {!valueOrderFalse && (
                    <th
                      style={{
                        ...headStyle,
                        textAlign: "right",
                        paddingRight: 16,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bestSellingProductHeading}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        i === items.length - 1 ? "none" : "1px solid #f1f1f1",
                      background: i === 0 ? "#f7fbff" : "transparent",
                    }}
                  >
                    {/* <td style={{ ...cellStyle, paddingLeft: 16 }}>
                      <Text fontWeight="semibold" tone="subdued" as="span">
                        {i + 1}
                      </Text>
                    </td> */}

                    <td style={cellStyle}>
                      <InlineStack gap="300" blockAlign="center" wrap={false}>
                        {showImage && p.image && (
                          <img
                            src={p.image}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 8,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          {p.handle ? (
                            <Link
                              url={`https://${shop}/products/${p.handle}`}
                              target="_blank"
                            >
                              <span title={p.title} style={titleClip}>
                                {p.title}
                              </span>
                            </Link>
                          ) : (
                            <span title={p.title} style={titleClip}>
                              <Text as="span">{p.title}</Text>
                            </span>
                          )}
                        </div>
                      </InlineStack>
                    </td>

                    {valueOrderFalse && (
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "right",
                          paddingRight: 16,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <InlineStack
                          gap="200"
                          blockAlign="center"
                          align="end"
                          wrap={false}
                        >
                          <Text fontWeight="semibold" as="span">
                            {valueOrder(p)}
                          </Text>
                        </InlineStack>
                      </td>
                    )}

                    <td
                      style={{
                        ...cellStyle,
                        textAlign: "right",
                        paddingRight: 16,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <InlineStack
                        gap="200"
                        blockAlign="center"
                        align="end"
                        wrap={false}
                      >
                        {i === 0 && <Badge tone="success">Top</Badge>}
                        <Text fontWeight="semibold" as="span">
                          {valueText(p)}
                        </Text>
                      </InlineStack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BlockStack>
    </Card>
  );
}

// Changing only ?type must not re-run the loader.
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }) {
  if (currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
  const { shop, apiUrl, currency } = await requireShopData(request);
  return {
    shop: shop?.myshopifyDomain,
    apiUrl,
    currency: currency || shop?.currencyCode || "USD",
  };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Activity() {
  const { shop, apiUrl, currency: shopCurrency } = useLoaderData();
  const navigate = useNavigate();

  const [range, setRange] = useState(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return { start, end };
  });
  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();
  // Persist the dropdown in the URL (?type=cart|all) without re-running the loader
  const [type, setTypeState] = useState(() =>
    SHOW_ALL_ACTIVITY &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("type") === "all"
      ? "all"
      : "cart",
  );
  const [, setSearchParams] = useSearchParams();
  const setType = (value) => {
    setTypeState(value);
    // Go through the router (not raw history.replaceState) so React Router /
    // App Bridge stay in sync with the URL and the sidebar highlight.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("type", value);
        return next;
      },
      { replace: true },
    );
  };
  const [top, setTop] = useState({ mostAdded: [], bestSelling: [] });
  const [topLoading, setTopLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(false);
  const [events, setEvents] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const [page, setPage] = useState(0);
  const cursorsRef = useRef([null]);
  const pageRef = useRef(0);

  const clientApiKey =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_SECRET_KEY) ||
    "";

  const loadTop = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setTopLoading(true);

      try {
        const { startDate, endDate } = getRange({
          start: startISO,
          end: endISO,
        });

        const url = new URL(`${apiUrl}/api/cart-activity/top-products`);
        url.searchParams.set("shop", shop);
        url.searchParams.set("startDate", startDate);
        url.searchParams.set("endDate", endDate);

        const res = await fetch(url.toString(), {
          headers: { "x-api-key": clientApiKey },
        });

        const json = await res.json();

        if (!json.success) return;

        const { mostAdded = [], bestSelling = [] } = json.data;

        const productIds = [
          ...new Set(
            [...mostAdded, ...bestSelling]
              .map((p) => String(p.productId || ""))
              .filter(Boolean),
          ),
        ];

        let shopifyProducts = [];

        if (productIds.length > 0) {
          const productRes = await fetch("/shopify/get-products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shop,
              productIds,
            }),
          });

          const productJson = await productRes.json();
          shopifyProducts =
            productJson.products ||
            productJson.data?.products ||
            productJson.data ||
            [];
        }

        const getProductId = (id) =>
          String(id || "")
            .split("/")
            .pop();

        const productMap = new Map(
          shopifyProducts.map((product) => [getProductId(product.id), product]),
        );

        const attachProductImage = (products) =>
          products.map((p) => {
            const shopifyProduct = productMap.get(getProductId(p.productId));

            const image =
              shopifyProduct?.featuredImage?.url ||
              shopifyProduct?.images?.edges?.[0]?.node?.url ||
              shopifyProduct?.image?.src ||
              shopifyProduct?.image ||
              p.image ||
              "";

            return {
              ...p,
              image,
              title: p.title || shopifyProduct?.title || "Product",
            };
          });

        setTop({
          mostAdded: attachProductImage(mostAdded),
          bestSelling: attachProductImage(bestSelling),
        });
      } catch (error) {
        console.error("LOAD TOP PRODUCTS ERROR:", error);
      } finally {
        if (!silent) setTopLoading(false);
      }
    },
    [apiUrl, shop, startISO, endISO, clientApiKey],
  );

  const fetchPage = useCallback(
    async ({ before } = {}) => {
      const { startDate, endDate } = getRange({ start: startISO, end: endISO });
      const url = new URL(`${apiUrl}/api/cart-activity`);
      url.searchParams.set("shop", shop);
      url.searchParams.set("startDate", startDate);
      url.searchParams.set("endDate", endDate);
      url.searchParams.set("type", type);
      url.searchParams.set("limit", type === "all" ? "50" : "10");
      if (before) url.searchParams.set("before", before);

      const res = await fetch(url.toString(), {
        headers: { "x-api-key": clientApiKey },
      });
      const json = await res.json();
      if (!json.success) throw new Error("Request failed");
      return json.data;
    },
    [apiUrl, shop, startISO, endISO, type, clientApiKey],
  );

  const reload = useCallback(
    async ({ silent = false, keepPage = false } = {}) => {
      const id = ++requestId.current;
      if (!silent) setLoading(true);

      if (!keepPage) {
        cursorsRef.current = [null];
        pageRef.current = 0;
        setPage(0);
      }
      const before = cursorsRef.current[pageRef.current] || undefined;

      try {
        const [data] = await Promise.all([
          fetchPage({ before }),
          loadTop({ silent }),
        ]);
        if (id !== requestId.current) return;
        setEvents(data.events);
        setHasMore(data.hasMore);
        setNextBefore(data.nextBefore);
        setError(false);
        setLastUpdated(Date.now());
      } catch (e) {
        if (id === requestId.current) setError(true);
      } finally {
        if (id === requestId.current && !silent) setLoading(false);
      }
    },
    [fetchPage, loadTop],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  // Tick so "Last updated: Ns ago" stays current
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Live mode: poll every 10 seconds
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(
      () => reload({ silent: true, keepPage: true }),
      10000,
    );
    return () => clearInterval(timer);
  }, [live, reload]);

  const goToPage = async (targetIndex) => {
    if (loadingMore) return;
    const before =
      targetIndex > pageRef.current
        ? nextBefore
        : cursorsRef.current[targetIndex] || undefined;
    if (targetIndex > pageRef.current && !before) return;

    setLoadingMore(true);
    try {
      const data = await fetchPage({ before });
      if (targetIndex > pageRef.current) {
        cursorsRef.current[targetIndex] = before;
      }
      pageRef.current = targetIndex;
      setPage(targetIndex);
      setEvents(data.events);
      setHasMore(data.hasMore);
      setNextBefore(data.nextBefore);
      setError(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const onNext = () => goToPage(pageRef.current + 1);
  const onPrevious = () => goToPage(pageRef.current - 1);

  return (
    <div className="_page_yc9hy_1">
      <Page
        fullWidth
        title="Activity"
        backAction={{ onAction: () => navigate("/app") }}
      >
        <BlockStack gap="400">
          <InlineStack gap="300" blockAlign="center">
            <div style={{ minWidth: 170 }}>
              <Select
                label="Activity type"
                labelHidden
                options={ACTIVITY_TYPES}
                value={type}
                onChange={setType}
              />
            </div>

            <Button
              pressed={live}
              onClick={() => setLive((v) => !v)}
              icon={
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    display: "inline-block",
                    background: live ? "#2563eb" : "#8a8a8a",
                  }}
                />
              }
            >
              Live
            </Button>

            <Button
              icon={RefreshIcon}
              accessibilityLabel="Refresh"
              onClick={() => reload({ keepPage: true })}
              loading={loading}
            />

            <LastUpdated value={lastUpdated} />

            <div style={{ flex: 1 }} />

            <DateRangePicker value={range} onChange={setRange} />
          </InlineStack>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            <TopProductsCard
              title="Best-selling product"
              subtitle="Top 5 by units sold in this period"
              items={top.bestSelling}
              loading={topLoading}
              shop={shop}
              showImage
              valueOrder={(p) => `${p.quantity}`}
              valueText={(p) =>
                `${priceLabel(p.revenue, p.currency || shopCurrency)}`
              }
            />
            <TopProductsCard
              title="Most-added product"
              subtitle="Top 5 by units added to cart in this period"
              items={top.mostAdded}
              loading={topLoading}
              shop={shop}
              showImage
              valueOrder={(p) => `${p.quantity}`}
              valueText={(p) => `${p.addedQty} `}
              valueOrderFalse={false}
            />
          </div>

          <Card>
            <BlockStack gap="300">
              <Text variant="bodySm" tone="subdued" as="p">
                {loading
                  ? "Loading activity…"
                  : `Showing ${events.length}${hasMore ? "+" : ""} ${type === "all" ? "activit" : "event"}${type === "all" ? (events.length === 1 ? "y" : "ies") : events.length === 1 ? "" : "s"}`}
              </Text>

              {error && (
                <Text tone="critical" as="p">
                  Could not load activity. Please try again.
                </Text>
              )}

              {!loading && !error && events.length === 0 ? (
                <Box padding="800">
                  <Text tone="subdued" alignment="center" as="p">
                    No cart activity in this period yet.
                  </Text>
                </Box>
              ) : type === "all" ? (
                <FeedList
                  events={events}
                  now={now}
                  navigate={navigate}
                  currency={shopCurrency}
                />
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    border: "1px solid #e3e3e3",
                    borderRadius: 12,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 860,
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e3e3e3" }}>
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Product
                        </th>
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Quantity
                        </th>
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Price
                        </th>
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Cart Action
                        </th>
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Customer
                        </th>
                        {/* <th style={{ ...headStyle, textAlign: "left" }}>
                          Location
                        </th> */}
                        <th style={{ ...headStyle, textAlign: "left" }}>
                          Cart Details
                        </th>
                        <th
                          style={{
                            ...headStyle,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => {
                        const isEvent = e.kind === "event";
                        const added = e.action === "added";
                        const meta = EVENT_META[e.eventType] || {
                          label: e.eventType,
                          tone: undefined,
                        };
                        return (
                          <tr
                            key={e._id}
                            style={{ borderBottom: "1px solid #f1f1f1" }}
                          >
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              {isEvent ? (
                                <Text tone="subdued" as="span">
                                  —
                                </Text>
                              ) : (
                                <InlineStack
                                  gap="300"
                                  blockAlign="start"
                                  wrap={false}
                                >
                                  <img
                                    src={e.image}
                                    style={{
                                      width: "56px",
                                      height: "56px",
                                      objectFit: "cover",
                                      border: "none",
                                      outline: "none",
                                      boxShadow: "none",
                                      borderRadius: "8px",
                                    }}
                                  />

                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 2,
                                      textAlign: "left",
                                      minWidth: 0,
                                    }}
                                  >
                                    {e.handle ? (
                                      <Link
                                        url={`https://${shop}/products/${e.handle}`}
                                        target="_blank"
                                      >
                                        <span
                                          style={{
                                            display: "inline-block",
                                            maxWidth: "180px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            verticalAlign: "bottom",
                                          }}
                                          title={e.productTitle || "Product"}
                                        >
                                          {e.productTitle || "Product"}
                                        </span>
                                      </Link>
                                    ) : (
                                      <Text as="span">
                                        {e.productTitle || "Product"}
                                      </Text>
                                    )}
                                    {e.variantTitle && (
                                      <Text
                                        variant="bodySm"
                                        tone="subdued"
                                        as="span"
                                      >
                                        {e.variantTitle}
                                      </Text>
                                    )}
                                  </div>
                                </InlineStack>
                              )}
                            </td>
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              <Text as="span">
                                {isEvent
                                  ? "—"
                                  : `${added ? "+" : "-"}${e.quantity}`}
                              </Text>
                            </td>
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              <Text as="span">
                                {isEvent
                                  ? "—"
                                  : priceLabel(
                                      e.price,
                                      e.currency || shopCurrency,
                                    )}
                              </Text>
                            </td>
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              {isEvent ? (
                                <Badge tone={meta.tone}>{meta.label}</Badge>
                              ) : (
                                <Badge tone={added ? "success" : "critical"}>
                                  {`${added ? "Added" : "Removed"} ${e.quantity === 1 ? "item" : "items"}`}
                                </Badge>
                              )}
                            </td>
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              <Text as="span">
                                {e.customerId
                                  ? `Customer #${e.customerId}`
                                  : "Guest"}
                              </Text>
                            </td>
                            {/* <td style={{ ...cellStyle, textAlign: "left" }}>
                              <Text as="span">
                                {locationFromTimezone(e.timezone)}
                              </Text>
                            </td> */}
                            <td style={{ ...cellStyle, textAlign: "left" }}>
                              <Link
                                onClick={() =>
                                  navigate(
                                    `/app/activity/${encodeURIComponent(e.sessionId)}`,
                                  )
                                }
                              >
                                View Cart
                              </Link>
                            </td>
                            <td
                              style={{
                                ...cellStyle,
                                textAlign: "left",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Text as="span">
                                {formatDateTime(e.createdAt)}
                              </Text>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(page > 0 || hasMore) && (
                <InlineStack align="center">
                  <Pagination
                    label={`Page ${page + 1}`}
                    hasPrevious={page > 0 && !loadingMore}
                    onPrevious={onPrevious}
                    hasNext={hasMore && !loadingMore}
                    onNext={onNext}
                  />
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
    </div>
  );
}
