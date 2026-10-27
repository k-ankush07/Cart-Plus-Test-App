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

export default function DiscountCode({ discountCodesSettings, handleChange }) {
  const [showLimitations, setShowLimitations] = useState(false);

  const update = (key, value) => {
    handleChange("discountCodesSettings", (prev) => ({
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

        {/* <Card>
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
            </Card> */}
      </BlockStack>
    </div>
  );
}
