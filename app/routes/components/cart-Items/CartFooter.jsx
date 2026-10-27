import { useState } from "react";
import AdditionalNotes from "./AdditionalNotes";
import AddOns from "./AddOns";
import TrustBadges from "./TrustBadges";
import CustomHtml from "./CustomHtml";
import SectionBg from "./SectionBg";

export default function CartFooter({
  designSettings,
  additionalNotesSettings,
  addonsSettings,
  currency,
  discountCodesSettings,
  trustBadgesSettings,
  disableFixedFooter,
  cartSettings,
  subtotal,
  breakdownOpen,
  setBreakdownOpen,
  offerOpen,
  setOfferOpen,
  shop,
  apiUrl,
}) {
  const [loading, setLoading] = useState(false);

  const totalPrice = Number(subtotal ?? 200);
  const totalLabel = totalPrice.toFixed(2);

  const checkoutText = cartSettings.checkoutButtonText?.replace(
    "{{total_price}}",
    `$${totalPrice}`,
  );

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const buttonText = cartSettings.goToCartPageOnCheckout
    ? cartSettings.viewCartName || "View Cart"
    : checkoutText;

  return (
    <div
      className="cart-app__footer cart-plus-footer"
      style={{
        backgroundColor: designSettings.accentColor,
        ...(designSettings.footerBackground
          ? { background: designSettings.footerBackground }
          : {}),
        zIndex: 10,
        ...(disableFixedFooter ? { flexShrink: 1 } : {}),
      }}
    >
      {!additionalNotesSettings?.enabled && (
        <SectionBg id="Add Notes" cartSettings={cartSettings}>
          <AdditionalNotes
            additionalNotesSettings={additionalNotesSettings}
            designSettings={designSettings}
          />
        </SectionBg>
      )}

      <div>
        <SectionBg id="Add ons" cartSettings={cartSettings}>
          <AddOns addonsSettings={addonsSettings} currency={currency} />
        </SectionBg>

        {designSettings.enableSubtotal && (
          <div
            className="cart-plus-savings-row cart-plus-savings-amount"
            onClick={() => setBreakdownOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <div className="cart-plus-total-header">
              <div className="cart-plus-total-header-left">
                <span
                  className="cart-plus-total-label"
                  style={{ color: designSettings.subtotalColor }}
                >
                  Estimated Total
                </span>
                <span
                  className="cart-plus-total-arrow"
                  style={{
                    transform: breakdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <svg
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L6 6L11 1"
                      stroke={designSettings.iconColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </span>
              </div>
              <div className="cart-plus-total-header-right">
                <span className="cart-plus-total-original"></span>
                <span
                  className="cart-plus-total-final"
                  style={{ color: designSettings.subtotalColor }}
                >
                  {currency} {totalLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className={`cart-plus-total-breakdown ${breakdownOpen ? "cart-plus-breakdown-open" : ""}`}
        >
          <div className="cart-plus-cart-breakdown-header cart-plus-public-cart-summary__slide-codes">
            <div className="cart-plus-breakdown-row cart-plus-public-cart-summary__total-discount">
              <span style={{ color: designSettings.textColor }}>Total MRP</span>
              <span style={{ color: designSettings.textColor }}>
                {currency} {totalLabel}
              </span>
            </div>
            <div className="cart-plus-breakdown-row cart-plus-public-cart-summary__discount-label">
              <span style={{ color: designSettings.textColor }}>
                {cartSettings.discountsSavingsText}
              </span>
              <span
                className="cart-plus-public-cart-summary__discount-codes"
                style={{ color: "#10812F" }}
              >
                MEGA20
              </span>
            </div>
            {designSettings.enableShipping && (
              <div className="cart-plus-breakdown-row">
                <span style={{ color: designSettings.textColor }}>
                  Shipping
                </span>
                <span style={{ color: "#10812F" }}>Free</span>
              </div>
            )}
            <div className="cart-plus-breakdown-row cart-plus-breakdown-grand">
              <span style={{ color: designSettings.textColor }}>
                Grand Total
              </span>
              <span style={{ color: designSettings.textColor }}>
                {currency} {totalLabel}
              </span>
            </div>
          </div>
        </div>

        {/* above_checkout */}
        <CustomHtml cartSettings={cartSettings} position="above_checkout" />

        <div className="cart-plus-checkout-button-container cart-plus-checkout-button">
          <button
            className="cart-app__checkout cart-plus-checkout-button cart-plus-checkout-button-container"
            style={{
              borderRadius: `${designSettings.buttonRadius}px`,
              background: designSettings.buttonColor,
              "--btn-hover-text": designSettings.buttonHoverColor,
              "--btn-text": designSettings.buttonTextColor,
            }}
            onClick={handleCheckout}
          >
            {loading ? <span className="loader"></span> : buttonText}
          </button>
        </div>

        {/* below_checkout */}
        <CustomHtml cartSettings={cartSettings} position="below_checkout" />

        {designSettings.continueshopping && (
          <div
            className="cart-plus-continue-shopping styles_Footer__continueShopping__ cart-plus-continue-shopping"
            style={{ color: designSettings.textColor }}
          >
            <p>{cartSettings.continueShoppingText}</p>
          </div>
        )}

        {trustBadgesSettings?.position === "bottom" && (
          <SectionBg id="Security Badges" cartSettings={cartSettings}>
            <TrustBadges trustBadgesSettings={trustBadgesSettings} />
          </SectionBg>
        )}
      </div>
    </div>
  );
}
