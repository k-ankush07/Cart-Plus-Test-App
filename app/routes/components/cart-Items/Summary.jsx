import { useEffect, useState } from "react";
import { backgroundToCss } from "../utils/background";
import { getSummary } from "../utils/summary";
import { LibraryIcon } from "../ui/IconLibrary";

const ICON_PATHS = {
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  percent:
    "M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  receipt:
    "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 8h8M8 12h8M8 16h5",
  ticket:
    "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2zM13 5v2M13 17v2M13 11v2",
  truck:
    "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  total: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
};

// 24-point scalloped badge outline
const BADGE_POINTS = Array.from({ length: 24 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
  const r = i % 2 === 0 ? 11.6 : 9.9;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

const shade = (hex, amt) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16),
    g = c((n >> 8) & 255),
    b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

function SummaryIcon({ name, color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// Preview of the cart summary rows (subtotal / savings / applied discounts)
export default function Summary({
  cartSettings,
  currency,
  subtotal,
  compareTotal,
  discountCodes = [],
  designSettings,
}) {
  const savedSummary = getSummary(cartSettings);
  // Appearance: Dark -> the saved light text colour becomes the theme's text colour
  const s =
    designSettings?.dark &&
    String(savedSummary.textColor).toLowerCase() === "#303030"
      ? { ...savedSummary, textColor: designSettings.textColor }
      : savedSummary;
  const [open, setOpen] = useState(s.expandable ? !s.collapsedByDefault : true);

  useEffect(() => {
    setOpen(s.expandable ? !s.collapsedByDefault : true);
  }, [s.expandable, s.collapsedByDefault]);

  if (!s.enabled) return null;

  const total = Number(subtotal) || 0;
  const compare = Number(compareTotal) > total ? Number(compareTotal) : 0;
  const saved = compare - total;
  const money = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const designTitles = {
    "bill-details": "Bill details",
    "bill-summary": "Bill Summary",
    "price-details": "Price Details",
  };
  const displayTitle =
    s.title === "Summary" ? designTitles[s.design] || s.title : s.title;

  const row = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  };

  // same rows and values for every design, only the styling differs
  const items = [
    {
      key: "mrp",
      icon: "tag",
      label: "Total MRP",
      value: money(compare || total),
    },
    s.showDiscountsRow &&
      saved > 0 && {
        key: "savings",
        icon: "percent",
        label: s.discountsRowLabel,
        value: `-${money(saved)}`,
      },
    s.showSubtotal && {
      key: "subtotal",
      icon: "receipt",
      label:
        s.design === "bill-details" && s.subtotalLabel === "Subtotal"
          ? "Items total"
          : s.design === "bill-summary" && s.subtotalLabel === "Subtotal"
            ? "Item Total"
            : s.subtotalLabel,
      value: (
        <>
          {money(total)}
          {s.compareAtSavings && compare > 0 && (
            <span style={{ marginLeft: 6, opacity: 0.6 }}>
              {s.compareAtMode === "percentage" ? (
                `(-${Math.round((saved / compare) * 100)}%)`
              ) : (
                <s>{money(compare)}</s>
              )}
            </span>
          )}
        </>
      ),
    },
    s.showAppliedDiscounts &&
      discountCodes.length > 0 && {
        key: "applied",
        icon: "ticket",
        label: s.appliedDiscountsLabel,
        value: discountCodes.join(", "),
      },
    s.showShipping && {
      key: "shipping",
      icon: "truck",
      label:
        s.design === "bill-details" && s.shippingLabel === "Shipping"
          ? "Delivery charge"
          : s.design === "bill-summary" && s.shippingLabel === "Shipping"
            ? "Delivery Fee"
            : s.shippingLabel,
      value: s.showShippingFree ? (
        <span style={{ color: "#10812F" }}>{s.shippingFreeLabel}</span>
      ) : null,
    },
  ].filter(Boolean);

  const label = (icon, text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {s.showIcons && <SummaryIcon name={icon} color={s.textColor} />}
      {text}
    </span>
  );

  const bannerBg = s.savingsBannerBg || "#b6eb98";
  const bannerTextColor = s.savingsBannerTextColor || "#1d2b1a";

  const design = s.design;
  // Template theme: Card / Striped borders follow the theme colour
  const themeBorder = designSettings?.accentBorder;
  const wrapStyle =
    {
      classic: { display: "flex", flexDirection: "column", gap: 6 },
      card: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: `1px solid ${themeBorder || "rgba(0,0,0,0.12)"}`,
        borderRadius: 12,
        padding: 12,
      },
      striped: { display: "flex", flexDirection: "column" },
      "bill-details": {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "#fff",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 2px 12px rgba(20, 45, 80, 0.08)",
      },
      "bill-summary": {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "#fff",
        border: `1px solid ${themeBorder || "#e5e9f0"}`,
        borderRadius: 10,
        padding: 12,
      },
      "price-details": {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "#fff",
        borderRadius: 10,
        padding: 12,
        boxShadow: "0 2px 10px rgba(20, 45, 80, 0.06)",
      },
    }[design] || {};
  const itemStyle =
    {
      classic: row,
      card: row,
      striped: {
        ...row,
        padding: "8px 0",
        borderBottom: `1px solid ${themeBorder || "rgba(0,0,0,0.08)"}`,
      },
      "bill-details": row,
      "bill-summary": {
        ...row,
        color: "#667085",
        fontSize: 12,
      },
      "price-details": row,
    }[design] || row;
  const totalStyle =
    {
      classic: {
        ...row,
        fontWeight: 600,
        borderTop: "1px solid rgba(0,0,0,0.1)",
        paddingTop: 6,
      },
      card: {
        ...row,
        fontWeight: 700,
        fontSize: 16,
        borderTop: `1px dashed ${themeBorder || "rgba(0,0,0,0.2)"}`,
        paddingTop: 10,
        marginTop: 2,
      },
      striped: {
        ...row,
        fontWeight: 700,
        background: "rgba(0,0,0,0.05)",
        borderRadius: 8,
        padding: "10px 12px",
        marginTop: 8,
      },
      "bill-details": {
        ...row,
        fontWeight: 700,
        borderTop: "1px dashed #9db8ec",
        paddingTop: 10,
        marginTop: 2,
      },
      "bill-summary": {
        ...row,
        fontWeight: 700,
        color: s.textColor,
        borderTop: "1px solid #e8ebf0",
        paddingTop: 10,
        marginTop: 2,
      },
      "price-details": {
        ...row,
        fontWeight: 700,
        fontSize: 15,
        borderTop: "1px solid #e8ebf0",
        paddingTop: 10,
        marginTop: 2,
      },
    }[design] || row;

  const rows = (
    <div style={wrapStyle}>
      {items.map((it) => (
        <div
          key={it.key}
          style={{
            ...itemStyle,
            ...(design === "price-details" && it.key === "savings"
              ? { color: "#16803c" }
              : {}),
          }}
        >
          {label(it.icon, it.label)}
          <span>{it.value}</span>
        </div>
      ))}
      <div style={totalStyle}>
        {label(
          "total",
          design === "bill-summary"
            ? "To Pay"
            : design === "price-details"
              ? "Total Amount"
              : "Grand Total",
        )}
        <span>{money(total)}</span>
      </div>
      {design === "price-details" && saved > 0 && s.showSavingsBanner && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "4px 10px",
            marginTop: 6,
            borderRadius: 8,
            border: "1px solid #b7e8a0",
            border: `1px solid ${shade(bannerBg, -25)}`,
            background: `linear-gradient(90deg, ${shade(bannerBg, -12)} 0%, ${bannerBg} 50%, ${shade(bannerBg, 6)} 100%)`,
            color: s.savingsBannerTextColor || "#1d2b1a",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {/* soft diagonal shine, like the Figma sheen */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 60%)",
            }}
          />

          
          <span style={{ position: "relative" }}>
            {(s.savingsBannerText || "You're saving {amount} on this order")
              .split("{amount}")
              .map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15 ,
                        textDecoration: "underline",
                        textDecorationColor: "#2f8f4e",
                        textDecorationThickness: 2,
                        textUnderlineOffset: 4,
                      }}
                    >
                      {currency} {Math.round(saved).toLocaleString("en-IN")}
                    </span>
                  )}
                </span>
              ))}
          </span>
        </div>
      )}
    </div>
  );

  // icon picked in the Summary settings, shown before the title
  const titleIcon = s.showIcons && s.titleIcon && (
    <LibraryIcon value={s.titleIcon} size={18} color={s.textColor} />
  );
  const titleRow = { display: "inline-flex", alignItems: "center", gap: 8 };

  return (
    <div
      className="cart-plus-summary"
      style={{
        color: s.textColor,
        background: backgroundToCss(s.background),
        padding: "12px 16px",
        fontSize: 13,
      }}
    >
      {!s.expandable && displayTitle.replace(/<[^>]*>|&nbsp;/g, "").trim() && (
        <div style={{ marginBottom: 6, ...titleRow }}>
          {titleIcon}
          <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
        </div>
      )}
      {s.expandable && (
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          style={{
            all: "unset",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: open ? 6 : 0,
          }}
        >
          <span style={titleRow}>
            {titleIcon}
            <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
          </span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            stroke={s.textColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              alignSelf: "center",
              transition: "transform 0.3s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path d="M1 1L6 6L11 1" />
          </svg>
        </button>
      )}
      {open && rows}
    </div>
  );
}
