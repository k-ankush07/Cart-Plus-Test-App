import {
    Page,
    Card,
    Layout,
    Text,
    InlineStack,
    Badge,
    IndexTable,
    Button,
    Tooltip
} from "@shopify/polaris";
import {
    EditIcon,
    ViewIcon,
    DuplicateIcon,
    DeleteIcon,
} from "@shopify/polaris-icons";

import { PlusIcon } from "@shopify/polaris-icons";
import { useLoaderData, useNavigate } from "react-router-dom";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import { shopLoader } from "./components/shop.server";
import { createCart, getCarts, deleteCart } from "../services/apiRoutes";

export const loader = async ({ request }) => {
    const data = await shopLoader(request);
    return json(data);
};

export default function AppCarts() {
    const { shop, apiUrl } = useLoaderData();
    const navigate = useNavigate();
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleCreateCart = async () => {
        setLoading(true);

        try {
            const data = await createCart(apiUrl, {
                shop: shop.myshopifyDomain,
                shopEmail: shop.email,
                storeOwner: shop.name,
            });

            if (data.success) {
                navigate(`/app/cart-editor/${data.data.cartId}`, {
                    replace: true,
                });
            }
            shopify.toast.show(data.updated ? "CreateCart" : "Cart updated successfully", {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCarts = async () => {
            try {
                const data = await getCarts(apiUrl, shop.myshopifyDomain);
                setCarts(data.data)
            } catch (error) {
                console.error("FETCH CARTS ERROR:", error);
            }
        };

        fetchCarts();
    }, [shop.myshopifyDomain, apiUrl]);

    const handleDeleteCart = async (cartId) => {
        try {
            const data = await deleteCart(apiUrl, cartId);

            if (data.success) {
                setCarts(carts.filter((cart) => cart.cartId !== cartId));
            }
        } catch (error) {
            console.error("DELETE CART ERROR:", error);
        }
    };

    return (
        <Page
            title="All Carts"
            primaryAction={{
                content: loading ? "Creating..." : "Create cart",
                icon: PlusIcon,
                onAction: handleCreateCart,
                loading: loading,
            }}
        >
            <Layout>
                <Layout.Section>
                    <Card>
                        <InlineStack align="space-between">
                            <InlineStack gap="200" align="center">
                                <Badge tone="success">Live cart</Badge>
                            </InlineStack>
                        </InlineStack>

                        <div style={{ paddingTop: "12px" }}>
                            <Text variant="bodyMd" tone="subdued">
                                No live cart configured
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                                Publish a draft cart to see your cart live and start earning.
                            </Text>
                        </div>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <Text variant="headingSm" as="h2">
                            Draft carts
                        </Text>

                        <div style={{ paddingTop: "12px" }}>
                            {carts.length === 0 ? (
                                <Text variant="bodyMd" tone="subdued">
                                    No draft carts yet.
                                </Text>
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
                                    {carts.map((cart, index) => (
                                        <IndexTable.Row id={cart.cartId} key={cart.cartId} position={index}>

                                            {/* Cart Name */}
                                            <IndexTable.Cell>
                                                <Text fontWeight="medium">
                                                    {cart.cartName || "Untitled cart"}
                                                </Text>
                                            </IndexTable.Cell>

                                            {/* Conversion */}
                                            <IndexTable.Cell>—</IndexTable.Cell>

                                            {/* Revenue */}
                                            <IndexTable.Cell>—</IndexTable.Cell>

                                            {/* Actions */}
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
                                                        <Button icon={DuplicateIcon} />
                                                    </Tooltip>

                                                    <Tooltip content="Publish cart">
                                                        <Button size="slim">Publish</Button>
                                                    </Tooltip>

                                                    <Tooltip content="Delete cart">
                                                        <Button icon={DeleteIcon} tone="critical" onClick={() => handleDeleteCart(cart.cartId)} />
                                                    </Tooltip>
                                                </InlineStack>
                                            </IndexTable.Cell>

                                        </IndexTable.Row>
                                    ))}
                                </IndexTable>
                            )}
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}