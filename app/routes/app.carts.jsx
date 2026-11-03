import {
    Page,
    Layout,
    Text,
    InlineStack,
    Badge,
    IndexTable,
    Button,
    Tooltip,
    Modal,
    BlockStack,
    Box,
    Icon,
    InlineGrid,
    SkeletonBodyText,
    SkeletonDisplayText,
    Banner,
    Popover,
    ActionList,
    Card,
    Tabs,
    TextField,
    Checkbox,
} from "@shopify/polaris";

import {
    defaultSettings,
    defaultHeaderSettings,
    defaultAnnouncementSettings,
    defaultRewardsSettings,
    defaultRecommendationsSettings,
    defaultSubscriptionUpgradesSettings,
    defaultUpsellsSettings,
    defaultAdditionalNotesSettings,
    defaultAddonsSettings,
    defaultDiscountCodesSettings,
    defaultExpressPaymentsSettings,
    defaultTrustBadgesSettings,
    defaultCartSettings,
    defaultTriggeredRewardsSettings,
} from "../routes/components/constants/cartDefaults";

import {
    EditIcon,
    ViewIcon,
    DuplicateIcon,
    DeleteIcon,
    PlusIcon,
    ExternalIcon,
    MagicIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    MenuVerticalIcon,
    SearchIcon,
    MegaphoneIcon,
    TargetIcon,
    CartIcon,
    DiscountIcon,
    PlusCircleIcon,
    ReceiptIcon,
} from "@shopify/polaris-icons";

import DateRangePicker from "./components/ui/DateRangePicker";
import { Await, useLoaderData, useNavigate } from "react-router-dom";
import { Suspense, useState, useEffect, Fragment } from "react";
import CartHoverCard from "./components/ui/CartHoverCard";
import { requireShopData } from "./components/shop.server";

import {
    createCart,
    getCarts,
    getCartStats,
    deleteCart,
    togglePublishCart,
    duplicateCart,
    syncDiscountStatus,
} from "../services/apiRoutes";
import "../index.css";

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

// Custom toggle switch (Polaris has no switch component)
function Switch({ checked, disabled, onChange }) {
    return (
        <span
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onChange();
            }}
            onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange();
                }
            }}
            style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                padding: 2,
                boxSizing: "border-box",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "background .15s",
                background: checked ? "#008060" : "#e1e3e5",
            }}
        >
            <span
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transform: checked ? "translateX(16px)" : "translateX(0)",
                    transition: "transform .15s",
                    boxShadow: "0 1px 2px rgba(0,0,0,.3)",
                }}
            />
        </span>
    );
}

const PLAN_ORDER_LIMITS = {
    free: 100,
    starter: 200,
    growth: 500,
    advance: Infinity,
    unlimited: Infinity,
};

// Metric columns shown in the table (Cart Name + Status are always shown)
const ALL_METRICS = [
    { id: "created", title: "Created" },
    { id: "visitors", title: "Total visitors" },
    { id: "revenue", title: "Total Revenue" },
    { id: "conv", title: "Conv Rate (%)" },
    { id: "rpv", title: "Rev per visitor" },
    { id: "aov", title: "AOV" },
];

const TABS = [
    { id: "all", content: "All" },
    { id: "active", content: "Active" },
    { id: "draft", content: "Draft" },
    { id: "ab-archive", content: "A/B test archive" },
];

async function checkAppEmbed(shopDomain, accessToken, themeId) {
    try {
        const assetRes = await fetch(
            `https://${shopDomain}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
            { headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" } }
        );
        const assetData = await assetRes.json();
        const settings = JSON.parse(assetData.asset.value);
        const blocks = settings?.current?.blocks || {};
        for (const key in blocks) {
            const block = blocks[key];
            if (block?.type?.includes("shopify://apps/cart-plus-testing/")) {
                return !block?.disabled;
            }
        }
    } catch (_) { }
    return false;
}

async function fetchShopPlan(apiUrl, shopDomain) {
    try {
        const res = await fetch(`${apiUrl}/api/shop-plan?shop=${encodeURIComponent(shopDomain)}`);
        const data = await res.json();
        return data?.data?.plan || "free";
    } catch (_) {
        return "free";
    }
}

async function fetchCurrentMonthOrders(apiUrl, shopDomain) {
    try {
        const res = await fetch(`${apiUrl}/api/cart-order-count?shop=${encodeURIComponent(shopDomain)}`);
        const data = await res.json();
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        return (data?.data?.dateWise || [])
            .filter(({ date }) => date >= monthStart)
            .reduce((sum, { totalOrders }) => sum + totalOrders, 0);
    } catch (_) {
        return 0;
    }
}

// ─── A/B test helper ───────────────────────────────────────────────────────────

// Returns the abTest object only when a real test is running on this cart.
// Shape: { enabled, variants: ['A','B',...], weights: {A:20,...}, allocation, controlId, data }
const getAbTest = (cart) => {
    const ab = cart?.cartSettings?.abTest;
    return ab?.enabled && Array.isArray(ab.variants) && ab.variants.length > 1 ? ab : null;
};

// ─── Loader ────────────────────────────────────────────────────────────────────

async function getMainThemeId(shopDomain, accessToken) {
    try {
        const res = await fetch(
            `https://${shopDomain}/admin/api/2025-10/themes.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );
        const data = await res.json();
        const mainTheme = data.themes?.find((t) => t.role === "main");
        return mainTheme?.id || null;
    } catch (_) {
        return null;
    }
}

export const loader = async ({ request }) => {
    const { shop, apiUrl, accessToken, currency } = await requireShopData(request);

    const mainThemeId = await getMainThemeId(shop.myshopifyDomain, accessToken);

    const appEmbedId = process.env.SHOPIFY_API_KEY || "";

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

    // ← NOT awaited — stays pending so Suspense triggers skeleton
    const dataPromise = Promise.allSettled([
        getCarts(apiUrl, shop.myshopifyDomain),
        getCartStats(apiUrl, shop.myshopifyDomain, defaultStart.toISOString(), today.toISOString()),
        checkAppEmbed(shop.myshopifyDomain, accessToken, mainThemeId),
        fetchShopPlan(apiUrl, shop.myshopifyDomain),
        fetchCurrentMonthOrders(apiUrl, shop.myshopifyDomain),
    ]).then(([cartsResult, statsResult, embedResult, planResult, ordersResult]) => ({
        carts: cartsResult.status === "fulfilled" ? cartsResult.value?.data || [] : [],
        cartStats: statsResult.status === "fulfilled" ? statsResult.value?.data || {} : {},
        appEmbedInstalled: embedResult.status === "fulfilled" ? embedResult.value : false,
        shopPlan: planResult.status === "fulfilled" ? planResult.value : "free",
        currentMonthOrders: ordersResult.status === "fulfilled" ? ordersResult.value : 0,
    }));

    return { shop, apiUrl, currency, appEmbedId, mainThemeId, dataPromise };
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function AppCartsSkeleton() {
    return (
        <Page fullWidth title="All Carts">
            <style>{pulseStyle}</style>
            <Layout>
                <Layout.Section>
                    <Box paddingBlockStart="300">
                        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 12, padding: 20 }}>
                            <SkeletonDisplayText size="small" />
                            <Box paddingBlockStart="300">
                                <SkeletonBodyText lines={6} />
                            </Box>
                        </div>
                    </Box>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

// ─── Shell ─────────────────────────────────────────────────────────────────────

export default function AppCarts() {
    const loaderData = useLoaderData();
    return (
        <>
            <style>{pulseStyle}</style>
            <Suspense fallback={<AppCartsSkeleton />}>
                <Await resolve={loaderData.dataPromise} errorElement={<AppCartsSkeleton />}>
                    {(data) => <AppCartsInner {...loaderData} {...data} />}
                </Await>
            </Suspense>
        </>
    );
}

// ─── Inner ─────────────────────────────────────────────────────────────────────

function AppCartsInner({
    shop,
    apiUrl,
    currency,
    appEmbedId,
    mainThemeId,
    carts: initialCarts,
    cartStats: initialCartStats,
    appEmbedInstalled,
    shopPlan,
    currentMonthOrders,
}) {
    const navigate = useNavigate();
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedCart, setSelectedCart] = useState(null);
    const [publishModal, setPublishModal] = useState(false);
    const [cartToPublish, setCartToPublish] = useState(null);
    const [publishHasLive, setPublishHasLive] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [unpublishModal, setUnpublishModal] = useState(false);
    const [cartToUnpublish, setCartToUnpublish] = useState(null);
    const [duplicatingCartId, setDuplicatingCartId] = useState(null);
    const [popoverActive, setPopoverActive] = useState(false);

    // Table UI state
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [metricsOpen, setMetricsOpen] = useState(false);
    const [menuCartId, setMenuCartId] = useState(null);
    const [visibleMetrics, setVisibleMetrics] = useState(ALL_METRICS.map((m) => m.id));
    const toggleMetric = (id) =>
        setVisibleMetrics((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    const shownMetrics = ALL_METRICS.filter((m) => visibleMetrics.includes(m.id));

    // Which A/B test carts have their variant rows expanded: { [cartId]: true }
    const [expandedCarts, setExpandedCarts] = useState({});
    const toggleExpand = (id) =>
        setExpandedCarts((prev) => ({ ...prev, [id]: !prev[id] }));

    const authHeaders = () => ({
        "x-api-key": import.meta.env.VITE_API_SECRET_KEY || "",
    });

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

    const [range, setRange] = useState({ start: defaultStart, end: today });
    const [carts, setCarts] = useState(initialCarts);
    const [cartStats, setCartStats] = useState(initialCartStats);
    const [creatingFrom, setCreatingFrom] = useState(null);

    // ← true on mount so table cells show skeleton until first fetch completes
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => { setCarts(initialCarts); }, [initialCarts]);

    // ← no isFirstRender guard — runs on mount AND on range change
    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const params = new URLSearchParams({
                    shop: shop.myshopifyDomain,
                    startDate: range.start.toISOString(),
                    endDate: range.end.toISOString(),
                });
                const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, {
                    credentials: "include",
                    headers: authHeaders(),
                });
                const data = await res.json();
                if (data.success) setCartStats(data.data || {});
            } catch (err) {
                console.error("STATS FETCH ERROR:", err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [range.start, range.end]);

    const handleCreateCart = (from = "scratch") => {
        setCreatingFrom(from);
        setPopoverActive(false);
        const tempCartId = "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
        setTimeout(() => {
            navigate(`/app/cart-editor/${tempCartId}?from=carts`, { replace: true });
            createCart(apiUrl, {
                shop: shop.myshopifyDomain,
                shopEmail: shop.email,
                storeOwner: shop.name,
                cartId: tempCartId,
                designSettings: defaultSettings,
                headerSettings: defaultHeaderSettings,
                announcementSettings: defaultAnnouncementSettings,
                rewardsSettings: defaultRewardsSettings,
                recommendationsSettings: defaultRecommendationsSettings,
                subscriptionUpgradesSettings: defaultSubscriptionUpgradesSettings,
                upsellsSettings: defaultUpsellsSettings,
                additionalNotesSettings: defaultAdditionalNotesSettings,
                addonsSettings: defaultAddonsSettings,
                discountCodesSettings: defaultDiscountCodesSettings,
                expressPaymentsSettings: defaultExpressPaymentsSettings,
                trustBadgesSettings: defaultTrustBadgesSettings,
                cartSettings: defaultCartSettings,
                triggeredRewardsSettings: defaultTriggeredRewardsSettings,
            }).then((data) => {
                if (data.success) shopify.toast.show("Cart created successfully");
            }).catch(() => { });
        }, 1000);
    };

    const confirmDeleteCart = async () => {
        if (!selectedCart) return;
        setModalLoading(true);
        const data = await deleteCart(apiUrl, selectedCart.cartId);
        if (data.success) {
            setCarts((prev) => prev.filter((c) => c.cartId !== selectedCart.cartId));
            shopify.toast.show("Cart deleted successfully");
        }
        setModalLoading(false);
        setDeleteModal(false);
        setSelectedCart(null);
    };

    const handleUnpublishClick = (cartId) => {
        const cart = carts.find((c) => c.cartId === cartId);
        setCartToUnpublish(cart);
        setUnpublishModal(true);
    };

    const confirmUnpublish = async () => {
        if (!cartToUnpublish) return;
        setModalLoading(true);
        await handleTogglePublish(cartToUnpublish.cartId);
        setModalLoading(false);
        setUnpublishModal(false);
        setCartToUnpublish(null);
    };

    const confirmPublish = async () => {
        if (!cartToPublish) return;
        setModalLoading(true);
        await handleTogglePublish(cartToPublish.cartId);
        setModalLoading(false);
        setPublishModal(false);
        setCartToPublish(null);
    };

    const handleTogglePublish = async (id) => {
        const data = await togglePublishCart(apiUrl, id);
        if (data.success) {
            const newStatus =
                carts.find((c) => c.cartId === id)?.status === "published"
                    ? "unpublished"
                    : "published";

            setCarts((prev) =>
                prev.map((c) =>
                    c.cartId === id
                        ? { ...c, status: c.status === "published" ? "unpublished" : "published" }
                        : { ...c, status: c.status === "published" ? "unpublished" : c.status }
                )
            );
            shopify.toast.show(data.message || "Cart status updated");

            try {
                await syncDiscountStatus(apiUrl, { cartId: id, cartStatus: newStatus });
            } catch (err) {
                console.error("[handleTogglePublish] discount sync failed:", err);
            }
        }
    };

    const handlePublishClick = (cart) => {
        setCartToPublish(cart);
        setPublishHasLive(carts.some((c) => c.status === "published"));
        setPublishModal(true);
    };

    const handleDuplicateCart = async (cart) => {
        setDuplicatingCartId(cart.cartId);
        const data = await duplicateCart(apiUrl, cart.cartId);
        if (data.success) {
            setCarts((prev) => [data.data, ...prev]);
            shopify.toast.show("Cart duplicated successfully");
        }
        setDuplicatingCartId(null);
    };

    // ─── Derived data ──────────────────────────────────────────────────────────

    const fmt = (n) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency ?? "USD",
            minimumFractionDigits: 2,
        }).format(Number(n ?? 0));

    const filteredCarts = [...carts]
        .filter((c) => {
            if (selectedTab === 1) return c.status === "published";
            if (selectedTab === 2) return c.status !== "published";
            // apne archive flag ke hisaab se change karna
            if (selectedTab === 3) return !!c.cartSettings?.abTest?.archived;
            return true;
        })
        .filter((c) =>
            (c.cartName || "Untitled cart").toLowerCase().includes(searchValue.toLowerCase())
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const limit = PLAN_ORDER_LIMITS[shopPlan] ?? PLAN_ORDER_LIMITS.free;
    const limitReached = currentMonthOrders >= limit;
    const featureCart = [...carts]
        .filter((cart) => cart.status === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
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

    // `s` = stats object for a cart (or for a single variant)
    const metricValue = (id, cart, s) => {
        if (id === "created") {
            return new Date(cart.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
        if (statsLoading) {
            return <SkeletonCell width={48} />;
        }
        const visitors = s?.impressions ?? 0;
        switch (id) {
            case "visitors": return visitors.toLocaleString();
            case "revenue": return fmt(s?.revenue);
            case "extra": return fmt(s?.extraRevenue);   // backend field name check kar lena
            case "conv": return (s?.conversionRate ?? 0).toFixed(0) + "%";
            case "rpv": return fmt(visitors ? (s?.revenue ?? 0) / visitors : 0);
            case "aov": return fmt(s?.aov);            // backend field name check kar lena
            default: return "—";
        }
    };

    // ─── Row renderer ──────────────────────────────────────────────────────────

    const renderCartRow = (cart, i) => {
        const cartEditorPath = `/app/cart-editor/${cart.cartId}?from=carts`;
        const abTest = getAbTest(cart);
        const isExpanded = !!expandedCarts[cart.cartId];
        const isLive = cart.status === "published";
        const s = cartStats?.[cart.cartId];
        const name = cart.cartName || "My cart drawer";

        return (
            <Fragment key={cart.cartId || `${cart._id || "cart"}-${i}`}>
                <IndexTable.Row
                    id={cart.cartId || `${i}`}
                    position={i}
                    onClick={() => navigate(cartEditorPath)}
                >
                    <IndexTable.Cell>
                        <CartHoverCard cart={cart}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                {abTest && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExpanded}
                                        aria-label={isExpanded ? "Hide variants" : "Show variants"}
                                        style={{ display: "inline-flex", cursor: "pointer" }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleExpand(cart.cartId);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleExpand(cart.cartId);
                                            }
                                        }}
                                    >
                                        <Icon
                                            source={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                                            tone="subdued"
                                        />
                                    </span>
                                )}

                                {/* status dot: green = live, red = draft */}
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        background: isLive ? "#008060" : "#e51c00",
                                    }}
                                />
                                <Text as="span">{name}</Text>
                                {abTest && <Badge tone="success">A/B test</Badge>}
                                <span
                                    style={{ display: "inline-flex", cursor: "pointer" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(cartEditorPath);
                                    }}
                                >
                                    <Icon source={EditIcon} tone="subdued" />
                                </span>
                            </div>
                        </CartHoverCard>
                    </IndexTable.Cell>

                    {shownMetrics.map((m) => (
                        <IndexTable.Cell key={m.id}>{metricValue(m.id, cart, s)}</IndexTable.Cell>
                    ))}

                    <IndexTable.Cell>
                        <InlineStack gap="200" align="end" blockAlign="center" wrap={false}>
                            <Button
                                size="slim"
                                onClick={() => {
                                    // apna actual A/B start/end flow yahan lagana
                                    navigate(`${cartEditorPath}&tab=ab-test`);
                                }}
                            >
                                {abTest ? "End A/B test" : "Run A/B test"}
                            </Button>

                            <Tooltip
                                content={
                                    isLive
                                        ? "Unpublish"
                                        : limitReached
                                            ? `Monthly order limit reached (${currentMonthOrders}/${limit}). Upgrade your plan to publish.`
                                            : "Publish"
                                }
                            >
                                <span>
                                    <Switch
                                        checked={isLive}
                                        disabled={!isLive && limitReached}
                                        onChange={() =>
                                            isLive
                                                ? handleUnpublishClick(cart.cartId)
                                                : handlePublishClick(cart)
                                        }
                                    />
                                </span>
                            </Tooltip>

                            <span onClick={(e) => e.stopPropagation()}>
                                <Popover
                                    active={menuCartId === cart.cartId}
                                    onClose={() => setMenuCartId(null)}
                                    activator={
                                        <Button
                                            icon={MenuVerticalIcon}
                                            accessibilityLabel="More actions"
                                            loading={duplicatingCartId === cart.cartId}
                                            onClick={() =>
                                                setMenuCartId(menuCartId === cart.cartId ? null : cart.cartId)
                                            }
                                        />
                                    }
                                >
                                    <ActionList
                                        items={[
                                            {
                                                content: "Edit",
                                                icon: EditIcon,
                                                onAction: () => navigate(cartEditorPath),
                                            },
                                            {
                                                content: "Preview",
                                                icon: ViewIcon,
                                                disabled: !isLive,
                                                onAction: () => {
                                                    setMenuCartId(null);
                                                    window.open(
                                                        `https://${shop.myshopifyDomain}?preview_theme_id=${mainThemeId}`,
                                                        "_blank"
                                                    );
                                                },
                                            },
                                            {
                                                content: "Duplicate",
                                                icon: DuplicateIcon,
                                                disabled: duplicatingCartId !== null,
                                                onAction: () => {
                                                    setMenuCartId(null);
                                                    handleDuplicateCart(cart);
                                                },
                                            },
                                            ...(!isLive
                                                ? [
                                                    {
                                                        content: "Delete",
                                                        icon: DeleteIcon,
                                                        destructive: true,
                                                        onAction: () => {
                                                            setMenuCartId(null);
                                                            setSelectedCart(cart);
                                                            setDeleteModal(true);
                                                        },
                                                    },
                                                ]
                                                : []),
                                        ]}
                                    />
                                </Popover>
                            </span>
                        </InlineStack>
                    </IndexTable.Cell>
                </IndexTable.Row>

                {/* ── A/B test variant rows (shown when the chevron is expanded) ── */}
                {abTest &&
                    isExpanded &&
                    abTest.variants.map((vid, vi) => {
                        const pct =
                            abTest.weights?.[vid] ?? Math.round(100 / abTest.variants.length);
                        // Per-variant stats: stats[cartId].variants[variantId]
                        const vs = s?.variants?.[vid];

                        return (
                            <IndexTable.Row
                                key={`${cart.cartId}-${vid}`}
                                id={`${cart.cartId}-${vid}`}
                                position={1000 + i * 10 + vi}
                                onClick={() => navigate(`${cartEditorPath}&variant=${vid}`)}
                            >
                                <IndexTable.Cell>
                                    <div
                                        style={{
                                            paddingLeft: 52,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <Text as="span">Variant {vid}</Text>
                                        <Text as="span" variant="bodySm" tone="subdued">
                                            {pct}% of traffic
                                        </Text>
                                        {vid === abTest.controlId && <Badge>Control</Badge>}
                                    </div>
                                </IndexTable.Cell>

                                {shownMetrics.map((m) => (
                                    <IndexTable.Cell key={m.id}>
                                        {m.id === "created" ? "" : metricValue(m.id, cart, vs)}
                                    </IndexTable.Cell>
                                ))}

                                <IndexTable.Cell />
                            </IndexTable.Row>
                        );
                    })}
            </Fragment>
        );
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="_page_yc9hy_1">
        <Page
            fullWidth
            backAction={{ onAction: () => navigate("/app") }}
            title="All Carts"
            primaryAction={
                <InlineStack gap="300">
                    <DateRangePicker value={range} onChange={setRange} />
                    <Popover
                        active={popoverActive && !creatingFrom}
                        activator={
                            <Button
                                icon={PlusIcon}
                                onClick={() => setPopoverActive((v) => !v)}
                                disclosure
                                loading={!!creatingFrom}
                                disabled={!!creatingFrom}
                            >
                                {creatingFrom ? "Creating..." : "Create cart"}
                            </Button>
                        }
                        onClose={() => setPopoverActive(false)}
                    >
                        <ActionList
                            actionRole="menuitem"
                            items={[
                                {
                                    content: "Create from scratch",
                                    icon: PlusIcon,
                                    onAction: () => handleCreateCart("scratch"),
                                },
                                {
                                    content: "Create from templates",
                                    icon: MagicIcon,
                                    onAction: () => navigate("/app/design-cart"),
                                },
                            ]}
                        />
                    </Popover>
                </InlineStack>
            }
        >
            <Layout>
                {/* Monthly limit banner */}
                {limitReached && (
                    <Layout.Section>
                        <Banner
                            tone="warning"
                            title={`Monthly order limit reached (${currentMonthOrders}/${limit})`}
                            action={{ content: "Upgrade plan", onAction: () => navigate("/app/pricing") }}
                        >
                            <Text as="p" variant="bodyMd">
                                Your store has reached the <strong>{currentMonthOrders}</strong> order
                                limit for the <strong>{shopPlan}</strong> plan this month.
                                Your cart has been automatically unpublished. Upgrade your plan to continue selling.
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

                {/* App embed warning */}
                {!appEmbedInstalled && (
                    <Layout.Section>
                        <Banner
                            tone="warning"
                            title="App embed is off"
                            action={{
                                content: "Enable app embed",
                                url: `https://${shop.myshopifyDomain}/admin/themes/${mainThemeId}/editor?context=apps&activateAppId=${appEmbedId}/app-embed`,
                                target: "_blank",
                                external: true,
                            }}
                        >
                            <Text as="p" variant="bodyMd">
                                Enable the app embed in your theme editor to show your live cart on the storefront.
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

                {/* Carts card: tabs + metrics dropdown + search + table */}
                <Layout.Section>
                    <Card padding="0">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 12px 0",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <Tabs tabs={TABS} selected={selectedTab} onSelect={setSelectedTab} />

                            <InlineStack gap="200" blockAlign="center" wrap={false}>
                                {searchOpen && (
                                    <TextField
                                        label="Search carts"
                                        labelHidden
                                        autoFocus
                                        value={searchValue}
                                        onChange={setSearchValue}
                                        placeholder="Search carts"
                                        clearButton
                                        onClearButtonClick={() => setSearchValue("")}
                                        autoComplete="off"
                                    />
                                )}

                                <Popover
                                    active={metricsOpen}
                                    onClose={() => setMetricsOpen(false)}
                                    activator={
                                        <Button disclosure onClick={() => setMetricsOpen((v) => !v)}>
                                            {`(${visibleMetrics.length}) Performance metrics`}
                                        </Button>
                                    }
                                >
                                    <Box padding="300">
                                        <BlockStack gap="100">
                                            {ALL_METRICS.map((m) => (
                                                <Checkbox
                                                    key={m.id}
                                                    label={m.title}
                                                    checked={visibleMetrics.includes(m.id)}
                                                    onChange={() => toggleMetric(m.id)}
                                                />
                                            ))}
                                        </BlockStack>
                                    </Box>
                                </Popover>

                                <Button
                                    icon={SearchIcon}
                                    accessibilityLabel="Search carts"
                                    onClick={() => {
                                        if (searchOpen) setSearchValue("");
                                        setSearchOpen((v) => !v);
                                    }}
                                />
                            </InlineStack>
                        </div>

                        {filteredCarts.length === 0 ? (
                            <Box padding="500">
                                <Text tone="subdued" as="p">
                                    {selectedTab === 1
                                        ? "No live cart configured. Publish a cart to see it live."
                                        : selectedTab === 2
                                            ? "No draft carts yet."
                                            : selectedTab === 3
                                                ? "No archived A/B tests."
                                                : "No carts found."}
                                </Text>
                            </Box>
                        ) : (
                            <div
                                style={{
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: "1px solid var(--p-color-border)",
                                }}
                            >
                                <IndexTable
                                    resourceName={{ singular: "cart", plural: "carts" }}
                                    itemCount={filteredCarts.length}
                                    selectable={false}
                                    headings={[
                                        { title: "Cart Name", id: "cart-name" },
                                        ...shownMetrics.map((m) => ({ title: m.title, id: m.id })),
                                        { title: "Status", id: "status", alignment: "end" },
                                    ]}
                                >
                                    {filteredCarts.map(renderCartRow)}
                                </IndexTable>
                            </div>
                        )}
                    </Card>
                </Layout.Section>

                {/* App Features */}
                <Layout.Section>
                    <BlockStack gap="300">
                        <Text variant="headingMd" as="h3">
                            App Features
                        </Text>
                        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                            {appFeatures.map((feature) => (
                                <Card key={feature.title} padding="400">
                                    <BlockStack gap="300">
                                        <InlineStack gap="300" blockAlign="center" wrap={false}>
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
                                                <Icon source={feature.icon} />
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
                                                    {feature.title}
                                                </Text>
                                                <Text variant="headingSm" as="p">
                                                    {feature.subtitle}
                                                </Text>
                                            </div>
                                            {feature.isActive && (
                                                <div style={{ flexShrink: 0 }}>
                                                    <Badge tone="success">Active</Badge>
                                                </div>
                                            )}
                                        </InlineStack>
                                        <Button
                                            fullWidth
                                            disabled={!featureCart?.cartId}
                                            onClick={() =>
                                                navigate(
                                                    `/app/cart-editor/${featureCart.cartId}?from=carts&module=${feature.module}`,
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
                </Layout.Section>
            </Layout>

            {/* Publish Modal */}
            <Modal
                open={publishModal}
                size="small"
                onClose={() => { setPublishModal(false); setCartToPublish(null); }}
                title={`Publish "${cartToPublish?.cartName || "Untitled cart"}"?`}
                primaryAction={{ content: "Publish cart", loading: modalLoading, disabled: modalLoading, onAction: confirmPublish }}
                secondaryActions={[{ content: "Cancel", disabled: modalLoading, onAction: () => { setPublishModal(false); setCartToPublish(null); } }]}
            >
                <Modal.Section>
                    <Text tone="subdued">Publishing this cart will make it live. The current live cart will be moved to draft.</Text>
                </Modal.Section>
            </Modal>

            {/* Delete Modal */}
            <Modal
                open={deleteModal}
                size="small"
                onClose={() => setDeleteModal(false)}
                title={`Are you sure you want to delete "${selectedCart?.cartName || "Untitled cart"}"?`}
                primaryAction={{ content: "Delete cart", destructive: true, loading: modalLoading, disabled: modalLoading, onAction: confirmDeleteCart }}
                secondaryActions={[{ content: "Cancel", disabled: modalLoading, onAction: () => setDeleteModal(false) }]}
            >
                <Modal.Section>
                    <Text tone="subdued">Deleting this cart will permanently remove it and it cannot be recovered. This action cannot be undone.</Text>
                </Modal.Section>
            </Modal>

            {/* Unpublish Modal */}
            <Modal
                open={unpublishModal}
                size="small"
                onClose={() => { setUnpublishModal(false); setCartToUnpublish(null); }}
                title={`Unpublish "${cartToUnpublish?.cartName || "Untitled cart"}"?`}
                primaryAction={{ content: "Unpublish cart", destructive: true, loading: modalLoading, disabled: modalLoading, onAction: confirmUnpublish }}
                secondaryActions={[{ content: "Cancel", disabled: modalLoading, onAction: () => { setUnpublishModal(false); setCartToUnpublish(null); } }]}
            >
                <Modal.Section>
                    <Text tone="subdued">Unpublishing this cart will set it to draft. No cart will be live until you publish another.</Text>
                </Modal.Section>
            </Modal>
        </Page>
        </div>
    );
}