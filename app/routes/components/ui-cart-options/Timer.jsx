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

const TIMER_TEMPLATE_PREVIEWS = {
  limited_offer: { icon: "ϟ", digits: ["02", "14", "36", "12"] },
  hurry_up: { icon: "◷", digits: ["14:36"] },
  same_day: { icon: "◷", digits: ["2h 14m 36s"] },
  special_discount: { icon: "◆", digits: ["14", "36", "12"] },
  flash_sale: { icon: "ϟ", digits: ["02", "14", "36", "12"] },
  deal_bar: { icon: "⌛", digits: ["14:36"] },
  price_expires: { icon: "◷", digits: ["14:36"] },
  offer_progress: { icon: "◷", digits: ["14:36"] },
};

function TimerTemplatePreview({ template, selected, onSelect }) {
  const settings = TIMER_TEMPLATES[template];
  const preview = TIMER_TEMPLATE_PREVIEWS[template];
  const timerPill = {
    padding: "3px 4px",
    borderRadius: 4,
    background: settings.boxColor || `${settings.iconBg || "#d8cfff"}`,
    color: settings.digitsColor || settings.textColor,
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <button
      type="button"
      aria-label={`Select ${settings.label} timer template`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        width: "100%",
        minHeight: 92,
        padding: 8,
        border: `2px solid ${selected ? "#303030" : "#e1e3e5"}`,
        borderRadius: 10,
        background: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          width: "100%",
          minHeight: 60,
          boxSizing: "border-box",
          padding: "8px 9px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderRadius: 8,
          background: settings.background,
          color: settings.textColor,
          fontSize: 9,
          lineHeight: 1.3,
          textAlign: "left",
        }}
      >
        {settings.iconBg && (
          <span
            aria-hidden="true"
            style={{
              width: 23,
              height: 23,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background: settings.iconBg,
              color: settings.iconColor || settings.textColor,
              fontSize: 13,
            }}
          >
            {preview.icon}
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          {settings.eyebrow && (
            <span
              style={{
                display: "block",
                marginBottom: 2,
                color: settings.iconColor || settings.textColor,
                fontSize: 7,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {settings.eyebrow}
            </span>
          )}
          <span style={{ display: "block", fontWeight: 700 }}>
            {settings.message.replace("{{timer}}", "14:36")}
          </span>
          {settings.subText && (
            <span style={{ display: "block", opacity: 0.75, fontSize: 7 }}>
              {settings.subText.replace("{{minutes}}", "14")}
            </span>
          )}
        </span>
        {settings.style === "boxes" && (
          <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {preview.digits.map((digit, index) => (
              <span key={index} style={timerPill}>
                {digit}
              </span>
            ))}
          </span>
        )}
        {settings.style === "rings" && (
          <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {preview.digits.map((digit, index) => (
              <span
                key={index}
                style={{
                  ...timerPill,
                  width: 24,
                  height: 24,
                  boxSizing: "border-box",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  border: `2px solid ${settings.barColor}`,
                  background: "transparent",
                }}
              >
                {digit}
              </span>
            ))}
          </span>
        )}
        {settings.style === "clock" && (
          <span
            style={{
              ...timerPill,
              width: 29,
              height: 29,
              boxSizing: "border-box",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              border: `3px solid ${settings.barColor}`,
              background: "transparent",
              fontSize: 7,
            }}
          >
            {preview.digits[0]}
          </span>
        )}
        {(settings.style === "bar" || settings.style === "progress") && (
          <span style={{ width: 46, flexShrink: 0 }}>
            {settings.style === "bar" && (
              <span
                style={{
                  ...timerPill,
                  display: "block",
                  marginBottom: 3,
                  background: "transparent",
                }}
              >
                {preview.digits[0]}
              </span>
            )}
            <span
              style={{
                display: "block",
                height: 5,
                borderRadius: 5,
                background: settings.barBackground,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "70%",
                  height: "100%",
                  borderRadius: 5,
                  background: settings.barColor,
                }}
              />
            </span>
          </span>
        )}
        {["inline", "text"].includes(settings.style) && (
          <span
            style={{
              ...timerPill,
              flexShrink: 0,
              background: "transparent",
              fontSize: 8,
            }}
          >
            {preview.digits[0]}
          </span>
        )}
      </span>
    </button>
  );
}

export default function Timer({
  headerSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
  const timer = getTimer(headerSettings);
  const update = (patch) => handleChange("header", patchTimer(patch));
  const applyTemplate = (key) => {
    const settings = Object.fromEntries(
      Object.entries(TIMER_TEMPLATES[key]).filter(
        ([setting]) => setting !== "label",
      ),
    );
    update({ template: key, ...settings });
  };

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
          <InlineGrid columns={3} gap="200">
            {Object.entries(TIMER_TEMPLATES).map(([key]) => (
                <TimerTemplatePreview
                  key={key}
                  template={key}
                  selected={timer.template === key}
                  onSelect={() => applyTemplate(key)}
                />
              ))}
          </InlineGrid>
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
