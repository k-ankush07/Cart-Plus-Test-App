import { useState, useEffect, useCallback } from "react";
import { resolveDiscountStyle } from "../utils/discountTemplates";
import { LibraryIcon } from "../ui/IconLibrary";

const API_KEY = import.meta.env.VITE_API_SECRET_KEY || "";

const TagIcon = ({ color = "currentColor", size = 16 }) => (
  <svg viewBox="0 0 20 20" width={size} height={size} style={{ fill: color }}>
    <path
      fillRule="evenodd"
      d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
    />
  </svg>
);

const authHeaders = (extra = {}) => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
  ...extra,
});

const toCodeString = (d) =>
  typeof d === "string" ? d : d?.code || d?.title || "";

const formatBadgeText = (discount) => {
  const dv = discount?.discountValue;
  if (!dv) return "";
  if (dv.type === "percentage") return `${dv.value}% OFF`;
  if (dv.type === "fixed_amount" || dv.type === "fixed")
    return `₹${dv.value} OFF`;
  return "";
};

const formatSavingsText = (discount, currency, cartTotal) => {
  const dv = discount?.discountValue;
  if (!dv) return "Apply this offer at checkout";

  if (dv.type === "percentage") {
    if (cartTotal) {
      let amount = (cartTotal * dv.value) / 100;
      if (discount.maximumDiscount)
        amount = Math.min(amount, discount.maximumDiscount);
      return `Save ${currency} ${Math.round(amount)} on this order!`;
    }
    return `Save ${dv.value}% on this order!`;
  }

  if (dv.type === "fixed_amount" || dv.type === "fixed") {
    return `Save ${currency} ${dv.value} on this order!`;
  }

  return "Apply this offer at checkout";
};

// sample rows shown in the editor preview before any code is really applied
const SAMPLE_APPLIED = [
  { code: "SAVE15", amount: 711.75 },
  { code: "EXTRAS", amount: 237.25 },
];

const discountAmount = (d, total = 0) => {
  const dv = d?.discountValue;
  if (!dv) return 0;
  if (dv.type === "percentage") {
    let a = (total * dv.value) / 100;
    if (d.maximumDiscount) a = Math.min(a, d.maximumDiscount);
    return a;
  }
  return Number(dv.value) || 0;
};

const num = (v) => (v === "" || v == null ? undefined : Number(v));

const PercentBadge = ({ bg, fg = "#fff", text = "%", size = 35, radius = 22 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      color: fg,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: size * 0.42,
      flexShrink: 0,
    }}
  >
    {text}
  </span>
);

const XBtn = ({ onClick, color }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Remove code"
    style={{
      background: "none",
      border: 0,
      cursor: "pointer",
      color,
      padding: 2,
      display: "inline-flex",
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 20 20" style={{ width: 20, height: 20 }}>
    <path
      fillRule="evenodd"
      d="M16.5 10a.75.75 0 0 1-.75.75h-9.69l2.72 2.72a.75.75 0 0 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 1 1 1.06 1.06l-2.72 2.72h9.69a.75.75 0 0 1 .75.75Z"
    />
  </svg>
);

const CouponIconSvg = ({ color }) => (
  <svg viewBox="0 0 20 20" width="20" height="20" style={{ fill: color }}>
    <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z" />
    <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    <path
      fillRule="evenodd"
      d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"
    />
  </svg>
);

function CouponCard({
  code,
  badgeText,
  savings,
  description,
  onApply,
  loading,
  showOfferBgColor,
}) {
  return (
    <div className="cart-plus-offer-listing">
      <div className="cart-plus-offers-list">
        <div className="cart-plus-coupon-card">
          <div className="cart-plus-coupon-badge">
            <svg
              className="cart-plus-coupon-badge__bg"
              width="250"
              height="460"
              viewBox="0 0 124 460"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M124 460H40C17.9086 460 4.02715e-07 442.091 0 420V348.34C9.56574 348.34 17.3203 340.585 17.3203 331.02C17.3203 321.454 9.56574 313.699 0 313.699V280.699C9.56574 280.699 17.3203 272.945 17.3203 263.379C17.3203 253.813 9.56574 246.059 0 246.059V213.059C9.56574 213.059 17.3203 205.304 17.3203 195.738C17.3203 186.173 9.56574 178.418 0 178.418V145.418C9.56574 145.418 17.3203 137.663 17.3203 128.098C17.3203 118.532 9.56574 110.777 0 110.777V40C0 17.9086 17.9086 0 40 0H124V460Z"
                fill={showOfferBgColor}
              />
            </svg>
            <span className="cart-plus-coupon-badge__text">{badgeText}</span>
          </div>
          <div className="cart-plus-coupon-body">
            <div className="cart-plus-coupon-top">
              <span className="cart-plus-coupon-code">{code}</span>
              <button
                className="cart-plus-coupon-action-btn apply"
                onClick={() => onApply?.(code)}
                disabled={loading}
              >
                {loading ? <span className="loader" /> : "APPLY"}
              </button>
            </div>
            <div className="cart-plus-coupon-savings">{savings}</div>
            <div className="cart-plus-coupon-desc">
              {description || `Use code ${code} & enjoy this offer`}
            </div>
            <div
              className="cart-plus-coupon-error"
              id={`coupon-error-${code}`}
              style={{ color: "black", fontSize: "12px", marginTop: "5px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscountCode({
  discountCodesSettings,
  offerOpen,
  setOfferOpen,
  designSettings,
  currency,
  shop,
  apiUrl,
  subtotal = 0, // pass the cart subtotal so % discounts get a real amount
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState("");
  const [invalid, setInvalid] = useState(false);

  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState("");

  // applied codes (for Compact card / Chip badges templates)
  const [applied, setApplied] = useState([]);
  const [touched, setTouched] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const iconColor = designSettings?.iconColor || "#0000";

  const fetchDiscounts = useCallback(async () => {
    if (!shop) return;

    setDiscountsLoading(true);
    setDiscountsError("");
    try {
      const res = await fetch(`${apiUrl}/api/discounts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ shop }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();

      const allDiscountCodes = data.allDiscountCodes || data.discounts || [];

      const valid = allDiscountCodes.filter(
        (d) =>
          d.title &&
          d.status !== "EXPIRED" &&
          d.type !== "DiscountAutomaticApp" &&
          d.type !== "DiscountAutomaticBasic",
      );

      setDiscounts(valid);
    } catch (err) {
      console.error("[hub] Failed to fetch discounts:", err);
      setDiscountsError("Couldn't load offers right now.");
    } finally {
      setDiscountsLoading(false);
    }
  }, [shop, apiUrl]);

  useEffect(() => {
    if (offerOpen) {
      fetchDiscounts();
    }
  }, [offerOpen, fetchDiscounts]);

  if (discountCodesSettings?.enabled) return null;

  const cs = discountCodesSettings || {};
  const T = resolveDiscountStyle(cs);
  const layout = T.layout; // "compact" | "chipbadges" | undefined (classic)

  const placeholder = cs.placeholder || "Discount code";
  const buttonText = cs.buttonText || "Apply";
  const showOfferBgColor = cs.showOfferBgColor || "#6C4DFF";
  const invalidMessage =
    cs.invalidCodeMessage ??
    "This discount code isn't valid. Please check the code and try again.";

  const invalidBox = invalid &&
    invalidMessage.replace(/<[^>]*>|&nbsp;/g, "").trim() && (
      <div
        role="alert"
        className="cart-plus-discount-invalid"
        style={{ color: T.invalidColor, fontSize: 12, marginTop: 6 }}
        dangerouslySetInnerHTML={{ __html: invalidMessage }}
      />
    );

  const applyDiscountCode = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    setApplyingCode(trimmed);
    setInvalid(false);
    setLoading(true);
    // TODO: replace with real cart-apply API call.
    // Until then the preview treats any code that is not in the loaded offers as invalid.
    setTimeout(() => {
      const d = discounts.find(
        (x) => toCodeString(x).toUpperCase() === trimmed.toUpperCase(),
      );
      setLoading(false);
      setApplyingCode("");
      if (d) {
        const up = trimmed.toUpperCase();
        setApplied((p) =>
          p.some((a) => a.code === up)
            ? p
            : [...p, { code: up, amount: discountAmount(d, subtotal) }],
        );
        setTouched(true);
        setCode("");
        setShowInput(false);
      } else {
        setInvalid(true);
      }
    }, 2000);
  };

  const handleDiscount = () => applyDiscountCode(code);
  const handleClose = () => setOfferOpen(false);
  const isThisButtonLoading = loading && applyingCode === code.trim();

  // applied list: sample rows in the editor until a real code is applied
  const list = touched || applied.length ? applied : SAMPLE_APPLIED;
  const totalSaved = list.reduce((s, a) => s + a.amount, 0);
  const moreCount = Math.max(1, discounts.length - list.length);
  const money = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const removeCode = (c) => {
    setApplied(list.filter((a) => a.code !== c));
    setTouched(true);
  };
  const clearAll = () => {
    setApplied([]);
    setTouched(true);
  };
  const openOffers = () => setOfferOpen(!offerOpen);

  // ───────── shared pieces for Compact / Chip ─────────
  const tInput = (extra = {}) => (
    <input
      type="text"
      placeholder={placeholder}
      value={code}
      disabled={loading}
      onChange={(e) => {
        setCode(e.target.value);
        setInvalid(false);
      }}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "10px 12px",
        fontSize: 13,
        color: T.inputColor,
        background: T.inputBg,
        border: `1px solid ${T.inputBorder}`,
        borderRadius: T.inputRadius,
        outline: "none",
        ...extra,
      }}
    />
  );

  const tButton = (extra = {}) => (
    <button
      type="button"
      onClick={handleDiscount}
      disabled={loading}
      style={{
        background: T.buttonBg,
        color: T.buttonColor,
        border: 0,
        borderRadius: T.buttonRadius,
        padding: "8px 18px",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer",
        ...extra,
      }}
    >
      {isThisButtonLoading ? (
        <span className="loader" />
      ) : (
        <span dangerouslySetInnerHTML={{ __html: buttonText }} />
      )}
    </button>
  );

  const arrow = (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      style={{ fill: "currentColor" }}
    >
      <path
        fillRule="evenodd"
        d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"
      />
    </svg>
  );

  const shell = {
    background: T.bg,
    color: T.textColor,
    borderRadius: T.radius,
    padding: T.padding,
    margin: "12px",
    boxShadow: T.shadow ? "0 1px 3px rgba(0,0,0,.08)" : "none",
  };

  const banner = T.showBanner && list.length > 0 && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 6,
        borderRadius: T.bannerRadius,
        background: T.bannerBg,
      }}
    >
      <PercentBadge
        bg={T.badgeBg}
        fg={T.badgeColor}
        text={T.badgeText}
        radius={T.badgeRadius}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.headingColor }}>
          {T.heading}
        </div>
        <div
          style={{
            fontSize: T.amountSize,
            fontWeight: 800,
            color: T.amountColor,
          }}
        >
          {money(totalSaved)}
        </div>
      </div>
      {layout === "chipbadges" ? (
        <button
          type="button"
          onClick={clearAll}
          style={{
            border: `1px solid ${T.pillBorder}`,
            background: T.pillBg,
            color: T.pillColor,
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {T.clearAllText}
        </button>
      ) : (
        <span
          style={{
            border: `1px solid ${T.pillBorder}`,
            color: T.pillColor,
            background: T.pillBg,
            borderRadius: 999,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {String(T.appliedLabel)
            .replace(/\{n\}/g, list.length)
            .replace(/\bDiscounts\b/, list.length === 1 ? "Discount" : "Discounts")}
        </span>
      )}
    </div>
  );

  const tplIcon = T.icon || { type: "icon", name: "discount" };

  const templated =
    layout === "compact" ? (
      <div className="cart-plus-discount-tpl" style={shell}>
        {banner}
        {T.showList && list.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {list.map((a) => (
              <div
                key={a.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 4px",
                  borderBottom: `1px solid ${T.rowDivider}`,
                }}
              >
                <TagIcon color={T.rowIconColor} size={18} />
                <b style={{ flex: 1, fontSize: 13, color: T.rowColor }}>
                  {a.code}
                </b>
                <b style={{ fontSize: 13, color: T.rowAmountColor }}>
                  -{money(a.amount)}
                </b>
                <XBtn color={T.removeColor} onClick={() => removeCode(a.code)} />
              </div>
            ))}
          </div>
        )}
        {(T.showMoreOffers || T.showEnterLink) && (
          <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
            {T.showMoreOffers && (
              <button
                type="button"
                onClick={openOffers}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: T.moreOffersColor,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <LibraryIcon value={tplIcon} size={18} color={T.iconColor} />+
                {moreCount} {T.moreOffersText}
              </button>
            )}
            {T.showMoreOffers && T.showEnterLink && (
              <span
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  background: "#e1e3e5",
                  margin: "0 12px",
                }}
              />
            )}
            {T.showEnterLink && (
              <button
                type="button"
                onClick={() => setShowInput((v) => !v)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: T.linkColor,
                  fontSize: 13,
                }}
              >
                {T.linkText} {arrow}
              </button>
            )}
          </div>
        )}
        {(showInput || list.length === 0 || !T.showEnterLink) && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {tInput()}
            {tButton()}
          </div>
        )}
        {invalidBox}
      </div>
    ) : layout === "chipbadges" ? (
      <div className="cart-plus-discount-tpl" style={shell}>
        {banner}
        {T.showList && list.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            {list.map((a) => (
              <span
                key={a.code}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: T.chipBg,
                  color: T.chipColor,
                  borderRadius: T.chipRadius,
                  padding: "5px 5px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <TagIcon color={T.chipColor} size={16} />
                {a.code}
                <XBtn color={T.chipColor} onClick={() => removeCode(a.code)} />
              </span>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 12,
            padding: T.showDashedBox ? 4 : 0,
            borderRadius: T.dashedRadius,
            border: T.showDashedBox ? `1.5px dashed ${T.dashedColor}` : "none",
          }}
        >
          {tInput(T.showDashedBox ? { border: 0, background: "transparent" } : {})}
          {tButton()}
        </div>
        {invalidBox}
        {T.showEnterLink && (
          <button
            type="button"
            onClick={openOffers}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: 0,
              padding: 0,
              marginTop: 10,
              fontSize: 12,
              color: T.linkColor,
              cursor: "pointer",
            }}
          >
            {T.linkText} {arrow}
          </button>
        )}
      </div>
    ) : null;

  // ───────── Classic: only override what the merchant customised ─────────
  const classicWrapStyle = {
    background: cs.inputBg || undefined,
    border: cs.inputBorder ? `1px solid ${cs.inputBorder}` : undefined,
    borderRadius: num(cs.inputRadius),
  };
  const classicInputStyle = { color: cs.inputColor || undefined };
  const classicBtnStyle = {
    background: cs.buttonBg || undefined,
    color: cs.buttonColor || undefined,
    borderRadius: num(cs.buttonRadius),
  };
  const classicIconColor = cs.iconColor || iconColor;

  return (
    <>
      {templated}

      {/* ── Inline discount row (Classic) ── */}
      {!layout && (
        <div className="cart-discount-row cart-plus-discount-code-row cart-plus-discount-code-row cart-plus-discount-code-module cart-plus-public-discount-code">
          <div className="cart-plus-discount-code-input-wrapper cart-plus-discount-code-input-wrapper cart-plus-discount-code-module cart-plus-public-discount-code__input-wrapper">
            {cs.showTitle && (
              <div
                className="cart-plus-discount-heading"
                style={{ color: cs.couponHeadingColor || "#000000" }}
                dangerouslySetInnerHTML={{ __html: cs.title || "" }}
              ></div>
            )}

            <div className="cart-plus-discount-input-row">
              <div
                className="cart-plus-discount-input-wrapped"
                style={classicWrapStyle}
              >
                <div className="cart-plus-discount-input-btn cart-plus-discount-code-icon">
                  <CouponIconSvg color={classicIconColor} />
                  <input
                    type="text"
                    className="cart-discount-row__input cart-plus-discount-code-text cart-plus-discount-code-input cart-plus-discount-input upcart-discount-code-input cart-plus-public-discount-code__input"
                    placeholder={placeholder}
                    value={code}
                    style={classicInputStyle}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setInvalid(false);
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="cart-discount-row__btn cart-plus-discount-code-button cart-plus-public-discount-code__button cart-plus-discount-code-button"
                    style={classicBtnStyle}
                    onClick={handleDiscount}
                    disabled={loading}
                  >
                    {isThisButtonLoading ? (
                      <span className="loader" />
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: buttonText }} />
                    )}
                  </button>
                </div>
              </div>

              {cs.showOfferBox && (
                <div
                  className="discount-offer-btn"
                  onClick={() => setOfferOpen(!offerOpen)}
                  style={{
                    backgroundColor: cs.viewAllOffersBgColor || "#000000",
                  }}
                >
                  <button
                    style={{ color: cs.viewAllOffersColor || "#ffffff" }}
                    className="cart-plus-view-offers-btn"
                  >
                    View all offers
                  </button>
                  <svg
                    viewBox="0 0 20 20"
                    style={{
                      width: 20,
                      height: 20,
                      fill: cs.viewAllOffersColor || "#ffffff",
                    }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {invalidBox}
          </div>

          <div
            className="cart-plus-discount-code-badge"
            style={{ display: "none" }}
          >
            <span className="cart-plus-discount-code-icon" />
            <span className="cart-plus-discount-code-text" />
          </div>
        </div>
      )}

      {/* ── Offers panel / backdrop ── */}
      <div
        className="cart-plus-offers-backdrop"
        style={{
          visibility: offerOpen ? "visible" : "hidden",
          opacity: offerOpen ? 1 : 0,
          transition: "0.3s",
        }}
      >
        <div className="cart-plus-offers-panel">
          <button
            className="cart-plus-offers-close cart-plus-offers-open"
            onClick={handleClose}
          >
            <CloseIcon />
          </button>

          <div className="cart-plus-offers-header">
            <div className="cart-plus-offers-title-group">
              <button className="cart-plus-offers-back" onClick={handleClose}>
                <BackIcon />
              </button>
              <div className="cart-plus-offers-title-subtitle">
                <span className="cart-plus-offers-title">
                  {cs.panelTitle || "Apply Coupon"}
                </span>
                <span className="cart-plus-offers-cart-total">
                  Your Cart: {currency} {subtotal || 200}
                </span>
              </div>
            </div>
          </div>

          <div className="cart-plus-offers-code">
            <div className="cart-plus-offers-input-row">
              <div className="cart-plus-offers-input-wrap">
                <div className="cart-plus-offers-input">
                  <CouponIconSvg color={classicIconColor} />
                  <input
                    type="text"
                    className="cart-plus-offers-code-input cart-plus-discount-code-text cart-plus-discount-code-input"
                    placeholder={placeholder}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setInvalid(false);
                    }}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="cart-discount-row__btn cart-plus-discount-code-button cart-plus-public-discount-code__button cart-plus-discount-code-button"
                  style={layout ? undefined : classicBtnStyle}
                  onClick={handleDiscount}
                  disabled={loading}
                >
                  {isThisButtonLoading ? (
                    <span className="loader" />
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: buttonText }} />
                  )}
                </button>
              </div>
            </div>
            <div className="cart-plus-discount-message">{invalidBox}</div>
          </div>

          {!discountsLoading && discountsError && (
            <div className="cart-plus-offers-error">{discountsError}</div>
          )}
          {!discountsLoading && !discountsError && discounts.length === 0 && (
            <div className="cart-plus-offers-empty">
              No offers available right now.
            </div>
          )}
          <div className="cart-plus-cart-disounts">
            {discounts.map((d) => {
              const codeStr = toCodeString(d).toUpperCase();
              return (
                <CouponCard
                  key={d.id || codeStr}
                  code={codeStr}
                  badgeText={formatBadgeText(d)}
                  savings={formatSavingsText(d, currency, subtotal)}
                  description={d.description}
                  onApply={applyDiscountCode}
                  loading={loading && applyingCode === codeStr}
                  showOfferBgColor={showOfferBgColor}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}