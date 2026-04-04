import {
    Card,
    Text,
    Button,
    InlineStack,
    BlockStack,
    Checkbox,
    TextField,
    Select,
    Modal,

} from "@shopify/polaris";

import ProductItemCollections from "../ui/ProductItem-Collections";
import RichTextEditor from "../ui/RichTextEditor";
import { useState } from "react";

export default function Recommendations({ recommendationsSettings, handleChange, currency }) {

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(
        recommendationsSettings.selectedProducts || []
    );

    const update = (key, value) => {
        handleChange("recommendationsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <Card>
            <BlockStack gap="400">

                {/* Header */}
                <InlineStack align="space-between">
                    <Text variant="headingMd">Recommendations</Text>

                    <Button
                        variant={recommendationsSettings.enabled ? "primary" : "secondary"}
                        onClick={() => update("enabled", !recommendationsSettings.enabled)}
                    >
                        {recommendationsSettings.enabled ? "Disable" : "Enable"}
                    </Button>
                </InlineStack>

                <Text variant="bodySm" tone="subdued">
                    Displays only on an empty cart.
                </Text>

                {/* Header text */}
                <BlockStack gap="200">
                    <Text fontWeight="medium">Edit header text</Text>
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

                {/* Product header */}
                <BlockStack gap="200">
                    <InlineStack align="space-between">
                        <Text fontWeight="medium">
                            Product recommendations header text
                        </Text>
                        <Button
                            plain
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

                <Checkbox
                    label="Show product reviews on recommendations"
                    helpText="Product reviews will also be shown on upsells"
                    checked={recommendationsSettings.showReviews}
                    onChange={(val) => update("showReviews", val)}
                />

                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    title="Select Products"
                    primaryAction={{
                        content: "Save",
                        onAction: () => {
                            update("selectedProducts", selected);
                            setOpen(false);
                        },
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
                                    console.log("SELECTED DATA 👉", data);
                                    setSelected(data);
                                }}
                            />
                        </div>
                    </Modal.Section>
                </Modal>

            </BlockStack>
        </Card>
    );
}