import CartItem from "./CartItem";
import "../../index.css";
import {
    getFontWeight,
    getHeadingSize,
    getIconSize,
    getBorderWidth,
} from "../../routes/components/utils/helpers";

export default function CartPreview({ designSettings, headerSettings }) {
    const CloseButton = ({ headerSettings }) => {
        return (
            <button
                className="cart-app__close custom-close-btn"
                style={{
                    flexShrink: 0,
                    "--icon-color": headerSettings.iconColor,

                    "--icon-bg": headerSettings.iconBgColor,
                    "--icon-hover-bg": headerSettings.iconbgHoverColor,
                    "--icon-hover-color": headerSettings.iconHoverColor,
                    "--icon-border-hover": headerSettings.borderHoverColor,
                    "--border-color": headerSettings.iconBorderColor,
                    "--border-width": getBorderWidth(headerSettings.iconBorder),
                }}
            >
                <svg
                    width={getIconSize(headerSettings.iconSize)}
                    height={getIconSize(headerSettings.iconSize)}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={
                        headerSettings.iconThickNess === "thick" ? 3 : 2
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        );
    };
    
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
                    <div
                        className="cart-app__header-top"
                        style={{
                            padding:
                                headerSettings.height === "slim"
                                    ? "16px 30px"
                                    : "30px 30px",
                            background: headerSettings.backgroundColor
                        }}
                    >
                        <div
                            className="cart-app__row-between"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            {headerSettings.closePosition === "left" && (
                                <CloseButton headerSettings={headerSettings} />
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    textAlign:
                                        headerSettings.alignment === "center"
                                            ? "center"
                                            : headerSettings.closePosition === "left"
                                                ? "right"
                                                : "left",
                                }}
                            >
                                {headerSettings.titleType === "logo" ? (
                                    <img
                                        src={
                                            headerSettings.logo && headerSettings.logo !== ""
                                                ? headerSettings.logo
                                                : "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/upcart_header_logo_1775234624267.png"
                                        }
                                        alt="Logo"
                                        onError={(e) => {
                                            e.target.src =
                                                "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/upcart_header_logo_1775234624267.png";
                                        }}
                                        style={{
                                            maxWidth: `${headerSettings.logoSize || 120}px`,
                                            display: "block",
                                            margin:
                                                headerSettings.alignment === "center"
                                                    ? "0 auto"
                                                    : headerSettings.closePosition === "left"
                                                        ? "0 0 0 auto"
                                                        : "0",
                                        }}
                                    />
                                ) : headerSettings.titleType === "custom" ? (
                                    <span
                                        className="cart-app__title"
                                        style={{
                                            color: headerSettings.textColor,
                                            fontWeight: getFontWeight(headerSettings.fontWeight),
                                            fontSize: `${headerSettings.fontSize}px`,
                                            display: "block",
                                            margin: 0,
                                        }}
                                    >
                                        {headerSettings.titleText?.replace("{{cart_quantity}}", "2") ||
                                            "Cart • 2"}
                                    </span>
                                ) : (
                                    (() => {
                                        const HeadingTag = headerSettings.heading || "h3";
                                        const text =
                                            headerSettings.titleText?.replace("{{cart_quantity}}", "2") ||
                                            "Cart • 2";

                                        return (
                                            <HeadingTag
                                                className="cart-app__title"
                                                style={{
                                                    margin: 0,
                                                    color: designSettings.textColor,
                                                    fontWeight: getFontWeight(headerSettings.fontWeight),
                                                    fontSize: getHeadingSize(headerSettings.heading),
                                                }}
                                            >
                                                {text}
                                            </HeadingTag>
                                        );
                                    })()
                                )}
                            </div>

                            {headerSettings.closePosition === "right" && (
                                <CloseButton headerSettings={headerSettings} />
                            )}
                        </div>
                    </div>

                    {headerSettings.border === "thin" && (<div className="cart-app__divider"></div>)}

                    <div className="cart-app__items">
                        <CartItem showStrikethrough={designSettings.showStrikethrough}
                            textColor={designSettings.textColor}
                            savingColor={designSettings.savingsColor}
                        />
                    </div>

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