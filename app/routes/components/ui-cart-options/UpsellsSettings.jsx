import {
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    Divider,
    InlineStack,
    Link,
    Select,
    Text,
    TextField,
    Modal,
    Badge
} from "@shopify/polaris";
import RichTextEditor from "../ui/RichTextEditor";
import ProductItemCollections from "../ui/ProductItem-Collections";
import { useState, useEffect } from "react";

export default function UpsellsSettings({ upsellsSettings, handleChange, currency }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState({
        type: upsellsSettings.sourceType || "products",
        items: upsellsSettings.selectedItems || []
    });
    
    const [suggestedOpen, setSuggestedOpen] = useState(false);
    const [suggestedSelected, setSuggestedSelected] = useState(
        upsellsSettings.suggestedProduct || { type: "products", items: [] }
    );

    const update = (key, value) => {
        handleChange("upsellsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <BlockStack gap="400">
            {/* SELECT PRODUCT */}
            <Card>
                <BlockStack gap="300">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack gap="200" align="center">
                            <Text variant="headingMd">Upsells</Text>
                            <Badge tone={upsellsSettings.enabled ? "critical" : "success"}>
                                {upsellsSettings.enabled ? "Disabled" : "Active"}
                            </Badge>
                        </InlineStack>
                        <Button
                            variant={upsellsSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !upsellsSettings.enabled)}
                        >
                            {upsellsSettings.enabled ? "Enabled" : "Disabled"}
                        </Button>
                    </InlineStack>

                    <Divider />

                    <Text variant="headingSm">Select product</Text>

                    <Checkbox
                        label="Use AI recommended upsells"
                        checked={upsellsSettings.useAiRecommended}
                        onChange={(val) => update("useAiRecommended", val)}
                    />

                    {upsellsSettings.useAiRecommended && (
                        <>
                            <Select
                                label="Recommendation Algorithm"
                                options={[
                                    { label: "Related", value: "related" },
                                    { label: "Complementary", value: "complementary" },
                                ]}
                                value={upsellsSettings.recommendationAlgorithm}
                                onChange={(val) => update("recommendationAlgorithm", val)}
                            />

                            {upsellsSettings.recommendationAlgorithm !== "complementary" && (
                                <Checkbox
                                    label="Use smart variant matching"
                                    checked={upsellsSettings.useSmartVariantMatching}
                                    onChange={(val) => update("useSmartVariantMatching", val)}
                                />
                            )}
                        </>
                    )}

                    <Button
                        disabled={upsellsSettings.useAiRecommended}
                        onClick={() => setOpen(true)}
                    >
                        Configure Manual Upsells
                    </Button>
                </BlockStack>
            </Card>

            {/* UPSELL SETTINGS */}
            <Card>
                <BlockStack gap="300">
                    <Text variant="headingSm">Upsell settings</Text>

                    <Checkbox
                        label="Show upsell offer if item already in cart"
                        checked={upsellsSettings.showIfAlreadyInCart}
                        onChange={(val) => update("showIfAlreadyInCart", val)}
                    />

                    <BlockStack gap="100">
                        <Checkbox
                            label="Limit the number of upsells in the cart"
                            checked={upsellsSettings.limitUpsellsInCart}
                            onChange={(val) => update("limitUpsellsInCart", val)}
                        />

                    </BlockStack>

                    <BlockStack gap="200">
                        <Checkbox
                            label="Suggested Products"
                            checked={upsellsSettings.showSuggestedProduct}
                            onChange={(val) => update("showSuggestedProduct", val)}
                        />
                        {upsellsSettings.showSuggestedProduct && (
                            <Button onClick={() => setSuggestedOpen(true)}>
                                {upsellsSettings.suggestedProduct?.items?.titles?.[0]
                                    ? `Selected: ${upsellsSettings.suggestedProduct.items.titles[0]}`
                                    : "Select Suggested Product"}
                            </Button>
                        )}
                    </BlockStack>

                    <Modal
                        open={suggestedOpen}
                        onClose={() => setSuggestedOpen(false)}
                        title="Select Suggested Product"
                        primaryAction={{
                            content: "Save",
                            onAction: () => {
                                update("suggestedProduct", suggestedSelected);
                                setSuggestedOpen(false);
                            },
                        }}
                        secondaryActions={[{ content: "Close", onAction: () => setSuggestedOpen(false) }]}
                    >
                        <Modal.Section>
                            <div style={{ height: "700px" }}>
                                <ProductItemCollections
                                    currency={currency}
                                    maxSelect={1}
                                    showCollections={false}
                                    onSelect={(data) => setSuggestedSelected(data)}
                                    initialSelected={suggestedSelected}
                                />
                            </div>
                        </Modal.Section>
                    </Modal>

                    <BlockStack gap="100">
                        <Checkbox
                            label="Show product reviews on upsells"
                            checked={upsellsSettings.showReviews}
                            onChange={(val) => update("showReviews", val)}
                        />

                        <>
                            <Text variant="bodySm" tone="subdued">
                                Product reviews will also be shown on recommendations
                            </Text>
                            <Banner tone="info">
                                This integration will only work with product review apps that
                                allow the{" "}
                                <Link
                                    url="https://shopify.dev/docs/api/storefront"
                                    target="_blank"
                                >
                                    Shopify Storefront API to read product review data stored in
                                    metafields.
                                </Link>
                            </Banner>
                        </>

                    </BlockStack>
                    {upsellsSettings.limitUpsellsInCart && (
                        <TextField
                            label="Maximum number of upsells to display"
                            type="number"
                            min={1}
                            value={String(upsellsSettings.maxUpsellsInCart)}
                            onChange={(val) => update("maxUpsellsInCart", Number(val))}
                            autoComplete="off"
                        />
                    )}

                    <InlineStack align="space-between">
                        <Text variant="bodyMd" fontWeight="medium">
                            Upsell title
                        </Text>
                        <Button
                            variant="plain"
                            onClick={() => update("title", "")}
                        >
                            Clear
                        </Button>
                    </InlineStack>
                    <RichTextEditor
                        value={upsellsSettings.title}
                        onChange={(val) => update("title", val)}
                    />

                    <TextField
                        label="Button text"
                        value={upsellsSettings.buttonText}
                        onChange={(val) => update("buttonText", val)}
                    />

                    <Select
                        label="Upsell position"
                        options={[
                            { label: "Bottom", value: "bottom" },
                            { label: "Top", value: "top" },
                        ]}
                        value={upsellsSettings.position}
                        onChange={(val) => update("position", val)}
                    />

                    <Select
                        label="Upsell direction"
                        options={[
                            { label: "Block", value: "block" },
                            { label: "Carousel", value: "carousel" },
                        ]}
                        value={upsellsSettings.direction}
                        onChange={(val) => update("direction", val)}
                    />

                    {upsellsSettings.direction === "carousel" && (
                        <Select
                            label="Carousel indicator"
                            options={[
                                { label: "Progress bar", value: "progressBar" },
                                { label: "Buttons", value: "buttons" },
                                { label: "None", value: "none" },
                            ]}
                            value={upsellsSettings.carouselIndicator || "progressBar"}
                            onChange={(val) => update("carouselIndicator", val)}
                        />
                    )}
                </BlockStack>
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    title="Select Products"
                    primaryAction={{
                        content: "Save",
                        onAction: () => {
                            handleChange("upsellsSettings", (prev) => ({
                                ...prev,
                                sourceType: selected?.type || "products",
                                selectedItems: selected?.items || [],
                            }));

                            setOpen(false);
                        }
                    }}
                    secondaryActions={[
                        {
                            content: "Close",
                            onAction: () => setOpen(false),
                        },
                    ]}
                >
                    <Modal.Section>
                        <div style={{ height: "700px" }}>
                            <ProductItemCollections
                                currency={currency}
                                onSelect={(data) => {
                                    setSelected(data);
                                }}
                                initialSelected={selected}
                            />
                        </div>
                    </Modal.Section>
                </Modal>
            </Card>
        </BlockStack>
    );
}
