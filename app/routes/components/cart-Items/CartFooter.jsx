import AdditionalNotes from "./AdditionalNotes";
import AddOns from "./AddOns";
import DiscountCode from "./DiscountCodes";
import TrustBadges from "./TrustBadges";
import CustomHtml from "./CustomHtml";

export default function CartFooter({ designSettings, additionalNotesSettings,
    addonsSettings, currency, discountCodesSettings, trustBadgesSettings, disableFixedFooter,
    cartSettings }) {

    const totalPrice = 84.40;

    const checkoutText = cartSettings.checkoutButtonText?.replace(
        "{{total_price}}",
        `$${totalPrice}`
    );

    return (
        <div
            className="cart-app__footer upcart-footer"
            style={{
                backgroundColor: designSettings.accentColor,
                ...(disableFixedFooter ? { flexShrink: 1, position: "relative" } : {}),
            }}
        >
            {!additionalNotesSettings?.enabled && additionalNotesSettings.placement === "top_of_footer" && (
                <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
            )}

            <div style={{ padding: '16px' }}>
                <AddOns addonsSettings={addonsSettings} currency={currency} />
                <DiscountCode discountCodesSettings={discountCodesSettings} />
                <div className="cart-app__row-between upcart-savings-row">
                    <div className="cart-app__row cart-app__row--gap">
                        <span style={{ color: designSettings.textColor }}>{cartSettings.discountsSavingsText}</span>
                        <span className="cart-app__badge">Auto 5</span>
                    </div>
                    <span className="upcart-savings-amount" style={{ color: designSettings.textColor }}>- $36.00</span>
                </div>

                {designSettings.enableSubtotal && (
                    <div className="cart-app__row-between" style={{ color: designSettings.subtotalColor }}>
                        <span className="cart-app__subtotal">Subtotal</span>
                        <span className="cart-app__subtotal">$84.00</span>
                    </div>
                )}

                {/* above_checkout */}
                <CustomHtml cartSettings={cartSettings} position="above_checkout" />

                <div className="upcart-checkout-button-container">
                    <button
                        className="cart-app__checkout upcart-checkout-button"
                        style={{
                            borderRadius: `${designSettings.buttonRadius}px`,
                            backgroundColor: designSettings.buttonColor,
                            "--btn-hover-text": designSettings.buttonHoverColor,
                            "--btn-text": designSettings.buttonTextColor,
                        }}
                    >
                        {checkoutText}
                    </button>
                </div>

                {/* below_checkout */}
                <CustomHtml cartSettings={cartSettings} position="below_checkout" />

                {designSettings.continueshopping && (<div className="styles_Footer__continueShopping__ upcart-continue-shopping"><p>{cartSettings.continueShoppingText}</p></div>)}
                {trustBadgesSettings?.position === "bottom" && (
                    <TrustBadges trustBadgesSettings={trustBadgesSettings} />
                )}
            </div>
        </div>
    )
}
