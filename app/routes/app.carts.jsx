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
    SkeletonBodyText,
    SkeletonDisplayText,
    Banner,
    Popover, ActionList
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
    MagicIcon
} from "@shopify/polaris-icons";

import DateRangePicker from "./components/ui/DateRangePicker";
import { Await, useLoaderData, useNavigate, Link } from "react-router-dom";
import { Suspense, useState, useEffect, useRef } from "react";
import CartHoverCard from "./components/ui/CartHoverCard";
import LiveDot from "./components/ui/LiveDot";
import { shopLoader } from "./components/shop.server";

import {
    createCart,
    getCarts,
    getCartStats,
    deleteCart,
    togglePublishCart,
    duplicateCart,
} from "../services/apiRoutes";
import "../index.css";

const PLAN_ORDER_LIMITS = {
    free: 50,
    starter: 100,
    growth: 200,
};

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
            if (block?.type?.includes("shopify://apps/cart-drawer/")) {
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
        const res = await fetch(
            `${apiUrl}/api/cart-order-count?shop=${encodeURIComponent(shopDomain)}`
        );
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

export const loader = async ({ request }) => {
    const { shop, apiUrl, accessToken, currency, mainThemeId } =
        await shopLoader(request);

    const appEmbedId = process.env.SHOPIFY_API_KEY || "";

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AppCartsSkeleton() {
    return (
        <Page title="All Carts">
            <Layout>
                <Layout.Section>
                    <div style={{ marginTop: 16 }}>
                        <SkeletonDisplayText size="small" />
                    </div>
                    <Box paddingBlockStart="300">
                        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 12, padding: 20 }}>
                            <SkeletonBodyText lines={4} />
                        </div>
                    </Box>
                </Layout.Section>
                <Layout.Section>
                    <div style={{ marginTop: 16 }}>
                        <SkeletonDisplayText size="small" />
                    </div>
                    <Box paddingBlockStart="300">
                        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 12, padding: 20 }}>
                            <SkeletonBodyText lines={4} />
                        </div>
                    </Box>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default function AppCarts() {
    const loaderData = useLoaderData();
    return (
        <Suspense fallback={<AppCartsSkeleton />}>
            <Await resolve={loaderData.dataPromise} errorElement={<AppCartsSkeleton />}>
                {(data) => <AppCartsInner {...loaderData} {...data} />}
            </Await>
        </Suspense>
    );
}

// ─── Inner ────────────────────────────────────────────────────────────────────

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

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

    const [range, setRange] = useState({ start: defaultStart, end: today });
    const [carts, setCarts] = useState(initialCarts);
    const [cartStats, setCartStats] = useState(initialCartStats);
    const [creatingFrom, setCreatingFrom] = useState(null);

    const isFirstRender = useRef(true);

    useEffect(() => { setCarts(initialCarts); }, [initialCarts]);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const fetchStats = async () => {
            try {
                const params = new URLSearchParams({
                    shop: shop.myshopifyDomain,
                    startDate: range.start.toISOString(),
                    endDate: range.end.toISOString(),
                });
                const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, { credentials: "include" });
                const data = await res.json();
                if (data.success) setCartStats(data.data || {});
            } catch (err) {
                console.error("STATS FETCH ERROR:", err);
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
            setCarts((prev) =>
                prev.map((c) =>
                    c.cartId === id
                        ? { ...c, status: c.status === "published" ? "unpublished" : "published" }
                        : { ...c, status: c.status === "published" ? "unpublished" : c.status }
                )
            );
            shopify.toast.show(data.message || "Cart status updated");
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

    const liveCarts = carts
        .filter((cart) => cart.status === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const draftCarts = carts
        .filter((cart) => cart.status !== "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const fmt = (n) =>
        new Intl.NumberFormat("en-US", {
            style: "currency", currency: currency ?? "USD", minimumFractionDigits: 2,
        }).format(Number(n ?? 0));

    const AppEmbedLink = () => (
        <Tooltip content="Enable the app embed to start showing this cart on your storefront. Click to enable in your theme editor.">
            <span>
                <a
                    href={`https://${shop.myshopifyDomain}/admin/themes/${mainThemeId}/editor?context=apps&activateAppId=${appEmbedId}/app-embed`}
                    target="_blank"
                    rel="noopener noreferrer"
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

    // ─── CartTable ─────────────────────────────────────────────────────────────

    const CartTable = ({ carts, emptyText, isDraft, stats, monthOrders }) => (
        <div style={{ paddingTop: 12 }}>
            {carts.length === 0 ? (
                <Text tone="subdued">{emptyText}</Text>
            ) : (
                <div
                    className="compact-cart-table"
                    style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--p-color-border)" }}
                >
                    <IndexTable
                        resourceName={{ singular: "cart", plural: "carts" }}
                        itemCount={carts.length}
                        headings={[
                            { title: "Cart name", id: "cart-name" },
                            ...(!isDraft ? [{ title: "Status", id: "status" }] : []),
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
                                            <Text as="p" variant="bodyMd">The percentage of cart impressions that resulted in a completed purchase.</Text>
                                            <Text as="p" variant="bodyMd">Values shown are for the date range selected at the top of the page.</Text>
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
                                            <Text as="p" variant="bodyMd">Revenue generated by Upcart offers.</Text>
                                            <Text as="p" variant="bodyMd">Values shown are for the date range selected at the top of the page.</Text>
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
                        {carts.map((cart, i) => {
                            const cartEditorPath = `/app/cart-editor/${cart.cartId}?from=carts`;
                            const limit = PLAN_ORDER_LIMITS[shopPlan] ?? PLAN_ORDER_LIMITS.free;
                            const limitReached = monthOrders >= limit;

                            return (
                                // ── FIX: No onClick on the row — cover Link handles navigation instantly
                                <IndexTable.Row
                                    key={cart.cartId || `${cart._id || "cart"}-${i}`}
                                    id={cart.cartId || `${i}`}
                                    position={i}
                                    onClick={() => navigate(cartEditorPath)}
                                >
                                    <IndexTable.Cell>

                                        <Link
                                            to={cartEditorPath}
                                            prefetch="intent"
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                zIndex: 0,
                                            }}
                                            aria-label={`Edit cart ${cart.cartName || "Untitled cart"}`}
                                        />
                                        <CartHoverCard cart={cart}>
                                            {/* zIndex: 1 keeps hover card above the cover link */}
                                            <div style={{ position: "relative", zIndex: 1, cursor: "pointer" }}>
                                                <Text as="span">
                                                    {(cart.cartName || "Untitled cart").length > 8
                                                        ? (cart.cartName || "Untitled cart").slice(0, 8) + "..."
                                                        : (cart.cartName || "Untitled cart")}
                                                </Text>
                                            </div>
                                        </CartHoverCard>
                                    </IndexTable.Cell>

                                    {!isDraft && (
                                        <IndexTable.Cell>
                                            <InlineStack gap="200" blockAlign="center">
                                                {/* zIndex: 1 keeps badge/link above cover */}
                                                <span style={{ position: "relative", zIndex: 1 }}>
                                                    {appEmbedInstalled ? (
                                                        <Badge tone="success">Live</Badge>
                                                    ) : (
                                                        <AppEmbedLink />
                                                    )}
                                                </span>
                                            </InlineStack>
                                        </IndexTable.Cell>
                                    )}

                                    <IndexTable.Cell>
                                        {!isDraft && stats?.[cart.cartId]?.impressions != null
                                            ? stats[cart.cartId].impressions.toLocaleString()
                                            : "—"}
                                    </IndexTable.Cell>

                                    <IndexTable.Cell>
                                        {!isDraft && stats?.[cart.cartId]?.conversionRate != null
                                            ? stats[cart.cartId].conversionRate.toFixed(2) + "%"
                                            : "—"}
                                    </IndexTable.Cell>

                                    <IndexTable.Cell>
                                        {!isDraft && stats?.[cart.cartId]?.revenue != null
                                            ? fmt(stats[cart.cartId].revenue)
                                            : "—"}
                                    </IndexTable.Cell>

                                    {/* Action buttons — all at zIndex: 1 so they sit above the cover link */}
                                    <IndexTable.Cell>
                                        <InlineStack gap="200" align="end" style={{ position: "relative", zIndex: 1 }}>
                                            <Tooltip content="Edit">
                                                <Link
                                                    to={cartEditorPath}
                                                    prefetch="intent"
                                                    style={{ textDecoration: "none" }}
                                                >
                                                    <Button icon={EditIcon} />
                                                </Link>
                                            </Tooltip>

                                            <Tooltip content={cart.status === "published" ? "Preview" : "Only available for live carts"}>
                                                <Button
                                                    icon={ViewIcon}
                                                    disabled={cart.status !== "published"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (cart.status === "published") {
                                                            window.open(`https://${shop.myshopifyDomain}`, "_blank");
                                                        }
                                                    }}
                                                />
                                            </Tooltip>

                                            <Tooltip content="Duplicate">
                                                <Button
                                                    icon={DuplicateIcon}
                                                    loading={duplicatingCartId === cart.cartId}
                                                    disabled={duplicatingCartId !== null}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDuplicateCart(cart);
                                                    }}
                                                />
                                            </Tooltip>

                                            {cart.status === "published" && limitReached ? (
                                                <Tooltip content={`Monthly order limit reached (${monthOrders}/${limit}). Upgrade your plan to republish.`}>
                                                    <span>
                                                        <Badge tone="critical">Limit reached</Badge>
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip content={
                                                    cart.status !== "published" && limitReached
                                                        ? `Monthly order limit reached (${monthOrders}/${limit}). Upgrade your plan to publish.`
                                                        : cart.status === "published" ? "Unpublish" : "Publish"
                                                }>
                                                    <span>
                                                        <Button
                                                            size="slim"
                                                            disabled={cart.status !== "published" && limitReached}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                cart.status === "published"
                                                                    ? handleUnpublishClick(cart.cartId)
                                                                    : handlePublishClick(cart);
                                                            }}
                                                        >
                                                            {cart.status === "published" ? "Unpublish" : "Publish"}
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            )}

                                            {isDraft && (
                                                <Tooltip content="Delete">
                                                    <Button
                                                        icon={DeleteIcon}
                                                        tone="critical"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCart(cart);
                                                            setDeleteModal(true);
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </InlineStack>
                                    </IndexTable.Cell>
                                </IndexTable.Row>
                            );
                        })}
                    </IndexTable>
                </div>
            )}
        </div>
    );

    // ─── EmptyState ────────────────────────────────────────────────────────────

    const EmptyState = ({ title, subtitle, tag }) => (
        <Box paddingBlockStart="300">
            <Box
                borderStyle="dashed"
                borderColor="border"
                borderWidth="050"
                borderRadius="200"
                background="bg-surface-secondary"
                paddingBlockStart="500"
                paddingInlineStart="800"
            >
                <InlineStack align="start" blockAlign="center" gap="1000">
                    <img
                        src="https://hubsyntax.com/cart-images/Clip%20path%20group.png"
                        alt={title}
                        style={{ width: "127px", height: "82px", objectFit: "contain", flexShrink: 0, display: "block" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Text variant="headingMd" as="h4">{title}</Text>
                            {tag?.label ? (
                                <Badge tone={tag.tone || "warning"}>{tag.label}</Badge>
                            ) : (
                                <div style={{ width: "100px" }}>
                                    <SkeletonBodyText lines={1} />
                                </div>
                            )}
                        </div>
                        <Text variant="bodySm" tone="subdued" as="p">{subtitle}</Text>
                    </div>
                </InlineStack>
            </Box>
        </Box>
    );

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <Page
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
                                    onAction: () => navigate('/app/design-cart'),
                                },
                            ]}
                        />
                    </Popover>
                </InlineStack>
            }
        >
            <Layout>
                {(() => {
                    const limit = PLAN_ORDER_LIMITS[shopPlan] ?? PLAN_ORDER_LIMITS.free;
                    if (currentMonthOrders < limit) return null;
                    return (
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
                    );
                })()}

                {/* Live Cart Section */}
                <Layout.Section>
                    <div className="carts_liveStatusHeader___LUes" style={{ marginTop: 16 }}>
                        <LiveDot />
                        <Text variant="headingMd" as="h3">Live cart</Text>
                    </div>
                    {liveCarts.length === 0 ? (
                        <EmptyState
                            title="No live cart configured"
                            subtitle="Publish your cart to see it live, and start earning with your cart."
                            tag={!appEmbedInstalled ? { label: "App embed off", tone: "warning" } : null}
                        />
                    ) : (
                        <CartTable
                            carts={liveCarts}
                            emptyText="No live cart configured"
                            stats={cartStats}
                            monthOrders={currentMonthOrders}
                        />
                    )}
                </Layout.Section>

                {/* Draft Carts Section */}
                <Layout.Section>
                    <div className="carts_liveStatusHeader___LUes" style={{ marginTop: 16 }}>
                        <span style={{ display: "flex", width: 20, height: 20, flexShrink: 0, color: "rgb(48,48,48)", opacity: 0.7 }}>
                            <svg viewBox="0 0 20 20">
                                <path d="M15.747 2.354c.195-.196.512-.196.707 0l1.06 1.06c.196.195.196.512 0 .707l-.956.957-1.768-1.767.957-.957Z" fill="currentColor" />
                                <path d="m14.083 4.018 1.768 1.768-2.831 2.83c-.359.359-.84.568-1.348.585l-.772.025c-.144.005-.263-.113-.258-.258l.026-.772c.016-.507.225-.989.584-1.348l2.83-2.83Z" fill="currentColor" />
                                <path fillRule="evenodd" d="M6.976 5c-.62 0-1.146.454-1.237 1.067l-.583 3.933h2.484c.538 0 1.015.344 1.185.855l.159.474c.034.102.13.171.237.171h1.558c.108 0 .203-.069.237-.171l.159-.474c.17-.51.647-.855 1.185-.855h2.484l-.086-.578c-.06-.41.222-.79.632-.851.41-.061.791.222.852.632l.163 1.104c.063.425.095.853.095 1.282v1.661c0 1.795-1.455 3.25-3.25 3.25h-6.5c-1.795 0-3.25-1.455-3.25-3.25v-1.66c0-.43.032-.858.094-1.283l.661-4.46c.2-1.348 1.357-2.347 2.72-2.347h3.775c.414 0 .75.336.75.75s-.336.75-.75.75h-3.774Zm-1.976 6.59v-.09h2.46l.1.303c.239.715.908 1.197 1.66 1.197h1.56c.753 0 1.421-.482 1.66-1.197l.1-.303h2.46v1.75c0 .966-.784 1.75-1.75 1.75h-6.5c-.966 0-1.75-.784-1.75-1.75v-1.66Z" fill="currentColor" />
                            </svg>
                        </span>
                        <Text variant="headingMd" as="h3">Draft carts</Text>
                    </div>
                    {draftCarts.length === 0 ? (
                        <EmptyState
                            title="No draft carts"
                            subtitle="Create a new cart to start customizing. Draft carts won't go live until you publish them."
                        />
                    ) : (
                        <CartTable
                            carts={draftCarts}
                            emptyText="No draft carts yet."
                            isDraft
                            stats={cartStats}
                            monthOrders={currentMonthOrders}
                        />
                    )}
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
    );
}