import CartItem from "./cart-setting/CartItem";
import "../../index.css";
import Announcements from "../components/cart-setting/Announcements";
import TieredReward from "../components/cart-setting/TieredRewards";
import CartHeading from "../components/cart-setting/CartHeading";

export default function CartPreview({ designSettings, headerSettings, announcementSettings }) {

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
                    designSettings ={designSettings } />

                    {headerSettings.border === "thin" && (<div className="cart-app__divider"></div>)}


                    {!announcementSettings.enabled &&
                        announcementSettings.position === "before" && (
                            <Announcements announcementSettings={announcementSettings} />
                        )}

                    <TieredReward />

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

                <div className="cart-app__footer" style={{ backgroundColor: designSettings.accentColor }}>

                    <div className="cart-app__row-between">
                        <div className="cart-app__row cart-app__row--gap">
                            <span style={{ color: designSettings.textColor }}>Discounts</span>
                            <span className="cart-app__badge">Auto 5</span>
                        </div>
                        <span style={{ color: designSettings.textColor }}>- $36.00</span>
                    </div>

                    {designSettings.enableSubtotal && (
                        <div className="cart-app__row-between" style={{ color: designSettings.subtotalColor }}>
                            <span className="cart-app__subtotal">Subtotal</span>
                            <span className="cart-app__subtotal">$84.00</span>
                        </div>
                    )}

                    <button
                        className="cart-app__checkout"
                        style={{
                            borderRadius: `${designSettings.buttonRadius}px`,
                            backgroundColor: designSettings.buttonColor,
                            "--btn-hover-text": designSettings.buttonHoverColor,
                            "--btn-text": designSettings.buttonTextColor,
                        }}
                    >
                        Checkout • $84.00
                    </button>
                </div>

            </div>
        </div>
    );
}