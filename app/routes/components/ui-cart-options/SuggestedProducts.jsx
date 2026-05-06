import {
    Card,
    Text,
    Button,
    ButtonGroup,
    TextField,
    InlineStack,
    InlineGrid,
    BlockStack,
    RangeSlider,
    Badge,
    LegacyCard,
    LegacyStack,
    Box,
    Icon,
    Divider,
    DropZone,
    ProgressBar,
    Tooltip,
    Checkbox,
    Select,
    Modal,
    Banner,
    Link
} from "@shopify/polaris";
import {
    StarIcon,                 // Recommendations
} from "@shopify/polaris-icons";

import ProductItemCollections from "../ui/ProductItem-Collections";
import RichTextEditor from "../ui/RichTextEditor";
import { useState, useEffect } from "react";

export default function SuggestedProducts({ recommendationsSettings, handleChange, currency }) {

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState({
        type: recommendationsSettings.sourceType || "products",
        items: recommendationsSettings.selectedItems || []
    });

    const update = (key, value) => {
        handleChange("recommendationsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    useEffect(() => {
        setSelected({
            type: recommendationsSettings.sourceType || "products",
            items: recommendationsSettings.selectedItems || []
        });
    }, [open]);

    return (
        <div className="mainContent">
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={StarIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Suggested Products</Text>
                            </InlineStack>
                            <Box paddingInlineStart="200">
                                <Badge tone={recommendationsSettings.enabled ? "critical" : "success"}>
                                    {recommendationsSettings.enabled ? "Disabled" : "Active"}
                                </Badge>
                            </Box>
                        </InlineStack>
                        <InlineStack gap="200" />
                        <Button
                            variant={recommendationsSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !recommendationsSettings.enabled)}
                        >
                            {recommendationsSettings.enabled ? "Enable" : "Disable"}
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>
            <LegacyCard sectioned title="Recommendations settings">
                <LegacyStack vertical spacing="tight">
                    <Text variant="bodySm" tone="subdued">
                        Displays <Text as="span" fontWeight="bold">only</Text> on an empty cart.
                    </Text>
                    <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="bodyMd" fontWeight="medium">
                                Edit header text
                            </Text>
                            <Button
                                variant="plain"
                                onClick={() => update("text", "")}
                            >
                                Clear
                            </Button>
                        </InlineStack>
                        <RichTextEditor
                            value={recommendationsSettings.headerText}
                            onChange={(val) => update("headerText", val)}
                        />
                    </BlockStack>

                    {/* Shop now toggle */}
                    <Checkbox
                        label="Enable 'Shop now' button"
                        checked={recommendationsSettings.showShopNowButton}
                        onChange={(val) => update("showShopNowButton", val)}
                    />
                    {/* Button text */}

                    <>
                        <TextField
                            label="Edit button text"
                            value={recommendationsSettings.buttonText}
                            onChange={(val) => update("buttonText", val)}
                        />

                        <TextField
                            label="Edit button URL"
                            value={recommendationsSettings.buttonUrl}
                            onChange={(val) => update("buttonUrl", val)}
                        />
                    </>

                    <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="bodyMd" fontWeight="medium">
                                Product recommendations header text
                            </Text>
                            <Button
                                variant="plain"
                                onClick={() => update("productHeaderText", "")}
                            >
                                Clear
                            </Button>
                        </InlineStack>

                        <RichTextEditor
                            value={recommendationsSettings.productHeaderText}
                            onChange={(val) => update("productHeaderText", val)}
                        />
                    </BlockStack>

                    {/* Manual config button */}
                    <Button fullWidth variant="primary" onClick={() => setOpen(true)}>
                        Configure manual recommendations
                    </Button>

                    {/* Max recommendations */}
                    <TextField
                        label="Maximum number of recommendations to display"
                        type="number"
                        value={String(recommendationsSettings.maxRecommendations)}
                        onChange={(val) => update("maxRecommendations", Number(val))}
                    />

                    {/* Direction */}
                    <Select
                        label="Recommendation direction"
                        options={[
                            { label: "Block", value: "block" },
                            { label: "Carousel", value: "carousel" },
                        ]}
                        value={recommendationsSettings.layout}
                        onChange={(val) => update("layout", val)}
                    />
                    {recommendationsSettings.layout === "carousel" && (
                        <Select
                            label="Carousel indicator"
                            options={[
                                { label: "Progress bar", value: "progressBar" },
                                { label: "Buttons", value: "buttons" },
                                { label: "None", value: "none" },
                            ]}
                            value={recommendationsSettings.carouselIndicator || "progressBar"}
                            onChange={(val) => update("carouselIndicator", val)}
                        />
                    )}

                    <Divider />

                    <BlockStack gap="200">
                        <Text variant="bodyMd" fontWeight="semibold">Product reviews</Text>
                        <Checkbox
                            label="Show product reviews on recommendations"
                            helpText="Product reviews will also be shown on upsells"
                            checked={recommendationsSettings.showReviews}
                            onChange={(val) => update("showReviews", val)}
                        />
                        <TextField
                            label="Review count text"
                            value={recommendationsSettings.reviewCountText || '({{review_count}} reviews)'}
                            onChange={(val) => update("reviewCountText", val)}
                            helpText="Use {{review_count}} for the number of reviews"
                            autoComplete="off"
                            disabled={!recommendationsSettings.showReviews}
                        />
                        <Banner tone="info">
                            <InlineStack gap="100" blockAlign="center" wrap={false}>
                                <Text variant="bodyMd">
                                    This integration will only work with product review apps that allow the{" "}
                                    <Link url="https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/metafields" target="_blank">
                                        Shopify Storefront API to read product review data stored in metafields.
                                    </Link>
                                </Text>
                            </InlineStack>
                        </Banner>
                    </BlockStack>

                    <Modal
                        open={open}
                        onClose={() => setOpen(false)}
                        title="Select Products"
                        primaryAction={{
                            content: "Save",
                            onAction: () => {
                                handleChange("recommendationsSettings", (prev) => ({
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

                </LegacyStack>
            </LegacyCard>
        </div>
    );
}