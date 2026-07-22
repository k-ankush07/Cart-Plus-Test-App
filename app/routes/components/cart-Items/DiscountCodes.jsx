import { useState, useEffect, useCallback } from "react";
import { DiscountIcon } from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
const API_KEY = import.meta.env.VITE_API_SECRET_KEY || "";

const authHeaders = (extra = {}) => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
  ...extra,
});

const toCodeString = (d) => (typeof d === "string" ? d : d?.code || d?.title || "");

const formatBadgeText = (discount) => {
  const dv = discount?.discountValue;
  if (!dv) return "";
  if (dv.type === "percentage") return `${dv.value}% OFF`;
  if (dv.type === "fixed_amount" || dv.type === "fixed") return `₹${dv.value} OFF`;
  return "";
};

const formatSavingsText = (discount, currency, cartTotal) => {
  const dv = discount?.discountValue;
  if (!dv) return "Apply this offer at checkout";

  if (dv.type === "percentage") {
    if (cartTotal) {
      let amount = (cartTotal * dv.value) / 100;
      if (discount.maximumDiscount) amount = Math.min(amount, discount.maximumDiscount);
      return `Save ${currency} ${Math.round(amount)} on this order!`;
    }
    return `Save ${dv.value}% on this order!`;
  }

  if (dv.type === "fixed_amount" || dv.type === "fixed") {
    return `Save ${currency} ${dv.value} on this order!`;
  }

  return "Apply this offer at checkout";
};

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 20 20" style={{ width: 20, height: 20 }}>
    <path fillRule="evenodd" d="M16.5 10a.75.75 0 0 1-.75.75h-9.69l2.72 2.72a.75.75 0 0 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 1 1 1.06 1.06l-2.72 2.72h9.69a.75.75 0 0 1 .75.75Z" />
  </svg>
);

function CouponCard({ code, badgeText, savings, description, onApply, loading, showOfferBgColor }) {
  return (
    <div className="hub-offer-listing">
      <div className="hub-offers-list">
        <div className="hub-coupon-card">
          <div className="hub-coupon-badge">
            <svg
              className="hub-coupon-badge__bg"
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
            <span className="hub-coupon-badge__text">{badgeText}</span>
          </div>
          <div className="hub-coupon-body">
            <div className="hub-coupon-top">
              <span className="hub-coupon-code">{code}</span>
              <button
                className="hub-coupon-action-btn apply"
                onClick={() => onApply?.(code)}
                disabled={loading}
              >
                {loading ? <span className="loader" /> : "APPLY"}
              </button>
            </div>
            <div className="hub-coupon-savings">{savings}</div>
            <div className="hub-coupon-desc">{description || `Use code ${code} & enjoy this offer`}</div>
            <div
              className="hub-coupon-error"
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
  apiUrl
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState("");

  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState("");
  const [activeCodes, setActiveCodes] = useState([]);

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
          d.type !== "DiscountAutomaticBasic"
      );

      console.log(valid)
      setDiscounts(valid);

      if (Array.isArray(data.activeDiscountCodes)) {
        setActiveCodes(
          data.activeDiscountCodes
            .map(toCodeString)
            .filter(Boolean)
            .map((s) => s.toUpperCase())
        );
      }
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

  const placeholder = discountCodesSettings?.placeholder || "Discount code";
  const buttonText = discountCodesSettings?.buttonText || "Apply";
  const showOfferBgColor = discountCodesSettings?.showOfferBgColor || "#6C4DFF";

  const applyDiscountCode = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    setApplyingCode(trimmed);
    setLoading(true);
    // TODO: replace with real cart-apply API call
    setTimeout(() => {
      setLoading(false);
      setApplyingCode("");
      setCode("");
    }, 2000);
  };

  const handleDiscount = () => applyDiscountCode(code);
  const handleClose = () => setOfferOpen(false);

  // Only the button that actually triggered the request should show its own spinner.
  // For the manual-entry inputs, "this button's identity" is the current `code` field value
  // at the moment it was clicked, which is what's stored in `applyingCode`.
  const isThisButtonLoading = loading && applyingCode === code.trim();

  return (
    <>
      {/* ── Inline discount row ── */}
      <div className="cart-discount-row custom-cart-discount-code-row upcart-discount-code-row upcart-discount-code-module custom-cart-public-discount-code">
        <div className="upcart-discount-code-input-wrapper custom-cart-discount-code-input-wrapper custom-cart-discount-code-module custom-cart-public-discount-code__input-wrapper">
          {discountCodesSettings.showTitle && (
            <div
              className="hub-discount-heading"
              style={{ color: discountCodesSettings?.couponHeadingColor || "#000000" }}
            >
              {discountCodesSettings?.title}
            </div>
          )}

          <div className="hub-discount-input-row">
            <div className="hub-discount-input-wrapped">
              <div className="hub-discount-input-btn custom-cart-discount-code-icon">
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ fill: iconColor }}>
                  <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z" />
                  <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                  <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  <path fillRule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z" />
                </svg>
                <input
                  type="text"
                  className="cart-discount-row__input custom-cart-discount-code-text custom-cart-discount-code-input hub-discount-input upcart-discount-code-input custom-cart-public-discount-code__input"
                  placeholder={placeholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button custom-cart-discount-code-button"
                  onClick={handleDiscount}
                  disabled={loading}
                >
                  {isThisButtonLoading ? <span className="loader" /> : buttonText}
                </button>
              </div>
            </div>

            {discountCodesSettings?.showOfferBox && (
              <div
                className="discount-offer-btn"
                onClick={() => setOfferOpen(!offerOpen)}
                style={{ backgroundColor: discountCodesSettings?.viewAllOffersBgColor || "#000000" }}
              >
                <button
                  style={{ color: discountCodesSettings?.viewAllOffersColor || "#ffffff" }}
                  className="hub-view-offers-btn"
                >
                  View all offers
                </button>
                <svg viewBox="0 0 20 20" style={{ width: 20, height: 20, fill: discountCodesSettings?.viewAllOffersColor || "#ffffff" }}>
                  <path fillRule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="upcart-discount-code-badge" style={{ display: "none" }}>
          <span className="upcart-discount-code-icon" />
          <span className="upcart-discount-code-text" />
        </div>
      </div>

      {/* ── Offers panel / backdrop ── */}
      <div
        className="hub-offers-backdrop"
        style={{ visibility: offerOpen ? "visible" : "hidden", opacity: offerOpen ? 1 : 0, transition: "0.3s" }}
      >
        <div className="hub-offers-panel">
          <button className="hub-offers-close hub-offers-open" onClick={handleClose}>
            <CloseIcon />
          </button>

          <div className="hub-offers-header">
            <div className="hub-offers-title-group">
              <button className="hub-offers-back" onClick={handleClose}>
                <BackIcon />
              </button>
              <div className="hub-offers-title-subtitle">
                <span className="hub-offers-title">Apply Coupon</span>
                <span className="hub-offers-cart-total">Your Cart: {currency} 200</span>
              </div>
            </div>
          </div>

          <div className="hub-offers-code">
            <div className="hub-offers-input-row">
              <div className="hub-offers-input-wrap">
                <div className="hub-offers-input">
                  <svg viewBox="0 0 20 20" width="20" height="20" style={{ fill: iconColor }}>
                    <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z" />
                    <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                    <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    <path fillRule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z" />
                  </svg>
                  <input
                    type="text"
                    className="hub-offers-code-input custom-cart-discount-code-text custom-cart-discount-code-input"
                    placeholder={placeholder}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button custom-cart-discount-code-button"
                  onClick={handleDiscount}
                  disabled={loading}
                >
                  {isThisButtonLoading ? <span className="loader" /> : buttonText}
                </button>
              </div>
            </div>
            <div className="hub-discount-message" />
          </div>

          {!discountsLoading && discountsError && (
            <div className="hub-offers-error">{discountsError}</div>
          )}
          {!discountsLoading && !discountsError && discounts.length === 0 && (
            <div className="hub-offers-empty">No offers available right now.</div>
          )}
          <div className="hub-cart-disounts">
            {discounts.map((d) => {
              const codeStr = toCodeString(d).toUpperCase();
              return (
                <CouponCard
                  key={d.id || codeStr}
                  code={codeStr}
                  badgeText={formatBadgeText(d)}
                  savings={formatSavingsText(d, currency)}
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