import { useState } from "react";
import { DiscountIcon } from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";

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

const CouponBadgeIcon = () => (
  <svg viewBox="0 0 20 20" style={{ fill: "#111" }}>
    <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z" />
    <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    <path
      fillRule="evenodd"
      d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"
    />
  </svg>
);

function CouponCard({ code, savings, description }) {
  return (
    <div className="hub-offers-list">
      <div className="hub-coupon-card">
        <div className="hub-coupon-badge">{code}</div>
        <div className="hub-coupon-body">
          <div className="hub-coupon-top">
            <span className="hub-coupon-code">{code}</span>
            <button className="hub-coupon-action-btn apply">APPLY</button>
          </div>
          <div className="hub-coupon-savings">{savings}</div>
          <div className="hub-coupon-desc">
            Use code {code} &amp; enjoy this offer
          </div>
          <div
            className="hub-coupon-error"
            id={`coupon-error-${code}`}
            style={{ color: "black", fontSize: "12px", marginTop: "5px" }}
          />
        </div>
      </div>
    </div>
  );
}

function ApplyButton({ loading, buttonText }) {
  return (
    <button
      type="button"
      className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button"
      onClick={undefined}
    >
      {loading ? <span className="loader" /> : buttonText || "Apply"}
    </button>
  );
}

export default function DiscountCode({
  discountCodesSettings,
  offerOpen,
  setOfferOpen,
  designSettings
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (discountCodesSettings?.enabled) return null;

  const placeholder =
    discountCodesSettings?.placeholder || "Discount code";
  const buttonText = discountCodesSettings?.buttonText || "Apply";

  const handleDiscount = () => {
    if (!code.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCode("");
    }, 2000);
  };

  const handleClose = () => setOfferOpen(false);

  const iconColor = designSettings.iconColor || '#0000';

  return (
    <>
      {/* ── Inline discount row ── */}
      <div className="cart-discount-row custom-cart-discount-code-row upcart-discount-code-row upcart-discount-code-module custom-cart-public-discount-code">
        <div className="upcart-discount-code-input-wrapper custom-cart-discount-code-input-wrapper custom-cart-discount-code-module custom-cart-public-discount-code__input-wrapper">
          {discountCodesSettings.showTitle && <div
            className="hub-discount-heading"
            style={{ color: discountCodesSettings?.couponHeadingColor || "#000000" }}
          >
            {discountCodesSettings?.title}
          </div>}

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
                />
                <button
                  type="button"
                  className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button custom-cart-discount-code-button"
                  onClick={handleDiscount}
                >
                  {loading ? <span className="loader" /> : buttonText}
                </button>
              </div>
            </div>

            {discountCodesSettings?.showOfferBox && (
              <div
                className="discount-offer-btn"
                onClick={() => setOfferOpen(!offerOpen)}
                style={{
                  backgroundColor: discountCodesSettings?.viewAllOffersBgColor || "#000000",
                }}
              >
                <button
                  style={{
                    color: discountCodesSettings?.viewAllOffersColor || "#ffffff",
                  }}
                  className="hub-view-offers-btn" >
                  View all offers
                </button>
                <svg viewBox="0 0 20 20" style={{ width: 20, height: 20, fill: discountCodesSettings?.viewAllOffersColor || "#ffffff" }}>
                  <path
                    fillRule="evenodd"
                    d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"
                  />
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
        style={{
          visibility: offerOpen ? "visible" : "hidden",
          opacity: offerOpen ? 1 : 0,
          transition: "0.3s",
        }}
      >
        <div className="hub-offers-panel">
          {/* Close button */}
          <button
            className="hub-offers-close hub-offers-open"
            onClick={handleClose}
          >
            <CloseIcon />
          </button>

          {/* Header */}
          <div className="hub-offers-header">
            <div className="hub-offers-title-group">
              <button className="hub-offers-back" onClick={handleClose}>
                <BackIcon />
              </button>

              <div className="hub-offers-title-subtitle">
                <span className="hub-offers-title">Apply Coupon</span>
                <span className="hub-offers-cart-total">Your Cart: $200</span>
              </div>
            </div>
          </div>

          {/* Code input inside panel */}
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
                  />
                </div>

                <button
                  type="button"
                  className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button custom-cart-discount-code-button"
                  onClick={handleDiscount}
                >
                  {loading ? <span className="loader" /> : buttonText}
                </button>
              </div>
            </div>
            <div className="hub-discount-message" />
          </div>

          <CouponCard
            code="ABC"
            savings="Save 20% on this order!"
            description="Use code ABC & enjoy this offer"
          />
          <CouponCard
            code="XYZ"
            savings="Save 50% on this order!"
            description="Use code XYZ & enjoy this offer"
          />
        </div>
      </div>
    </>
  );
}