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
  Card
} from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";
import IconLibrary from "../ui/IconLibrary";
import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import { getTimer, patchTimer, toggleTimer } from "../utils/timer";
import "../../../index.css";

const STYLES = [
  { value: "text", label: "Text" },
  { value: "digits", label: "Digits" },
  { value: "bar", label: "Progress bar" },
];

const StylePreview = ({ value }) => {
  if (value === "digits") {
    return (
      <div style={{ fontSize: 12, fontWeight: 700, textAlign: "center" }}>
        00 : 09 : 42
        <div style={{ fontSize: 9, fontWeight: 400 }}>Sale price expires soon</div>
      </div>
    );
  }
  if (value === "bar") {
    return (
      <div style={{ width: "100%", fontSize: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Offer expires soon</span>
          <strong>09:42</strong>
        </div>
        <div style={{ height: 3, background: "#ddd", marginTop: 4, borderRadius: 3 }}>
          <div style={{ width: "55%", height: "100%", background: "#888", borderRadius: 3 }} />
        </div>
      </div>
    );
  }
  return (
    <span style={{ fontSize: 10, background: "#f1f1f1", padding: "2px 8px", borderRadius: 10 }}>
      This price expires in <strong>09:42</strong>
    </span>
  );
};

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

      <BlockStack gap="400">
        {/* Style */}
        <InlineGrid columns={3} gap="300">
          {STYLES.map((s) => (
            <div
              key={s.value}
              role="button"
              tabIndex={0}
              onClick={() => update({ style: s.value })}
              onKeyDown={(e) => e.key === "Enter" && update({ style: s.value })}
              style={{
                cursor: "pointer",
                borderRadius: 10,
                padding: 12,
                minHeight: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                border:
                  timer.style === s.value ? "2px solid #303030" : "1px solid #e1e3e5",
              }}
              title={s.label}
            >
              <StylePreview value={s.value} />
            </div>
          ))}
        </InlineGrid>

        {/* Message */}
        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Message
            </Text>
            <IconLibrary
              value={timer.icon}
              onChange={(icon) => update({ icon })}
              quickIcons={["clock", "calendar", "star", "heart", "gift", "discount", "delivery", "megaphone"]}
              shop={shop}
              accessToken={accessToken}
              apiUrl={apiUrl}
            />
            <ColorInput
              label="Icon color"
              value={timer.iconColor || "#000000"}
              onChange={(iconColor) => update({ iconColor })}
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
                  update({ minutes: Math.min(1440, Math.max(1, Number(v) || 1)) })
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
                  onChange={(v) => update({ labels: { ...timer.labels, [key]: v } })}
                />
              ))}
            </InlineGrid>
          </BlockStack>
</Card>
        <BackgroundInput
          value={timer.background || undefined}
          onChange={(background) => update({ background })}
        />
      </BlockStack>
    </div>
  );
}
