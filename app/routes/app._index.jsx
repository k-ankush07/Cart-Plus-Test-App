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
  Avatar,
  ButtonGroup,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  ExternalIcon,
  CheckIcon,
  RefreshIcon,
  MegaphoneIcon,
  TargetIcon,
  CartIcon,
  DiscountIcon,
  PlusCircleIcon,
  ReceiptIcon,
  ChatIcon,
  PhoneIcon,
} from "@shopify/polaris-icons";

import { getCarts, getCartStats } from "../services/apiRoutes";
import { requireShopData } from "./components/shop.server";
import DateRangePicker from "./components/ui/DateRangePicker";
import {
  Suspense,
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Await,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "react-router-dom";
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

const getAbTest = (cart) => {
  const abTest = cart?.cartSettings?.abTest;
  return abTest?.enabled &&
    Array.isArray(abTest.variants) &&
    abTest.variants.length > 1
    ? abTest
    : null;
};

// ─── CheckItem (setup guide checklist row) ──────────────────────────────────────

function CheckItem({ text, completed }) {
  return (
    <InlineStack gap="200" blockAlign="start" wrap={false}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        {completed ? (
          <Icon source={CheckIcon} tone="success" />
        ) : (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid #c9cccf",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
      <Text variant="bodyMd">{text}</Text>
    </InlineStack>
  );
}

// ─── SetupStepCard ───────────────────────────────────────────────────────────
// Rich, individually-collapsible setup guide row: numbered circle, title,
// description, status badge, "WHAT TO DO" checklist, action button(s),
// and an optional preview image on the right — matches the Figma design.

function SetupStepCard({
  index,
  title,
  description,
  completed,
  cartCount,
  isEmbedStarted,
  hideIncompleteBadge,
  checklist,
  previewImage,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  isOpen,
  onToggle,
  disabled,
}) {
  const isCollapsible = !!previewImage;
  const isCircleComplete = completed || (index === 3 && cartCount >= 1);

  const header = (
    <>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: isCircleComplete ? "#008060" : "#f1f2f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontWeight: 600,
          fontSize: 13,
          color: isCircleComplete ? "#fff" : "#616161",
        }}
      >
        {isCircleComplete ? (
          <Icon source={CheckIcon} tone="text-inverse" />
        ) : (
          index
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyMd" fontWeight="semibold">
          {title}
        </Text>
        <Text variant="bodySm" tone="subdued">
          {description}
        </Text>
      </div>

      {index !== 3 &&
        (completed ? (
          <Badge tone="success">Completed</Badge>
        ) : (
          <Badge>Pending</Badge>
        ))}
      {isCollapsible && (
        <div
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Icon source={ChevronDownIcon} />
        </div>
      )}
    </>
  );

  const content = (
    <div
      style={{
        padding: previewImage ? "20px 20px 24px 20px" : "5px 20px 24px 20px",
        borderTop: previewImage ? "1px solid #f1f2f3" : "none",
      }}
    >
      <InlineGrid
        columns={previewImage ? { xs: 1, md: ["twoThirds", "oneThird"] } : 1}
        gap="400"
      >
        <BlockStack gap="300">
          {checklist?.length > 0 && (
            <BlockStack gap="200">
              <Text variant="bodySm" fontWeight="semibold" tone="subdued">
                WHAT TO DO
              </Text>
              <BlockStack gap="150">
                {checklist.map((item, i) => (
                  <CheckItem key={i} text={item} completed={completed} />
                ))}
              </BlockStack>
            </BlockStack>
          )}
          <InlineStack gap="200">
            {secondaryActionLabel && (
              <Button size="slim" onClick={onSecondaryAction}>
                <InlineStack gap="100" blockAlign="center" wrap={false}>
                  <Text as="span">{secondaryActionLabel}</Text>
                  <Icon source={ExternalIcon} />
                </InlineStack>
              </Button>
            )}
            <div className={index !== 3 ? "setup-step-dark-btn" : undefined}>
              <Button
                size="slim"
                variant={index !== 3 ? "primary" : undefined}
                onClick={onAction}
                disabled={disabled}
              >
                <InlineStack gap="100" blockAlign="center" wrap={false}>
                  <Text as="span">{actionLabel}</Text>
                  <Icon source={ExternalIcon} />
                </InlineStack>
              </Button>
            </div>
          </InlineStack>
        </BlockStack>
        {previewImage && (
          <div>
            <img
              src={previewImage}
              alt={title}
              style={{ width: "100%", display: "block" }}
            />
          </div>
        )}
      </InlineGrid>
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {isCollapsible ? (
        <button
          type="button"
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {header}
        </button>
      ) : (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            textAlign: "left",
          }}
        >
          {header}
        </div>
      )}

      {isCollapsible ? (
        <Collapsible open={isOpen} id={`setup-step-${index}`}>
          {content}
        </Collapsible>
      ) : (
        content
      )}
    </div>
  );
}

// ─── SetupTask (flat row, used by the second/simple Setup guide card) ──────────

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
      <InlineGrid
        columns={{ xs: 1, sm: ["twoThirds", "oneThird"] }}
        gap="300"
        alignItems="center"
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
        <InlineStack align="end">
          <Button size="slim" onClick={onAction}>
            {actionLabel}
          </Button>
        </InlineStack>
      </InlineGrid>
    </Box>
  );
}

// ─── Setup Tasks Data ──────────────────────────────────────────────────────────
// Two separate guides, matching the two stacked "Setup guide" cards in Figma:
//  1) buildPrimarySetupTasks  → rich accordion (checklist + preview image)
//  2) buildSecondarySetupTasks → flat list (title, description, button)

function buildPrimarySetupTasks(
  liveCart,
  navigate,
  shop,
  appEmbedId,
  mainThemeId,
  appEmbedInstalled,
) {
  const storeHandle =
    shop?.myshopifyDomain?.replace(".myshopify.com", "") || "";
  const themeId = mainThemeId || "current";
  const cartEditorPath = liveCart?.cartId
    ? `/app/cart-editor/${liveCart.cartId}?from=home`
    : "/app/carts";

  return [
    {
      title: "Create Your Cart",
      description: "Design and configure your cart drawer.",
      actionLabel: "Edit Existing Cart",
      secondaryActionLabel: "Create new Cart",
      completed: !!liveCart,
      disabled: !liveCart,
      checklist: [
        "Choose your cart layout and style",
        "Add upsells, free shipping bar, and cart goals",
        "Customize colors, fonts, and branding",
        "Save your cart settings",
      ],
      previewImage: "https://cartplus.io/cartplus-img/Your%20Cart%20Step4.svg",
      onAction: () => navigate(cartEditorPath),
      onSecondaryAction: () => navigate("/app/carts"),
    },
    {
      title: "Integrate Cart Plus with your theme",
      description:
        "Enable the embed app in shopify's theme editor to make the cart drawer visible on your store",
      actionLabel: "Integrate Now",
      completed: appEmbedInstalled,
      onAction: () =>
        window.open(
          `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
        ),
    },
    {
      title: "Manage Your Carts",
      description:
        "View and organize all the carts you've created for your store.",
      actionLabel: "View Existing Cart",
      completed: !!liveCart,
      disabled: !liveCart,
      hideIncompleteBadge: true,
      onAction: () => navigate("/app/carts"),
    },
  ];
}

function buildSecondarySetupTasks(
  liveCart,
  navigate,
  shop,
  appEmbedId,
  mainThemeId,
  appEmbedInstalled,
  appEmbedStarted,
) {
  const cartId = liveCart?.cartId;
  const goTo = (module) => () =>
    cartId && navigate(`/app/cart-editor/${cartId}?from=home&module=${module}`);
  const storeHandle =
    shop?.myshopifyDomain?.replace(".myshopify.com", "") || "";
  const themeId = mainThemeId || "current";

  return [
    {
      title: "Add upsells",
      description:
        "Show relevant product recommendations and upsell offers in your cart drawer to increase order value.",
      actionLabel: "Add upsells",
      completed: liveCart?.upsellsSettings?.enabled === false,
      onAction: goTo("upsells"),
    },
    {
      title: "Add rewards",
      description:
        "Turn users into buyers by offering free shipping, free gift, or create custom rewards.",
      actionLabel: "Add rewards",
      completed: liveCart?.rewardsSettings?.enabled === false,
      onAction: goTo("rewards"),
    },
    {
      title: "Add triggered rewards",
      description:
        "Rewards customers with discounts when they meet specific criteria based on cart value, products, collections, subscriptions, and more.",
      actionLabel: "Add triggered rewards",
      completed:
        Array.isArray(liveCart?.triggeredRewardsSettings?.rewards) &&
        liveCart.triggeredRewardsSettings.rewards.length > 0,
      onAction: goTo("triggered-rewards"),
    },
    {
      title: "Cart Plus App Embed Installation",
      description:
        "Set up the Cart Plus app embed in your Shopify theme before enabling it to start using its features.",
      actionLabel: "Install Cart Plus app embed",
      completed: appEmbedInstalled,
      isEmbedStarted: false,
      hideIncompleteBadge: true,
      onAction: () =>
        window.open(
          `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
          "_top",
        ),
    },
    {
      title: "Activate Cart Plus",
      description:
        "Open the cart editor and set the Cart Plus status to 'Active'.",
      actionLabel: "Activate Cart Plus",
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
      },
    );
    const assetData = await assetRes.json();
    const settings = JSON.parse(assetData.asset.value);
    const blocks = settings?.current?.blocks || {};

    for (const key in blocks) {
      const block = blocks[key];
      if (block?.type?.includes("shopify://apps/cart-plus-testing/")) {
        return { started: true, installed: !block?.disabled };
      }
    }
  } catch (_) {}
  return { started: false, installed: false };
}

async function getMainThemeId(shopDomain, accessToken) {
  try {
    const res = await fetch(
      `https://${shopDomain}/admin/api/2025-10/themes.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );
    const data = await res.json();
    const mainTheme = data.themes?.find((t) => t.role === "main");
    return mainTheme?.id || null;
  } catch (_) {
    return null;
  }
}

// export const loader = async ({ request }) => {
//   const { shop, apiUrl, accessToken, currency } =
//     await requireShopData (request);

//   const mainThemeId = await getMainThemeId(shop.myshopifyDomain, accessToken);

//   const appEmbedId = process.env.SHOPIFY_API_KEY || "";

//   const today = new Date();
//   const defaultStart = new Date();
//   defaultStart.setDate(today.getDate() - 29);

//   const fallbackRevenue = {
//     addonRevenue: 0,
//     upsellRevenue: 0,
//     subscriptionRevenue: 0,
//   };

//   const dataPromise = getCarts(apiUrl, shop.myshopifyDomain).then((cartsRes) => {
//     const allCarts = cartsRes?.data || [];
//     const publishedCartIds = allCarts
//       .filter((c) => c.status === "published")
//       .map((c) => c.cartId);

//     return Promise.allSettled([
//       Promise.resolve(cartsRes),
//       getCartStats(apiUrl, shop.myshopifyDomain, defaultStart.toISOString(), today.toISOString(), publishedCartIds),
//       checkAppEmbed(shop.myshopifyDomain, accessToken, mainThemeId),
//     ]).then(([cartsResult, statsResult, embedResult]) => ({
//       carts:
//         cartsResult.status === "fulfilled" ? cartsResult.value?.data || [] : [],
//       cartStats:
//         statsResult.status === "fulfilled" ? statsResult.value?.data || {} : {},
//       shopRevenue:
//         statsResult.status === "fulfilled"
//           ? statsResult.value?.shopRevenue || fallbackRevenue
//           : fallbackRevenue,
//       appEmbedInstalled:
//         embedResult.status === "fulfilled" ? embedResult.value.installed : false,
//       appEmbedStarted:
//         embedResult.status === "fulfilled" ? embedResult.value.started : false,
//     }));
//   });

//   return { shop, apiUrl, currency, appEmbedId, mainThemeId, dataPromise };
// };

export const loader = async ({ request }) => {
  const { shop, apiUrl, accessToken, currency, mainThemeId } =
    await requireShopData(request);

  const appEmbedId = process.env.SHOPIFY_API_KEY || "";

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 29);

  const fallbackRevenue = {
    addonRevenue: 0,
    upsellRevenue: 0,
    subscriptionRevenue: 0,
  };

  const dataPromise = getCarts(apiUrl, shop.myshopifyDomain).then(
    (cartsRes) => {
      const allCarts = cartsRes?.data || [];
      const publishedCartIds = allCarts
        .filter((c) => c.status === "published")
        .map((c) => c.cartId);

      return Promise.allSettled([
        Promise.resolve(cartsRes),
        getCartStats(
          apiUrl,
          shop.myshopifyDomain,
          defaultStart.toISOString(),
          today.toISOString(),
          publishedCartIds,
        ),
        checkAppEmbed(shop.myshopifyDomain, accessToken, mainThemeId),
      ]).then(([cartsResult, statsResult, embedResult]) => ({
        carts:
          cartsResult.status === "fulfilled"
            ? cartsResult.value?.data || []
            : [],
        cartStats:
          statsResult.status === "fulfilled"
            ? statsResult.value?.data || {}
            : {},
        shopRevenue:
          statsResult.status === "fulfilled"
            ? statsResult.value?.shopRevenue || fallbackRevenue
            : fallbackRevenue,
        appEmbedInstalled:
          embedResult.status === "fulfilled"
            ? embedResult.value.installed
            : false,
        appEmbedStarted:
          embedResult.status === "fulfilled"
            ? embedResult.value.started
            : false,
      }));
    },
  );

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
        line.style.transition =
          "stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)";
        line.style.strokeDashoffset = "0";
        setTimeout(() => {
          area.style.transition = "opacity 0.4s ease";
          area.style.opacity = "1";
        }, 300);
        setTimeout(() => {
          dot.style.transition =
            "opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
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

function StatTile({
  label,
  value,
  sparklineType,
  rawValue,
  onClick,
  borderLeft,
  loading,
}) {
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
          <Text variant="bodyMd" fontWeight="semibold" truncate>
            {label}
          </Text>
          <InlineStack gap="300" align="left" blockAlign="center">
            {loading ? (
              <div
                style={{
                  width: 80,
                  height: 20,
                  background: "#e1e3e5",
                  borderRadius: 4,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ) : (
              <>
                <Text variant="bodyMd" fontWeight="semibold">
                  {value}
                </Text>
                <Badge>—</Badge>
              </>
            )}
          </InlineStack>
        </BlockStack>
        <div style={{ flexShrink: 0, paddingInlineStart: "8px" }}>
          {loading ? (
            <div
              style={{
                width: 72,
                height: 36,
                background: "#e1e3e5",
                borderRadius: 4,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
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
    <Page title="Welcome to Cart Plus 🎉">
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

// ─── AppEmbedLink ──────────────────────────────────────────────────────────────
// NOTE: this must be a real component (not a useMemo'd JSX element) so it can
// be safely rendered with `<AppEmbedLink ... />` in multiple places.

function AppEmbedLink({ shop, mainThemeId, appEmbedId }) {
  return (
    <Tooltip content="Enable the app embed to start showing this cart on your storefront. Click to enable in your theme editor.">
      <span>
        <a
          href={`https://${shop?.myshopifyDomain}/admin/themes/${mainThemeId}/editor?context=apps&activateAppId=${appEmbedId}/app-embed`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <Badge tone="warning">App embed off</Badge>
          <span className="embed-icon" style={{ opacity: 0.9 }}>
            <Icon source={ExternalIcon} tone="subdued" />
          </span>
        </a>
      </span>
    </Tooltip>
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
  const revalidator = useRevalidator();

  const authHeaders = useMemo(
    () => ({
      "x-api-key": import.meta.env.VITE_API_SECRET_KEY || "",
    }),
    [],
  );

  const [carts, setCarts] = useState(initialCarts || []);
  const [cartStats, setCartStats] = useState(initialCartStats || {});
  const [expandedCarts, setExpandedCarts] = useState({});
  const toggleCartExpanded = useCallback((cartId) => {
    setExpandedCarts((prev) => ({ ...prev, [cartId]: !prev[cartId] }));
  }, []);
  const [shopRevenue, setShopRevenue] = useState(
    initialShopRevenue || {
      addonRevenue: 0,
      upsellRevenue: 0,
      subscriptionRevenue: 0,
    },
  );
  const [range, setRange] = useState(getDefaultRange);

  // Two separate Setup guide cards, each with its own collapse state.
  const [primarySetupOpen, setPrimarySetupOpen] = useState(true);
  const [secondarySetupOpen, setSecondarySetupOpen] = useState(true);

  // Which individual rows are expanded within the primary (rich) guide — like Figma.
  const [openTasks, setOpenTasks] = useState(() => new Set([0]));
  const toggleTask = useCallback((i) => {
    setOpenTasks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  // ← false on first render: the loader already resolved cartStats/shopRevenue,
  // so render them immediately instead of flashing a skeleton + refetching.
  const [statsLoading, setStatsLoading] = useState(false);

  // Skip the very first effect run (mount); only refetch when the range changes.
  const isFirstRangeRender = useRef(true);

  const storeHandle =
    shop?.myshopifyDomain?.replace(".myshopify.com", "") || "";
  const themeId = mainThemeId || "current";

  const liveCarts = useMemo(() => {
    return (carts || [])
      .filter((cart) => cart.status === "published")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [carts]);

  const primaryTasks = useMemo(
    () =>
      buildPrimarySetupTasks(
        liveCarts[0] || null,
        navigate,
        shop,
        appEmbedId,
        mainThemeId,
        appEmbedInstalled,
      ),
    [liveCarts, navigate, shop, appEmbedId, mainThemeId, appEmbedInstalled],
  );

  const secondaryTasks = useMemo(
    () =>
      buildSecondarySetupTasks(
        liveCarts[0] || null,
        navigate,
        shop,
        appEmbedId,
        mainThemeId,
        appEmbedInstalled,
        appEmbedStarted,
      ),
    [
      liveCarts,
      navigate,
      shop,
      appEmbedId,
      mainThemeId,
      appEmbedInstalled,
      appEmbedStarted,
    ],
  );

  const handlePrimarySetupToggle = useCallback(
    () => setPrimarySetupOpen((v) => !v),
    [],
  );
  const handleSecondarySetupToggle = useCallback(
    () => setSecondarySetupOpen((v) => !v),
    [],
  );

  const primaryCompletedCount = primaryTasks.filter((t) => t.completed).length;
  const primaryProgressPercent = Math.round(
    (primaryCompletedCount / primaryTasks.length) * 100,
  );

  const secondaryCompletedCount = secondaryTasks.filter(
    (t) => t.completed,
  ).length;
  const secondaryProgressPercent = Math.round(
    (secondaryCompletedCount / secondaryTasks.length) * 100,
  );

  useEffect(() => {
    setCarts(initialCarts);
  }, [initialCarts]);

  // Refetch stats only when the date range changes — not on mount (loader did that).
  useEffect(() => {
    if (isFirstRangeRender.current) {
      isFirstRangeRender.current = false;
      return;
    }
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
          headers: authHeaders,
        });
        const data = await res.json();
        if (data.success) {
          setCartStats(data.data || {});
          setShopRevenue(
            data.shopRevenue || {
              addonRevenue: 0,
              upsellRevenue: 0,
              subscriptionRevenue: 0,
            },
          );
        }
      } catch (err) {
        console.error("STATS FETCH ERROR:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [
    range.start,
    range.end,
    liveCarts,
    apiUrl,
    shop?.myshopifyDomain,
    authHeaders,
  ]);

  const sparkType = useCallback(
    (val) => ((val ?? 0) > 0 ? "spike" : "flat"),
    [],
  );

  const featureCart = liveCarts[0];
  const cartIdForFeatures = featureCart?.cartId;

  const appFeatures = [
    {
      title: "Announcements",
      subtitle: "Show messages in your cart",
      icon: MegaphoneIcon,
      module: "announcements",
      isActive: featureCart?.announcementSettings?.enabled === false,
    },
    {
      title: "Progress Bar",
      subtitle: "Free shipping & reward goals",
      icon: TargetIcon,
      module: "rewards",
      isActive: featureCart?.rewardsSettings?.enabled === false,
    },
    {
      title: "One Click Upsell",
      subtitle: "Add products in a single tap",
      icon: CartIcon,
      module: "one-tick-upsell",
      isActive: !!featureCart?.cartSettings?.oneTick?.enabled,
    },
    {
      title: "Discount Code",
      subtitle: "Apply discounts in cart",
      icon: DiscountIcon,
      module: "discount-codes",
      isActive: featureCart?.discountCodesSettings?.enabled === false,
    },
    {
      title: "Add-ons",
      subtitle: "Gift wrap, insurance & more",
      icon: PlusCircleIcon,
      module: "addons",
      isActive: featureCart?.addonsSettings?.enabled === false,
    },
    {
      title: "Summary",
      subtitle: "Order summary in your cart",
      icon: ReceiptIcon,
      module: "summary",
      isActive: !!featureCart?.cartSettings?.summary?.enabled,
    },
  ];

  return (
    <Page
      title={
        <InlineStack gap="300" blockAlign="center" wrap={false}>
          <img
            src="https://cartplus.io/cartplus-img/Cart%20Plus.svg"
            alt="Cart Plus"
            style={{
              height: 48,
              width: 48,
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              Welcome to
            </Text>
            <Text as="span" variant="headingLg" fontWeight="semibold">
              Cart Plus
            </Text>
          </BlockStack>
        </InlineStack>
      }
      primaryAction={
        <InlineStack align="end" gap="300">
          <DateRangePicker value={range} onChange={setRange} />
          <Button variant="primary" onClick={() => navigate("/app/carts")}>
            Your Carts
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
                  currency,
                )}
                rawValue={
                  (shopRevenue.addonRevenue ?? 0) +
                  (shopRevenue.upsellRevenue ?? 0) +
                  (shopRevenue.subscriptionRevenue ?? 0)
                }
                sparklineType={sparkType(
                  (shopRevenue.addonRevenue ?? 0) +
                    (shopRevenue.upsellRevenue ?? 0) +
                    (shopRevenue.subscriptionRevenue ?? 0),
                )}
                onClick={() => navigate("/app/analytics")}
              />
            </InlineGrid>
          </div>
        </BlockStack>

        {/* ── App embed status ── */}
        <Card padding="400">
          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="400"
            wrap={false}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text variant="headingSm" as="span">
                  App embed status :
                </Text>
                <Badge tone={appEmbedInstalled ? "success" : "attention"}>
                  {appEmbedInstalled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Text variant="bodyMd" tone="subdued" as="p">
                You have{" "}
                <a
                  href={`https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps`}
                  target="_top"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {appEmbedInstalled ? 1 : 0} active app blocks
                </a>{" "}
                in your store
              </Text>
            </div>

            {!appEmbedInstalled && (
              <InlineStack gap="300" blockAlign="center" wrap={false}>
                <Tooltip content="Refresh status">
                  <Button
                    variant="tertiary"
                    icon={RefreshIcon}
                    loading={revalidator.state === "loading"}
                    onClick={() => revalidator.revalidate()}
                    accessibilityLabel="Refresh app embed status"
                  />
                </Tooltip>
                <Button
                  variant="primary"
                  onClick={() =>
                    window.open(
                      `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
                      "_top",
                    )
                  }
                >
                  Activate app embed
                </Button>
              </InlineStack>
            )}
          </InlineStack>
        </Card>

        {/* ── Cart table ── */}
        <BlockStack>
          <Box paddingBlockEnd="200">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="headingMd">Cart logs</Text>
            </InlineStack>
          </Box>

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
                      <Tooltip
                        hasUnderline
                        activatorWrapper="span"
                        content={
                          <BlockStack gap="200">
                            <Text as="p" fontWeight="bold">
                              Impressions
                            </Text>
                            <Text as="p" variant="bodyMd">
                              Number of times this cart was shown to a shopper.
                            </Text>
                            <Text as="p" variant="bodyMd">
                              Values shown are for the date range selected at
                              the top of the page.
                            </Text>
                          </BlockStack>
                        }
                      >
                        <Text
                          variant="bodySm"
                          tone="subdued"
                          as="span"
                          fontWeight="medium"
                        >
                          {" "}
                          Impressions
                        </Text>
                      </Tooltip>
                    ),
                  },
                  {
                    id: "conversion-rate",
                    title: (
                      <Tooltip
                        hasUnderline
                        activatorWrapper="span"
                        content={
                          <BlockStack gap="200">
                            <Text as="p" fontWeight="bold">
                              Cart conversion rate (%)
                            </Text>
                            <Text as="p" variant="bodySm">
                              The percentage of cart impressions that resulted
                              in a completed purchase.
                            </Text>
                          </BlockStack>
                        }
                      >
                        <Text
                          variant="bodySm"
                          tone="subdued"
                          as="span"
                          fontWeight="medium"
                        >
                          {" "}
                          Cart conversion rate (%)
                        </Text>
                      </Tooltip>
                    ),
                  },
                  {
                    id: "added-revenue",
                    title: (
                      <Tooltip
                        hasUnderline
                        activatorWrapper="span"
                        content={
                          <BlockStack gap="200">
                            <Text as="p" fontWeight="bold">
                              Added revenue
                            </Text>
                            <Text as="p" variant="bodySm">
                              The percentage of cart impressions that resulted
                              in a completed purchase.
                            </Text>
                          </BlockStack>
                        }
                      >
                        <Text
                          variant="bodySm"
                          tone="subdued"
                          as="span"
                          fontWeight="medium"
                        >
                          {" "}
                          Added revenue
                        </Text>
                      </Tooltip>
                    ),
                  },
                  { title: "", id: "actions" },
                ]}
                selectable={false}
              >
                {liveCarts.map((cart, i) => {
                  const safeId =
                    (cart.cartId &&
                      cart.cartId.trim() !== "" &&
                      cart.cartId.trim()) ||
                    (cart._id &&
                      cart._id.toString().trim() !== "" &&
                      cart._id.toString().trim()) ||
                    `row-${i}`;

                  const cartEditorPath = `/app/cart-editor/${cart.cartId}?from=home`;
                  const abTest = getAbTest(cart);
                  const isExpanded = !!expandedCarts[cart.cartId];

                  return (
                    <Fragment key={safeId}>
                      <IndexTable.Row
                        id={safeId}
                        position={i}
                        onClick={() => navigate(cartEditorPath)}
                      >
                      <IndexTable.Cell>
                        <CartHoverCard cart={cart}>
                          <div
                            style={{
                              maxWidth: "150px",
                              cursor: "pointer",
                              position: "relative",
                              zIndex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {abTest && (
                              <span
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded ? "Hide variants" : "Show variants"
                                }
                                style={{
                                  display: "inline-flex",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                }}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  toggleCartExpanded(cart.cartId);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    toggleCartExpanded(cart.cartId);
                                  }
                                }}
                              >
                                <Icon
                                  source={
                                    isExpanded ? ChevronDownIcon : ChevronRightIcon
                                  }
                                  tone="subdued"
                                />
                              </span>
                            )}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                              }}
                            >
                              <Text truncate as="span">
                                {cart.cartName || "Untitled cart"}
                              </Text>
                            </div>
                            {abTest && <Badge tone="success">A/B test</Badge>}
                          </div>
                        </CartHoverCard>
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <InlineStack gap="200" blockAlign="center">
                          {appEmbedInstalled ? (
                            <Badge tone="success">Live</Badge>
                          ) : (
                            <span style={{ position: "relative", zIndex: 1 }}>
                              <AppEmbedLink
                                shop={shop}
                                mainThemeId={mainThemeId}
                                appEmbedId={appEmbedId}
                              />
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
                        ) : (
                          "—"
                        )}
                      </IndexTable.Cell>

                      {/* Conversion rate */}
                      <IndexTable.Cell>
                        {statsLoading ? (
                          <SkeletonCell width={56} />
                        ) : cartStats?.[cart.cartId]?.conversionRate != null ? (
                          cartStats[cart.cartId].conversionRate.toFixed(2) + "%"
                        ) : (
                          "—"
                        )}
                      </IndexTable.Cell>

                      {/* Revenue */}
                      <IndexTable.Cell>
                        {statsLoading ? (
                          <SkeletonCell width={72} />
                        ) : cartStats?.[cart.cartId]?.revenue != null ? (
                          fmt(cartStats[cart.cartId].revenue, currency)
                        ) : (
                          "—"
                        )}
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <InlineStack
                          gap="200"
                          align="end"
                          style={{ position: "relative", zIndex: 1 }}
                        >
                          <Button
                            size="slim"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(cartEditorPath);
                            }}
                          >
                            Edit cart
                          </Button>
                          <Button
                            size="slim"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://${shop.myshopifyDomain}?preview_theme_id=${mainThemeId}`,
                                "_blank",
                              );
                            }}
                          >
                            Preview
                          </Button>
                        </InlineStack>
                      </IndexTable.Cell>
                      </IndexTable.Row>
                      {abTest &&
                        isExpanded &&
                        abTest.variants.map((variantId, variantIndex) => {
                          const percentage =
                            abTest.weights?.[variantId] ??
                            Math.round(100 / abTest.variants.length);
                          const variantStats =
                            cartStats?.[cart.cartId]?.variants?.[variantId];
                          const variantEditorPath = `${cartEditorPath}&variant=${variantId}`;

                          return (
                            <IndexTable.Row
                              key={`${safeId}-${variantId}`}
                              id={`${safeId}-${variantId}`}
                              position={1000 + i * 10 + variantIndex}
                              onClick={() => navigate(variantEditorPath)}
                            >
                              <IndexTable.Cell>
                                <div
                                  style={{
                                    paddingLeft: 28,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <Text as="span">Variant {variantId}</Text>
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    {percentage}% of traffic
                                  </Text>
                                  {variantId === abTest.controlId && (
                                    <Badge>Control</Badge>
                                  )}
                                </div>
                              </IndexTable.Cell>
                              <IndexTable.Cell />
                              <IndexTable.Cell>
                                {statsLoading ? (
                                  <SkeletonCell width={48} />
                                ) : variantStats?.impressions != null ? (
                                  variantStats.impressions.toLocaleString()
                                ) : (
                                  "—"
                                )}
                              </IndexTable.Cell>
                              <IndexTable.Cell>
                                {statsLoading ? (
                                  <SkeletonCell width={56} />
                                ) : variantStats?.conversionRate != null ? (
                                  `${variantStats.conversionRate.toFixed(2)}%`
                                ) : (
                                  "—"
                                )}
                              </IndexTable.Cell>
                              <IndexTable.Cell>
                                {statsLoading ? (
                                  <SkeletonCell width={72} />
                                ) : variantStats?.revenue != null ? (
                                  fmt(variantStats.revenue, currency)
                                ) : (
                                  "—"
                                )}
                              </IndexTable.Cell>
                              <IndexTable.Cell />
                            </IndexTable.Row>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </IndexTable>
            </div>
          ) : (
            <EmptyState
              title="No live carts configured"
              subtitle="Publish your cart to see it live, and start earning with your cart."
              tag={
                !appEmbedInstalled
                  ? { label: "App embed off", tone: "warning" }
                  : null
              }
              primaryAction={{
                label: "Enable app embed",
                onAction: () =>
                  window.open(
                    `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=${appEmbedId}%2Fapp-embed`,
                    "_blank",
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

      {/* ── App Features ── */}
      <Box paddingBlockStart="400">
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">
            App Features
          </Text>

          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            {appFeatures.map((f) => (
              <Card key={f.title} padding="400">
                <BlockStack gap="300">
                  <InlineStack gap="300" wrap={false}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#f1f2f3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon source={f.icon} />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Text variant="bodyMd" as="p">
                        {f.title}
                      </Text>
                      <Text variant="headingSm" as="p">
                        {f.subtitle}
                      </Text>
                    </div>

                    {f.isActive && (
                      <div style={{ flexShrink: 0 }}>
                        <Badge tone="success">Active</Badge>
                      </div>
                    )}
                  </InlineStack>

                  <Button
                    fullWidth
                    disabled={!cartIdForFeatures}
                    onClick={() =>
                      navigate(
                        `/app/cart-editor/${cartIdForFeatures}?from=home&module=${f.module}`,
                      )
                    }
                  >
                    Configure
                  </Button>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </BlockStack>
      </Box>
      {/* <Box paddingBlockStart="400">
        <BlockStack gap="300">
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
              onClick={handlePrimarySetupToggle}
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
                {primaryCompletedCount} of {primaryTasks.length} tasks complete
              </Text>
              <div style={{ flex: 1 }} />
              <div style={{ width: 200 }}>
                <ProgressBar
                  progress={primaryProgressPercent}
                  size="small"
                  tone="primary"
                />
              </div>
              <div
                style={{
                  transition: "transform 0.2s",
                  transform: primarySetupOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  display: "flex",
                }}
              >
                <Icon source={ChevronDownIcon} />
              </div>
            </button>

            <Collapsible open={primarySetupOpen} id="setup-guide-primary">
              <div
                style={{
                  borderTop: "1px solid #e1e3e5",
                  background: "#fafbfb",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {primaryTasks.map((task, i) => (
                  <SetupStepCard
                    key={task.title}
                    index={i + 1}
                    cartCount={liveCarts.length}
                    isOpen={openTasks.has(i)}
                    onToggle={() => toggleTask(i)}
                    {...task}
                  />
                ))}
              </div>
            </Collapsible>
          </div>


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
              onClick={handleSecondarySetupToggle}
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
              <Text variant="headingMd">Recommendations </Text>
              <Text tone="subdued">
                {secondaryCompletedCount} of {secondaryTasks.length} tasks
                complete
              </Text>
              <div style={{ flex: 1 }} />
              <div style={{ width: 200 }}>
                <ProgressBar
                  progress={secondaryProgressPercent}
                  size="small"
                  tone="primary"
                />
              </div>
              <div
                style={{
                  transition: "transform 0.2s",
                  transform: secondarySetupOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  display: "flex",
                }}
              >
                <Icon source={ChevronDownIcon} />
              </div>
            </button>

            <Collapsible open={secondarySetupOpen} id="setup-guide-secondary">
              <div style={{ borderTop: "1px solid #e1e3e5" }}>
                {secondaryTasks.map((task, i) => (
                  <div key={task.title}>
                    <SetupTask {...task} />
                    {i < secondaryTasks.length - 1 && <Divider />}
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        </BlockStack>
      </Box> */}

      {/* ── Help cards ── */}
      <Box paddingBlockStart="400">
        <InlineGrid columns={{ xs: 1, sm: 1 }} gap="300">
          {/* ── Customer success specialist ── */}
          <Card padding="400">
            <InlineStack
              align="space-between"
              blockAlign="center"
              gap="400"
              wrap={false}
            >
              <InlineStack gap="300" blockAlign="center" wrap={false}>
                {/* Avatar + green online dot */}
                <div
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    size="xl"
                    name="Sujil"
                    source="https://cdn.shopify.com/s/files/1/0281/5682/1583/files/sujil.jpg"
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#22c55e",
                      border: "2px solid #fff",
                      boxSizing: "border-box",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Text variant="bodySm" tone="subdued" as="p">
                    Hi! I’m your customer success specialist
                  </Text>
                  <Text variant="headingSm" as="p">
                    Ankush Kumar
                  </Text>
                </div>
              </InlineStack>

              <ButtonGroup>
                <Button
                  icon={ChatIcon}
                  onClick={() => navigate("/app/support")}
                >
                  Chat Now
                </Button>
                <Button
                  icon={PhoneIcon}
                  onClick={() =>
                    window.open("https://your-calendly-link.com", "_blank")
                  }
                >
                  Schedule strategy call
                </Button>
              </ButtonGroup>
            </InlineStack>
          </Card>

          {/* <Card padding="400">
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
          </Card> */}
        </InlineGrid>
      </Box>
    </Page>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

const EmptyState = ({
  title,
  subtitle,
  tag,
  primaryAction,
  secondaryAction,
}) => (
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
              {tag?.label && (
                <Badge tone={tag.tone || "warning"}>{tag.label}</Badge>
              )}
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
              <Button onClick={secondaryAction.onAction}>
                {secondaryAction.label}
              </Button>
            )}
          </InlineStack>
        </div>
      </InlineStack>
    </Box>
  </Box>
);
