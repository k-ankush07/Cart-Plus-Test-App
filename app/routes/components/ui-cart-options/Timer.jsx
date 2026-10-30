import {
  LegacyCard,
  Text,
  TextField,
  Checkbox,
  Button,
  ButtonGroup,
  InlineStack,
  InlineGrid,
  BlockStack,
  Box,
  Icon,
  Card,
} from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";
import IconLibrary from "../ui/IconLibrary";
import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import { getTimer, patchTimer, toggleTimer } from "../utils/timer";
import { TIMER_TEMPLATES } from "../utils/timerTemplates";
import "../../../index.css";

const quickIcons = [
  "bolt",
  "clock",
  "discount",
  "hourglass",
  "gift",
  "star",
  "delivery",
  "megaphone",
];

export default function Timer({
  headerSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
  const timer = getTimer(headerSettings);
  const update = (patch) => handleChange("header", patchTimer(patch));

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Icon source={ClockIcon} />
            <Text variant="headingMd" as="h2">
              Timer
            </Text>
          </InlineStack>
          <button
            type="button"
            role="switch"
            aria-checked={timer.enabled}
            aria-label="Toggle timer"
            className={`sb-switch ${timer.enabled ? "is-on" : ""}`}
            onClick={() => handleChange("header", toggleTimer)}
          >
            <span className="sb-switch-knob" />
          </button>
        </InlineStack>
      </Box>

      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Templates
          </Text>
          <InlineStack gap="200" wrap>
            {Object.entries(TIMER_TEMPLATES).map(
              ([key, { label, ...settings }]) => (
                <Button
                  key={key}
                  pressed={timer.template === key}
                  onClick={() => update({ template: key, ...settings })}
                >
                  {label}
                </Button>
              ),
            )}
          </InlineStack>
        </BlockStack>
      </Card>

      <BlockStack gap="400">
        {/* Style */}
        <InlineGrid columns={3} gap="300"></InlineGrid>

        {/* Message */}
        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Message
            </Text>
            <IconLibrary
              value={timer.icon || { type: "icon", name: "clock" }}
              onChange={(icon) => update({ icon })}
              quickIcons={quickIcons}
              shop={shop}
              accessToken={accessToken}
              apiUrl={apiUrl}
            />
            <ColorInput
              label="Icon color"
              value={timer.iconColor || "#000000"}
              onChange={(iconColor) => update({ iconColor })}
            />

            <ColorInput
              label="Icon background"
              value={timer.iconBg || "#f1f1f1"}
              onChange={(iconBg) => update({ iconBg })}
            />
            <TextField
              label="Small heading"
              value={timer.eyebrow || ""}
              autoComplete="off"
              onChange={(eyebrow) => update({ eyebrow })}
            />
            <TextField
              label="Sub text"
              value={timer.subText || ""}
              autoComplete="off"
              helpText="Use {{minutes}} for remaining minutes"
              onChange={(subText) => update({ subText })}
            />
            <RichTextEditor
              value={timer.message}
              onChange={(message) => update({ message })}
            />
            <BlockStack gap="100">
              <Text as="p">Alignment</Text>
              <ButtonGroup variant="segmented">
                {["left", "center", "right"].map((val) => (
                  <Button
                    key={val}
                    pressed={timer.alignment === val}
                    onClick={() => update({ alignment: val })}
                  >
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Button>
                ))}
              </ButtonGroup>
            </BlockStack>
            <Text as="p" variant="bodySm" tone="subdued">
              Use {"{{timer}}"} where the countdown should appear.
            </Text>
          </BlockStack>
        </LegacyCard>

        {/* Duration */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Duration
            </Text>
            <Checkbox
              label="Remove the products once the timer is done"
              checked={timer.removeProducts}
              onChange={(removeProducts) => update({ removeProducts })}
            />
            <div style={{ maxWidth: 200 }}>
              <TextField
                label="Duration"
                labelHidden
                type="number"
                min={1}
                max={1440}
                suffix="minutes"
                value={String(timer.minutes)}
                autoComplete="off"
                onChange={(v) =>
                  update({
                    minutes: Math.min(1440, Math.max(1, Number(v) || 1)),
                  })
                }
              />
            </div>
            <Text as="p" variant="bodySm" fontWeight="semibold">
              Timer Labels
            </Text>
            <InlineGrid columns={4} gap="200">
              {["days", "hrs", "min", "sec"].map((key) => (
                <TextField
                  key={key}
                  label={key}
                  labelHidden
                  value={timer.labels[key]}
                  autoComplete="off"
                  onChange={(v) =>
                    update({ labels: { ...timer.labels, [key]: v } })
                  }
                />
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>
        {/* Styles (digits + progress bar only) */}
        {["boxes", "rings", "clock", "bar", "progress"].includes(
          timer.style,
        ) && (
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Styles
              </Text>
              <InlineGrid columns={3} gap="300">
                <ColorInput
                  label="Digits"
                  value={timer.digitsColor || "#303030"}
                  onChange={(digitsColor) => update({ digitsColor })}
                />
                {timer.style === "boxes" && (
                  <>
                    <ColorInput
                      label="Labels"
                      value={timer.labelsColor || "#303030"}
                      onChange={(labelsColor) => update({ labelsColor })}
                    />
                    <ColorInput
                      label="Box"
                      value={timer.boxColor || "#e8eefb"}
                      onChange={(boxColor) => update({ boxColor })}
                    />
                  </>
                )}
                {timer.style === "rings" && (
                  <>
                    <ColorInput
                      label="Labels"
                      value={timer.labelsColor || "#303030"}
                      onChange={(labelsColor) => update({ labelsColor })}
                    />
                    <ColorInput
                      label="Ring"
                      value={timer.barColor || "#4b2fc0"}
                      onChange={(barColor) => update({ barColor })}
                    />
                    <ColorInput
                      label="Ring background"
                      value={timer.barBackground || "#d8cfff"}
                      onChange={(barBackground) => update({ barBackground })}
                    />
                  </>
                )}
                {(timer.style === "clock" || timer.style === "bar") && (
                  <>
                    <ColorInput
                      label={timer.style === "bar" ? "Bar" : "Ring"}
                      value={timer.barColor || "#1a56db"}
                      onChange={(barColor) => update({ barColor })}
                    />
                    <ColorInput
                      label={
                        timer.style === "bar"
                          ? "Bar background"
                          : "Ring background"
                      }
                      value={timer.barBackground || "#c9d6f5"}
                      onChange={(barBackground) => update({ barBackground })}
                    />
                  </>
                )}
                {(timer.style === "clock" ||
                  timer.style === "bar" ||
                  timer.style === "progress") && (
                  <>
                    <ColorInput
                      label={timer.style === "clock" ? "Ring" : "Bar"}
                      value={timer.barColor || "#1a56db"}
                      onChange={(barColor) => update({ barColor })}
                    />
                    <ColorInput
                      label={
                        timer.style === "clock"
                          ? "Ring background"
                          : "Bar background"
                      }
                      value={timer.barBackground || "#c9d6f5"}
                      onChange={(barBackground) => update({ barBackground })}
                    />
                  </>
                )}
              </InlineGrid>
            </BlockStack>
          </Card>
        )}
        <BackgroundInput
          value={timer.background || undefined}
          onChange={(background) => update({ background })}
        />
      </BlockStack>
    </div>
  );
}
