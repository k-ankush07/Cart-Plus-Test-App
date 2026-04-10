import {
    Page,
    Card,
    Layout,
    Text,
    InlineStack,
    Badge,
    IndexTable,
    Button,
    Tooltip,
    Modal
} from "@shopify/polaris";

import {
    EditIcon,
    ViewIcon,
    DuplicateIcon,
    DeleteIcon,
    PlusIcon,
} from "@shopify/polaris-icons";

import { useLoaderData, useNavigate } from "react-router-dom";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";

import { shopLoader } from "./components/shop.server";
import {
    createCart,
    getCarts,
    deleteCart,
    togglePublishCart,
    duplicateCart,
} from "../services/apiRoutes";

export const loader = async ({ request }) => {
    const data = await shopLoader(request);
    return json(data);
};

export default function AppCarts() {
    const { shop, apiUrl } = useLoaderData();
    const navigate = useNavigate();
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedCart, setSelectedCart] = useState(null);

    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCarts = async () => {
            const data = await getCarts(apiUrl, shop.myshopifyDomain);
            setCarts(data.data || []);
        };
        fetchCarts();
    }, [shop.myshopifyDomain, apiUrl]);

    const handleCreateCart = async () => {
        setLoading(true);

        const data = await createCart(apiUrl, {
            shop: shop.myshopifyDomain,
            shopEmail: shop.email,
            storeOwner: shop.name,
        });

        if (data.success) {
            shopify.toast.show("Cart created successfully");
            navigate(`/app/cart-editor/${data.data.cartId}`, { replace: true });
        }

        setLoading(false);
    };

    const confirmDeleteCart = async () => {
        if (!selectedCart) return;

        const data = await deleteCart(apiUrl, selectedCart.cartId);

        if (data.success) {
            setCarts((prev) =>
                prev.filter((c) => c.cartId !== selectedCart.cartId)
            );

            shopify.toast.show("Cart deleted successfully");
        }

        setDeleteModal(false);
        setSelectedCart(null);
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

            shopify.toast.show(
                data.message || "Cart status updated"
            );
        }
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

    const CartTable = ({ carts, emptyText, isDraft }) => (
        <div style={{ paddingTop: 12 }}>
            {carts.length === 0 ? (
                <Text tone="subdued">{emptyText}</Text>
            ) : (
                <IndexTable
                    resourceName={{ singular: "cart", plural: "carts" }}
                    itemCount={carts.length}
                    headings={[
                        { title: "Cart name" },
                        { title: "Cart conversion rate (%)" },
                        { title: "Added revenue" },
                        { title: "" },
                    ]}
                    selectable={false}
                >
                    {carts.map((cart, i) => (
                        <IndexTable.Row key={cart.cartId} id={cart.cartId} position={i}>
                            <IndexTable.Cell>
                                <div style={{ maxWidth: "100px" }}>
                                    <Text
                                        fontWeight="medium"
                                        truncate
                                        as="span"
                                    >
                                        {cart.cartName || "Untitled cart"}
                                    </Text>
                                </div>
                            </IndexTable.Cell>

                            <IndexTable.Cell>—</IndexTable.Cell>
                            <IndexTable.Cell>—</IndexTable.Cell>

                            <IndexTable.Cell>
                                <InlineStack gap="200" align="end">

                                    <Tooltip content="Edit cart">
                                        <Button
                                            icon={EditIcon}
                                            onClick={() => navigate(`/app/cart-editor/${cart.cartId}`)}
                                        />
                                    </Tooltip>

                                    <Tooltip content="Preview cart">
                                        <Button icon={ViewIcon} />
                                    </Tooltip>

                                    <Tooltip content="Duplicate cart">
                                        <Button
                                            icon={DuplicateIcon}
                                            onClick={() => handleDuplicateCart(cart)}
                                        />
                                    </Tooltip>

                                    <Tooltip content={cart.status === "published" ? "Unpublish cart" : "Publish cart"}>
                                        <Button
                                            size="slim"
                                            tone={cart.status === "published" ? "critical" : "success"}
                                            onClick={() => handleTogglePublish(cart.cartId)}
                                        >
                                            {cart.status === "published" ? "Unpublish" : "Publish"}
                                        </Button>
                                    </Tooltip>

                                    {isDraft && (
                                        <Tooltip content="Delete cart">
                                            <Button
                                                icon={DeleteIcon}
                                                tone="critical"
                                                onClick={() => {
                                                    setSelectedCart(cart);
                                                    setDeleteModal(true);
                                                }}
                                            />
                                        </Tooltip>
                                    )}

                                </InlineStack>
                            </IndexTable.Cell>
                        </IndexTable.Row>
                    ))}
                </IndexTable>
            )}
        </div>
    );

    return (
        <Page
            title="All Carts"
            primaryAction={{
                content: loading ? "Creating..." : "Create cart",
                icon: PlusIcon,
                loading,
                onAction: handleCreateCart,
            }}
        >
            <Layout>

                <Layout.Section>
                    <Card>
                        <InlineStack gap="200">
                            <Badge tone="success">Live cart</Badge>
                        </InlineStack>

                        <CartTable
                            carts={liveCarts}
                            emptyText="No live cart configured"
                        />
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <Text variant="headingSm">Draft carts</Text>

                        <CartTable
                            carts={draftCarts}
                            emptyText="No draft carts yet."
                            isDraft
                        />
                    </Card>
                </Layout.Section>

            </Layout>

            <Modal
                open={deleteModal}
                onClose={() => setDeleteModal(false)}
                title={`Are you sure you want to delete "${selectedCart?.cartName || "Untitled cart"}"?`}
                primaryAction={{
                    content: "Delete cart",
                    destructive: true,
                    onAction: confirmDeleteCart,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => setDeleteModal(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Text tone="subdued">
                        Deleting this cart will permanently remove it and it cannot be recovered.
                        <br />
                        This action cannot be undone.
                    </Text>
                </Modal.Section>
            </Modal>
        </Page>
    );
}