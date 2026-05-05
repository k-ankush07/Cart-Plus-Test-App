import { useState } from "react";
import AdditionalNotes from "./AdditionalNotes";
import AddOns from "./AddOns";
import DiscountCode from "./DiscountCodes";
import TrustBadges from "./TrustBadges";
import CustomHtml from "./CustomHtml";

export default function CartFooter({ designSettings, additionalNotesSettings,
    addonsSettings, currency, discountCodesSettings, trustBadgesSettings, disableFixedFooter,
    cartSettings }) {

    const [loading, setLoading] = useState(false);
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    const totalPrice = 200.00;

    const checkoutText = cartSettings.checkoutButtonText?.replace(
        "{{total_price}}",
        `$${totalPrice}`
    );

    const handleCheckout = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }

    return (
        <div
            className="cart-app__footer custom-cart-footer"
            style={{
                backgroundColor: designSettings.accentColor,
                ...(disableFixedFooter ? { flexShrink: 1, position: "relative" } : {}),
            }}
        >
            {!additionalNotesSettings?.enabled && additionalNotesSettings.placement === "top_of_footer" && (
                <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
            )}

            <div>
                <AddOns addonsSettings={addonsSettings} currency={currency} />
                <DiscountCode discountCodesSettings={discountCodesSettings} />

                <div className="hub-total-summary" onClick={() => setBreakdownOpen(prev => !prev)} style={{ cursor: "pointer" }}>
                    <div className="hub-total-header">
                        <div className="hub-total-header-left">
                            <span className="hub-total-label">Estimated Total</span>
                            <span className="hub-total-arrow" style={{ transform: breakdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </div>
                        <div className="hub-total-header-right">
                            <span className="hub-total-original" ></span>
                            <span className="hub-total-final">$200.00</span>
                        </div>

                    </div>
                </div>

                <div className={`hub-total-breakdown ${breakdownOpen ? "hub-breakdown-open" : ""}`}>
                    <div class="hub-breakdown-row">
                        <span>Total MRP</span>
                        <span>$600.00</span>
                    </div>
                    <div class="hub-breakdown-row">
                        <span style={{ color: designSettings.textColor }}>{cartSettings.discountsSavingsText}</span>
                        <span style={{ color: '#10812F' }}>MEGA20</span>
                    </div>

                    <div class="hub-breakdown-row hub-breakdown-grand">
                        <span>Grand Total</span>
                        <span>$200.00</span>
                    </div>

                    {/* {designSettings.enableSubtotal && (
                        <div className="cart-app__row-between" style={{ color: designSettings.subtotalColor }}>
                            <span className="cart-app__subtotal">Subtotal</span>
                            <span className="cart-app__subtotal">$84.00</span>
                        </div>
                    )} */}

                </div>
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
                        onClick={handleCheckout}
                    >
                        {loading ? (<span className="loader"></span>) : (checkoutText)}
                    </button>
                </div>

                {/* below_checkout */}
                <CustomHtml cartSettings={cartSettings} position="below_checkout" />

                {designSettings.continueshopping && (<div className="custom-cart-continue-shopping styles_Footer__continueShopping__ upcart-continue-shopping "
                    style={{ color: designSettings.textColor }}>
                    <p>{cartSettings.continueShoppingText}</p>
                </div>)}
                {trustBadgesSettings?.position === "bottom" && (
                    <TrustBadges trustBadgesSettings={trustBadgesSettings} />
                )}
            </div>
        </div>
    )
}

















// import { useState } from "react";
// import AdditionalNotes from "./AdditionalNotes";
// import AddOns from "./AddOns";
// import DiscountCode from "./DiscountCodes";
// import TrustBadges from "./TrustBadges";
// import CustomHtml from "./CustomHtml";

// export default function CartFooter({ designSettings, additionalNotesSettings,
//     addonsSettings, currency, discountCodesSettings, trustBadgesSettings, disableFixedFooter,
//     cartSettings }) {

//     const [loading, setLoading] = useState(false);

//     const totalPrice = 84.40;

//     const checkoutText = cartSettings.checkoutButtonText?.replace(
//         "{{total_price}}",
//         `$${totalPrice}`
//     );

//     const handleCheckout = () => {
//         setLoading(true);
//         setTimeout(() => {
//             setLoading(false);
//         }, 2000);
//     }

//     return (
//         <div
//             className="cart-app__footer custom-cart-footer"
//             style={{
//                 backgroundColor: designSettings.accentColor,
//                 ...(disableFixedFooter ? { flexShrink: 1, position: "relative" } : {}),
//             }}
//         >
//             {!additionalNotesSettings?.enabled && additionalNotesSettings.placement === "top_of_footer" && (
//                 <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
//             )}

//             <div>
//                 <AddOns addonsSettings={addonsSettings} currency={currency} />
//                 <DiscountCode discountCodesSettings={discountCodesSettings} />
//                 <div className="cart-app__row-between upcart-savings-row">
//                     <div className="cart-app__row cart-app__row--gap">
//                         <span style={{ color: designSettings.textColor }}>{cartSettings.discountsSavingsText}</span>
//                         <span className="cart-app__badge">Auto 5</span>
//                     </div>
//                     <span className="upcart-savings-amount" style={{ color: designSettings.textColor }}>- $36.00</span>
//                 </div>

//                 {designSettings.enableSubtotal && (
//                     <div className="cart-app__row-between" style={{ color: designSettings.subtotalColor }}>
//                         <span className="cart-app__subtotal">Subtotal</span>
//                         <span className="cart-app__subtotal">$84.00</span>
//                     </div>
//                 )}

//                 {/* above_checkout */}
//                 <CustomHtml cartSettings={cartSettings} position="above_checkout" />

//                 <div className="upcart-checkout-button-container">
//                     <button
//                         className="cart-app__checkout upcart-checkout-button"
//                         style={{
//                             borderRadius: `${designSettings.buttonRadius}px`,
//                             backgroundColor: designSettings.buttonColor,
//                             "--btn-hover-text": designSettings.buttonHoverColor,
//                             "--btn-text": designSettings.buttonTextColor,
//                         }}
//                         onClick={handleCheckout}
//                     >
//                         {loading ? (<span className="loader"></span>) : (checkoutText)}
//                     </button>
//                 </div>

//                 {/* below_checkout */}
//                 <CustomHtml cartSettings={cartSettings} position="below_checkout" />

//                 {designSettings.continueshopping && (<div className="custom-cart-continue-shopping styles_Footer__continueShopping__ upcart-continue-shopping "
//                     style={{ color: designSettings.textColor }}>
//                     <p>{cartSettings.continueShoppingText}</p>
//                 </div>)}
//                 {trustBadgesSettings?.position === "bottom" && (
//                     <TrustBadges trustBadgesSettings={trustBadgesSettings} />
//                 )}
//             </div>
//         </div>
//     )
// }
