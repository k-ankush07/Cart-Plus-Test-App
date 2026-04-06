import {
    Card,
    Text,
    BlockStack,
    Checkbox,
    TextField,
    InlineStack,
    Button,
    Badge,
} from "@shopify/polaris";
import "../../../index.css";

export default function SubscriptionUpgrades({ subscriptionUpgradesSettings, handleChange }) {

    const update = (key, value) => {
        handleChange("subscriptionUpgradesSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between">
                    <Text variant="headingMd">Recommendations</Text>

                    <Button
                        variant={subscriptionUpgradesSettings.enabled ? "primary" : "secondary"}
                        onClick={() => update("enabled", !subscriptionUpgradesSettings.enabled)}
                    >
                        {subscriptionUpgradesSettings.enabled ? "Enable" : "Disabled"}
                    </Button>
                </InlineStack>

                <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="medium">Button text</Text>
                    <TextField
                        value={subscriptionUpgradesSettings.buttonText}
                        onChange={(val) => update("buttonText", val)}
                        autoComplete="off"
                    />
                    <Text variant="bodySm" tone="subdued">
                        Use {`{{selling_plan_group_name}}`} to show the name of the selling plan. Preview uses 'Subscribe &amp; Save 20%' as the selling plan group name.
                    </Text>
                </BlockStack>

                <BlockStack gap="100">
                    <Checkbox
                        label="Override subscription plan options text"
                        helpText="Customize the text that appears in the dropdown menu for each subscription plan"
                        checked={subscriptionUpgradesSettings.overridePlanOptionsText}
                        onChange={(val) => update("overridePlanOptionsText", val)}
                    />
                </BlockStack>

                {subscriptionUpgradesSettings.overridePlanOptionsText && (
                    <>
                        <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="medium">Subscription plan options text</Text>
                            <TextField
                                value={subscriptionUpgradesSettings.planOptionsText}
                                onChange={(val) => update("planOptionsText", val)}
                                autoComplete="off"
                            />
                            <Text variant="bodySm" tone="critical">
                                The variables {`{{selling_plan_group_name}}`} / {`{{selling_plan_name}}`} will be replaced with the 'subscription group name' and the 'subscription plan name' of the product, respectively. If the field is empty, the default subscription group and plan names will be used
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="medium">Subscription plan options one-time purchase text</Text>
                            <TextField
                                value={subscriptionUpgradesSettings.planOptionsOneTimePurchaseText}
                                onChange={(val) => update("planOptionsOneTimePurchaseText", val)}
                                autoComplete="off"
                            />
                            <Text variant="bodySm" tone="subdued">
                                Override the text that appears in the dropdown menu for one-time purchase.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="medium">Subscription plan full price text</Text>
                            <TextField
                                value={subscriptionUpgradesSettings.planFullPriceText}
                                onChange={(val) => update("planFullPriceText", val)}
                                autoComplete="off"
                            />
                            <Text variant="bodySm" tone="subdued">
                                Text used to indicate the full (non-discounted) price in the subscription options.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="medium">Subscription plans heading text</Text>
                            <TextField
                                value={subscriptionUpgradesSettings.planHeadingText}
                                onChange={(val) => update("planHeadingText", val)}
                                autoComplete="off"
                            />
                            <Text variant="bodySm" tone="critical">
                                Heading text used above subscription plan choices (e.g. 'Subscription plans').
                            </Text>
                        </BlockStack>
                    </>
                )}

                <BlockStack gap="100">
                    <Checkbox
                        label="Prevent downgrades"
                        helpText="If enabled, customers will not be allowed to downgrade from a subscription to one-time purchase. Caution: May increase cart abandonment."
                        checked={subscriptionUpgradesSettings.preventDowngrades}
                        onChange={(val) => update("preventDowngrades", val)}
                    />
                </BlockStack>
            </BlockStack>
        </Card>
    );
}
