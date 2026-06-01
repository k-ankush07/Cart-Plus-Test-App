import {
    getFontWeight,
    getHeadingSize,
    getIconSize,
    getBorderWidth,
} from "../utils/helpers";

export default function CartHeading({ headerSettings, designSettings, onClose, qty }) {

    const CloseButton = ({ headerSettings }) => {
        return (
            <button
                onClick={onClose}
                className="cart-app__close custom-close-btn custom-cart-public-header__close-button custom-cart-header-close-button"
                style={{
                    flexShrink: 0,
                    "--icon-color": headerSettings.iconColor,
                    "--icon-bg": headerSettings.iconBgColor,
                    "--icon-hover-bg": headerSettings.iconbgHoverColor,
                    "--icon-hover-color": headerSettings.iconHoverColor,
                    "--icon-border-hover": headerSettings.borderHoverColor,
                    "--border-color": headerSettings.iconBorderColor,
                    "--border-width": getBorderWidth(headerSettings.iconBorder),
                    borderRadius: `${designSettings.buttonRadius}px`,
                }}
            >
                <svg
                    className="upcart-internal-header__close-button-icon custom-cart-public-header__close-button-icon custom-cart-header-close-button-icon"
                    width={getIconSize(headerSettings.iconSize)}
                    height={getIconSize(headerSettings.iconSize)}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={headerSettings.iconThickNess === "thick" ? 3 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                </svg>

            </button>
        );
    };

    return (
        <div
            className="cart-app__header-top custom-cart-public-header custom-cart-header"
            style={{
                padding:
                    headerSettings.height === "slim"
                        ? "15px 25px"
                        : "30px 30px",
                background: headerSettings.backgroundColor || designSettings.backgroundColor || '',
            }}
        >
            <div
                className="cart-app__row-between custom-cart-header-text"
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
                    className ="custom-cart-header-logo"
                >
                    {headerSettings.titleType === "logo" ? (
                        <img
                            className="upcart-header-logo"
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
                            className="cart-app__title upcart-header-text"
                            style={{
                                color: headerSettings.textColor,
                                fontWeight: getFontWeight(headerSettings.fontWeight),
                                fontSize: `${headerSettings.fontSize}px`,
                                display: "block",
                                margin: 0,
                            }}
                        >
                            {headerSettings.titleText?.replace("{{cart_quantity}}", qty) || `Cart • ${qty}`}
                        </span>
                    ) : (
                        (() => {
                            const HeadingTag = headerSettings.heading || "h3";
                            const text = headerSettings.titleText?.replace("{{cart_quantity}}", qty) || `Cart • ${qty}`;

                            return (
                                <HeadingTag
                                    className="cart-app__title upcart-header-text"
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
    )
}
