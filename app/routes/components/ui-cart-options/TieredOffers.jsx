import {
  Text,
  Button,
  InlineStack,
  BlockStack,
  RangeSlider,
  LegacyCard,
  LegacyStack,
  Box,
  Icon,
  Checkbox,
  InlineGrid,
  TextField,
} from "@shopify/polaris";

import { GiftCardIcon } from "@shopify/polaris-icons";

import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import RewardsCalculation from "../ui/Rewards-calculation";
import BackgroundInput from "../ui/BackgroundInput";

/* ---------- mini previews (style cards ke andar) ---------- */
const DARK = "#1a1a1a";
const GRAY = "#d9d9d9";
const LIGHT = "#ececec";

const Line = ({ w = "100%", h = 3, color = GRAY, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: h,
      background: color,
      ...style,
    }}
  />
);

const PreviewIcon = () => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 6, color: "#6d7175", marginBottom: 6 }}>
      You're <b>$25.00</b> away from free shipping
    </div>
    <div style={{ position: "relative", height: 10, margin: "0 10px" }}>
      <Line style={{ position: "absolute", top: 4 }} />
      <Line w="50%" color={DARK} style={{ position: "absolute", top: 4 }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 9,
          height: 9,
          marginLeft: -4,
          borderRadius: "50%",
          background: DARK,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "#fff",
          border: `1px solid ${GRAY}`,
        }}
      />
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0 6px",
        fontSize: 5,
        color: "#6d7175",
        marginTop: 2,
      }}
    >
      <span style={{ marginLeft: "38%" }}>Free Shipping</span>
      <span>Free Gift</span>
    </div>
  </div>
);

const PreviewReward = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{ flex: 1, display: "grid", gap: 4 }}>
      <Line w="35%" h={2} />
      <Line h={2} />
      <Line h={3} color={DARK} w="60%" />
    </div>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        background: "#fff1e0",
        display: "grid",
        placeItems: "center",
        fontSize: 11,
      }}
    >
      🎁
    </div>
  </div>
);

const PreviewNextReward = () => (
  <div style={{ display: "grid", gap: 4 }}>
    <Line h={2} />
    <Line w="35%" h={2} />
    <Line h={3} color={DARK} w="55%" />
  </div>
);

const PreviewMilestone = () => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e1e3e5",
      borderRadius: 6,
      padding: "6px 10px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
    }}
  >
    {/* upar ki line */}
    <Line w="60%" h={2} />

    {/* neeche circles, center me paas-paas */}
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {[
        { n: "✓", done: true },
        { n: "2" },
        { n: "3" },
      ].map((d) => (
        <div
          key={d.n}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            boxSizing: "border-box",
            background: d.done ? DARK : "#fff",
            color: d.done ? "#fff" : "#6d7175",
            border: d.done ? "none" : `1px solid ${GRAY}`,
            fontSize: 7,
            lineHeight: 1,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {d.n}
        </div>
      ))}
    </div>
  </div>
);

const PreviewThreshold = () => (
  <div style={{ display: "flex", gap: 4, paddingTop: 6 }}>
    {[1, 1, 1, 1, 0].map((on, i) => (
      <Line key={i} h={4} color={on ? DARK : LIGHT} style={{ flex: 1 }} />
    ))}
  </div>
);

const BAR_STYLES = [
  { value: "icon", label: "Icon", preview: <PreviewIcon /> },
  { value: "reward", label: "Reward", preview: <PreviewReward /> },
  { value: "nextReward", label: "Next Reward", preview: <PreviewNextReward /> },
  { value: "milestone", label: "Milestone", preview: <PreviewMilestone /> },
  {
    value: "threshold",
    label: "Threshold Tracker",
    preview: <PreviewThreshold />,
  },
];

export default function TieredOffers({
  handleChange,
  rewardsSettings,
  currency,
}) {
  const barStyle = rewardsSettings.barStyle || "icon";
  const update = (key, value) => {
    handleChange("rewardsSettings", (prev) => ({
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
                <Icon source={GiftCardIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Tiered Offers
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
            <button
              type="button"
              role="switch"
              aria-checked={!rewardsSettings.enabled}
              aria-label="Tiered Offers"
              className={`sb-switch ${!rewardsSettings.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !rewardsSettings.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>
      <Box paddingBlockEnd="400">
        <Text as="p" variant="bodySm">
          Show customers a progress bar that highlights reward milestones.
        </Text>
      </Box>
      <LegacyCard sectioned title="Style">
        <BlockStack gap="300">
          <InlineGrid columns={3} gap="300">
            {BAR_STYLES.map((s) => {
              const selected = barStyle === s.value;
              return (
                <div
                  key={s.value}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => update("barStyle", s.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && update("barStyle", s.value)
                  }
                  style={{
                    cursor: "pointer",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fff",
                    // border hamesha 2px, taaki select par layout na hile
                    border: `2px solid ${selected ? "#303030" : "#e1e3e5"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minHeight: 92,
                  }}
                >
                  <Text as="span" variant="bodySm" fontWeight="medium">
                    {s.label}
                  </Text>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "#f7f7f7",
                      border: "1px solid #ededed",
                      pointerEvents: "none",
                    }}
                  >
                    {s.preview}
                  </div>
                </div>
              );
            })}
          </InlineGrid>

          {barStyle === "reward" && (
            <>
              <TextField
                label="Reward ticket label"
                value={rewardsSettings.rewardTicketLabel ?? "REWARD TICKET"}
                onChange={(v) => update("rewardTicketLabel", v)}
                autoComplete="off"
              />
              <TextField
                label="Next reward label"
                value={rewardsSettings.nextRewardLabel ?? "NEXT REWARD"}
                onChange={(v) => update("nextRewardLabel", v)}
                autoComplete="off"
              />
            </>
          )}
          {barStyle === "milestone" && (
            <TextField
              label="Completed milestone label"
              value={rewardsSettings.milestoneDoneLabel ?? "DONE"}
              onChange={(v) => update("milestoneDoneLabel", v)}
              autoComplete="off"
            />
          )}
        </BlockStack>
      </LegacyCard>

      <LegacyCard sectioned title="General settings">
        <LegacyStack vertical spacing="tight">
          <InlineStack>
            <Checkbox
              label="Show rewards on empty cart"
              checked={rewardsSettings.showOnEmptyCart}
              onChange={(val) => update("showOnEmptyCart", val)}
            />
          </InlineStack>
          <BlockStack gap="300">
            <ColorInput
              label="Bar background color"
              value={rewardsSettings.backgroundColor}
              onChange={(val) => update("backgroundColor", val)}
            />

            <ColorInput
              label="Bar foreground color"
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
          </BlockStack>
          <BlockStack gap="100">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" fontWeight="medium">
                Completing full rewards bar text
              </Text>
              <Button variant="plain" onClick={() => update("successText", "")}>
                Clear
              </Button>
            </InlineStack>

            <RichTextEditor
              value={rewardsSettings.successText}
              onChange={(val) => update("successText", val)}
            />
          </BlockStack>
          <InlineStack gap="200" align="start">
            <Box width="100%">
              <RangeSlider
                label="Bar Length"
                value={rewardsSettings.barLength || 2}
                onChange={(val) => update("barLength", val)}
                min={2}
                max={16}
                step={1}
                prefix={<Text>2px</Text>}
                suffix={<Text>16px</Text>}
                output
              />
            </Box>

            <Box width="100%">
              <RangeSlider
                label="Bar Gap"
                value={rewardsSettings.barGap || 0}
                onChange={(val) => update("barGap", val)}
                min={0}
                max={20}
                step={1}
                prefix={<Text>0px</Text>}
                suffix={<Text>20px</Text>}
                output
              />
            </Box>
          </InlineStack>
        </LegacyStack>
      </LegacyCard>

      <RewardsCalculation
        rewardsSettings={rewardsSettings}
        handleChange={handleChange}
        currency={currency}
      />

      <BackgroundInput
        title="Bar background"
        value={
          rewardsSettings.barBackground || {
            type: "plain",
            color: rewardsSettings.backgroundColor,
          }
        }
        onChange={(bg) => update("barBackground", bg)}
      />
      <BackgroundInput
        title="Bar progress"
        value={rewardsSettings.barProgress}
        onChange={(bg) => update("barProgress", bg)}
      />
    </div>
  );
}