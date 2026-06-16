import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    Icon,
    InlineStack,
    Link,
    Modal,
    Text,
    TextField,
    Thumbnail,
    LegacyCard,
    LegacyStack,
    Box,
    Pagination
} from "@shopify/polaris";
import { DeliveryIcon, ProductIcon, AppsIcon } from "@shopify/polaris-icons";
import Products from "../ui/Products";

export default function Extras({ addonsSettings, handleChange, currency, }) {
    const authenticatedFetch = useAuthenticatedFetch();

    const [productModalOpen, setProductModalOpen] = useState(false);
    const [modalKey, setModalKey] = useState(0);
    const [tempProduct, setTempProduct] = useState(addonsSettings.selectedProduct || null);

    const [pagination, setPagination] = useState({
        hasPrevious: false,
        hasNext: false,
        handlePrev: () => { },
        handleNext: () => { },
    })

    useEffect(() => {
        setTempProduct(addonsSettings.selectedProduct || null);
    }, [addonsSettings.selectedProduct]);

    const openModal = () => {
        setModalKey((k) => k + 1);
        setProductModalOpen(true);
    };

    const update = (key, value) => {
        handleChange("addonsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const isShipping = addonsSettings.type === "shipping_protection";

    const TypeButton = ({ value, icon, label }) => (
        <button
            type="button"
            onClick={() => update("type", value)}
            style={{
                flex: 1,
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                background: addonsSettings.type === value ? "rgb(236, 244, 254)" : "#fff",
                border: addonsSettings.type === value ? "1px solid rgb(46, 94, 131)" : "1px solid #e1e3e5",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#202223",
            }}
        >
            <Icon source={icon} tone={addonsSettings.type === value ? "info" : "subdued"} />
            {label}
        </button>
    );

    useEffect(() => {
        if (
            addonsSettings.type !== "shipping_protection" ||
            !addonsSettings.title ||
            !addonsSettings.description ||
            !addonsSettings.price
        ) return;

        const timer = setTimeout(async () => {
            await createOrUpdateShippingProduct();
        }, 1500);

        return () => clearTimeout(timer);

    }, [
        addonsSettings.type,
        addonsSettings.title,
        addonsSettings.description,
        addonsSettings.price,
        addonsSettings.customShippingProduct
    ]);

    const createOrUpdateShippingProduct = async () => {
        try {
            const res = await authenticatedFetch(`/shopify/create-or-update-shipping`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: addonsSettings.title,
                    description: addonsSettings.description,
                    price: addonsSettings.price,
                }),
            });

            const data = await res.json();

            if (data.success) {
                update("customShippingProduct", {
                    productId: data.productId,
                    variantId: data.variantId,
                });
                // shopify.toast.show(data.updated ? "Shipping product updated!" : "Shipping product created!");
            } else {
                // shopify.toast.show("Failed to save product", { isError: true });
            }

        } catch (err) {
            console.error(err);
            shopify.toast.show("Something went wrong", { isError: true });
        }
    };

    return (
        <div className="mainContent">
            {/* HEADER CARD */}
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={AppsIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Extras</Text>
                            </InlineStack>
                            <Box paddingInlineStart="200">
                                <Badge tone={addonsSettings.enabled ? "critical" : "success"}>
                                    {addonsSettings.enabled ? "Disabled" : "Active"}
                                </Badge>

                            </Box>
                        </InlineStack>
                        <InlineStack gap="200" />
                        <Button
                            variant={addonsSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !addonsSettings.enabled)}
                        >
                            {addonsSettings.enabled ? "Enable" : "Disable"}
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>

            <BlockStack gap="400">
                {/* GENERAL SETTINGS */}
                <Card>
                    <BlockStack gap="400">
                        <Text variant="headingSm">General settings</Text>

                        {/* TYPE SELECTOR */}
                        <InlineStack gap="300">
                            <TypeButton value="shipping_protection" icon={DeliveryIcon} label="Shipping protection" />
                            <TypeButton value="product_addon" icon={ProductIcon} label="Product add-on" />
                        </InlineStack>

                        {isShipping ? (
                            <BlockStack gap="300">
                                <Banner tone="info">
                                    <Text variant="bodyMd" fontWeight="semibold">Shipping protection disclaimer</Text>
                                    <Text variant="bodySm">
                                       Appname only provides a product to represent shipping protection and does not offer shipping protection services itself.
                                    </Text>
                                </Banner>

                                <TextField
                                    label="Title"
                                    value={addonsSettings.title}
                                    onChange={(val) => update("title", val.slice(0, 50))}
                                    helpText="Name of the product in the cart"
                                    suffix={`${addonsSettings.title?.length || 0}/50`}
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Description"
                                    value={addonsSettings.description}
                                    onChange={(val) => update("description", val.slice(0, 80))}
                                    helpText="Upsell description in the cart below title"
                                    suffix={`${addonsSettings.description?.length || 0}/80`}
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Price"
                                    value={addonsSettings.price}
                                    onChange={(val) => update("price", val)}
                                    suffix={currency}
                                    autoComplete="off"
                                />

                                <Link onClick={() => update("dynamicPricing", !addonsSettings.dynamicPricing)}>
                                    Enable dynamic shipping protection pricing
                                </Link>
                            </BlockStack>
                        ) : (
                            <BlockStack gap="300">
                                {addonsSettings.selectedProduct ? (
                                    <BlockStack gap="400">
                                        <Box width="80%" className="ProductAddonSettings_product__SoIR7">
                                            <LegacyCard>
                                                <LegacyCard.Section>
                                                    <LegacyStack alignment="center" distribution="equalSpacing" wrap={false}>
                                                        <LegacyStack.Item>
                                                            <Thumbnail
                                                                source={addonsSettings.selectedProduct.productImage || addonsSettings.selectedProduct.image}
                                                                alt={addonsSettings.selectedProduct.productTitle || addonsSettings.selectedProduct.title}
                                                                size="large"
                                                            />
                                                        </LegacyStack.Item>
                                                        <LegacyStack.Item fill>
                                                            <LegacyStack vertical spacing="extraTight">
                                                                <LegacyStack.Item>
                                                                    <Text variant="bodyMd" fontWeight="semibold">
                                                                        {addonsSettings.selectedProduct.productTitle || addonsSettings.selectedProduct.title}
                                                                    </Text>
                                                                </LegacyStack.Item>
                                                                <LegacyStack.Item>
                                                                    <Text variant="bodyMd" tone="subdued">
                                                                        {addonsSettings.selectedProduct.description}
                                                                    </Text>
                                                                </LegacyStack.Item>
                                                            </LegacyStack>
                                                        </LegacyStack.Item>
                                                        <LegacyStack.Item>
                                                            <Text variant="bodyMd" fontWeight="semibold">
                                                                {addonsSettings.selectedProduct.price} {currency}
                                                            </Text>
                                                        </LegacyStack.Item>
                                                    </LegacyStack>
                                                </LegacyCard.Section>
                                            </LegacyCard>
                                        </Box>
                                        <Button variant="primary" fullWidth onClick={openModal}>
                                            Change product
                                        </Button>
                                    </BlockStack>
                                ) : (
                                    <Button variant="primary" fullWidth onClick={openModal}>
                                        Select product
                                    </Button>
                                )}
                            </BlockStack>
                        )}
                    </BlockStack>
                </Card>

                {/* ADVANCED SETTINGS */}
                <Card>
                    <BlockStack gap="300">
                        <Text variant="headingSm">Advanced settings</Text>

                        <BlockStack gap="100">
                            <Checkbox
                                label="Add Add-ons to Cart Item Count"
                                checked={addonsSettings.includeInItemCount}
                                onChange={(val) => update("includeInItemCount", val)}
                            />
                            <Text variant="bodySm" tone="subdued">
                               By default, add-ons are excluded from the cart item count.
                            </Text>
                        </BlockStack>

                        {isShipping && (
                            <BlockStack gap="100">
                                <Checkbox
                                    label="Auto-Fulfill Shipping Protection"
                                    checked={addonsSettings.autoFulfill}
                                    onChange={(val) => update("autoFulfill", val)}
                                />
                                <Text variant="bodySm" tone="subdued">
                                    Shipping protection will be automatically fulfilled when other items in the order are fulfilled.
                                </Text>
                            </BlockStack>
                        )}

                        <BlockStack gap="100">
                            <Checkbox
                                label="Enable Add-on Tracking on Orders"
                                checked={addonsSettings.includeTracking}
                                onChange={(val) => update("includeTracking", val)}
                            />
                            <Text variant="bodySm" tone="subdued">
                                Show add-on details on order documents for tracking and analytics (attributes like beamAddonDesiredState are included).
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <InlineStack gap="200" align="start" blockAlign="center">
                                <Checkbox
                                    label="Accept Offers by Default"
                                    checked={false}
                                    disabled
                                    onChange={() => { }}
                                />
                                <Badge tone="warning">Deprecated</Badge>
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued">
                                Auto-accept the add-on when the first item is added to the cart.
                            </Text>
                        </BlockStack>

                        <Banner tone="warning">
                            <Text variant="bodyMd" fontWeight="semibold">Removed “Accept offer by default”</Text>
                            <Text variant="bodySm">
                                To provide a more trustworthy buyer experience, Shopify prohibits apps from automatically adding non-free items. Buyers must explicitly accept add-ons using the toggle. For more details, see{" "}
                                <Link url="https://shopify.dev/docs/apps/launch/app-requirements" target="_blank">
                                    Section 1.19
                                </Link>{" "}
                                of Shopify's app requirements.
                            </Text>
                        </Banner>
                    </BlockStack>
                </Card>

                {/* CUSTOM TEMPLATE */}
                {/* <Card>
                <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm">Custom template</Text>
                        <Badge tone="info">Advanced</Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued">
                        Custom templates aren't enabled.{" "}
                        <Link url="/app/settings/advanced">
                            Navigate to Settings &gt; Advanced Settings to enable.
                        </Link>
                    </Text>
                </BlockStack>
            </Card> */}

                {/* PRODUCT PICKER MODAL */}
                <Modal
                    open={productModalOpen}
                    onClose={() => setProductModalOpen(false)}
                    title="Select Product"
                    primaryAction={{
                        content: "Save",
                        onAction: () => {
                            update("selectedProduct", tempProduct);
                            setProductModalOpen(false);
                        },
                    }}
                    secondaryActions={[{ content: "Cancel", onAction: () => setProductModalOpen(false) }]}
                    footer={
                        <InlineStack align="space-between" blockAlign="center">
                            <Pagination
                                hasPrevious={pagination.hasPrevious}
                                onPrevious={pagination.handlePrev}
                                hasNext={pagination.hasNext}
                                onNext={pagination.handleNext}
                            />
                        </InlineStack>
                    }
                >
                    <Modal.Section>
                        <Products
                            key={modalKey}
                            currency={currency}
                            selectedItems={tempProduct ? [{ id: tempProduct.id, productTitle: tempProduct.title, productImage: tempProduct.image, price: tempProduct.price }] : []}
                            onSelect={(items) => {
                                const v = items[0];
                                if (!v) { setTempProduct(null); return; }
                                setTempProduct({
                                    id: v.id,
                                    handle: v.handle,
                                    title: v.productTitle || v.title,
                                    image: v.productImage || v.image,
                                    price: v.price,
                                });
                            }}
                            onPaginationChange={(p) => setPagination(p)}
                        />
                    </Modal.Section>
                </Modal>
            </BlockStack>
        </div>
    );
}
