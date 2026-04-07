import {
    Card,
    Text,
    BlockStack,
    Checkbox,
    Select,
    TextField,
    InlineStack,
    RangeSlider
} from "@shopify/polaris";
import ColorInput from "../ui/ColorInput";
import "../../../index.css";

export default function DesignSettings({ designSettings, setDesignSettings }) {

    const handleChange = (key, value) => {
        setDesignSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="mainContent">
            <Card>
                <BlockStack gap="400">
                    <Text variant="headingMd">Design</Text>
                    <BlockStack gap="200">
                        <Text variant="headingSm">General</Text>
                        <InlineStack>
                            <Checkbox
                                label="Inherit fonts from theme"
                                checked={designSettings.inheritFonts}
                                onChange={(value) => handleChange("inheritFonts", value)}
                            />
                        </InlineStack>
                        <InlineStack>
                            <Checkbox
                                label="Show strikethrough prices"
                                checked={designSettings.showStrikethrough}
                                onChange={(value) => handleChange("showStrikethrough", value)}
                            />
                        </InlineStack>
                        <InlineStack>
                            <Checkbox
                                label="Enable subtotal line"
                                checked={designSettings.enableSubtotal}
                                onChange={(value) => handleChange("enableSubtotal", value)}
                            />
                        </InlineStack>
                    </BlockStack>

                    <BlockStack gap="200">
                        <Text variant="headingSm">Cart width</Text>

                        <Select
                            label="Desktop"
                            options={[
                                { label: "Default", value: "default" },
                                { label: "Wide", value: "wide" },
                            ]}
                            value={designSettings.desktopWidth}
                            onChange={(value) =>
                                handleChange("desktopWidth", value)
                            }
                        />

                        {/* <Select
                            label="Mobile"
                            options={[{ label: "Full", value: "full" }]}
                            value="full"
                        /> */}
                    </BlockStack>

                    <BlockStack gap="200">
                        <Text variant="headingSm">Colors</Text>

                        <ColorInput
                            label="Background color"
                            value={designSettings.backgroundColor}
                            onChange={(val) => handleChange("backgroundColor", val)}
                        />
                        <ColorInput
                            label="Cart accent color"
                            value={designSettings.accentColor}
                            onChange={(val) => handleChange("accentColor", val)}
                        />
                        <ColorInput
                            label="Cart text color"
                            value={designSettings.textColor}
                            onChange={(val) => handleChange("textColor", val)}
                        />
                        <ColorInput
                            label="Savings text color"
                            value={designSettings.savingsColor}
                            onChange={(val) => handleChange("savingsColor", val)}
                        />
                        <ColorInput
                            label="Subtotal text color"
                            value={designSettings.subtotalColor}
                            onChange={(val) => handleChange("subtotalColor", val)}
                        />
                    </BlockStack>

                    <BlockStack gap="200">
                        <BlockStack gap="200">
                            <Text variant="bodyMd">Corner radius</Text>
                            <InlineStack align="center" gap="300">
                                <div style={{ width: "100px" }}>
                                    <TextField
                                        value={designSettings.buttonRadius}
                                        suffix="px"
                                        type="number"
                                        onChange={(val) => {
                                            let num = Number(val);

                                            if (isNaN(num)) num = 0;
                                            if (num > 40) num = 40;
                                            if (num < 0) num = 0;

                                            handleChange("buttonRadius", String(num));
                                        }}
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <RangeSlider
                                        value={Number(designSettings.buttonRadius || 0)}
                                        min={0}
                                        max={40}
                                        step={1}
                                        onChange={(val) =>
                                            handleChange("buttonRadius", String(val))
                                        }
                                    />
                                </div>
                            </InlineStack>
                        </BlockStack>
                        <ColorInput
                            label="Button color"
                            value={designSettings.buttonColor}
                            onChange={(val) => handleChange("buttonColor", val)}
                        />
                        <ColorInput
                            label="Button text color"
                            value={designSettings.buttonTextColor}
                            onChange={(val) => handleChange("buttonTextColor", val)}
                        />
                        <ColorInput
                            label="Button text hover color"
                            value={designSettings.buttonHoverColor}
                            onChange={(val) => handleChange("buttonHoverColor", val)}
                        />

                        <Checkbox
                            label=" Show continue shopping button"
                            checked={designSettings.continueshopping}
                            onChange={(val) => handleChange("continueshopping", val)}
                        />
                    </BlockStack>
                </BlockStack>
            </Card>
        </div>
    )
}
