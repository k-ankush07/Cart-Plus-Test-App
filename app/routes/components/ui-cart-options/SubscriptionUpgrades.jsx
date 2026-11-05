import {
  Text,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  LegacyCard,
  LegacyStack,
  Box,
  Icon,
  Checkbox,
  Button,
  RangeSlider,
} from "@shopify/polaris";
import ColorInput from "../ui/ColorInput";
import {
  backgroundToCss,
  useTemplateBackground,
} from "../utils/background";

import {
  RefreshIcon, // Subscription upgrades
} from "@shopify/polaris-icons";
import {
  SUBSCRIPTION_TEMPLATES,
  DEFAULT_SUBSCRIBE_LABEL,
} from "../utils/subscriptionTemplates";

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

  // A saved template that no longer exists (e.g. the removed "Radio" / "Toggle blue")
  // is shown as the closest remaining one, so the picker always highlights a template.
  const savedKey = subscriptionUpgradesSettings.template || "default";
  const activeKey = SUBSCRIPTION_TEMPLATES[savedKey]
    ? savedKey
    : (Object.keys(SUBSCRIPTION_TEMPLATES).find(
        (k) =>
          SUBSCRIPTION_TEMPLATES[k].layout ===
          subscriptionUpgradesSettings.layout,
      ) ?? "default");
  const activeLayout =
    subscriptionUpgradesSettings.layout ??
    SUBSCRIPTION_TEMPLATES[activeKey].layout;

  // value of a template field: what the user set, else the template's own value
  const tpl = SUBSCRIPTION_TEMPLATES[activeKey] || SUBSCRIPTION_TEMPLATES.default;
  const field = (k) => subscriptionUpgradesSettings[k] ?? tpl[k];
  // Default template follows the theme (Template tab) until a colour is picked
  const themeBg = useTemplateBackground();
  const themeCss = backgroundToCss(themeBg);
  const isDefaultTpl = activeKey === "default";
  const hasOverride = ["accent", "accentText", "radius"].some(
    (k) => subscriptionUpgradesSettings[k] != null,
  );

  const applyTemplate = (key) => {
    const { label, ...fields } = SUBSCRIPTION_TEMPLATES[key];
    handleChange("subscriptionUpgradesSettings", (prev) => ({
      ...prev,
      template: key,
      ...fields,
    }));
  };

  return (
    <div className="mainContent">
      {/* Page heading */}
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

      {/* Templates */}
      <LegacyCard sectioned title="Template">
        <InlineGrid columns={2} gap="200">
          {Object.entries(SUBSCRIPTION_TEMPLATES).map(([key, t]) => {
            const accent = t.accent ?? "#1a56db";
            return (
              <button
                key={key}
                type="button"
                aria-pressed={activeKey === key}
                onClick={() => applyTemplate(key)}
                style={{
                  padding: 10,
                  border: `2px solid ${activeKey === key ? "#303030" : "#e1e3e5"}`,
                  borderRadius: 10,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {t.layout === "button" && (
                  <span
                    style={{
                      display: "block",
                      padding: "7px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      borderRadius: 6,
                      background:
                        themeCss || "linear-gradient(135deg,#1a56db,#7db3f8)",
                    }}
                  >
                    Upgrade
                  </span>
                )}
                {t.layout === "toggle" && (
                  <span
                    style={{
                      display: "flex",
                      gap: 3,
                      padding: 3,
                      background: t.trackBg,
                      borderRadius: Math.min(t.radius, 14),
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        fontSize: 9,
                        fontWeight: 700,
                        color: t.accentText,
                        background: accent,
                        borderRadius: Math.min(t.radius, 14),
                      }}
                    >
                      Subscribe
                    </span>
                    <span
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        fontSize: 9,
                        color: t.trackText,
                      }}
                    >
                      One-time
                    </span>
                  </span>
                )}
                {t.layout === "radio" && (
                  <span style={{ display: "grid", gap: 4 }}>
                    {["Subscribe", "One-time"].map((x, i) => (
                      <span
                        key={x}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 6px",
                          fontSize: 9,
                          border: `1.5px solid ${i === 0 ? accent : "#e5e7eb"}`,
                          borderRadius: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            border: `2px solid ${i === 0 ? accent : "#9ca3af"}`,
                          }}
                        />
                        {x}
                      </span>
                    ))}
                  </span>
                )}
                {/* <span style={{ display: "block", marginTop: 6, fontSize: 12 }}>
                  {t.label}
                </span> */}
              </button>
            );
          })}
        </InlineGrid>
      </LegacyCard>

      {/* Customize the chosen template */}
      <LegacyCard sectioned title="Customize template">
        <BlockStack gap="300">
          {isDefaultTpl && (
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodySm" tone="subdued">
                Follows your theme colors until you pick your own.
              </Text>
              {hasOverride && (
                <Button
                  variant="plain"
                  onClick={() =>
                    handleChange("subscriptionUpgradesSettings", (prev) => ({
                      ...prev,
                      accent: null,
                      accentText: null,
                      radius: null,
                    }))
                  }
                >
                  Use theme colors
                </Button>
              )}
            </InlineStack>
          )}
          <InlineGrid columns={2} gap="400">
            <ColorInput
              label={activeLayout === "button" ? "Button color" : "Active color"}
              value={field("accent") ?? "#1a56db"}
              onChange={(val) => update("accent", val)}
            />
            <ColorInput
              label={activeLayout === "button" ? "Button text" : "Active text"}
              value={field("accentText") ?? "#ffffff"}
              onChange={(val) => update("accentText", val)}
            />
            {activeLayout !== "button" && (
              <>
                <ColorInput
                  label="Background"
                  value={field("trackBg")}
                  onChange={(val) => update("trackBg", val)}
                />
                <ColorInput
                  label="Inactive text"
                  value={field("trackText")}
                  onChange={(val) => update("trackText", val)}
                />
              </>
            )}
          </InlineGrid>
          <RangeSlider
            label="Corner radius"
            min={0}
            max={30}
            output
            value={Number(field("radius") ?? 8)}
            suffix={<Text as="span">{Number(field("radius") ?? 8)} px</Text>}
            onChange={(val) => update("radius", val)}
          />
        </BlockStack>
      </LegacyCard>

      {/* Settings */}
      <LegacyCard sectioned>
        <LegacyStack vertical spacing="tight">
          {activeLayout === "button" ? (
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
          ) : (
            <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="medium">
                Subscribe option text
              </Text>
              <TextField
                value={
                  subscriptionUpgradesSettings.subscribeLabel ??
                  DEFAULT_SUBSCRIBE_LABEL
                }
                onChange={(val) => update("subscribeLabel", val)}
                autoComplete="off"
              />
              <Text variant="bodySm" tone="subdued">
                Use {`{{selling_plan_group_name}}`} for the plan name. The
                one-time label comes from "One-Time Purchase subscription plan
                text" below (default: One-time).
              </Text>
            </BlockStack>
          )}

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
        </LegacyStack>
      </LegacyCard>
    </div>
  );
}
