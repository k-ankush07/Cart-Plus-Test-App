import { useState } from "react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Collapsible,
  InlineGrid,
  InlineStack,
  Text,
  TextField,
  Box,
  Icon,
  RangeSlider,
} from "@shopify/polaris";
import { DiscountIcon } from "@shopify/polaris-icons";
import ColorInput from "../ui/ColorInput";
import RichTextEditor from "../ui/RichTextEditor";
import IconLibrary from "../ui/IconLibrary";
import {
  DISCOUNT_TEMPLATES,
  TOKEN_KEYS,
  resolveDiscountStyle,
} from "../utils/discountTemplates";

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

const Section = ({ title, hint, children }) => (
  <Card>
    <BlockStack gap="300">
      <BlockStack gap="050">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        {hint && (
          <Text as="p" variant="bodySm" tone="subdued">
            {hint}
          </Text>
        )}
      </BlockStack>
      {children}
    </BlockStack>
  </Card>
);

const MiniLine = ({ width = "100%", color = "#d9dce1", height = 4 }) => (
  <span
    aria-hidden="true"
    style={{
      display: "block",
      width,
      height,
      borderRadius: height,
      background: color,
    }}
  />
);

function DiscountTemplatePreview({ template, selected, onSelect }) {
  const settings = template ? DISCOUNT_TEMPLATES[template] : null;
  const accent = settings?.accent || "#16803c";

  const previewContent = (() => {
    if (!settings) {
      // Classic
      return (
        <div style={{ display: "grid", gap: 7 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <MiniLine width="72%" height={14} color="#f0f2f4" />
            <MiniLine width="28%" height={14} color={accent} />
          </div>
          <MiniLine width="55%" height={3} color="#8b929c" />
        </div>
      );
    }

    if (settings.layout === "compact") {
      return (
        <div style={{ display: "grid", gap: 5 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: 4,
              borderRadius: 6,
              background: `${accent}1a`,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: accent,
              }}
            />
            <MiniLine width="40%" height={5} color={accent} />
          </div>
          <MiniLine height={3} />
          <MiniLine height={3} />
          <MiniLine width="60%" height={3} color={accent} />
        </div>
      );
    }

    // chip badges
    return (
      <div style={{ display: "grid", gap: 5 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: 4,
            borderRadius: 6,
            background: `${accent}1a`,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              background: accent,
            }}
          />
          <MiniLine width="40%" height={5} color={accent} />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <MiniLine width="38%" height={9} color={`${accent}33`} />
          <MiniLine width="38%" height={9} color={`${accent}33`} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 3,
            padding: 2,
            border: `1px dashed ${accent}66`,
            borderRadius: 5,
          }}
        >
          <MiniLine width="70%" height={7} color="#f1f3f5" />
          <MiniLine width="30%" height={7} color={accent} />
        </div>
      </div>
    );
  })();

  return (
    <button
      type="button"
      aria-label={`Select ${settings?.label || "Classic"} discount code template`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        width: "100%",
        minHeight: 112,
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
          minHeight: 78,
          boxSizing: "border-box",
          padding: 8,
          display: "flex",
          alignItems: "center",
          border: "1px solid #eceef0",
          borderRadius: settings ? 12 : 8,
          background: "#fff",
          color: "#1a1a1a",
          textAlign: "left",
        }}
      >
        <span style={{ width: "100%" }}>{previewContent}</span>
      </span>
    </button>
  );
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

export default function DiscountCode({
  discountCodesSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
  const [showLimitations, setShowLimitations] = useState(false);

  const s = discountCodesSettings || {};
  const template = s.template || "";
  const T = resolveDiscountStyle(s);
  const isClassic = !template;
  const isCompact = template === "compact_card";
  const isChip = template === "chip_badges";

  const update = (key, value) => {
    handleChange("discountCodesSettings", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // select a template: clear every customised token so the template defaults apply
  const applyTemplate = (key) => {
    const cleared = Object.fromEntries(TOKEN_KEYS.map((k) => [k, undefined]));
    handleChange("discountCodesSettings", (prev) => ({
      ...prev,
      ...cleared,
      template: key,
    }));
  };

  // ── small field builders ──
  const color = (key, label, fallback = "#ffffff") => (
    <ColorInput
      label={label}
      value={T[key] || fallback}
      onChange={(v) => update(key, v)}
    />
  );
  const text = (key, label, helpText) => (
    <TextField
      label={label}
      autoComplete="off"
      helpText={helpText}
      value={T[key] ?? ""}
      onChange={(v) => update(key, v)}
    />
  );
  const num = (key, label, min, max, allowEmpty = false) => {
    const raw = T[key];
    const isEmpty = raw === "" || raw === undefined || raw === null;
    const current = isEmpty ? min : Number(raw);

    return (
      <BlockStack gap="100">
        <RangeSlider
          label={label}
          min={min}
          max={max}
          step={1}
          output
          value={current}
          suffix={`${isEmpty && allowEmpty ? "auto" : current}px`}
          onChange={(v) => update(key, Number(v))}
        />
        {/* {allowEmpty && !isEmpty && (
        <InlineStack>
          <Button variant="plain" onClick={() => update(key, "")}>
            Reset to default
          </Button>
        </InlineStack>
      )} */}
      </BlockStack>
    );
  };
  const toggle = (key, label) => (
    <Checkbox
      label={label}
      checked={!!T[key]}
      onChange={(v) => update(key, v)}
    />
  );

  return (
    <div className="mainContent">
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
              aria-checked={!s.enabled}
              aria-label="Discount Code"
              className={`sb-switch ${!s.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !s.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>

      <BlockStack gap="400">
        {/* ───────── Template picker (Classic + 2) ───────── */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingSm">
                Template
              </Text>
              <Button variant="plain" onClick={() => applyTemplate(template)}>
                Reset to template defaults
              </Button>
            </InlineStack>
            <InlineGrid columns={3} gap="200">
              <DiscountTemplatePreview
                selected={isClassic}
                onSelect={() => applyTemplate("")}
              />
              {Object.keys(DISCOUNT_TEMPLATES).map((key) => (
                <DiscountTemplatePreview
                  key={key}
                  template={key}
                  selected={template === key}
                  onSelect={() => applyTemplate(key)}
                />
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* ───────── Container (Compact + Chip) ───────── */}
        {!isClassic && (
          <Section
            title="Container"
            hint="The outer box of the discount block."
          >
            <InlineGrid columns={3} gap="300">
              {color("bg", "Background")}
              {color("textColor", "Text color", "#1a1a1a")}
              {color("accent", "Accent color")}
            </InlineGrid>
            <InlineGrid columns={2} gap="300">
              {num("radius", "Border radius (px)", 0, 40)}
              {num("padding", "Inner padding (px)", 0, 48)}
            </InlineGrid>
            {toggle("shadow", "Show shadow")}
          </Section>
        )}
        {/* ───────── Savings banner (Compact + Chip) ───────── */}
        {!isClassic && (
          <Section
            title="Savings banner"
            hint="Shown at the top when at least one code is applied."
          >
            {toggle("showBanner", "Show savings banner")}
            {T.showBanner && (
              <>
                {text("heading", "Heading text")}

                <InlineGrid columns={3} gap="300">
                  {color("headingColor", "Heading color")}
                  {color("amountColor", "Saved amount color")}
                  {color("bannerBg", "Banner background", T.accent)}
                </InlineGrid>
                <InlineGrid columns={2} gap="300">
                  {num("amountSize", "Saved amount size (px)", 12, 40)}
                  {num("bannerRadius", "Banner border radius (px)", 0, 30)}
                </InlineGrid>
                <Text as="p" variant="bodyMd" fontWeight="medium">
                  Badge
                </Text>
                <InlineGrid columns={3} gap="300">
                  {text("badgeText", "Badge symbol")}
                  {color("badgeBg", "Badge background")}
                  {color("badgeColor", "Badge symbol color")}
                </InlineGrid>
                {num("badgeRadius", "Badge border radius (px)", 0, 22)}

                <Text as="p" variant="bodyMd" fontWeight="medium">
                  {isCompact ? "Applied-count pill" : "Remove-all button"}
                </Text>
                {isCompact
                  ? text(
                      "appliedLabel",
                      "Pill text",
                      "Use {n} for the number of applied codes.",
                    )
                  : text("clearAllText", "Button text")}
                <InlineGrid columns={3} gap="300">
                  {color("pillBg", "Pill background")}
                  {color("pillColor", "Pill text color")}
                  {color("pillBorder", "Pill border color")}
                </InlineGrid>
              </>
            )}
          </Section>
        )}

        {/* ───────── Applied codes (Compact rows / Chip chips) ───────── */}
        {!isClassic && (
          <Section
            title={isCompact ? "Applied code rows" : "Applied code chips"}
          >
            {toggle("showList", "Show applied codes")}

            {T.showList && isCompact && (
              <>
                <InlineGrid columns={3} gap="300">
                  {color("rowColor", "Code text color")}
                  {color("rowIconColor", "Tag icon color")}
                  {color("rowAmountColor", "Amount color")}
                </InlineGrid>
                <InlineGrid columns={3} gap="300">
                  {color("removeColor", "Remove (×) color")}
                  {color("rowDivider", "Divider color")}
                </InlineGrid>
              </>
            )}

            {T.showList && isChip && (
              <>
                <InlineGrid columns={2} gap="300">
                  {color("chipBg", "Chip background", T.accent)}
                  {color("chipColor", "Chip text & icon color")}
                </InlineGrid>
                {num("chipRadius", "Chip border radius (px)", 0, 30)}
              </>
            )}
          </Section>
        )}

        {/* ───────── Links & icon (Compact + Chip) ───────── */}
        {!isClassic && (
          <Section title="Links">
            {isCompact && (
              <>
                {toggle("showMoreOffers", "Show “+N more offers” button")}
                {T.showMoreOffers && (
                  <>
                    <InlineGrid columns={2} gap="300" alignItems="start">
                      {text(
                        "moreOffersText",
                        "More offers text",
                        "Shown as “+N …”.",
                      )}
                      {color("moreOffersColor", "More offers text color")}
                    </InlineGrid>

                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        Icon
                      </Text>
                      <IconLibrary
                        value={T.icon}
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
                      {color("iconColor", "Icon color")}
                      <Text as="p" variant="bodySm" tone="subdued">
                        Double-click the selected icon to reset it to the
                        default.
                      </Text>
                    </BlockStack>
                  </>
                )}
              </>
            )}

            {toggle("showEnterLink", "Show “Enter a coupon code” link")}
            {T.showEnterLink && (
              <InlineGrid columns={2} gap="300">
                {text("linkText", "Link text")}
                {color("linkColor", "Link color")}
              </InlineGrid>
            )}
          </Section>
        )}

        {/* ───────── Input & button (all 3) ───────── */}
        <Section
          title="Coupon input & button"
          hint={
            isClassic
              ? "Leave a color empty/unchanged to keep the storefront theme default."
              : undefined
          }
        >
          <TextField
            label="Input placeholder"
            value={s.placeholder ?? ""}
            onChange={(v) => update("placeholder", v)}
            autoComplete="off"
          />
          <Field
            label="Apply button text"
            value={s.buttonText}
            onChange={(v) => update("buttonText", v)}
          />
          <InlineGrid columns={3} gap="300">
            {color("inputBg", "Input background")}
            {color("inputColor", "Input text color", "#1a1a1a")}
            {color("inputBorder", "Input border color", "#dcdcdc")}
          </InlineGrid>

          <InlineGrid columns={3} gap="300">
            {color("buttonBg", "Button background", "#16803c")}
            {color("buttonColor", "Button text color")}
            {isClassic && color("iconColor", "Coupon icon color", "#000000")}
          </InlineGrid>
          <InlineGrid columns={2} gap="400">
            {num("inputRadius", "Input border radius (px)", 0, 40, isClassic)}
            {num("buttonRadius", "Button border radius (px)", 0, 40, isClassic)}
          </InlineGrid>
          {isChip && (
            <>
              {toggle("showDashedBox", "Show dashed box around input")}
              {T.showDashedBox && (
                <>
                  <InlineGrid columns={3} gap="300">
                    {color("dashedColor", "Dashed border color")}
                  </InlineGrid>
                  {num("dashedRadius", "Dashed box radius (px)", 0, 30)}
                </>
              )}
            </>
          )}
        </Section>

        {/* ───────── Classic-only parts ───────── */}
        {isClassic && (
          <Section title="Classic layout">
            <Checkbox
              label="Show Discount Code Title"
              checked={s.showTitle ?? false}
              onChange={(v) => update("showTitle", v)}
            />

            {s.showTitle && (
              <>
                <Field
                  label="Discount Code Title"
                  value={s.title}
                  onChange={(v) => update("title", v)}
                />
                <ColorInput
                  label="Coupon Heading Text Color"
                  value={s.couponHeadingColor ?? "#000000"}
                  onChange={(v) => update("couponHeadingColor", v)}
                />
              </>
            )}
            <Checkbox
              label="Show All Discount code"
              checked={s.showOfferBox ?? false}
              onChange={(v) => update("showOfferBox", v)}
            />
            {s.showOfferBox && (
              <InlineGrid columns={2} gap="300">
                <ColorInput
                  label="View All Offers Text Color"
                  value={s.viewAllOffersColor ?? "#ffffff"}
                  onChange={(v) => update("viewAllOffersColor", v)}
                />
                <ColorInput
                  label="View All Offers Background Color"
                  value={s.viewAllOffersBgColor ?? "#000000"}
                  onChange={(v) => update("viewAllOffersBgColor", v)}
                />
              </InlineGrid>
            )}
          </Section>
        )}

        {/* ───────── Offers panel (all 3) ───────── */}
        <Section title="Offers panel" hint="The slide-in list of all coupons.">
          <InlineGrid columns={2} gap="300">
            <TextField
              label="Panel title"
              autoComplete="off"
              value={s.panelTitle ?? "Apply Coupon"}
              onChange={(v) => update("panelTitle", v)}
            />
            <ColorInput
              label="Offer badge color"
              value={s.showOfferBgColor ?? "#6C4DFF"}
              onChange={(v) => update("showOfferBgColor", v)}
            />
          </InlineGrid>
        </Section>

        {/* ───────── Invalid message (all 3) ───────── */}
        <Section title="Error message">
          <Field
            label="Invalid code message"
            value={s.invalidCodeMessage ?? ""}
            onChange={(v) => update("invalidCodeMessage", v)}
            helpText="Shown below the input when the customer enters a code that does not exist or cannot be applied."
          />
          {color("invalidColor", "Error text color", "#D72C0D")}
        </Section>

        <Banner tone="warning">
          <BlockStack gap="200">
            <Text variant="bodyMd" fontWeight="semibold">
              Discount limitations
            </Text>
            <Text variant="bodySm">
              Cart Plus is not able to support all discount functionality
              available in checkout. Please review the following limitations.
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
                  • Some automatic discounts may not stack with code discounts
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
    </div>
  );
}
