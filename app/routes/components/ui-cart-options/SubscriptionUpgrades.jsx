import {
  Card,
  Text,
  Button,
  ButtonGroup,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  RangeSlider,
  Badge,
  LegacyCard,
  LegacyStack,
  Box,
  Icon,
  Divider,
  DropZone,
  ProgressBar,
  Checkbox,
} from "@shopify/polaris";

import {
  RefreshIcon, // Subscription upgrades
} from "@shopify/polaris-icons";

import "../../../index.css";

export default function SubscriptionUpgrades({
  subscriptionUpgradesSettings,
  handleChange,
}) {
  const update = (key, value) => {
    handleChange("subscriptionUpgradesSettings", (prev) => ({
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
                <Icon source={RefreshIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Upgrade subscription
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />

            <button
              type="button"
              role="switch"
              aria-checked={!subscriptionUpgradesSettings.enabled}
              aria-label="Subscription Upgrade"
              className={`sb-switch ${!subscriptionUpgradesSettings.enabled ? "is-on" : ""}`}
              onClick={() =>
                update("enabled", !subscriptionUpgradesSettings.enabled)
              }
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>
      <LegacyCard sectioned>
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="medium">
              Button text
            </Text>
            <TextField
              value={subscriptionUpgradesSettings.buttonText}
              onChange={(val) => update("buttonText", val)}
              autoComplete="off"
            />
            <Text variant="bodySm" tone="subdued">
              Use {`{{selling_plan_group_name}}`} to display the selling plan
              name. Preview uses “Subscribe & Save 20%” as the selling plan
              name.
            </Text>
          </BlockStack>

          <BlockStack gap="100">
            <Checkbox
              label="Customize Subscription Plan Option Text"
              helpText="Set custom text for each subscription plan option displayed in the dropdown menu."
              checked={subscriptionUpgradesSettings.overridePlanOptionsText}
              onChange={(val) => update("overridePlanOptionsText", val)}
            />
          </BlockStack>

          {subscriptionUpgradesSettings.overridePlanOptionsText && (
            <>
              <BlockStack gap="100">
                <Text variant="bodyMd" fontWeight="medium">
                  Subscription plan options text
                </Text>
                <TextField
                  value={subscriptionUpgradesSettings.planOptionsText}
                  onChange={(val) => update("planOptionsText", val)}
                  autoComplete="off"
                />
                <Box paddingBlockEnd="400">
                  <Text variant="bodyMd" tone="subdued">
                    The variables {`{{selling_plan_group_name}}`} and{" "}
                    {`{{selling_plan_name}}`} are replaced with the product’s
                    subscription group name and subscription plan name. If
                    empty, default names will be used.
                  </Text>
                </Box>
              </BlockStack>

              <BlockStack gap="100">
                <Text variant="bodyMd" fontWeight="medium">
                  One-Time Purchase subscription plan text
                </Text>
                <TextField
                  value={
                    subscriptionUpgradesSettings.planOptionsOneTimePurchaseText
                  }
                  onChange={(val) =>
                    update("planOptionsOneTimePurchaseText", val)
                  }
                  autoComplete="off"
                />
                <Text variant="bodySm" tone="subdued">
                  Customize the text that appears in the dropdown menu for
                  one-time purchase.
                </Text>
              </BlockStack>

              <BlockStack gap="100">
                <Text variant="bodyMd" fontWeight="medium">
                  Full price Subscription plan text
                </Text>
                <TextField
                  value={subscriptionUpgradesSettings.planFullPriceText}
                  onChange={(val) => update("planFullPriceText", val)}
                  autoComplete="off"
                />
                <Text variant="bodySm" tone="subdued">
                  Text shown for the original subscription price before any
                  discount is applied.
                </Text>
              </BlockStack>

              <BlockStack gap="100">
                <Text variant="bodyMd" fontWeight="medium">
                  Subscription plans heading text
                </Text>
                <TextField
                  value={subscriptionUpgradesSettings.planHeadingText}
                  onChange={(val) => update("planHeadingText", val)}
                  autoComplete="off"
                />
                <Box paddingBlockEnd="0">
                  <Text variant="bodyMd" tone="subdued">
                    Text displayed as the heading above the subscription plans.
                  </Text>
                </Box>
              </BlockStack>
            </>
          )}
          {/* <BlockStack gap="100">
                        <Checkbox
                            label="Prevent downgrades"
                            helpText="If enabled, customers will not be allowed to downgrade from a subscription to one-time purchase. Caution: May increase cart abandonment."
                            checked={subscriptionUpgradesSettings.preventDowngrades}
                            onChange={(val) => update("preventDowngrades", val)}
                        />
                    </BlockStack> */}
        </LegacyStack>
      </LegacyCard>
    </div>
  );
}
