import { useLayoutEffect, useRef, useState } from "react";
import AdditionalNotes from "./AdditionalNotes";
import AddOns from "./AddOns";
import TrustBadges from "./TrustBadges";
import CustomHtml from "./CustomHtml";
import { customBlockNodes } from "./CustomBlocks";
import SectionBg from "./SectionBg";
import Summary from "./Summary";
import AgeVerification from "./AgeVerification";
import LoginMessage from "./LoginMessage";
import PaymentBadges from "./PaymentBadges";
import { fillPrice, getCheckoutButton } from "../utils/checkoutButton";
import { getAgeVerification } from "../utils/ageVerification";
import { DEFAULT_FOOTER_ORDER, resolveOrder } from "../utils/sectionOrder";
import DiscountCode from "./DiscountCodes";

import { backgroundToCss } from "../utils/background";

export default function CartFooter({
  designSettings,
  additionalNotesSettings,
  addonsSettings,
  currency,
  discountCodesSettings,
  trustBadgesSettings,
  disableFixedFooter,
  cartSettings,
  sectionOrder,
  subtotal,
  compareTotal,
  breakdownOpen,
  setBreakdownOpen,
  offerOpen,
  setOfferOpen,
  shop,
  apiUrl,
}) {
  const stackRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [ageError, setAgeError] = useState(false);

  const totalPrice = Number(subtotal ?? 200);
  const totalLabel = totalPrice.toFixed(2);

  const checkoutText = cartSettings.checkoutButtonText?.replace(
    "{{total_price}}",
    `${currency}${totalPrice}`,
  );

  const handleCheckout = () => {
    // age verification must be confirmed first
    if (getAgeVerification(cartSettings).enabled && !ageChecked) {
      setAgeError(true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const btn = getCheckoutButton(cartSettings);
  // a label set on the Checkout Button page wins; otherwise the Preferences text is used
  const buttonText =
    btn.label != null
      ? fillPrice(btn.label, `${currency} ${totalLabel}`)
      : cartSettings.goToCartPageOnCheckout
        ? cartSettings.viewCartName || "View Cart"
        : checkoutText;

  // Footer rows, in the order set by dragging them in the sidebar
  const footerBlocks = {
    ...customBlockNodes(cartSettings),
    "Order notes": !additionalNotesSettings?.enabled && (
      <SectionBg id="Add Notes" cartSettings={cartSettings}>
        <AdditionalNotes
          additionalNotesSettings={additionalNotesSettings}
          designSettings={designSettings}
        />
      </SectionBg>
    ),

    "Shipping Protection & Add-ons": (
      <SectionBg id="Add ons" cartSettings={cartSettings}>
        <div
          style={{ background: backgroundToCss(addonsSettings?.background) }}
        >
          <AddOns
            addonsSettings={addonsSettings}
            currency={currency}
            designSettings={designSettings}
          />
        </div>
      </SectionBg>
    ),

    Summary: (
      <Summary
        cartSettings={cartSettings}
        currency={currency}
        subtotal={subtotal}
        compareTotal={compareTotal}
        discountCodes={["MEGA20"]}
        designSettings={designSettings}
      />
    ),

    "Discount code": (
      <SectionBg id="Discount code" cartSettings={cartSettings}>
        <DiscountCode
          discountCodesSettings={discountCodesSettings}
          setOfferOpen={setOfferOpen}
          offerOpen={offerOpen}
          designSettings={designSettings}
          currency={currency}
          shop={shop}
          apiUrl={apiUrl}
        />
      </SectionBg>
    ),

    "Age Verification": (
      <AgeVerification
        cartSettings={cartSettings}
        checked={ageChecked}
        error={ageError && !ageChecked}
        onChange={(v) => {
          setAgeChecked(v);
          if (v) setAgeError(false);
        }}
      />
    ),

    Login: <LoginMessage cartSettings={cartSettings} />,

    "Checkout Button": (
      <>
        {/* above_checkout */}
        <CustomHtml cartSettings={cartSettings} position="above_checkout" />

        <div
          className="cart-plus-checkout-button-container-row"
          style={{ background: backgroundToCss(btn.sectionBackground) }}
        >
          <button
            className="cart-app__checkout cart-plus-checkout-button cart-plus-checkout-button-container"
            style={{
              borderRadius: `${btn.radius ?? designSettings.buttonRadius}px`,
              background:
                backgroundToCss(btn.background) || designSettings.buttonColor,
              // Button Border; follows the theme colour until one is picked
              ...(btn.borderColor || designSettings.accentSolid
                ? {
                    border: `1px solid ${btn.borderColor || designSettings.accentSolid}`,
                  }
                : {}),
              "--btn-hover-text": designSettings.buttonHoverColor,
              "--btn-text": designSettings.buttonTextColor,
            }}
            onClick={handleCheckout}
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: buttonText }} />
            )}
          </button>
        </div>
      </>
    ),

    "Payment Badges": <PaymentBadges cartSettings={cartSettings} />,
  };
  const footerOrder = resolveOrder(sectionOrder?.Footer, DEFAULT_FOOTER_ORDER);

  // the first section that actually takes up space keeps its padding; the rest lose their top padding
  useLayoutEffect(() => {
    const kids = [...(stackRef.current?.children || [])];
    let found = false;
    kids.forEach((el) => {
      const first = !found && el.offsetHeight > 0;
      if (first) found = true;
      el.toggleAttribute("data-cp-first", first);
    });
  });

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
      <div className="cart-plus-footer-stack" ref={stackRef}>
        {footerOrder.map((key) => (
          <div
            key={key}
            className={
              key === "Age Verification" || key === "Checkout Button"
                ? "cp-sec cp-keep-pad"
                : "cp-sec"
            }
          >
            {footerBlocks[key]}
          </div>
        ))}

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
