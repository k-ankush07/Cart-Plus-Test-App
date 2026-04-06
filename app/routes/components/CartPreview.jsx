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

export default function CartPreview({ currency, designSettings, headerSettings, announcementSettings, rewardsSettings,
    recommendationsSettings, activeTab, subscriptionUpgradesSettings, upsellsSettings, additionalNotesSettings }) {

    return (
        <div
            className={`cart-app ${designSettings.inheritFonts ? "" : "cart-app--customFont"
                }`}
            style={{
                backgroundColor: designSettings.backgroundColor,
                maxWidth:
                    designSettings.desktopWidth === "wide" ? "550px" : "400px",
                width: "100%",
            }}
        >
            <div className="cart-app__container">
                <div className="cart-app__heading">
                    <CartHeading
                        headerSettings={headerSettings}
                        designSettings={designSettings} />
                    {headerSettings.border === "thin" && <div className="cart-app__divider"></div>}
                </div>

                <div className="cart-app__body">
                    {activeTab !== "Recommendations" && (
                        <>
                            {!announcementSettings.enabled &&
                                announcementSettings.position === "before" && (
                                    <Announcements announcementSettings={announcementSettings} />
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
                                />
                                {!upsellsSettings.enabled && upsellsSettings?.position === "bottom" && <Upsells upsellsSettings={upsellsSettings} />}
                            </div>

                            {!additionalNotesSettings.enabled && additionalNotesSettings.placement === "below_items" && (
                                <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
                            )}

                            {!announcementSettings.enabled &&
                                announcementSettings.position === "after" && (
                                    <Announcements announcementSettings={announcementSettings} />
                                )}
                        </>
                    )}

                    {!recommendationsSettings.enabled && activeTab === "Recommendations" && (
                        <Recommendation
                            recommendationsSettings={recommendationsSettings}
                            currency={currency}
                        />
                    )}
                </div>

                {activeTab !== "Recommendations" && (
                    <CartFooter
                        designSettings={designSettings}
                        additionalNotesSettings={additionalNotesSettings}
                    />
                )}
            </div>
        </div>
    );
}