import CartItem from "./cart-Items/CartItem";
import "../../index.css";
import Announcements from "./cart-Items/Announcements";
import TieredReward from "./cart-Items/TieredRewards";
import CartHeading from "./cart-Items/CartHeading";
import CartFooter from "./cart-Items/CartFooter";

export default function CartPreview({ designSettings, headerSettings, announcementSettings, rewardsSettings }) {

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
                </div>
                <CartFooter designSettings={designSettings} />
            </div>
        </div>
    );
}