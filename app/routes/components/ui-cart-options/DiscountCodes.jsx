import { useState } from "react";
import {
    Badge,
    Banner,
    BlockStack,
    Button,
    Card,
    Collapsible,
    Divider,
    InlineStack,
    Link,
    Text,
    TextField,
} from "@shopify/polaris";

export default function DiscountCodes({ discountCodesSettings, handleChange }) {
    const [showLimitations, setShowLimitations] = useState(false);

    const update = (key, value) => {
        handleChange("discountCodesSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <BlockStack gap="400">
            <Card>
                <BlockStack gap="300">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack gap="200" align="center">
                            <Text variant="headingMd">Discount codes</Text>

                            <Badge tone={discountCodesSettings.enabled ? "critical" : "success"}>
                                {discountCodesSettings.enabled ? "Disabled" : "Active"}
                            </Badge>
                        </InlineStack>
                        <Button
                            variant={discountCodesSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !discountCodesSettings.enabled)}
                        >
                            {discountCodesSettings.enabled ? "Enabled" : "Disabled"}
                        </Button>
                    </InlineStack>

                    <Divider />

                    <TextField
                        label="Discount input placeholder"
                        value={discountCodesSettings.placeholder}
                        onChange={(val) => update("placeholder", val)}
                        autoComplete="off"
                    />

                    <TextField
                        label="Discount apply button text"
                        value={discountCodesSettings.buttonText}
                        onChange={(val) => update("buttonText", val)}
                        autoComplete="off"
                    />

                    <Banner tone="warning">
                        <BlockStack gap="200">
                            <Text variant="bodyMd" fontWeight="semibold">Discount limitations</Text>
                            <Text variant="bodySm">
                                Upcart is not able to support all discount functionality available in checkout. Please review the following limitations.
                            </Text>
                            <Collapsible open={showLimitations} id="discount-limitations">
                                <BlockStack gap="100">
                                    <Text variant="bodySm">• Buy X Get Y discounts are not supported</Text>
                                    <Text variant="bodySm">• Free shipping discounts may not apply correctly</Text>
                                    <Text variant="bodySm">• Some automatic discounts may not stack with code discounts</Text>
                                    <Text variant="bodySm">• Discounts requiring minimum purchase amounts may behave differently</Text>
                                </BlockStack>
                            </Collapsible>
                            <div>
                                <Button
                                    variant="plain"
                                    onClick={() => setShowLimitations((v) => !v)}
                                >
                                    {showLimitations ? "Show less" : "Show more"}
                                </Button>
                            </div>
                        </BlockStack>
                    </Banner>
                </BlockStack>
            </Card>

            <Card>
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
            </Card>
        </BlockStack>
    );
}
