import {
  LegacyCard,
  LegacyStack,
  Text,
  Checkbox,
  RadioButton,
  Select,
  TextField,
  InlineStack,
  BlockStack,
  Box,
  Icon,
  RangeSlider,
  Card,
} from "@shopify/polaris";
import { PaintBrushFlatIcon } from "@shopify/polaris-icons";
import ColorInput from "../ui/ColorInput";
import { CUSTOM_FONTS, resolveCustomFont } from "../utils/fonts";
import "../../../index.css";

export default function Appearance({
  designSettings,
  setDesignSettings,
  themed = false,
}) {
  const handleChange = (key, value) => {
    setDesignSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="mainContent">
      {/* Page heading — matches reference HTML exactly */}
      {!themed && (
        <Box paddingBlockEnd="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack blockAlign="center" gap="100">
                <Box>
                  <Icon source={PaintBrushFlatIcon} />
                </Box>
                <InlineStack gap="200">
                  <Text variant="headingMd" as="h2">
                    Appearance
                  </Text>
                </InlineStack>
              </InlineStack>
              <InlineStack gap="200" />
            </InlineStack>
          </BlockStack>
        </Box>
      )}

      {/* CARD 1 — General + Cart width */}
      <Box paddingBlockEnd="400">
        <Card>
          <BlockStack gap="500">
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="semibold">
                Fonts
              </Text>
              <InlineStack gap="400">
                <RadioButton
                  label="Use theme fonts"
                  name="cart-font-mode"
                  checked={!!designSettings.inheritFonts}
                  onChange={() => handleChange("inheritFonts", true)}
                />
                <RadioButton
                  label="Custom font"
                  name="cart-font-mode"
                  checked={!designSettings.inheritFonts}
                  onChange={() => handleChange("inheritFonts", false)}
                />
              </InlineStack>
              {!designSettings.inheritFonts && (
                <Box paddingBlockStart="200">
                  <Select
                    label="Font family"
                    labelHidden
                    options={CUSTOM_FONTS.map((f) => ({ label: f, value: f }))}
                    value={resolveCustomFont(designSettings.customFont)}
                    onChange={(value) => handleChange("customFont", value)}
                  />
                </Box>
              )}
              {/* <Checkbox
              label="Show compare-at prices"
              checked={designSettings.showStrikethrough}
              onChange={(value) => handleChange("showStrikethrough", value)}
            /> */}
            </BlockStack>
            <BlockStack gap="100">
              <Text variant="headingSm" as="p">
                Cart width
              </Text>
              <InlineStack align="space-between" gap="300" wrap={false}>
                <div style={{ width: "100%" }}>
                  <Select
                    label="Desktop"
                    options={[
                      { label: "Default", value: "base" },
                      { label: "Wide", value: "wide" },
                    ]}
                    value={designSettings.desktopWidth}
                    onChange={(value) => handleChange("desktopWidth", value)}
                  />
                </div>
                <div style={{ width: "100%" }}>
                  <Select
                    label="Mobile"
                    options={[
                      { label: "Full", value: "full" },
                      { label: "Nearly full", value: "fullWithGap" },
                    ]}
                    value={designSettings.mobileWidth}
                    onChange={(value) => handleChange("mobileWidth", value)}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </Box>

      {/* CARD 2 — Colors (replaced by Template colors when themed) */}
      {!themed && (
        <LegacyCard sectioned title="Colors">
          <LegacyStack vertical spacing="tight">
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
              label="Discount badge color"
              value={designSettings.discountBageColor || "#1e7e34"}
              onChange={(val) => handleChange("discountBageColor", val)}
            />

            <ColorInput
              label="Icon color"
              value={designSettings.iconColor || "#ABABAB"}
              onChange={(val) => handleChange("iconColor", val)}
            />

            <ColorInput
              label="Estimated text color"
              value={designSettings.subtotalColor}
              onChange={(val) => handleChange("subtotalColor", val)}
            />
          </LegacyStack>
        </LegacyCard>
      )}

      {/* CARD 3 — Button settings */}
      {/* <LegacyCard sectioned title="Button settings">
        <BlockStack gap="200">
          {!themed && (
            <BlockStack gap="0">
              <div className="Polaris-Label">
                <label className="Polaris-Label__Text">Corner radius</label>
              </div>
              <InlineStack align="space-between" gap="300" wrap={false}>
                <div style={{ minWidth: "96px" }}>
                  <TextField
                    value={designSettings.buttonRadius}
                    suffix="px"
                    type="number"
                    min={0}
                    max={40}
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
                <div
                  className="styles_ButtonRadiusWrapper_ltYpX"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "80%",
                    marginLeft: "12px",
                  }}
                >
                  <div className="styles_ButtonRadiusIcon__ZFqx_">
                    <svg
                      viewBox="0 0 20 20"
                      style={{ width: 20, height: 20 }}
                      focusable="false"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.25 5a.25.25 0 0 0-.25.25v10.5a.75.75 0 0 1-1.5 0v-10.5c0-.966.784-1.75 1.75-1.75h10.5a.75.75 0 0 1 0 1.5h-10.5Z"
                      />
                    </svg>
                  </div>
                  <div style={{ width: "90%" }}>
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
                  <div className="styles_ButtonRadiusIcon__ZFqx_">
                    <svg
                      viewBox="0 0 20 20"
                      style={{ width: 20, height: 20 }}
                      focusable="false"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.25 5a7.25 7.25 0 0 0-7.25 7.25v3.5a.75.75 0 0 1-1.5 0v-3.5a8.75 8.75 0 0 1 8.75-8.75h3.5a.75.75 0 0 1 0 1.5h-3.5Z"
                      />
                    </svg>
                  </div>
                </div>
              </InlineStack>
            </BlockStack>
          )}

          {!themed && (
            <>
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
            </>
          )}

          <Checkbox
            label="Show continue shopping button"
            checked={designSettings.continueshopping}
            onChange={(val) => handleChange("continueshopping", val)}
          />
        </BlockStack>
      </LegacyCard> */}
    </div>
  );
}
