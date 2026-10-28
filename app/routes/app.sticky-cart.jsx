import { useEffect, useMemo, useRef, useState } from "react";
import {
  Page,
  Card,
  Layout,
  Text,
  InlineStack,
  InlineGrid,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Select,
  RangeSlider,
  Banner,
  Badge,
  Collapsible,
  AppProvider,
  Modal,
  Popover,
  TextField,
  Tooltip,
} from "@shopify/polaris";
import { DesktopIcon, MobileIcon, PlusCircleIcon } from "@shopify/polaris-icons";
import "../index.css";
import "@shopify/polaris/build/esm/styles.css";
import ColorInput from "./components/ui/ColorInput";
import { requireShopData } from "./components/shop.server";
import { useLoaderData, useNavigate } from "react-router";
import { createStickyCart, getStickyCart, uploadImage } from "../services/apiRoutes";

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const ICON_SIZE_MIN = 16;
const ICON_SIZE_MAX = 40;
const ICON_SIZE_DEFAULT = 24;
const BUTTON_SIZE_MIN = 40;
const BUTTON_SIZE_MAX = 100;
const BUTTON_SIZE_DEFAULT = 60;

// Only PNG / SVG are accepted for a custom cart icon
const ALLOWED_ICON_TYPES = ["image/png", "image/svg+xml"];
const ALLOWED_ICON_EXTENSIONS = ".png,.svg";

const PREVIEW_COUNT = 3;
const PREVIEW_HEIGHT = 620;

const TEMPLATES = [
  { id: "bubble", label: "Bubble" },
  { id: "pill", label: "Pill with label" },
  { id: "ring", label: "Progress ring" },
  { id: "tab", label: "Edge tab" },
  { id: "bar", label: "Bottom bar" },
];
const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

const PRESET_COLORS = [
  "#000000", "#6d3bff", "#64748b", "#0a74ff", "#28a745",
  "#ee0000", "#ff7ac8", "#ff9500", "#ffc400", "#7be06b",
];

const FLOAT_POSITIONS = [
  { label: "Bottom right", value: "bottom-right" },
  { label: "Center right", value: "center-right" },
  { label: "Top right", value: "top-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Center left", value: "center-left" },
  { label: "Top left", value: "top-left" },
];
const TAB_POSITIONS = [
  { label: "Right", value: "right" },
  { label: "Left", value: "left" },
];
const BAR_POSITIONS = [{ label: "Bottom", value: "bottom" }];

const positionOptionsFor = (template) =>
  template === "tab" ? TAB_POSITIONS : template === "bar" ? BAR_POSITIONS : FLOAT_POSITIONS;

/** Keep a saved position valid when the template changes (e.g. bottom-right → right for the tab). */
function coercePosition(template, pos) {
  const valid = positionOptionsFor(template).map((o) => o.value);
  if (valid.includes(pos)) return pos;
  if (template === "bar") return "bottom";
  const isLeft = typeof pos === "string" && pos.includes("left");
  if (template === "tab") return isLeft ? "left" : "right";
  return isLeft ? "bottom-left" : "bottom-right";
}

const POSITION_STYLES = {
  "bottom-right": { bottom: 16, right: 16 },
  "center-right": { top: "50%", right: 16, transform: "translateY(-50%)" },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "center-left": { top: "50%", left: 16, transform: "translateY(-50%)" },
  "top-left": { top: 16, left: 16 },
  right: { bottom: 16, right: 0 },
  left: { bottom: 16, left: 0 },
  bottom: { bottom: 16, left: 16, right: 16 },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Icons (stroke icons that take the chosen colour + size)                     */
/* ────────────────────────────────────────────────────────────────────────── */

const ICON_DEFS = {
  cart: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  basket: (
    <>
      <path d="m15 11-1 9" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
      <path d="M4.5 15.5h15" />
      <path d="m5 11 4-7" />
      <path d="m9 11 1 9" />
    </>
  ),
  "basket-2": (
    <>
      <path d="M3 10h18" />
      <path d="M5 10l1.3 8.4A2 2 0 0 0 8.3 20h7.4a2 2 0 0 0 2-1.6L19 10" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  "bag-2": (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  tote: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7v1a3 3 0 0 0 6 0V7" />
    </>
  ),
};
const ICON_IDS = Object.keys(ICON_DEFS);
const ICON_LABELS = {
  cart: "Cart",
  basket: "Basket",
  "basket-2": "Basket (open)",
  bag: "Bag",
  "bag-2": "Shopping bag",
  tote: "Tote",
};

function CartGlyph({ id, color, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_DEFS[id] ?? ICON_DEFS.bag}
    </svg>
  );
}

function renderGlyph(selectedIcon, customIconUrl, color, size) {
  if (selectedIcon === "custom" && customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt=""
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }
  return <CartGlyph id={selectedIcon} color={color} size={size} />;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

// Sorted-key stringify so comparisons never depend on key order
function stableStringify(obj) {
  if (!obj || typeof obj !== "object") return JSON.stringify(obj);
  return JSON.stringify(obj, Object.keys(obj).sort());
}

const clamp = (n, min, max, fallback) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

/** Scope custom CSS to the preview and force it to win over inline styles. */
function scopeCss(css, scope) {
  if (!css) return "";
  return css
    .replace(/<\/style/gi, "")
    .replace(
      /(@[\w-]+(?:\s+[\w-]+)?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})|([^{}@]+)\{([^{}]*)\}/g,
      (match, atRule, selectors, declarations) => {
        if (atRule) return atRule;

        const scoped = selectors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `${scope} ${s}`)
          .join(", ");

        const body = declarations.trim();
        const withSemi = !body || body.endsWith(";") ? body : `${body};`;
        const important = withSemi.replace(
          /([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g,
          (_m, prop, val, semi) => `${prop}${val.trim()} !important${semi}`
        );

        return `${scoped} { ${important} }`;
      }
    );
}

function buildSettings(data) {
  const template = TEMPLATE_IDS.includes(data?.template) ? data.template : "bubble";
  const customIconUrl = data?.customIconUrl ?? null;
  const rawIcon = data?.selectedIcon ?? "bag";
  const selectedIcon =
    rawIcon === "custom" ? (customIconUrl ? "custom" : "bag") : ICON_DEFS[rawIcon] ? rawIcon : "bag";

  // Older records only had `device` ("all" | "mobile" | "desktop")
  const displayOnMobile =
    data?.displayOnMobile ?? (data?.device ? data.device !== "desktop" : true);

  const position = coercePosition(template, data?.position ?? "bottom-right");
  const mobilePosition = coercePosition(template, data?.mobilePosition ?? position);

  return {
    enabled: data?.enabled ?? false,
    template,
    selectedIcon,
    customIconUrl,
    bgColor: data?.bgColor ?? "#000000",
    iconColor: data?.iconColor ?? "#ffffff",
    iconSize: clamp(data?.iconSize, ICON_SIZE_MIN, ICON_SIZE_MAX, ICON_SIZE_DEFAULT),
    buttonSize: clamp(data?.buttonSize, BUTTON_SIZE_MIN, BUTTON_SIZE_MAX, BUTTON_SIZE_DEFAULT),
    qBgColor: data?.qBgColor ?? "#6d3bff",
    qTextColor: data?.qTextColor ?? "#ffffff",
    enableCount: data?.enableCount ?? true,
    position,
    mobilePosition,
    displayOnMobile,
    hideOnEmptyCart: data?.hideOnEmptyCart ?? false,
    customCss: data?.customCss ?? "",
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Loader                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export const loader = async ({ request }) => {
  try {
    const { shop, apiUrl, accessToken, currency } = await requireShopData(request);

    let stickyCart = null;
    try {
      const res = await getStickyCart(apiUrl, shop?.myshopifyDomain || "");
      stickyCart = res?.data || null;
    } catch (err) {
      console.error("GET STICKY CART ERROR:", err);
    }

    return Response.json({ shop, apiUrl, accessToken, currency, stickyCart });
  } catch (error) {
    console.error("Shop Loader Error:", error);
    if (error instanceof Response) throw error;
    throw new Response("Loader failed", { status: 500 });
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Small UI pieces                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 40,
        height: 22,
        padding: 0,
        border: 0,
        borderRadius: 8,
        cursor: "pointer",
        background: checked ? "#303030" : "#c9cccf",
        transition: "background .15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 4,
          left: checked ? 22 : 4,
          width: 14,
          height: 14,
          borderRadius: 5,
          background: "#fff",
          transition: "left .15s",
        }}
      />
    </button>
  );
}

function ToggleRow({ checked, onChange, title }) {
  return (
    <InlineStack gap="300" blockAlign="center" wrap={false}>
      <Toggle checked={checked} onChange={onChange} label={title} />
      <span style={{ cursor: "pointer" }} onClick={() => onChange(!checked)}>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {title}
        </Text>
      </span>
    </InlineStack>
  );
}

function Panel({ children }) {
  return (
    <Box padding="300" borderWidth="025" borderColor="border" borderRadius="200">
      <BlockStack gap="300">{children}</BlockStack>
    </Box>
  );
}

function IconTile({ selected, onClick, children, label, dashed, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      disabled={disabled}
      style={{
        width: 52,
        height: 52,
        padding: 0,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: "#303030",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        border: selected ? "2px solid #1a1a1a" : dashed ? "1px dashed #c9cccf" : "1px solid #e3e3e3",
      }}
    >
      {children}
    </button>
  );
}

/** Miniature of each template, shown in the template picker. */
function MiniWidget({ id }) {
  const dark = "#1a1a1a";
  const accent = "#6d3bff";
  const base = { position: "absolute", background: dark, display: "block" };

  if (id === "bubble")
    return (
      <span style={{ ...base, right: 8, bottom: 8, width: 16, height: 16, borderRadius: "50%" }}>
        <span style={{ position: "absolute", right: -2, bottom: -2, width: 6, height: 6, borderRadius: "50%", background: accent }} />
      </span>
    );
  if (id === "pill")
    return (
      <span
        style={{
          ...base,
          left: "50%",
          bottom: 8,
          transform: "translateX(-50%)",
          height: 12,
          padding: "0 6px",
          borderRadius: 6,
          color: "#fff",
          fontSize: 6,
          lineHeight: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Cart • 2
      </span>
    );
  if (id === "ring")
    return (
      <span style={{ ...base, right: 8, bottom: 8, width: 18, height: 18, borderRadius: "50%", boxShadow: `0 0 0 2px ${accent}` }} />
    );
  if (id === "tab")
    return (
      <span style={{ ...base, right: 0, bottom: 10, width: 10, height: 20, borderRadius: "4px 0 0 4px" }}>
        <span style={{ position: "absolute", left: 2, bottom: 2, width: 5, height: 5, borderRadius: "50%", background: accent }} />
      </span>
    );
  return (
    <span style={{ ...base, left: 6, right: 6, bottom: 6, height: 12, borderRadius: 6 }}>
      <span style={{ position: "absolute", right: 2, top: 2, width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
    </span>
  );
}

function TemplateTile({ id, label, selected, onSelect }) {
  return (
    <Tooltip content={label} activatorWrapper="div">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${label} template`}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "88 / 58",
          padding: 0,
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          background: "#f1f1f1",
          border: selected ? "2px solid #1a1a1a" : "1px solid #e3e3e3",
        }}
      >
        <span style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", gap: 4 }}>
          <span style={{ flex: 1, height: 12, borderRadius: 3, background: "#dcdcdc" }} />
          <span style={{ flex: 1, height: 12, borderRadius: 3, background: "#dcdcdc" }} />
        </span>
        <MiniWidget id={id} />
      </button>
    </Tooltip>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Live preview                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const SHADOW = "0 4px 14px rgba(0,0,0,0.22)";

function StoreBackdrop({ mobile }) {
  const bar = { height: 8, borderRadius: 4, background: "#e5e5e5" };
  return (
    <div style={{ padding: mobile ? 16 : 24, color: "#1a1a1a" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "#ececec" }} />
        {!mobile && (
          <span style={{ display: "flex", gap: 24 }}>
            {[44, 44, 44].map((w, i) => (
              <span key={i} style={{ ...bar, width: w }} />
            ))}
          </span>
        )}
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "#ececec" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: mobile ? 26 : 34, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Everyday objects,
            <br />
            made well.
          </div>
          <div style={{ ...bar, marginTop: 20, width: "80%" }} />
          <div style={{ ...bar, marginTop: 10, width: "55%" }} />
          <div
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 18px",
              borderRadius: 8,
              background: "#1a1a1a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Shop now
          </div>
        </div>
        {!mobile && (
          <div
            style={{
              height: 240,
              borderRadius: 12,
              background: "#ececed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ width: 140, height: 140, borderRadius: "50%", background: "#d9dadc" }} />
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${mobile ? 2 : 4}, 1fr)`,
          gap: 16,
          marginTop: 28,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: mobile ? 120 : 170, borderRadius: 10, background: "#ececed" }} />
        ))}
      </div>
    </div>
  );
}

function StickyWidget({ s, count, position }) {
  const pos = POSITION_STYLES[position] ?? POSITION_STYLES["bottom-right"];
  const btn = s.buttonSize;
  const glyph = renderGlyph(s.selectedIcon, s.customIconUrl, s.iconColor, s.iconSize);
  const showBadge = s.enableCount && count > 0;

  const glyphWrap = { display: "flex", alignItems: "center", justifyContent: "center" };
  const badgeStyle = (absolute) => ({
    ...(absolute ? { position: "absolute", top: -4, right: -4 } : {}),
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: 10,
    boxSizing: "border-box",
    background: s.qBgColor,
    color: s.qTextColor,
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  const badge = (absolute) =>
    showBadge && (
      <span className="cart-plus__badge" style={badgeStyle(absolute)}>
        {count}
      </span>
    );

  const round = {
    position: "absolute",
    ...pos,
    width: btn,
    height: btn,
    borderRadius: "50%",
    background: s.bgColor,
    boxShadow: SHADOW,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    cursor: "pointer",
    transition: "all .2s",
  };

  if (s.template === "pill") {
    return (
      <div
        id="cart-plus"
        style={{
          position: "absolute",
          ...pos,
          height: btn,
          padding: `0 ${Math.round(btn * 0.4)}px`,
          borderRadius: btn / 2,
          background: s.bgColor,
          color: s.iconColor,
          boxShadow: SHADOW,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 600,
          fontSize: Math.max(13, Math.round(btn * 0.27)),
          whiteSpace: "nowrap",
          zIndex: 5,
          cursor: "pointer",
          transition: "all .2s",
        }}
      >
        <span className="cart-plus__glyph" style={glyphWrap}>{glyph}</span>
        <span>{`Cart${showBadge ? ` • ${count}` : ""}`}</span>
      </div>
    );
  }

  if (s.template === "ring") {
    const size = btn + 12;
    const r = (size - 4) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <div id="cart-plus" style={round}>
        <svg
          className="cart-plus__ring"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute", top: -6, left: -6, transform: "rotate(-90deg)", pointerEvents: "none" }}
          aria-hidden="true"
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.qBgColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.65} ${circ}`}
          />
        </svg>
        <span className="cart-plus__glyph" style={glyphWrap}>{glyph}</span>
        {badge(true)}
      </div>
    );
  }

  if (s.template === "tab") {
    const isLeft = position === "left";
    return (
      <div
        id="cart-plus"
        style={{
          position: "absolute",
          ...pos,
          width: Math.round(btn * 0.8),
          minHeight: Math.round(btn * 1.3),
          padding: "10px 0",
          boxSizing: "border-box",
          background: s.bgColor,
          borderRadius: isLeft ? "0 12px 12px 0" : "12px 0 0 12px",
          boxShadow: SHADOW,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          zIndex: 5,
          cursor: "pointer",
        }}
      >
        <span className="cart-plus__glyph" style={glyphWrap}>{glyph}</span>
        {badge(false)}
      </div>
    );
  }

  if (s.template === "bar") {
    const h = btn + 10;
    const thumb = h - 28;
    const arrow = Math.min(h - 20, 40);
    const chevron = Math.min(s.iconSize, arrow - 8);
    return (
      <div
        id="cart-plus"
        style={{
          position: "absolute",
          ...pos,
          height: h,
          padding: `0 ${Math.round(h * 0.18)}px 0 ${Math.round(h * 0.22)}px`,
          borderRadius: h / 2,
          background: s.bgColor,
          color: s.iconColor,
          boxShadow: SHADOW,
          display: "flex",
          alignItems: "center",
          gap: 14,
          zIndex: 5,
          cursor: "pointer",
        }}
      >
        <span className="cart-plus__glyph" style={{ display: "flex" }}>
          {["#d9d2c5", "#cbc3b3", "#bdb4a1"].map((c, i) => (
            <span
              key={c}
              style={{
                width: thumb,
                height: thumb,
                borderRadius: 8,
                background: c,
                marginLeft: i ? -Math.round(thumb * 0.45) : 0,
                border: `2px solid ${s.bgColor}`,
                boxSizing: "border-box",
              }}
            />
          ))}
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1 }}>
          <strong style={{ fontSize: 18 }}>$54.95</strong>
          {showBadge && (
            <span style={{ fontSize: 12, opacity: 0.85 }}>
              {count} {count === 1 ? "Product" : "Products"}
            </span>
          )}
        </span>
        <span
          style={{
            width: arrow,
            height: arrow,
            borderRadius: "50%",
            background: s.iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={chevron} height={chevron} viewBox="0 0 24 24" fill="none" stroke={s.bgColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    );
  }

  // bubble (default)
  return (
    <div id="cart-plus" style={round}>
      <span className="cart-plus__glyph" style={glyphWrap}>{glyph}</span>
      {badge(true)}
    </div>
  );
}

function StickyPreview({ s }) {
  const [device, setDevice] = useState("desktop");
  const [cartEmpty, setCartEmpty] = useState(false);

  const mobile = device === "mobile";
  const count = cartEmpty ? 0 : PREVIEW_COUNT;
  const position = mobile ? s.mobilePosition : s.position;

  let hiddenReason = null;
  if (mobile && !s.displayOnMobile) hiddenReason = "Hidden on mobile";
  else if (cartEmpty && s.hideOnEmptyCart) hiddenReason = "Hidden while the cart is empty";

  const css = useMemo(() => scopeCss(s.customCss, ".rapi-preview-viewport"), [s.customCss]);

  return (
    <Card padding="0">
      <Box padding="300" borderBlockEndWidth="025" borderColor="border">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <Text as="h3" variant="headingSm">Preview</Text>
          <InlineStack gap="300">
            <ButtonGroup variant="segmented">
              <Button size="slim" icon={DesktopIcon} pressed={!mobile} onClick={() => setDevice("desktop")} accessibilityLabel="Desktop preview" />
              <Button size="slim" icon={MobileIcon} pressed={mobile} onClick={() => setDevice("mobile")} accessibilityLabel="Mobile preview" />
            </ButtonGroup>
            <ButtonGroup variant="segmented">
              <Button size="slim" pressed={!cartEmpty} onClick={() => setCartEmpty(false)}>With items</Button>
              <Button size="slim" pressed={cartEmpty} onClick={() => setCartEmpty(true)}>Empty cart</Button>
            </ButtonGroup>
          </InlineStack>
        </InlineStack>
      </Box>

      {/* browser chrome */}
      <Box padding="300" borderBlockEndWidth="025" borderColor="border" background="bg-surface-secondary">
        <InlineStack gap="150" blockAlign="center" wrap={false}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "block" }} />
          ))}
          <span style={{ flex: 1, height: 10, borderRadius: 4, background: "#e5e7eb", marginLeft: 6, display: "block" }} />
        </InlineStack>
      </Box>

      <div style={{ background: "#e9e9ea", display: "flex", justifyContent: "center" }}>
        <div
          className="rapi-preview-viewport"
          style={{
            position: "relative",
            width: mobile ? 390 : "100%",
            maxWidth: "100%",
            height: PREVIEW_HEIGHT,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
          <StoreBackdrop mobile={mobile} />

          {hiddenReason ? (
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 6 }}>
              <Badge>{hiddenReason}</Badge>
            </div>
          ) : (
            <StickyWidget s={s} count={count} position={position} />
          )}
        </div>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export default function StickyCart() {
  const { shop, apiUrl, accessToken, stickyCart } = useLoaderData();
  const navigate = useNavigate();
  const Storeshop = shop?.myshopifyDomain;

  const [settings, setSettings] = useState(() => buildSettings(stickyCart));
  const [baseline, setBaseline] = useState(() => buildSettings(stickyCart));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [swatchOpen, setSwatchOpen] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconUploadError, setIconUploadError] = useState("");
  const fileInputRef = useRef(null);

  const [resetModal, setResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const set = (patch) => setSettings((prev) => ({ ...prev, ...patch }));
  const s = settings;

  const isDirty = useMemo(
    () => stableStringify(settings) !== stableStringify(baseline),
    [settings, baseline]
  );

  // Re-sync when the loader data changes (e.g. navigating back to this page)
  useEffect(() => {
    const next = buildSettings(stickyCart);
    setSettings(next);
    setBaseline(next);
  }, [stickyCart]);

  // Shopify contextual save bar
  useEffect(() => {
    if (!window.shopify?.saveBar) return;
    if (isDirty) window.shopify.saveBar.show("my-save-bar");
    else window.shopify.saveBar.hide("my-save-bar");
  }, [isDirty]);

  const toast = (msg) => window.shopify?.toast?.show?.(msg);

  const toPayload = (values) => ({
    shop: Storeshop,
    cartId: stickyCart?.cartId,
    ...values,
    // kept for older readers of the record
    device: values.displayOnMobile ? "all" : "desktop",
  });

  const chooseTemplate = (template) =>
    setSettings((prev) => ({
      ...prev,
      template,
      position: coercePosition(template, prev.position),
      mobilePosition: coercePosition(template, prev.mobilePosition),
    }));

  /* ── custom icon upload ── */
  const handleIconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconUploadError("");

    if (!ALLOWED_ICON_TYPES.includes(file.type)) {
      setIconUploadError("Please choose a PNG or SVG file for the cart icon.");
      e.target.value = "";
      return;
    }

    try {
      setUploadingIcon(true);
      const res = await uploadImage(apiUrl, file, shop, accessToken);
      if (res?.success && res?.imageUrl) {
        set({ customIconUrl: res.imageUrl, selectedIcon: "custom" });
      } else {
        setIconUploadError("Icon upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Icon upload error:", err);
      setIconUploadError("Icon upload failed. Please try again.");
    } finally {
      setUploadingIcon(false);
      e.target.value = "";
    }
  };

  /* ── save / discard / reset ── */
  const handleSave = async () => {
    if (saving) return;
    const saveBtn = document.getElementById("save-btn");
    setSaving(true);
    setError("");
    saveBtn?.setAttribute("loading", "");

    try {
      const [res] = await Promise.all([
        createStickyCart(apiUrl, toPayload(settings)),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      if (res?.success) {
        setBaseline(settings);
        toast("Sticky cart saved");
      } else {
        setError("We couldn't save your sticky cart. Please try again.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("We couldn't save your sticky cart. Please try again.");
    } finally {
      setSaving(false);
      saveBtn?.removeAttribute("loading");
    }
  };

  const handleDiscard = () => {
    setSettings(baseline);
    setError("");
  };

  const handleResetToDefault = async () => {
    setIsResetting(true);
    setError("");
    const defaults = buildSettings(null);

    try {
      const res = await createStickyCart(apiUrl, toPayload(defaults));
      if (res?.success) {
        setSettings(defaults);
        setBaseline(defaults);
        toast("Sticky cart reset to default");
      } else {
        setError("We couldn't reset your sticky cart. Please try again.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setError("We couldn't reset your sticky cart. Please try again.");
    } finally {
      setIsResetting(false);
      setResetModal(false);
    }
  };

  /* ── derived UI state ── */
  const hasIconPicker = s.template !== "bar";
  const countColorsDisabled = !s.enableCount || s.template === "pill" || s.template === "bar";
  const positionOptions = positionOptionsFor(s.template);
  const savedEnabled = baseline.enabled;

  return (
    <AppProvider>
      <ui-save-bar id="my-save-bar">
        <button variant="primary" id="save-btn" onClick={handleSave}>
          Save
        </button>
        <button onClick={handleDiscard}>Discard</button>
      </ui-save-bar>

      <Page fullWidth
        title="Customize Your Sticky Cart"
        titleMetadata={
          savedEnabled ? <Badge tone="success">Live</Badge> : <Badge tone="info">Draft</Badge>
        }
        backAction={{ content: "Back", onAction: () => navigate("/app") }}
        secondaryActions={[
          {
            content: "Reset to default",
            destructive: true,
            disabled: saving || isResetting,
            onAction: () => setResetModal(true),
          },
        ]}
      >
        <BlockStack gap="400">
          {error && (
            <Banner tone="critical" onDismiss={() => setError("")}>
              {error}
            </Banner>
          )}

          <Layout>
            {/* ── Settings ─────────────────────────────────────────────── */}
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="500">
                  <ToggleRow
                    checked={s.enabled}
                    onChange={(v) => set({ enabled: v })}
                    title={s.enabled ? "Sticky cart is enabled" : "Sticky cart is disabled"}
                  />

                  {/* Template */}
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center" gap="200">
                      <Text as="h3" variant="headingSm">Template</Text>
                      <InlineStack gap="200" blockAlign="center">
                        <Popover
                          active={swatchOpen}
                          onClose={() => setSwatchOpen(false)}
                          preferredAlignment="right"
                          activator={
                            <Button
                              disclosure
                              onClick={() => setSwatchOpen((o) => !o)}
                              accessibilityLabel="Template color"
                            >
                              <span
                                style={{
                                  display: "block",
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  background: s.bgColor,
                                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                }}
                              />
                            </Button>
                          }
                        >
                          <Box padding="300">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 22px)", gap: 10 }}>
                              {PRESET_COLORS.map((c) => {
                                const selected = s.bgColor.toLowerCase() === c;
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    aria-label={`Use color ${c}`}
                                    aria-pressed={selected}
                                    onClick={() => {
                                      set({ bgColor: c });
                                      setSwatchOpen(false);
                                    }}
                                    style={{
                                      width: 22,
                                      height: 22,
                                      padding: 0,
                                      border: 0,
                                      borderRadius: "50%",
                                      background: c,
                                      cursor: "pointer",
                                      boxShadow: selected ? "0 0 0 2px #fff, 0 0 0 4px #1a1a1a" : "none",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </Box>
                        </Popover>

                        <Button
                          icon={PlusCircleIcon}
                          pressed={customColorOpen}
                          onClick={() => setCustomColorOpen((o) => !o)}
                        >
                          Custom
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    <Collapsible open={customColorOpen} id="custom-template-color">
                      <Box paddingBlockEnd="100">
                        <ColorInput
                          label="Custom color"
                          value={s.bgColor}
                          onChange={(v) => set({ bgColor: v })}
                        />
                      </Box>
                    </Collapsible>

                    <InlineGrid columns={5} gap="200">
                      {TEMPLATES.map((t) => (
                        <TemplateTile
                          key={t.id}
                          id={t.id}
                          label={t.label}
                          selected={s.template === t.id}
                          onSelect={() => chooseTemplate(t.id)}
                        />
                      ))}
                    </InlineGrid>

                    {s.template === "ring" && (
                      <Banner tone="info">
                        The ring mirrors your cart's progress-bar status, so it only works on
                        carts that have the Progress Bar feature enabled.
                      </Banner>
                    )}
                  </BlockStack>

                  {/* Icon */}
                  {hasIconPicker && (
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">Icon</Text>
                      <InlineStack gap="200" blockAlign="center">
                        {ICON_IDS.map((id) => (
                          <IconTile
                            key={id}
                            label={ICON_LABELS[id]}
                            selected={s.selectedIcon === id}
                            onClick={() => set({ selectedIcon: id })}
                          >
                            <CartGlyph id={id} color="#303030" size={22} />
                          </IconTile>
                        ))}

                        {s.customIconUrl && (
                          <IconTile
                            label="Custom icon"
                            selected={s.selectedIcon === "custom"}
                            onClick={() => set({ selectedIcon: "custom" })}
                          >
                            <img
                              src={s.customIconUrl}
                              alt=""
                              style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
                            />
                          </IconTile>
                        )}

                        <Tooltip content="PNG or SVG only.">
                          <IconTile
                            dashed
                            label="Upload a custom icon"
                            disabled={uploadingIcon}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploadingIcon ? (
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  border: "2px solid #d1d5db",
                                  borderTopColor: "#6b7280",
                                  animation: "stickyCartIconSpin 0.7s linear infinite",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 22, color: "#6b7280" }}>+</span>
                            )}
                          </IconTile>
                        </Tooltip>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ALLOWED_ICON_EXTENSIONS}
                          onChange={handleIconFileChange}
                          style={{ display: "none" }}
                        />
                      </InlineStack>

                      {iconUploadError && (
                        <Text variant="bodySm" tone="critical" as="p">{iconUploadError}</Text>
                      )}

                      {s.selectedIcon === "custom" && s.customIconUrl && (
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="bodySm" tone="subdued" as="span">Using custom icon</Text>
                          <Button
                            variant="plain"
                            tone="critical"
                            onClick={() => set({ customIconUrl: null, selectedIcon: "bag" })}
                          >
                            Remove
                          </Button>
                        </InlineStack>
                      )}
                    </BlockStack>
                  )}

                  <ColorInput
                    label="Icon color"
                    value={s.iconColor}
                    onChange={(v) => set({ iconColor: v })}
                  />

                  {/* Sizes */}
                  <InlineGrid columns={2} gap="400">
                    <RangeSlider
                      label="Button size"
                      min={BUTTON_SIZE_MIN}
                      max={BUTTON_SIZE_MAX}
                      step={1}
                      value={s.buttonSize}
                      onChange={(v) => set({ buttonSize: Number(v) })}
                      suffix={<Text as="span" variant="bodySm" tone="subdued">{s.buttonSize}px</Text>}
                    />
                    <RangeSlider
                      label="Icon size"
                      min={ICON_SIZE_MIN}
                      max={ICON_SIZE_MAX}
                      step={1}
                      value={s.iconSize}
                      onChange={(v) => set({ iconSize: Number(v) })}
                      suffix={<Text as="span" variant="bodySm" tone="subdued">{s.iconSize}px</Text>}
                    />
                  </InlineGrid>

                  <Select
                    label="Positioning on desktop"
                    options={positionOptions}
                    value={s.position}
                    onChange={(v) => set({ position: v })}
                  />

                  {/* Enable count */}
                  <Panel>
                    <ToggleRow
                      checked={s.enableCount}
                      onChange={(v) => set({ enableCount: v })}
                      title="Enable count"
                    />
                    <BlockStack gap="200">
                      <Text as="h4" variant="bodyMd" fontWeight="semibold">Colors</Text>
                      <fieldset
                        disabled={countColorsDisabled}
                        style={{
                          border: 0,
                          margin: 0,
                          padding: 0,
                          minWidth: 0,
                          opacity: countColorsDisabled ? 0.5 : 1,
                          pointerEvents: countColorsDisabled ? "none" : "auto",
                        }}
                      >
                        <InlineGrid columns={2} gap="300">
                          <ColorInput
                            label="Background"
                            value={s.qBgColor}
                            onChange={(v) => set({ qBgColor: v })}
                          />
                          <ColorInput
                            label="Text"
                            value={s.qTextColor}
                            onChange={(v) => set({ qTextColor: v })}
                          />
                        </InlineGrid>
                      </fieldset>
                      {(s.template === "pill" || s.template === "bar") && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          This template shows the count inside its label, so badge colors don't apply.
                        </Text>
                      )}
                      {s.template === "ring" && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          The background color is also used for the progress ring.
                        </Text>
                      )}
                    </BlockStack>
                  </Panel>

                  {/* Hide on empty */}
                  <Panel>
                    <ToggleRow
                      checked={s.hideOnEmptyCart}
                      onChange={(v) => set({ hideOnEmptyCart: v })}
                      title="Hide when cart is empty"
                    />
                  </Panel>

                  {/* Mobile */}
                  <Panel>
                    <ToggleRow
                      checked={s.displayOnMobile}
                      onChange={(v) => set({ displayOnMobile: v })}
                      title="Display on mobile"
                    />
                    {s.displayOnMobile && (
                      <Select
                        label="Positioning on mobile"
                        options={positionOptions}
                        value={s.mobilePosition}
                        onChange={(v) => set({ mobilePosition: v })}
                      />
                    )}
                  </Panel>

                  {/* Custom CSS */}
                  <TextField
                    label="Custom CSS"
                    value={s.customCss}
                    onChange={(v) => set({ customCss: v })}
                    multiline={5}
                    monospaced
                    autoComplete="off"
                    placeholder="#cart-plus { box-shadow: 0 6px 20px rgba(0,0,0,.25); }"
                    helpText="Targets #cart-plus and its .cart-plus__glyph / .cart-plus__badge children."
                  />
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* ── Preview ──────────────────────────────────────────────── */}
            <Layout.Section>
              <div style={{ position: "sticky", top: 16 }}>
                <BlockStack gap="300">
                  <StickyPreview s={s} />

                  {isDirty && (
                    <InlineStack align="end" gap="200">
                      <Button onClick={handleDiscard} disabled={saving}>Discard changes</Button>
                      <Button variant="primary" onClick={handleSave} loading={saving}>
                        Save
                      </Button>
                    </InlineStack>
                  )}
                </BlockStack>
              </div>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>

      <style>{`
        @keyframes stickyCartIconSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Reset to default confirmation */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Reset to default settings?"
        size="small"
        primaryAction={{
          content: "Reset to default",
          tone: "critical",
          loading: isResetting,
          onAction: handleResetToDefault,
        }}
        secondaryActions={[
          { content: "Cancel", disabled: isResetting, onAction: () => setResetModal(false) },
        ]}
      >
        <Modal.Section>
          <Text as="p" tone="subdued">
            This restores the sticky cart button to its default template, colors, sizes and
            positioning, and saves immediately. Your current customizations will be lost and
            this can't be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}