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
    addonsSettings, discountCodesSettings, trustBadgesSettings, cartSettings }) {

    return (
        <div
            className={`cart-app upcart-cart ${designSettings.inheritFonts ? "" : "cart-app--customFont"}`}
            style={{
                backgroundColor: designSettings.backgroundColor,
                maxWidth: designSettings.desktopWidth === "wide" ? "550px" : "400px",
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
                        designSettings={designSettings} />
                    {headerSettings.border === "thin" && <div className="cart-app__divider"></div>}
                </div>

                {/* below_header */}
                <CustomHtml cartSettings={cartSettings} position="below_header" />

                <div className="cart-app__body upcart-cart-body">
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

                            <div className="cart-app__items">
                                {!upsellsSettings.enabled && upsellsSettings?.position === "top" && <Upsells upsellsSettings={upsellsSettings} />}
                                <CartItem
                                    showStrikethrough={designSettings.showStrikethrough}
                                    textColor={designSettings.textColor}
                                    savingColor={designSettings.savingsColor}
                                    Subscription={Subscription}
                                    subscriptionUpgradesSettings={subscriptionUpgradesSettings}
                                    cartSettings={cartSettings}
                                />
                                {/* between_line_items */}
                                <CustomHtml cartSettings={cartSettings} position="between_line_items" />
                                {!upsellsSettings.enabled && upsellsSettings?.position === "bottom" && <Upsells upsellsSettings={upsellsSettings} />}
                            </div>

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
                </div>

                {/* above_footer */}
                {activeTab !== "Recommendations" && (
                    <CustomHtml cartSettings={cartSettings} position="above_footer" />
                )}

                {activeTab !== "Recommendations" && (
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
