import { useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Collapsible,
  InlineStack,
  Text,
  TextField,
  Box,
  Icon,
} from "@shopify/polaris";
import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import { DISCOUNT_TEMPLATES } from "../utils/discountTemplates";
import IconLibrary from "../ui/IconLibrary";

// a labelled rich-text field
const Field = ({ label, value, onChange, helpText }) => (
  <BlockStack gap="100">
    <Text variant="bodyMd" fontWeight="medium">
      {label}
    </Text>
    <RichTextEditor value={value} onChange={onChange} />
    {helpText && (
      <Text variant="bodySm" tone="subdued">
        {helpText}
      </Text>
    )}
  </BlockStack>
);

import {
  DiscountIcon, // Discount codes
} from "@shopify/polaris-icons";

export default function DiscountCode({
  discountCodesSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
  const [showLimitations, setShowLimitations] = useState(false);

  const update = (key, value) => {
    handleChange("discountCodesSettings", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyTemplate = (key) => {
    const { label, ...settings } = DISCOUNT_TEMPLATES[key];
    handleChange("discountCodesSettings", (prev) => ({
      ...prev,
      template: key,
      showOfferBox: true,
      ...settings,
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
                <Icon source={DiscountIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Discount Code
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
            <button
              type="button"
              role="switch"
              aria-checked={!discountCodesSettings.enabled}
              aria-label="Discount Code"
              className={`sb-switch ${
                !discountCodesSettings.enabled ? "is-on" : ""
              }`}
              onClick={() => update("enabled", !discountCodesSettings.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>

      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Template
            </Text>
            <InlineStack gap="200" wrap>
              <Button
                pressed={!discountCodesSettings.template}
                onClick={() => update("template", "")}
              >
                Classic
              </Button>
              {Object.entries(DISCOUNT_TEMPLATES).map(([key, t]) => (
                <Button
                  key={key}
                  pressed={discountCodesSettings.template === key}
                  onClick={() => applyTemplate(key)}
                >
                  {t.label}
                </Button>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>

        {discountCodesSettings.template && (
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Customize template
              </Text>
              <TextField
                label="Heading"
                autoComplete="off"
                value={discountCodesSettings.heading ?? ""}
                onChange={(v) => update("heading", v)}
              />
              <TextField
                label="Sub text"
                autoComplete="off"
                value={discountCodesSettings.subtitle ?? ""}
                onChange={(v) => update("subtitle", v)}
              />
              <TextField
                label="View all link text"
                autoComplete="off"
                value={discountCodesSettings.linkText ?? ""}
                onChange={(v) => update("linkText", v)}
              />
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Icon
                </Text>
                <IconLibrary
                  value={discountCodesSettings.icon}
                  onChange={(icon) => update("icon", icon)}
                  quickIcons={[
                    "discount",
                    "percent",
                    "gift",
                    "star",
                    "fire",
                    "crown",
                    "truck",
                    "cart",
                  ]}
                  shop={shop}
                  accessToken={accessToken}
                  apiUrl={apiUrl}
                />
                <ColorInput
                  label="Icon color"
                  value={
                    discountCodesSettings.iconColor ??
                    discountCodesSettings.accent ??
                    "#0a7d3b"
                  }
                  onChange={(v) => update("iconColor", v)}
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  Double-click the selected icon to reset it to the default.
                </Text>
              </BlockStack>
              {discountCodesSettings.template === "popular_codes" && (
                <TextField
                  label="Popular codes"
                  autoComplete="off"
                  helpText="Comma separated"
                  value={discountCodesSettings.popularCodes ?? ""}
                  onChange={(v) => update("popularCodes", v)}
                />
              )}
              <ColorInput
                label="Background"
                value={discountCodesSettings.bg ?? "#ffffff"}
                onChange={(v) => update("bg", v)}
              />
              <ColorInput
                label="Text color"
                value={discountCodesSettings.textColor ?? "#1a1a1a"}
                onChange={(v) => update("textColor", v)}
              />
              <ColorInput
                label="Button / accent color"
                value={discountCodesSettings.accent ?? "#0a7d3b"}
                onChange={(v) => update("accent", v)}
              />
              <TextField
                label="Border radius (px)"
                type="number"
                autoComplete="off"
                value={String(discountCodesSettings.radius ?? 12)}
                onChange={(v) =>
                  update("radius", Math.min(40, Math.max(0, Number(v) || 0)))
                }
              />
            </BlockStack>
          </Card>
        )}
        <Card>
          <BlockStack gap="300">
            {/* Checkbox — Show Offer Box */}
            <InlineStack>
              <Checkbox
                label="Show Discount Code Title"
                checked={discountCodesSettings.showTitle ?? false}
                onChange={(val) => update("showTitle", val)}
              />
            </InlineStack>

            {discountCodesSettings.showTitle && (
              <Field
                label="Discount Code Title"
                value={discountCodesSettings.title}
                onChange={(val) => update("title", val)}
              />
            )}

            <TextField
              label="Discount input placeholder"
              value={discountCodesSettings.placeholder}
              onChange={(val) => update("placeholder", val)}
              autoComplete="off"
            />

            <Field
              label="Discount apply button text"
              value={discountCodesSettings.buttonText}
              onChange={(val) => update("buttonText", val)}
            />

            <Field
              label="Invalid code message"
              value={discountCodesSettings.invalidCodeMessage ?? ""}
              onChange={(val) => update("invalidCodeMessage", val)}
              helpText="Shown below the input when the customer enters a code that does not exist or cannot be applied."
            />

            {/* Checkbox — Show Offer Box */}
            <InlineStack>
              <Checkbox
                label="Show All Discount code"
                checked={discountCodesSettings.showOfferBox ?? false}
                onChange={(val) => update("showOfferBox", val)}
              />
            </InlineStack>

            <ColorInput
              label="Coupon Heading Text Color"
              value={discountCodesSettings.couponHeadingColor ?? "#000000"}
              onChange={(val) => update("couponHeadingColor", val)}
              autoComplete="off"
            />
            {discountCodesSettings.showOfferBox && (
              <BlockStack gap="300">
                <ColorInput
                  label="View All Offers Text Color"
                  value={discountCodesSettings.viewAllOffersColor ?? "#000000"}
                  onChange={(val) => update("viewAllOffersColor", val)}
                />
                <ColorInput
                  label="View All Offers Background Color"
                  value={
                    discountCodesSettings.viewAllOffersBgColor ?? "#ffffff"
                  }
                  onChange={(val) => update("viewAllOffersBgColor", val)}
                />
              </BlockStack>
            )}

            <ColorInput
              label="Offer Background Color"
              value={discountCodesSettings.showOfferBgColor ?? "#000000"}
              onChange={(val) => update("showOfferBgColor", val)}
              autoComplete="off"
            />

            <Banner tone="warning">
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="semibold">
                  Discount limitations
                </Text>
                <Text variant="bodySm">
                  Cart Plus is not able to support all discount functionality
                  available in checkout. Please review the following
                  limitations.
                </Text>
                <Collapsible open={showLimitations} id="discount-limitations">
                  <BlockStack gap="100">
                    <Text variant="bodySm">
                      • Buy X Get Y discounts are not supported
                    </Text>
                    <Text variant="bodySm">
                      • Free shipping discounts may not apply correctly
                    </Text>
                    <Text variant="bodySm">
                      • Some automatic discounts may not stack with code
                      discounts
                    </Text>
                    <Text variant="bodySm">
                      • Discounts requiring minimum purchase amounts may behave
                      differently
                    </Text>
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
      </BlockStack>
    </div>
  );
}
