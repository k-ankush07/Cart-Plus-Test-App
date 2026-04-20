import {
    Card,
    Text,
    Button,
    InlineStack,
    BlockStack,
    Checkbox,
    Badge,
    RangeSlider
} from "@shopify/polaris";
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
        <Card>
            <BlockStack gap="300">
                <InlineStack gap="300" align="space-between" blockAlign="center">
                    <InlineStack gap="200" align="center">
                        <Text variant="headingMd">Tiered rewards</Text>

                        <Badge tone={rewardsSettings.enabled ? "critical" : "success"}>
                            {rewardsSettings.enabled ? "Disabled" : "Active"}
                        </Badge>
                    </InlineStack>
                    <Button
                        variant={rewardsSettings.enabled ? "primary" : "secondary"}
                        onClick={() => update("enabled", !rewardsSettings.enabled)}
                    >
                        {rewardsSettings.enabled ? "Enable" : "Disabled"}
                    </Button>
                </InlineStack>
                <InlineStack>
                    <Checkbox
                        label="Show rewards on empty cart"
                        checked={rewardsSettings.showOnEmptyCart}
                        onChange={(val) => update("showOnEmptyCart", val)}
                    />
                </InlineStack>

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

                <div>
                    <RichTextEditor
                        value={rewardsSettings.successText}
                        onChange={(val) => update("successText", val)}
                    />
                </div>

                <InlineStack align="space-between">
                    <Text>Bar Length</Text>
                    <Text>{rewardsSettings.barLength || 2}px</Text>
                </InlineStack>
                <RangeSlider
                    value={rewardsSettings.barLength || 2}
                    onChange={(val) => update("barLength", val)}
                    min={2}
                    max={16}
                    step={2}
                />

                <InlineStack align="space-between">
                    <Text>Bar Gap</Text>
                    <Text>{rewardsSettings.barGap || 0}px</Text>
                </InlineStack>

                <RangeSlider
                    value={rewardsSettings.barGap || 0}
                    onChange={(val) => update("barGap", val)}
                    min={0}
                    max={20}
                    step={1}
                />

                <RewardsCalculation rewardsSettings={rewardsSettings}
                    handleChange={handleChange}
                    currency={currency}
                />
            </BlockStack>
        </Card>
    );
}