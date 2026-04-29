import {
    Text,
    Button,
    InlineStack,
    BlockStack,
    RangeSlider,
    Badge,
    LegacyCard,
    LegacyStack,
    Box,
    Icon,
    Checkbox
} from "@shopify/polaris";

import {
    GiftCardIcon,             // Tiered rewards
} from "@shopify/polaris-icons";

import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import RewardsCalculation from "../ui/Rewards-calculation";

export default function TieredRewards({ handleChange, rewardsSettings, currency }) {

    const update = (key, value) => {
        handleChange("rewardsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="mainContent">
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={GiftCardIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Tiered rewards</Text>
                            </InlineStack>
                            <Box paddingInlineStart="200">
                                <Badge tone={rewardsSettings.enabled ? "critical" : "success"}>
                                    {rewardsSettings.enabled ? "Disabled" : "Active"}
                                </Badge>
                            </Box>
                        </InlineStack>
                        <InlineStack gap="200" />
                        <Button
                            variant={rewardsSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !rewardsSettings.enabled)}
                        >
                            {rewardsSettings.enabled ? "Enable" : "Disable"}
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>
            <Box paddingBlockEnd="400">
                <Text as="p" variant="bodySm">
                    Motivate customers with a rewards bar with tiers/levels to unlock.
                </Text>
            </Box>
            <LegacyCard sectioned title="General settings">
                <LegacyStack vertical spacing="tight">
                    <InlineStack>
                        <Checkbox
                            label="Show rewards on empty cart"
                            checked={rewardsSettings.showOnEmptyCart}
                            onChange={(val) => update("showOnEmptyCart", val)}
                        />
                    </InlineStack>
                    <BlockStack gap="300">
                        <ColorInput
                            label="Bar background color"
                            value={rewardsSettings.backgroundColor}
                            onChange={(val) => update("backgroundColor", val)}
                        />

                        <ColorInput
                            label="Bar foreground color"
                            value={rewardsSettings.textColor}
                            onChange={(val) => update("textColor", val)}
                        />
                        <ColorInput
                            label="Complete reward tier icon color"
                            value={rewardsSettings.completeIconColor}
                            onChange={(val) => update("completeIconColor", val)}
                        />

                        <ColorInput
                            label="Incomplete reward tier icon color"
                            value={rewardsSettings.incompleteIconColor}
                            onChange={(val) => update("incompleteIconColor", val)}
                        />
                    </BlockStack>
                    <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="bodyMd" fontWeight="medium">
                                Text after completing full rewards bar
                            </Text>
                            <Button
                                variant="plain"
                                onClick={() => update("successText", "")}
                            >
                                Clear
                            </Button>
                        </InlineStack>

                        <RichTextEditor
                            value={rewardsSettings.successText}
                            onChange={(val) => update("successText", val)}
                        />
                    </BlockStack>
                    <InlineStack gap="200" align="start">

                        <Box width="100%">
                            <RangeSlider
                                label="Bar Length"
                                value={rewardsSettings.barLength || 2}
                                onChange={(val) => update("barLength", val)}
                                min={2}
                                max={16}
                                step={1}
                                prefix={<Text>2px</Text>}
                                suffix={<Text>16px</Text>}
                                output
                            />
                        </Box>

                        <Box width="100%">
                            <RangeSlider
                                label="Bar Gap"
                                value={rewardsSettings.barGap || 0}
                                onChange={(val) => update("barGap", val)}
                                min={0}
                                max={20}
                                step={1}
                                prefix={<Text>0px</Text>}
                                suffix={<Text>20px</Text>}
                                output
                            />
                        </Box>

                    </InlineStack>
                </LegacyStack>
            </LegacyCard>

            <RewardsCalculation rewardsSettings={rewardsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        </div>
    );
}