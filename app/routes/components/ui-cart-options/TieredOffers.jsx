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
import { THEMES, getTheme } from "../utils/rewardThemes";
import IconLibrary from "../ui/IconLibrary";
import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import RewardsCalculation from "../ui/Rewards-calculation";
import BackgroundInput from "../ui/BackgroundInput";

/* ---------- mini previews  ---------- */
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
    <Line w="60%" h={2} />

    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {[{ n: "✓", done: true }, { n: "2" }, { n: "3" }].map((d) => (
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

const Mini = ({ bg, children }) => (
  <div
    style={{
      background: bg,
      borderRadius: 6,
      padding: "6px 8px",
      display: "grid",
      gap: 4,
    }}
  >
    {children}
  </div>
);

const PreviewCard = () => (
  <Mini bg="#fff">
    <Line w="50%" h={2} />
    <Line h={3} color={DARK} w="70%" />
  </Mini>
);
const PreviewGift = () => (
  <Mini bg="#e6f6ec">
    <Line w="45%" h={2} color="#1a9a4a" />
    <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: i === 0 ? "#1a9a4a" : "#c4e8d1",
          }}
        />
      ))}
    </div>
  </Mini>
);
const PreviewRing = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#efeaff",
      borderRadius: 6,
      padding: 6,
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "3px solid #4b2fc0",
        borderRightColor: "#d8cfff",
      }}
    />
    <div style={{ flex: 1, display: "grid", gap: 3 }}>
      <Line h={2} color="#4b2fc0" />
      <Line w="50%" h={2} />
    </div>
  </div>
);
const PreviewUnlock = () => (
  <Mini bg="#fff8ea">
    <Line w="40%" h={2} color={DARK} />
    <Line h={3} color="#f59e0b" w="60%" />
  </Mini>
);
const PreviewStriped = () => (
  <Mini bg="#eef4ff">
    <Line w="40%" h={2} color="#2563eb" />
    <div
      style={{
        height: 4,
        borderRadius: 4,
        backgroundImage:
          "repeating-linear-gradient(45deg,#2563eb 0 4px,#7aa2f7 4px 8px)",
        width: "70%",
      }}
    />
  </Mini>
);
const PreviewAlmost = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#fff0f2",
      borderRadius: 6,
      padding: 6,
    }}
  >
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#e11d48",
      }}
    />
    <Line h={3} color="#e11d48" w="45%" />
    <div
      style={{ width: 16, height: 8, borderRadius: 6, background: "#e11d48" }}
    />
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
  { value: "card", label: "Card", preview: <PreviewCard /> },
  { value: "gift", label: "Gift steps", preview: <PreviewGift /> },
  { value: "ring", label: "Ring", preview: <PreviewRing /> },
  { value: "unlock", label: "Unlock rewards", preview: <PreviewUnlock /> },
  { value: "striped", label: "Striped", preview: <PreviewStriped /> },
  { value: "almost", label: "Almost there", preview: <PreviewAlmost /> },
];

export default function TieredOffers({
  handleChange,
  rewardsSettings,
  currency,
  shop,
  accessToken,
  apiUrl,
}) {
  const barStyle = rewardsSettings.barStyle || "icon";

  const isThemed = !!THEMES[barStyle];
  const t = isThemed
    ? getTheme(barStyle, rewardsSettings.styleConfig?.[barStyle])
    : {};
  const setCfg = (key, value) =>
    handleChange("rewardsSettings", (prev) => ({
      ...prev,
      styleConfig: {
        ...prev.styleConfig,
        [barStyle]: { ...prev.styleConfig?.[barStyle], [key]: value },
      },
    }));
  const resetCfg = () =>
    handleChange("rewardsSettings", (prev) => ({
      ...prev,
      styleConfig: { ...prev.styleConfig, [barStyle]: {} },
    }));

  const update = (key, value) => {
    handleChange("rewardsSettings", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="mainContent">
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

          {isThemed && (
            <LegacyCard sectioned title="Customize this style">
              <BlockStack gap="300">
                <InlineGrid columns={2} gap="300">
                  <ColorInput
                    label="Background"
                    value={t.bg}
                    onChange={(v) => setCfg("bg", v)}
                  />
                  <ColorInput
                    label="Bar / accent color"
                    value={t.accent}
                    onChange={(v) => setCfg("accent", v)}
                  />
                  <ColorInput
                    label="Bar background"
                    value={t.track}
                    onChange={(v) => setCfg("track", v)}
                  />
                  <ColorInput
                    label="Text color"
                    value={t.textColor}
                    onChange={(v) => setCfg("textColor", v)}
                  />
                  <ColorInput
                    label="Icon background"
                    value={t.iconBg}
                    onChange={(v) => setCfg("iconBg", v)}
                  />
                  <ColorInput
                    label="Icon color"
                    value={t.iconColor || t.accent}
                    onChange={(v) => setCfg("iconColor", v)}
                  />
                </InlineGrid>

                <RangeSlider
                  label="Border radius"
                  min={0}
                  max={40}
                  value={t.radius}
                  onChange={(v) => setCfg("radius", v)}
                  suffix={<Text>{t.radius}px</Text>}
                  output
                />
                <RangeSlider
                  label="Padding (top / bottom)"
                  min={6}
                  max={32}
                  value={t.padding}
                  onChange={(v) => setCfg("padding", v)}
                  suffix={<Text>{t.padding}px</Text>}
                  output
                />
                <RangeSlider
                  label="Message font size"
                  min={11}
                  max={22}
                  value={t.fontSize}
                  onChange={(v) => setCfg("fontSize", v)}
                  suffix={<Text>{t.fontSize}px</Text>}
                  output
                />
                <RangeSlider
                  label="Bar height"
                  min={4}
                  max={16}
                  value={t.barHeight}
                  onChange={(v) => setCfg("barHeight", v)}
                  suffix={<Text>{t.barHeight}px</Text>}
                  output
                />

                {["card", "gift", "striped", "almost"].includes(barStyle) && (
                  <BlockStack gap="200">
                    <Checkbox
                      label="Show icon"
                      checked={t.showIcon}
                      onChange={(v) => setCfg("showIcon", v)}
                    />
                    {t.showIcon && (
                      <>
                        <Text as="p" variant="bodyMd">
                          Icon
                        </Text>
                        <IconLibrary
                          value={t.icon}
                          onChange={(icon) => setCfg("icon", icon)}
                          quickIcons={[
                            "delivery",
                            "gift",
                            "star",
                            "product",
                            "discount",
                            "bolt",
                            "heart",
                            "cart",
                          ]}
                          shop={shop}
                          accessToken={accessToken}
                          apiUrl={apiUrl}
                        />
                        <RangeSlider
                          label="Icon size"
                          min={14}
                          max={36}
                          value={t.iconSize}
                          onChange={(v) => setCfg("iconSize", v)}
                          suffix={<Text>{t.iconSize}px</Text>}
                          output
                        />
                        <Text as="p" variant="bodySm" tone="subdued">
                          Double-click the selected icon to reset it to the
                          default.
                        </Text>
                      </>
                    )}
                  </BlockStack>
                )}

                {barStyle === "card" && (
                  <Checkbox
                    label="Show start / end amounts"
                    checked={t.showLabels}
                    onChange={(v) => setCfg("showLabels", v)}
                  />
                )}

                {barStyle === "gift" && (
                  <>
                    <Checkbox
                      label="Show amounts and labels under dots"
                      checked={t.showLabels}
                      onChange={(v) => setCfg("showLabels", v)}
                    />
                    <RangeSlider
                      label="Dot size"
                      min={12}
                      max={28}
                      value={t.dotSize}
                      onChange={(v) => setCfg("dotSize", v)}
                      suffix={<Text>{t.dotSize}px</Text>}
                      output
                    />
                  </>
                )}

                {barStyle === "unlock" && (
                  <>
                    <Checkbox
                      label="Show amounts and labels under dots"
                      checked={t.showLabels}
                      onChange={(v) => setCfg("showLabels", v)}
                    />
                    <RangeSlider
                      label="Dot size"
                      min={12}
                      max={28}
                      value={t.dotSize}
                      onChange={(v) => setCfg("dotSize", v)}
                      suffix={<Text>{t.dotSize}px</Text>}
                      output
                    />
                    <RangeSlider
                      label="Message width"
                      min={20}
                      max={50}
                      value={t.titleWidth}
                      onChange={(v) => setCfg("titleWidth", v)}
                      suffix={<Text>{t.titleWidth}%</Text>}
                      output
                    />
                  </>
                )}

                {barStyle === "ring" && (
                  <>
                    <TextField
                      label="Sub text"
                      autoComplete="off"
                      value={t.subText}
                      helpText="Use {remaining} for the remaining amount"
                      onChange={(v) => setCfg("subText", v)}
                    />
                    <RangeSlider
                      label="Ring size"
                      min={36}
                      max={70}
                      value={t.ringSize}
                      onChange={(v) => setCfg("ringSize", v)}
                      suffix={<Text>{t.ringSize}px</Text>}
                      output
                    />
                    <Checkbox
                      label="Show next reward card"
                      checked={t.showNext}
                      onChange={(v) => setCfg("showNext", v)}
                    />
                    <ColorInput
                      label="Next reward card background"
                      value={t.nextBg}
                      onChange={(v) => setCfg("nextBg", v)}
                    />
                  </>
                )}

                {barStyle === "striped" && (
                  <>
                    <Checkbox
                      label="Show next reward card"
                      checked={t.showNext}
                      onChange={(v) => setCfg("showNext", v)}
                    />
                    <ColorInput
                      label="Next reward card background"
                      value={t.nextBg}
                      onChange={(v) => setCfg("nextBg", v)}
                    />
                  </>
                )}

                {barStyle === "almost" && (
                  <>
                    <Checkbox
                      label="Show amount counter ($32 / $50)"
                      checked={t.showCounter}
                      onChange={(v) => setCfg("showCounter", v)}
                    />
                    <Checkbox
                      label="Show button"
                      checked={t.showButton}
                      onChange={(v) => setCfg("showButton", v)}
                    />
                    {t.showButton && (
                      <>
                        <TextField
                          label="Button text"
                          autoComplete="off"
                          value={t.buttonText}
                          onChange={(v) => setCfg("buttonText", v)}
                        />
                        <InlineGrid columns={2} gap="300">
                          <ColorInput
                            label="Button color"
                            value={t.buttonBg || t.accent}
                            onChange={(v) => setCfg("buttonBg", v)}
                          />
                          <ColorInput
                            label="Button text color"
                            value={t.buttonColor}
                            onChange={(v) => setCfg("buttonColor", v)}
                          />
                        </InlineGrid>
                      </>
                    )}
                  </>
                )}

                <Button onClick={resetCfg}>Reset to default</Button>
              </BlockStack>
            </LegacyCard>
          )}

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
