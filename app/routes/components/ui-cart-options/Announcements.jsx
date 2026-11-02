import {
  Text,
  Button,
  ButtonGroup,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  RangeSlider,
  LegacyCard,
  LegacyStack,
  Box,
  Icon,
  Checkbox,
} from "@shopify/polaris";

import { MegaphoneIcon, InfoIcon } from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import IconLibrary from "../ui/IconLibrary";
import BackgroundInput from "../ui/BackgroundInput";
import { ANNOUNCEMENT_TEMPLATES } from "../utils/announcementTemplates";
import { backgroundToCss, templateBackground } from "../utils/background";

import "../../../index.css";

const TEMPLATE_PREVIEWS = {
  default: {
    text: "Free shipping on $50  |  Free gift on $60",
  },
  free_shipping: {
    mark: "↗",
    text: "Free shipping on orders over $50",
    close: true,
  },
  coupon: {
    mark: "◇",
    text: "10% OFF your first order",
    action: "WELCOME",
    close: true,
  },
  progress: {
    mark: "✿",
    text: "You're only $12 away from free shipping!",
    progress: true,
  },
  vip: {
    mark: "♛",
    text: "VIP members get exclusive perks",
    action: "Learn more",
    close: true,
  },
  countdown: {
    mark: "◷",
    text: "Limited time only — up to 30% OFF",
    timer: true,
    close: true,
  },
  flash_sale: {
    mark: "ϟ",
    text: "Flash Sale!  |  Extra 15% OFF ends today",
    action: "Shop now →",
    close: true,
  },
  free_gift: {
    mark: "✿",
    text: "Free gift on orders over $60",
    action: "View gift →",
    close: true,
  },
};

function AnnouncementTemplatePreview({
  template,
  selected,
  onSelect,
  designSettings,
}) {
  const preview = TEMPLATE_PREVIEWS[template];
  const settings = ANNOUNCEMENT_TEMPLATES[template];
  const themedBackground =
    template === "default" ? templateBackground(designSettings) : undefined;
  const background = backgroundToCss(themedBackground) || (settings.backgroundGradient
    ? `linear-gradient(${settings.backgroundGradient.angle}deg, ${settings.backgroundGradient.color}, ${settings.backgroundGradient.color2})`
    : settings.background);

  return (
    <button
      type="button"
      aria-label={`Select ${settings.label} template`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        width: "100%",
        minHeight: 82,
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
          minHeight: 54,
          boxSizing: "border-box",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: template === "default" ? "center" : "flex-start",
          gap: 8,
          borderRadius: 8,
          background,
          color: settings.color,
          fontSize: 11,
          lineHeight: 1.35,
          textAlign: template === "default" ? "center" : "left",
        }}
      >
        {preview.mark && (
          <span aria-hidden="true" style={{ fontSize: 15, flexShrink: 0 }}>
            {preview.mark}
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0 }}>{preview.text}</span>
        {preview.progress && (
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 5,
              flexShrink: 0,
              borderRadius: 5,
              background: `${settings.accentBg}55`,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                width: "70%",
                height: "100%",
                background: settings.accentBg,
              }}
            />
          </span>
        )}
        {preview.timer && (
          <span
            aria-hidden="true"
            style={{ flexShrink: 0, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            02 : 14 : 36
          </span>
        )}
        {preview.action && (
          <span
            style={{
              flexShrink: 0,
              padding: "4px 7px",
              borderRadius: 999,
              background: settings.accentBg,
              color: settings.accentText,
              fontSize: 9,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {preview.action}
          </span>
        )}
        {preview.close && (
          <span aria-hidden="true" style={{ flexShrink: 0, opacity: 0.7 }}>
            ×
          </span>
        )}
      </span>
    </button>
  );
}

export default function Announcements({
  handleChange,
  announcementSettings,
  shop,
  accessToken,
  apiUrl,
  currency,
  designSettings,
}) {
  const update = (key, value) => {
    handleChange("announcement", {
      ...announcementSettings,
      [key]: value,
    });
  };

  const applyTemplate = (key) => {
    const t = ANNOUNCEMENT_TEMPLATES[key];
    const themedBackground =
      key === "default" ? templateBackground(designSettings) : undefined;
    handleChange("announcement", {
      ...announcementSettings,
      template: key,
      icon: null,
      text: t.text,
      iconColor: t.iconColor,
      background: themedBackground ||
        t.backgroundGradient || { type: "plain", color: t.background },
      textColor: t.color,
      accentBg: t.accentBg,
      accentText: t.accentText,
    });
  };
  return (
    <div className="mainContent">
      {/* Page heading — matches reference HTML exactly */}
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={MegaphoneIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Announcements{" "}
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
            <button
              type="button"
              role="switch"
              aria-checked={!announcementSettings.enabled}
              aria-label="Toggle announcements"
              className={`sb-switch ${!announcementSettings.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !announcementSettings.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>

      <LegacyCard sectioned title="Template">
        <InlineGrid columns={3} gap="200">
          {Object.entries(ANNOUNCEMENT_TEMPLATES).map(([key, t]) => (
            <AnnouncementTemplatePreview
              key={key}
              template={key}
              selected={announcementSettings.template === key}
              designSettings={designSettings}
              onSelect={() => applyTemplate(key)}
            />
          ))}
        </InlineGrid>
      </LegacyCard>

      {[
        "coupon",
        "progress",
        "vip",
        "countdown",
        "flash_sale",
        "free_gift",
      ].includes(announcementSettings.template) && (
        <LegacyCard sectioned title="Right side">
          <BlockStack gap="300">
            {announcementSettings.template === "coupon" && (
              <TextField
                label="Coupon code"
                autoComplete="off"
                value={
                  announcementSettings.couponCode ??
                  ANNOUNCEMENT_TEMPLATES.coupon.code
                }
                onChange={(v) => update("couponCode", v)}
              />
            )}

            {announcementSettings.template === "progress" && (
              <InlineGrid columns={2} gap="300">
                <TextField
                  label={`Current amount (${currency})`}
                  type="number"
                  autoComplete="off"
                  value={String(
                    announcementSettings.current ??
                      ANNOUNCEMENT_TEMPLATES.progress.current,
                  )}
                  onChange={(v) => update("current", Number(v))}
                />
                <TextField
                  label={`Goal (${currency})`}
                  type="number"
                  autoComplete="off"
                  value={String(
                    announcementSettings.goal ??
                      ANNOUNCEMENT_TEMPLATES.progress.goal,
                  )}
                  onChange={(v) => update("goal", Number(v))}
                />
              </InlineGrid>
            )}

            {announcementSettings.template === "vip" && (
              <TextField
                label="Link text"
                autoComplete="off"
                value={
                  announcementSettings.linkText ??
                  ANNOUNCEMENT_TEMPLATES.vip.linkText
                }
                onChange={(v) => update("linkText", v)}
              />
            )}

            {["flash_sale", "free_gift"].includes(
              announcementSettings.template,
            ) && (
              <TextField
                label="Button text"
                autoComplete="off"
                value={
                  announcementSettings.buttonText ??
                  ANNOUNCEMENT_TEMPLATES[announcementSettings.template]
                    .buttonText
                }
                onChange={(v) => update("buttonText", v)}
              />
            )}

            {["vip", "flash_sale", "free_gift"].includes(announcementSettings.template) && (
              <TextField
                label="Link (URL)"
                autoComplete="off"
                placeholder="/collections/sale"
                value={announcementSettings.link || ""}
                onChange={(v) => update("link", v)}
              />
            )}

            {announcementSettings.template === "countdown" && (
              <TextField
                label="Countdown (minutes)"
                type="number"
                autoComplete="off"
                value={String(
                  Math.round(
                    (announcementSettings.seconds ??
                      ANNOUNCEMENT_TEMPLATES.countdown.seconds) / 60,
                  ),
                )}
                onChange={(v) => update("seconds", Number(v) * 60)}
              />
            )}

           {["coupon", "flash_sale", "free_gift", "progress", "countdown"].includes(
              announcementSettings.template,
            ) && (
              <InlineGrid columns={2} gap="300">
                <ColorInput
                  label={
                    announcementSettings.template === "progress"
                      ? "Bar color"
                      : announcementSettings.template === "countdown"
                        ? "Timer box color"
                        : "Button color"
                  }
                  value={
                    announcementSettings.accentBg ??
                    ANNOUNCEMENT_TEMPLATES[announcementSettings.template]
                      .accentBg
                  }
                  onChange={(val) => update("accentBg", val)}
                />
                {announcementSettings.template !== "progress" && (
                  <ColorInput
                    label={
                      announcementSettings.template === "countdown"
                        ? "Timer text color"
                        : "Button text color"
                    }
                    value={
                      announcementSettings.accentText ??
                      ANNOUNCEMENT_TEMPLATES[announcementSettings.template]
                        .accentText
                    }
                    onChange={(val) => update("accentText", val)}
                  />
                )}
              </InlineGrid>
            )}
          </BlockStack>
        </LegacyCard>
      )}

      <LegacyCard sectioned title="Settings">
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Height
            </Text>
            <ButtonGroup variant="segmented">
              {["slim", "normal", "thick"].map((val) => (
                <Button
                  key={val}
                  pressed={announcementSettings.height === val}
                  onClick={() => update("height", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Position
            </Text>
            <ButtonGroup variant="segmented">
              <Button
                pressed={announcementSettings.position === "before"}
                onClick={() => update("position", "before")}
              >
                Before products
              </Button>

              <Button
                pressed={announcementSettings.position === "after"}
                onClick={() => update("position", "after")}
              >
                After products
              </Button>
            </ButtonGroup>
          </BlockStack>
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="medium">
              Icon
            </Text>
            <IconLibrary
              value={announcementSettings.icon}
              onChange={(icon) => update("icon", icon)}
              shop={shop}
              accessToken={accessToken}
              apiUrl={apiUrl}
            />
            {announcementSettings.template && announcementSettings.icon && (
              <Button variant="plain" onClick={() => update("icon", null)}>
                Reset to template icon
              </Button>
            )}
            <ColorInput
              label="Icon color"
              value={announcementSettings.iconColor || "#000000"}
              onChange={(val) => update("iconColor", val)}
            />
          </BlockStack>

          <BlockStack gap="100">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" fontWeight="medium">
                Announcement text
              </Text>
              <Button variant="plain" onClick={() => update("text", "")}>
                Clear
              </Button>
            </InlineStack>

            <RichTextEditor
              value={announcementSettings.text}
              onChange={(val) => update("text", val)}
            />
          </BlockStack>
          <RangeSlider
            label="Border radius"
            value={
              announcementSettings.borderRadius ??
              (announcementSettings.template ? 12 : 0)
            }
            onChange={(val) => update("borderRadius", val)}
            min={0}
            max={40}
            step={1}
            prefix={<Text>0px</Text>}
            suffix={<Text>40px</Text>}
            output
          />
          <Checkbox
            label="Show close (×) button"
            checked={announcementSettings.showClose ?? true}
            onChange={(val) => update("showClose", val)}
          />
          {/* <RangeSlider
            label="Font size"
            value={announcementSettings.fontSize || 10}
            onChange={(val) => update("fontSize", val)}
            min={10}
            max={24}
            step={1}
            prefix={<Text>10px</Text>}
            suffix={<Text>24px</Text>}
            output
          /> */}
          {/* <ColorInput
            label="Border color"
            value={announcementSettings.borderColor}
            onChange={(val) => update("borderColor", val)}
          /> */}
        </LegacyStack>
      </LegacyCard>

      <BackgroundInput
        value={announcementSettings.background}
        onChange={(background) => update("background", background)}
      />
    </div>
  );
}
