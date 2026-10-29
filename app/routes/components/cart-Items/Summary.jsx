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
    designSettings?.dark && String(savedSummary.textColor).toLowerCase() === "#303030"
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

  const row = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  };

  // same rows and values for every design, only the styling differs
  const items = [
    { key: "mrp", icon: "tag", label: "Total MRP", value: money(compare || total) },
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
      label: s.subtotalLabel,
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
      label: s.shippingLabel,
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

  const design = s.design;
  // Template theme: Card / Striped borders follow the theme colour
  const themeBorder = designSettings?.accentBorder;
  const wrapStyle = {
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
  }[design] || {};
  const itemStyle = {
    classic: row,
    card: row,
    striped: {
      ...row,
      padding: "8px 0",
      borderBottom: `1px solid ${themeBorder || "rgba(0,0,0,0.08)"}`,
    },
  }[design] || row;
  const totalStyle = {
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
  }[design] || row;

  const rows = (
    <div style={wrapStyle}>
      {items.map((it) => (
        <div key={it.key} style={itemStyle}>
          {label(it.icon, it.label)}
          <span>{it.value}</span>
        </div>
      ))}
      <div style={totalStyle}>
        {label("total", "Grand Total")}
        <span>{money(total)}</span>
      </div>
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
      {!s.expandable && s.title.replace(/<[^>]*>|&nbsp;/g, "").trim() && (
        <div style={{ marginBottom: 6, ...titleRow }}>
          {titleIcon}
          <span dangerouslySetInnerHTML={{ __html: s.title }} />
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
            <span dangerouslySetInnerHTML={{ __html: s.title }} />
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
