import {
    Card,
    Text,
    Button,
    InlineStack,
    BlockStack,
    Checkbox,
} from "@shopify/polaris";
import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import RewardsCalculation from "../ui/Rewards-calculation";

export default function TieredRewards({ handleChange, rewardsSettings, products, hasNextPage, nextCursor, currency }) {

    const update = (key, value) => {
        handleChange("rewardsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <Card>
            <BlockStack gap="300">

                <InlineStack align="space-between">
                    <Text variant="headingMd">Tiered rewards</Text>

                    <Button
                        variant={rewardsSettings.enabled ? "primary" : "secondary"}
                        onClick={() => update("enabled", !rewardsSettings.enabled)}
                    >
                        {rewardsSettings.enabled ? "Enable" : "Disabled"}
                    </Button>
                </InlineStack>

                <Checkbox
                    label="Show rewards on empty cart"
                    checked={rewardsSettings.showOnEmptyCart}
                    onChange={(val) => update("showOnEmptyCart", val)}
                />

                <ColorInput
                    label="Bar background color"
                    value={rewardsSettings.backgroundColor}
                    onChange={(val) => update("backgroundColor", val)}
                />

                <ColorInput
                    label="Bar text color"
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
                <RewardsCalculation rewardsSettings={rewardsSettings}
                    handleChange={handleChange}
                    products={products}
                    hasNextPage={hasNextPage}
                    nextCursor={nextCursor}
                    currency={currency}
                />
            </BlockStack>
        </Card>
    );
}