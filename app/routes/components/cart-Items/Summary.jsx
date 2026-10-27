import { useEffect, useState } from "react";
import { backgroundToCss } from "../utils/background";
import { getSummary } from "../utils/summary";

// Preview of the cart summary rows (subtotal / savings / applied discounts)
export default function Summary({
  cartSettings,
  currency,
  subtotal,
  compareTotal,
  discountCodes = [],
  designSettings,
}) {
  const s = getSummary(cartSettings);
  const [open, setOpen] = useState(s.expandable ? !s.collapsedByDefault : true);

  useEffect(() => {
    setOpen(s.expandable ? !s.collapsedByDefault : true);
  }, [s.expandable, s.collapsedByDefault]);

  if (!s.enabled) return null;

  const total = Number(subtotal) || 0;
  const compare = Number(compareTotal) > total ? Number(compareTotal) : 0;
  const saved = compare - total;
  const money = (n) => `${currency} ${Number(n).toFixed(2)}`;

  const row = { display: "flex", justifyContent: "space-between", gap: 8 };

  const rows = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={row}>
        <span>Total MRP</span>
        <span>{money(compare || total)}</span>
      </div>
      {s.showDiscountsRow && saved > 0 && (
        <div style={row}>
          <span>{s.discountsRowLabel}</span>
          <span>-{money(saved)}</span>
        </div>
      )}
      {s.showSubtotal && (
        <div style={row}>
          <span>{s.subtotalLabel}</span>
          <span>
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
          </span>
        </div>
      )}
      {s.showAppliedDiscounts && discountCodes.length > 0 && (
        <div style={row}>
          <span>{s.appliedDiscountsLabel}</span>
          <span>{discountCodes.join(", ")}</span>
        </div>
      )}
      {s.showShipping && (
        <div style={row}>
          <span>{s.shippingLabel}</span>
          {s.showShippingFree && (
            <span style={{ color: "#10812F" }}>{s.shippingFreeLabel}</span>
          )}
        </div>
      )}
      <div
        style={{
          ...row,
          fontWeight: 600,
          borderTop: "1px solid rgba(0,0,0,0.1)",
          paddingTop: 6,
        }}
      >
        <span>Grand Total</span>
        <span>{money(total)}</span>
      </div>
    </div>
  );

  return (
    <div
      className="cart-plus-summary"
      style={{
        color: s.textColor,
        background: backgroundToCss(s.background),
        padding: "8px 16px",
        fontSize: 14,
      }}
    >
      {!s.expandable && s.title.replace(/<[^>]*>|&nbsp;/g, "").trim() && (
        <div
          style={{ marginBottom: 6 }}
          dangerouslySetInnerHTML={{ __html: s.title }}
        />
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
          <span dangerouslySetInnerHTML={{ __html: s.title }} />
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
