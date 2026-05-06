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
    SkeletonBodyText
} from "@shopify/polaris";

import {
    EditIcon,
    ViewIcon,
    DuplicateIcon,
    DeleteIcon,
    PlusIcon,
} from "@shopify/polaris-icons";
import DateRangePicker from "./components/ui/DateRangePicker";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CartHoverCard from "./components/ui/CartHoverCard"

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

export const loader = async ({ request }) => {
    const { shop, apiUrl, accessToken, currency } = await shopLoader(request);

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

    let carts = [];
    let cartStats = {};
    try {
        const cartsData = await getCarts(apiUrl, shop.myshopifyDomain);
        carts = cartsData.data || [];
    } catch (err) {
        console.error("GET CARTS ERROR:", err);
    }
    try {
        const statsData = await getCartStats(
            apiUrl,
            shop.myshopifyDomain,
            defaultStart.toISOString(),
            today.toISOString()
        );
        cartStats = statsData.data || {};
    } catch (err) {
        console.error("GET CART STATS ERROR:", err);
    }

    return Response.json({ shop, apiUrl, accessToken, currency, carts, cartStats });
};

export default function AppCarts() {
    const { shop, apiUrl, carts: initialCarts, cartStats: initialCartStats } = useLoaderData();
    const navigate = useNavigate();

    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedCart, setSelectedCart] = useState(null);
    const [publishModal, setPublishModal] = useState(false);
    const [cartToPublish, setCartToPublish] = useState(null);
    const [publishHasLive, setPublishHasLive] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [unpublishModal, setUnpublishModal] = useState(false);
    const [cartToUnpublish, setCartToUnpublish] = useState(null);

    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 29);

    const [range, setRange] = useState({ start: defaultStart, end: today });
    const [carts, setCarts] = useState(initialCarts);
    const [cartStats, setCartStats] = useState(initialCartStats);
    const [loading, setLoading] = useState(false);

    const isFirstRender = useRef(true);

    useEffect(() => {
        setCarts(initialCarts);
    }, [initialCarts]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const fetchStats = async () => {
            try {
                const params = new URLSearchParams({
                    shop: shop.myshopifyDomain,
                    startDate: range.start.toISOString(),
                    endDate: range.end.toISOString(),
                });
                const res = await fetch(`${apiUrl}/api/cart-stats?${params}`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) setCartStats(data.data || {});
            } catch (err) {
                console.error("STATS FETCH ERROR:", err);
            }
        };

        fetchStats();
    }, [range.start, range.end]);

    const handleCreateCart = () => {
        setLoading(true);
        const tempCartId = "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
        setTimeout(() => {
            navigate(`/app/cart-editor/${tempCartId}`, { replace: true });
            createCart(apiUrl, {
                shop: shop.myshopifyDomain,
                shopEmail: shop.email,
                storeOwner: shop.name,
                cartId: tempCartId,
            }).then((data) => {
                if (data.success) shopify.toast.show("Cart created successfully");
            }).catch(() => { });
        }, 80);
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
        const data = await duplicateCart(apiUrl, cart.cartId);
        if (data.success) {
            setCarts((prev) => [data.data, ...prev]);
            shopify.toast.show("Cart duplicated successfully");
        }
    };

    const liveCarts = carts
        .filter((cart) => cart.status === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const draftCarts = carts
        .filter((cart) => cart.status !== "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const fmt = (n) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Number(n ?? 0));

    const CartTable = ({ carts, emptyText, isDraft, stats }) => (
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
                                id: "conversion-rate",
                                title: (
                                    <Tooltip content="The percentage of cart impressions that resulted in a completed purchase.">
                                        <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>
                                            Cart conversion rate (%)
                                        </span>
                                    </Tooltip>
                                ),
                            },
                            {
                                id: "added-revenue",
                                title: (
                                    <Tooltip content="Revenue generated by Upcart offers in the selected period.">
                                        <span style={{ borderBottom: "1px dashed #8c9196", cursor: "default" }}>
                                            Added revenue
                                        </span>
                                    </Tooltip>
                                ),
                            },
                            { title: "", id: "actions" },
                        ]}
                        selectable={false}
                    >
                        {carts.map((cart, i) => (
                            <IndexTable.Row
                                key={cart.cartId || `${cart._id || "cart"}-${i}`}
                                id={cart.cartId || `${i}`}
                                position={i}
                            >
                                <IndexTable.Cell>
                                    <CartHoverCard cart={cart}>
                                        <div
                                            style={{ maxWidth: "150px", cursor: "pointer" }}
                                            onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)}
                                        >
                                            <Text truncate as="span">
                                                {cart.cartName || "Untitled cart"}
                                            </Text>
                                        </div>
                                    </CartHoverCard>
                                </IndexTable.Cell>

                                {!isDraft && (
                                    <IndexTable.Cell>
                                        <Badge tone="success">Live</Badge>
                                    </IndexTable.Cell>
                                )}

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

                                <IndexTable.Cell>
                                    <InlineStack gap="200" align="end">
                                        <Tooltip content="Edit cart">
                                            <Button icon={EditIcon} onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)} />
                                        </Tooltip>
                                        <Tooltip content="Preview cart">
                                            <Button icon={ViewIcon} />
                                        </Tooltip>
                                        <Tooltip content="Duplicate cart">
                                            <Button icon={DuplicateIcon} onClick={() => handleDuplicateCart(cart)} />
                                        </Tooltip>
                                        <Tooltip content={cart.status === "published" ? "Unpublish cart" : "Publish cart"}>
                                            <Button
                                                size="slim"
                                                tone={cart.status === "published" ? "critical" : "success"}
                                                onClick={() =>
                                                    cart.status === "published"
                                                        ? handleUnpublishClick(cart.cartId)
                                                        : handlePublishClick(cart)
                                                }
                                            >
                                                {cart.status === "published" ? "Unpublish" : "Publish"}
                                            </Button>
                                        </Tooltip>
                                        {isDraft && (
                                            <Tooltip content="Delete cart">
                                                <Button
                                                    icon={DeleteIcon}
                                                    tone="critical"
                                                    onClick={() => { setSelectedCart(cart); setDeleteModal(true); }}
                                                />
                                            </Tooltip>
                                        )}
                                    </InlineStack>
                                </IndexTable.Cell>
                            </IndexTable.Row>
                        ))}
                    </IndexTable>
                </div>
            )}
        </div>
    );

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
                            ) : <div style={{ width: "100px" }}>
                                <SkeletonBodyText lines={1} />
                            </div>}

                        </div>
                        <Text variant="bodySm" tone="subdued" as="p">{subtitle}</Text>
                    </div>
                </InlineStack>
            </Box>
        </Box>
    );

    return (
        <Page
            backAction={{ url: "#" }}
            title="All Carts"
            primaryAction={
                <InlineStack gap="300">
                    <DateRangePicker value={range} onChange={setRange} />
                    <Button
                        icon={PlusIcon}
                        loading={loading}
                        disabled={loading}
                        onClick={handleCreateCart}
                    >
                        {loading ? "Creating..." : "Create cart"}
                    </Button>
                </InlineStack>
            }
        >
            <Layout>
                {/* Live Cart Section */}
                <Layout.Section>
                    <div className="carts_liveStatusHeader___LUes" style={{ marginTop: 16 }}>
                        <span className="carts_liveStatusDot__XROK5">
                            <span className="carts_liveStatusPulse___dT4L"></span>
                            <span className="carts_liveStatusCore__wJ4K1"></span>
                        </span>
                        <Text variant="headingMd" as="h3">Live cart</Text>
                    </div>

                    {liveCarts.length === 0 ? (
                        <EmptyState
                            title="No live cart configured"
                            subtitle="Publish your cart to see it live, and start earning with your cart."
                            tag={{ label: "App embed off", tone: "warning" }}
                        />
                    ) : (
                        <CartTable carts={liveCarts} emptyText="No live cart configured" stats={cartStats} />
                    )}
                </Layout.Section>

                {/* Draft Carts Section */}
                <Layout.Section>
                    <div className="carts_liveStatusHeader___LUes" style={{ marginTop: 16 }}>
                        <span style={{ display: "flex", width: 20, height: 20, flexShrink: 0, color: "rgb(48, 48, 48)", opacity: 0.7 }}>
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
                        <CartTable carts={draftCarts} emptyText="No draft carts yet." isDraft stats={cartStats} />
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
