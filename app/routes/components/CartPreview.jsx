import CartItem from "./cart-Items/CartItem";
import "../../index.css";
import Announcements from "./cart-Items/Announcements";
import TieredReward from "./cart-Items/TieredRewards";
import CartHeading from "./cart-Items/CartHeading";
import CartFooter from "./cart-Items/CartFooter";
import Recommendation from "./cart-Items/Recommendation";

export default function CartPreview({ currency, designSettings, headerSettings, announcementSettings, rewardsSettings,
    recommendationsSettings, activeTab }) {

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
                <div className="cart-app__header">
                    <CartHeading
                        headerSettings={headerSettings}
                        designSettings={designSettings} />

                    {activeTab !== "Recommendations" && (
                        <>
                            {headerSettings.border === "thin" && (<div className="cart-app__divider"></div>)}

                            {!announcementSettings.enabled &&
                                announcementSettings.position === "before" && (
                                    <Announcements announcementSettings={announcementSettings} />
                                )}
                            {!rewardsSettings.enabled && (
                                <TieredReward rewardsSettings={rewardsSettings} />)}

                            <div className="cart-app__items">
                                <CartItem
                                    showStrikethrough={designSettings.showStrikethrough}
                                    textColor={designSettings.textColor}
                                    savingColor={designSettings.savingsColor}
                                />
                            </div>

                            {!announcementSettings.enabled &&
                                announcementSettings.position === "after" && (
                                    <Announcements announcementSettings={announcementSettings} />
                                )}

                            <div className="cart-app__divider"></div>
                        </>
                    )}
                </div>
                {activeTab !== "Recommendations" && (<CartFooter designSettings={designSettings} />)}

                {!recommendationsSettings.enabled && activeTab === "Recommendations" && (
                    <Recommendation
                        recommendationsSettings={recommendationsSettings}
                        currency={currency}
                    />
                )}
            </div>
        </div>
    );
}