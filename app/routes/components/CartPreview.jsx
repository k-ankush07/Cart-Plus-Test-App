import { memo, useMemo, useState } from "react";
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

const CartPreview = memo(function CartPreview({ currency, designSettings, headerSettings, announcementSettings, rewardsSettings,
    recommendationsSettings, activeTab, subscriptionUpgradesSettings, upsellsSettings, additionalNotesSettings,
    addonsSettings, discountCodesSettings, trustBadgesSettings, cartSettings, previewMode, onClosePreview, shop, apiUrl }) {

    const emptyCart = previewMode === "empty";

    const scopedCustomCss = useMemo(() => scopeCss(cartSettings?.customCss, ".cart-app"), [cartSettings?.customCss]);
    const [qty, setQty] = useState(1);
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const [offerOpen, setOfferOpen] = useState(false);

    return (
        <div
            className={`cart-app custom-cart ${designSettings.inheritFonts ? "" : "cart-app--customFont"}`}
            style={{
                backgroundColor: designSettings.backgroundColor,
                maxWidth: designSettings.desktopWidth === "wide" ? "500px" : "440px",
                width: "100%",
                position: "relative",
                overflowY: cartSettings?.disableFixedFooter ? "auto" : "unset",
            }}
        >
            {offerOpen && (
                <div
                    onClick={() => setOfferOpen(false)}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.25)",
                        zIndex: 10,
                        pointerEvents: "auto",
                    }}
                />
            )}

            {cartSettings?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: scopedCustomCss }} />
            )}

            <div className="cart-app__container styles_CartPreview__card__" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                {breakdownOpen && (
                    <div
                        onClick={() => setBreakdownOpen(true)}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.25)",
                            zIndex: 10,
                            pointerEvents: "auto",
                        }}
                    />
                )}

                <div className="cart-app__heading">
                    <CartHeading
                        headerSettings={headerSettings}
                        designSettings={designSettings}
                        onClose={onClosePreview}
                        qty={qty} />
                    {headerSettings.border === "thin" && <div className="cart-app__divider"></div>}
                </div>

                {/* below_header */}
                <CustomHtml cartSettings={cartSettings} position="below_header" />

                <div className="cart-app__body custom-cart-body" style={{
                    overflowY: cartSettings?.disableFixedFooter ? "unset" : "auto",
                }}>
                    {emptyCart ? (
                        <>
                            {!rewardsSettings.enabled && rewardsSettings.showOnEmptyCart && (
                                <TieredReward rewardsSettings={rewardsSettings} currency={currency} />
                            )}
                            <Recommendation
                                recommendationsSettings={recommendationsSettings}
                                currency={currency}
                                cartSettings={cartSettings}
                                upsellsSettings={upsellsSettings}
                                designSettings={designSettings}
                            />
                        </>
                    ) : (
                        <>
                            {!emptyCart && activeTab !== "Recommended Products" && (
                                <>
                                    <CustomHtml cartSettings={cartSettings} position="above_announcements" />

                                    {!announcementSettings.enabled &&
                                        announcementSettings.position === "before" && (
                                            <Announcements announcementSettings={announcementSettings} cartSettings={cartSettings} />
                                        )}

                                    {trustBadgesSettings?.position === "top" && (
                                        <TrustBadges trustBadgesSettings={trustBadgesSettings} />
                                    )}

                                    {!rewardsSettings.enabled && (
                                        <TieredReward rewardsSettings={rewardsSettings} currency={currency} />)}

                                    {!upsellsSettings.enabled && upsellsSettings?.position === "top" && (
                                        <Upsells upsellsSettings={upsellsSettings} designSettings={designSettings} currency={currency} cartSettings={cartSettings} />
                                    )}

                                    <CartItem
                                        showStrikethrough={designSettings.showStrikethrough}
                                        textColor={designSettings.textColor}
                                        savingColor={designSettings.savingsColor}
                                        Subscription={Subscription}
                                        subscriptionUpgradesSettings={subscriptionUpgradesSettings}
                                        cartSettings={cartSettings}
                                        setQty={setQty}
                                        qty={qty}
                                        designSettings={designSettings}
                                        currency={currency}
                                    />

                                    {!upsellsSettings.enabled && upsellsSettings.showSuggestedProduct && upsellsSettings?.suggestedProduct?.items?.titles?.length > 0 && (
                                        <div className="upsell-suggestion">
                                            <label className="upsell-checkbox-wrapper">
                                                <input type="checkbox" />
                                                <span className="custom-checkbox"></span>
                                                <span className="upsell-text">
                                                    {upsellsSettings?.suggestedProduct?.items?.titles?.[0]}
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    <CustomHtml cartSettings={cartSettings} position="between_line_items" />

                                    <div className="cart-app__bottom-group">
                                        {!upsellsSettings.enabled && upsellsSettings?.position === "bottom" && (
                                            <Upsells upsellsSettings={upsellsSettings} designSettings={designSettings} currency={currency} cartSettings={cartSettings} />
                                        )}

                                        <CustomHtml cartSettings={cartSettings} position="below_cart_items" />

                                        {!additionalNotesSettings.enabled && additionalNotesSettings.placement === "below_items" && (
                                            <AdditionalNotes additionalNotesSettings={additionalNotesSettings} designSettings={designSettings} />
                                        )}

                                        {!announcementSettings.enabled &&
                                            announcementSettings.position === "after" && (
                                                <Announcements announcementSettings={announcementSettings} cartSettings={cartSettings} />
                                            )}
                                    </div>
                                </>
                            )}

                            {activeTab === "Recommended Products" && (
                                <Recommendation
                                    recommendationsSettings={recommendationsSettings}
                                    currency={currency}
                                    cartSettings={cartSettings}
                                    upsellsSettings={upsellsSettings}
                                    designSettings={designSettings}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* above_footer */}
                {!emptyCart && activeTab !== "Recommended Products" && (
                    <CustomHtml cartSettings={cartSettings} position="above_footer" />
                )}

                {!emptyCart && activeTab !== "Recommended Products" && (
                    <CartFooter
                        designSettings={designSettings}
                        additionalNotesSettings={additionalNotesSettings}
                        addonsSettings={addonsSettings}
                        currency={currency}
                        discountCodesSettings={discountCodesSettings}
                        trustBadgesSettings={trustBadgesSettings}
                        disableFixedFooter={cartSettings?.disableFixedFooter}
                        cartSettings={cartSettings}
                        setBreakdownOpen={setBreakdownOpen}
                        breakdownOpen={breakdownOpen}
                        setOfferOpen={setOfferOpen}
                        offerOpen={offerOpen}
                        shop={shop}
                        apiUrl={apiUrl}
                    />
                )}

                {/* bottom_of_cart */}
                {!emptyCart && (
                    <CustomHtml cartSettings={cartSettings} position="bottom_of_cart" />
                )}
            </div>
        </div>
    );
});

export default CartPreview;