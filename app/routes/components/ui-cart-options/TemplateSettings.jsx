import { useState, useEffect, useRef } from "react";
import {
  Card,
  Text,
  InlineStack,
  BlockStack,
  Box,
  RadioButton,
  RangeSlider,
  Popover,
  TextField,
  ColorPicker,
  Button,
    Icon,
} from "@shopify/polaris";
import { RefreshIcon, AppsIcon } from "@shopify/polaris-icons";
import Appearance from "./Appearance";
import {
  GRADIENTS,
  PLAIN_COLORS,
  TEMPLATE_DEFAULTS,
} from "../utils/templateTheme";

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HEX_ANY = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

const sameColor = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/* ---------- color helpers (hex(+alpha) <-> rgb <-> hsb) ---------- */
// "#RRGGBB" ya "#RRGGBBAA" -> { r, g, b, a(0..1) }
const parseColor = (hex) => {
  const s = HEX_ANY.test(hex) ? hex.slice(1) : "000000";
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
    a: s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1,
  };
};

// alpha 100% ho to 6-digit, warna 8-digit hex
const toHex = ({ r, g, b, a = 1 }) => {
  const h = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  const alpha = Math.round(clamp(a, 0, 1) * 255);
  return (
    "#" +
    h(r) +
    h(g) +
    h(b) +
    (alpha >= 255 ? "" : h(alpha))
  ).toUpperCase();
};

const hsbToRgb = ({ hue: h, saturation: s, brightness: v }) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

const rgbToHsb = ({ r, g, b }) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { hue, saturation: max === 0 ? 0 : d / max, brightness: max };
};

const hexToHsba = (hex) => {
  const c = parseColor(hex);
  return { ...rgbToHsb(c), alpha: c.a };
};

const hsbaToHex = (c) => toHex({ ...hsbToRgb(c), a: c.alpha });

/* ---------- Polaris ColorPicker (area + hue + alpha), hex in / hex out ---------- */
const HexColorPicker = ({ value, onChange }) => {
  const [hsba, setHsba] = useState(() => hexToHsba(value));

  // hex bahar se badle (tab switch / fields / swap) to picker sync karo.
  // Apna hi change ho to hue reset nahi hota.
  useEffect(() => {
    if (!sameColor(hsbaToHex(hsba), value)) setHsba(hexToHsba(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <ColorPicker
      fullWidth
      allowAlpha
      color={hsba}
      onChange={(c) => {
        setHsba(c);
        onChange(hsbaToHex(c));
      }}
    />
  );
};

/* ---------- HEX / R / G / B / A fields (labels neeche) ---------- */
const FIELDS_CSS = `
.cp-fields .Polaris-TextField__Input {
  padding-inline: 4px !important;
  text-align: center;
}
.cp-fields .Polaris-TextField__Backdrop { border-radius: 8px; }
`;

const ColorFields = ({ value, onChange }) => {
  const c = parseColor(value);
  const alphaPct = Math.round(c.a * 100);

  const [draft, setDraft] = useState(String(value).slice(1, 7).toUpperCase());
  useEffect(() => {
    setDraft(String(value).slice(1, 7).toUpperCase());
  }, [value]);

  // sirf digits, max 3 characters
  const digits = (v) => v.replace(/\D/g, "").slice(0, 3);

  const channel = (k) => (v) =>
    onChange(toHex({ ...c, [k]: clamp(Number(digits(v)) || 0, 0, 255) }));

  const cell = (flex, label, field) => (
    <div style={{ flex, minWidth: 0, textAlign: "center" }}>
      {field}
      <Text as="span" variant="bodyXs" tone="subdued">
        {label}
      </Text>
    </div>
  );

  return (
    <div className="cp-fields">
      <style>{FIELDS_CSS}</style>
      <InlineStack gap="100" wrap={false} blockAlign="start">
        {cell(
          2.4,
          "HEX",
          <TextField
            label="HEX"
            labelHidden
            value={draft}
            autoComplete="off"
            maxLength={7}
            onChange={(v) => {
              setDraft(v);
              const hex = v.startsWith("#") ? v : `#${v}`;
              if (HEX6.test(hex))
                onChange(toHex({ ...parseColor(hex), a: c.a }));
            }}
          />,
        )}
        {["r", "g", "b"].map((k) =>
          cell(
            1.3,
            k.toUpperCase(),
            <TextField
              label={k.toUpperCase()}
              labelHidden
              inputMode="numeric"
              value={String(c[k])}
              autoComplete="off"
              onChange={channel(k)}
            />,
          ),
        )}
        {cell(
          1.3,
          "A",
          <TextField
            label="Alpha"
            labelHidden
            inputMode="numeric"
            value={String(alphaPct)}
            autoComplete="off"
            onChange={(v) =>
              onChange(
                toHex({ ...c, a: clamp(Number(digits(v)) || 0, 0, 100) / 100 }),
              )
            }
          />,
        )}
      </InlineStack>
    </div>
  );
};

/* ---------- angle dial (needle angle ke saath ghoomta hai, drag se set) ---------- */
const AngleDial = ({ value, onChange }) => {
  const ref = useRef(null);

  const setFromPointer = (e) => {
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    let deg = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI); // 0deg = upar, CSS jaisa
    if (deg < 0) deg += 360;
    onChange(deg);
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Gradient angle"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={value}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp")
          onChange(clamp(value + 1, 0, 360));
        if (e.key === "ArrowLeft" || e.key === "ArrowDown")
          onChange(clamp(value - 1, 0, 360));
      }}
      style={{
        position: "relative",
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: "50%",
        border: "1px solid #c9cccf",
        background: "#fff",
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${value}deg)`,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: 5,
            width: 2,
            height: 10,
            marginLeft: -1,
            borderRadius: 1,
            background: "#303030",
          }}
        />
      </div>
    </div>
  );
};

/* ---------- gradient bar + Start / End tabs ---------- */
const CHECKER =
  "conic-gradient(#d9d9d9 25%, #fff 0 50%, #d9d9d9 0 75%, #fff 0) 0 0 / 10px 10px";

const GradientBar = ({ start, end, active, onSelect }) => {
  const dot = (key, side, color) => (
    <button
      type="button"
      aria-label={key === "gradientStart" ? "Start color" : "End color"}
      onClick={() => onSelect(key)}
      style={{
        position: "absolute",
        top: "50%",
        [side]: 0,
        transform: "translateY(-50%)",
        width: 22,
        height: 22,
        borderRadius: "50%",
        padding: 0,
        cursor: "pointer",
        background: color,
        border: "3px solid #fff",
        boxShadow:
          active === key ? "0 0 0 2px #303030" : "0 0 0 1px rgba(0,0,0,.2)",
      }}
    />
  );
  return (
    <div
      style={{
        position: "relative",
        height: 26,
        borderRadius: 13,
        background: `linear-gradient(90deg, ${start}, ${end}), ${CHECKER}`,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
      }}
    >
      {dot("gradientStart", "left", start)}
      {dot("gradientEnd", "right", end)}
    </div>
  );
};

const StopTab = ({ label, color, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 8,
      cursor: "pointer",
      border: active ? "1px solid #303030" : "1px solid transparent",
      background: active ? "#fff" : "#f1f1f1",
      font: "inherit",
    }}
  >
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
    <Text as="span" variant="bodySm" fontWeight="semibold">
      {label}
    </Text>
    <span style={{ marginLeft: "auto" }}>
      <Text as="span" variant="bodyXs" tone="subdued">
        {String(color).slice(1, 7).toUpperCase()}
      </Text>
    </span>
  </button>
);

const Swatch = ({ background, selected, onClick, label, size = 28 }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: "none",
      padding: 0,
      cursor: "pointer",
      background,
      boxShadow: selected
        ? "0 0 0 2px #fff, 0 0 0 4px #303030"
        : "inset 0 0 0 1px rgba(0,0,0,.08)",
    }}
  />
);

const LayoutOption = ({ value, label, selected, onSelect }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onSelect(value)}
    onKeyDown={(e) => e.key === "Enter" && onSelect(value)}
    style={{
      cursor: "pointer",
      padding: 8,
      borderRadius: 10,
      width: 150,
      border: selected ? "2px solid #303030" : "1px solid #e1e3e5",
      background: selected ? "#fff" : "#fafafa",
    }}
  >
    <RadioButton
      label={label}
      checked={selected}
      onChange={() => onSelect(value)}
    />
    <div
      style={{
        position: "relative",
        height: 64,
        marginTop: 6,
        borderRadius: 6,
        background: "#ededed",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          background: "#8a8c8f",
          ...(value === "floating"
            ? { top: 8, right: 8, bottom: 8, width: 22, borderRadius: 5 }
            : { top: 0, right: 0, bottom: 0, width: 28 }),
        }}
      />
    </div>
  </div>
);

const SliderRow = ({ label, value, max, unit, onChange }) => (
  <div style={{ flex: 1, minWidth: 140 }}>
    <RangeSlider
      label={label}
      value={value}
      min={0}
      max={max}
      output
      suffix={
        <Text as="span" variant="bodySm" tone="subdued">
          {value}
          {unit}
        </Text>
      }
      onChange={onChange}
    />
  </div>
);

export default function TemplateSettings({
  designSettings,
  setDesignSettings,
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [stop, setStop] = useState("gradientStart"); // gradient: konsa color edit ho raha hai
  const t = { ...TEMPLATE_DEFAULTS, ...designSettings };

  // the first change also switches the cart over to the Template look
  const update = (patch) =>
    setDesignSettings((prev) => ({ ...TEMPLATE_DEFAULTS, ...prev, ...patch }));

  const isGradient = t.colorMode === "gradient";
  const matchedGradient = GRADIENTS.some(
    (g) =>
      sameColor(g.start, t.gradientStart) && sameColor(g.end, t.gradientEnd),
  );
  const matchedPlain = PLAIN_COLORS.some((c) => sameColor(c, t.themeColor));
  const customSelected = isGradient ? !matchedGradient : !matchedPlain;

  const swapStops = () =>
    update({ gradientStart: t.gradientEnd, gradientEnd: t.gradientStart });

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
           <Icon source={AppsIcon} />
            <Text variant="headingMd" as="h2">
              Template
            </Text>
          </InlineStack>
        </InlineStack>
      </Box>

      <BlockStack gap="400">
        {/* Layout */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Template
            </Text>
            <InlineStack gap="300">
              <LayoutOption
                value="sidebar"
                label="Side bar"
                selected={t.layout === "sidebar"}
                onSelect={(layout) => update({ layout })}
              />
              <LayoutOption
                value="floating"
                label="Floating"
                selected={t.layout === "floating"}
                onSelect={(layout) => update({ layout })}
              />
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Colors */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Colors
            </Text>
            <InlineStack gap="400">
              <RadioButton
                label="Plain"
                checked={!isGradient}
                onChange={() => update({ colorMode: "plain" })}
              />
              <RadioButton
                label="Gradient"
                checked={isGradient}
                onChange={() => update({ colorMode: "gradient" })}
              />
            </InlineStack>

            <Text as="p" variant="bodySm" fontWeight="semibold">
              {isGradient ? "Default gradients" : "Default colors"}
            </Text>
            <InlineStack gap="300" blockAlign="center">
              {isGradient
                ? GRADIENTS.map((g) => (
                    <Swatch
                      key={g.start + g.end}
                      label={`${g.start} → ${g.end}`}
                      background={`linear-gradient(135deg, ${g.start}, ${g.end})`}
                      selected={
                        sameColor(g.start, t.gradientStart) &&
                        sameColor(g.end, t.gradientEnd)
                      }
                      onClick={() =>
                        update({ gradientStart: g.start, gradientEnd: g.end })
                      }
                    />
                  ))
                : PLAIN_COLORS.map((c) => (
                    <Swatch
                      key={c}
                      label={c}
                      background={c}
                      selected={sameColor(c, t.themeColor)}
                      onClick={() => update({ themeColor: c })}
                    />
                  ))}

              <Popover
                active={customOpen}
                autofocusTarget="none"
                activator={
                  <Swatch
                    label={isGradient ? "Custom gradient" : "Custom color"}
                    selected={customSelected}
                    onClick={() => setCustomOpen((v) => !v)}
                    background="conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                  />
                }
                onClose={() => setCustomOpen(false)}
                preferredAlignment="left"
              >
                <Box
                  padding="300"
                  width="400px"
                  minWidth="250px"
                  maxWidth="320px"
                >
                  <BlockStack gap="300">
                    {isGradient ? (
                      <>
                        {/* Title + angle dial + angle + swap */}
                        <InlineStack
                          align="space-between"
                          blockAlign="center"
                          gap="200"
                          wrap={false}
                        >
                          <Text as="h4" variant="headingSm">
                            Custom gradient
                          </Text>
                          <InlineStack
                            gap="150"
                            blockAlign="center"
                            wrap={false}
                          >
                            <AngleDial
                              value={t.gradientAngle}
                              onChange={(deg) => update({ gradientAngle: deg })}
                            />
                            <div style={{ width: 80 }}>
                              <TextField
                                label="Angle"
                                labelHidden
                                type="number"
                                suffix="°"
                                min={0}
                                max={360}
                                value={String(t.gradientAngle)}
                                autoComplete="off"
                                onChange={(v) =>
                                  update({
                                    gradientAngle: clamp(
                                      Number(v) || 0,
                                      0,
                                      360,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <Button
                              icon={RefreshIcon}
                              accessibilityLabel="Swap start and end colors"
                              onClick={swapStops}
                            />
                          </InlineStack>
                        </InlineStack>

                        {/* Gradient bar */}
                        <GradientBar
                          start={t.gradientStart}
                          end={t.gradientEnd}
                          active={stop}
                          onSelect={setStop}
                        />

                        {/* Start / End tabs */}
                        <InlineStack gap="150" wrap={false}>
                          <StopTab
                            label="Start"
                            color={t.gradientStart}
                            active={stop === "gradientStart"}
                            onClick={() => setStop("gradientStart")}
                          />
                          <StopTab
                            label="End"
                            color={t.gradientEnd}
                            active={stop === "gradientEnd"}
                            onClick={() => setStop("gradientEnd")}
                          />
                        </InlineStack>

                        <HexColorPicker
                          value={t[stop]}
                          onChange={(hex) => update({ [stop]: hex })}
                        />
                        <ColorFields
                          value={t[stop]}
                          onChange={(hex) => update({ [stop]: hex })}
                        />
                      </>
                    ) : (
                      <>
                        <Text as="h4" variant="headingSm">
                          Custom color
                        </Text>
                        <HexColorPicker
                          value={t.themeColor}
                          onChange={(hex) => update({ themeColor: hex })}
                        />
                        <ColorFields
                          value={t.themeColor}
                          onChange={(hex) => update({ themeColor: hex })}
                        />
                      </>
                    )}
                  </BlockStack>
                </Box>
              </Popover>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Style */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingSm">
              Style
            </Text>

            <BlockStack gap="100">
              <Text as="p" variant="bodySm">
                Appearance
              </Text>
              <RadioButton
                label="Light"
                checked={t.appearance === "light"}
                onChange={() => update({ appearance: "light" })}
              />
              <RadioButton
                label="Dark"
                checked={t.appearance === "dark"}
                onChange={() => update({ appearance: "dark" })}
              />
            </BlockStack>

            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="semibold">
                Surface tint
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                How much of your color tints each part of the cart.
              </Text>
              <InlineStack gap="400" wrap>
                <SliderRow
                  label="Header"
                  max={30}
                  unit="%"
                  value={t.tintHeader}
                  onChange={(v) => update({ tintHeader: v })}
                />
                <SliderRow
                  label="Body"
                  max={30}
                  unit="%"
                  value={t.tintBody}
                  onChange={(v) => update({ tintBody: v })}
                />
                <SliderRow
                  label="Footer"
                  max={30}
                  unit="%"
                  value={t.tintFooter}
                  onChange={(v) => update({ tintFooter: v })}
                />
              </InlineStack>
            </BlockStack>

            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="semibold">
                Corners
              </Text>
              <InlineStack gap="400" wrap>
                {t.layout === "floating" && (
                  <SliderRow
                    label="Drawer"
                    max={32}
                    unit="px"
                    value={t.radiusDrawer}
                    onChange={(v) => update({ radiusDrawer: v })}
                  />
                )}
                <SliderRow
                  label="Buttons"
                  max={24}
                  unit="px"
                  value={t.radiusButtons}
                  onChange={(v) => update({ radiusButtons: v })}
                />
                <SliderRow
                  label="Cards"
                  max={24}
                  unit="px"
                  value={t.radiusCards}
                  onChange={(v) => update({ radiusCards: v })}
                />
                <SliderRow
                  label="Fields"
                  max={24}
                  unit="px"
                  value={t.radiusFields}
                  onChange={(v) => update({ radiusFields: v })}
                />
                <SliderRow
                  label="Images"
                  max={24}
                  unit="px"
                  value={t.radiusImages}
                  onChange={(v) => update({ radiusImages: v })}
                />
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>

      {/* existing options: fonts, cart width, estimated line … */}
      <Box paddingBlockStart="400">
        <Appearance
          designSettings={designSettings}
          setDesignSettings={setDesignSettings}
          themed={!!designSettings.colorMode}
        />
      </Box>
    </div>
  );
}
