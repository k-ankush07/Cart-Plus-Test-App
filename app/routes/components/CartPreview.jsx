import CartItem from "./cart-Items/CartItem";
import "../../index.css";
import Announcements from "./cart-Items/Announcements";
import TieredReward from "./cart-Items/TieredRewards";
import CartHeading from "./cart-Items/CartHeading";
import CartFooter from "./cart-Items/CartFooter";
import Recommendation from "./cart-Items/Recommendation";
import Subscription from "./cart-Items/Subscription";
import Upsells from "./cart-Items/Upsells";
import AdditionalNotes from "./cart-Items/AdditionalNotes";
import TrustBadges from "./cart-Items/TrustBadges";
import CustomHtml from "./cart-Items/CustomHtml";

function scopeCss(css, scope) {
    if (!css) return "";
    let result = css.replace(/([^{}@][^{}]*)\{/g, (_match, selectors) => {
        const scoped = selectors.split(",").map(s => {
            const t = s.trim();
            if (!t) return t;
            return `${scope} ${t}`;
        }).join(", ");
        return `${scoped} {`;
    });
    result = result.replace(/([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g, (_m, prop, val, semi) => {
        return `${prop}${val.trim()} !important${semi}`;
    });
    return result;
}

export default function CartPreview({ currency, designSettings, headerSettings, announcementSettings, rewardsSettings,
    recommendationsSettings, activeTab, subscriptionUpgradesSettings, upsellsSettings, additionalNotesSettings,
    addonsSettings, discountCodesSettings, trustBadgesSettings, cartSettings, previewMode, onClosePreview }) {

    const emptyCart = previewMode === "empty";

    return (
        <div
            className={`cart-app upcart-cart ${designSettings.inheritFonts ? "" : "cart-app--customFont"}`}
            style={{
                backgroundColor: designSettings.backgroundColor,
                maxWidth: designSettings.desktopWidth === "wide" ? "500px" : "440px",
                width: "100%",
            }}
        >
            {cartSettings?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: scopeCss(cartSettings.customCss, ".cart-app") }} />
            )}

            <div className="cart-app__container">
                <div className="cart-app__heading">
                    <CartHeading
                        headerSettings={headerSettings}
                        designSettings={designSettings}
                        onClose={onClosePreview} />
                    {headerSettings.border === "thin" && <div className="cart-app__divider"></div>}
                </div>

                {/* below_header */}
                <CustomHtml cartSettings={cartSettings} position="below_header" />

                <div className="cart-app__body upcart-cart-body">
                    {(emptyCart && activeTab !== "Recommendations") || (activeTab === "Recommendations" && recommendationsSettings.enabled) ? (
                        <div className="cart-app__empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: "12px" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={designSettings.textColor || "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <p style={{ color: designSettings.textColor || "#6b7280", fontSize: "16px", fontWeight: "500", margin: 0 }}>Your cart is empty</p>
                        </div>
                    ) : (
                        <>
                            {activeTab !== "Recommendations" && (
                                <>
                                    {/* above_announcements */}
                                    <CustomHtml cartSettings={cartSettings} position="above_announcements" />

                                    {!announcementSettings.enabled &&
                                        announcementSettings.position === "before" && (
                                            <Announcements announcementSettings={announcementSettings} cartSettings={cartSettings} />
                                        )}

                                    {trustBadgesSettings?.position === "top" && (
                                        <TrustBadges trustBadgesSettings={trustBadgesSettings} />
                                    )}

                                    {!rewardsSettings.enabled && (
                                        <TieredReward rewardsSettings={rewardsSettings} />)}

                                    {!upsellsSettings.enabled && upsellsSettings?.position === "top" && <Upsells upsellsSettings={upsellsSettings} />}
                                    <CartItem
                                        showStrikethrough={designSettings.showStrikethrough}
                                        textColor={designSettings.textColor}
                                        savingColor={designSettings.savingsColor}
                                        Subscription={Subscription}
                                        subscriptionUpgradesSettings={subscriptionUpgradesSettings}
                                        cartSettings={cartSettings}
                                    />
                                    {!upsellsSettings.enabled && upsellsSettings.showSuggestedProduct && (
                                        <div className="upsell-suggestion">
                                            <label className="upsell-checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                />

                                                <span className="custom-checkbox"></span>

                                                <span className="upsell-text">
                                                    Add The Impulse | Crossbody Sling for only $150
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                    {/* between_line_items */}
                                    <CustomHtml cartSettings={cartSettings} position="between_line_items" />
                                    {!upsellsSettings.enabled && upsellsSettings?.position === "bottom" && <Upsells upsellsSettings={upsellsSettings} />}

                                    {/* below_cart_items */}
                                    <CustomHtml cartSettings={cartSettings} position="below_cart_items" />

                                    {!additionalNotesSettings.enabled && additionalNotesSettings.placement === "below_items" && (
                                        <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
                                    )}

                                    {!announcementSettings.enabled &&
                                        announcementSettings.position === "after" && (
                                            <Announcements announcementSettings={announcementSettings} cartSettings={cartSettings} />
                                        )}
                                </>
                            )}

                            {!recommendationsSettings.enabled && activeTab === "Recommendations" && (
                                <Recommendation
                                    recommendationsSettings={recommendationsSettings}
                                    currency={currency}
                                    cartSettings={cartSettings}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* above_footer */}
                {!emptyCart && activeTab !== "Recommendations" && (
                    <CustomHtml cartSettings={cartSettings} position="above_footer" />
                )}

                {!emptyCart && activeTab !== "Recommendations" && (
                    <CartFooter
                        designSettings={designSettings}
                        additionalNotesSettings={additionalNotesSettings}
                        addonsSettings={addonsSettings}
                        currency={currency}
                        discountCodesSettings={discountCodesSettings}
                        trustBadgesSettings={trustBadgesSettings}
                        disableFixedFooter={cartSettings?.disableFixedFooter}
                        cartSettings={cartSettings}
                    />
                )}

                {/* bottom_of_cart */}
                <CustomHtml cartSettings={cartSettings} position="bottom_of_cart" />
            </div>
        </div>
    );
}
