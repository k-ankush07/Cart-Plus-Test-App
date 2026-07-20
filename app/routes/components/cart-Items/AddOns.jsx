import { useState } from "react";

const ShippingIcon = () => (
    <div
        style={{
            position: "relative",
            width: "60px",
            height: "60px",
            borderRadius: "5px",
            overflow: "hidden",
            border: "1px solid #E8E8E8",
            flexShrink: 0,
        }}
    >
        <img
            src="https://cdn.shopify.com/s/files/1/0733/2531/4260/files/shipping-protection.png"
            alt="Shipping Protection"
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
            }}
        />
    </div>
);

const Toggle = ({ on, onChange }) => (
    <button
        type="button"
        className="custom-cart-public-addons__toggle"
        onClick={() => onChange(!on)}
        style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            background: on ? "#000" : "#c4c4c4",
            border: "none",
            padding: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            transition: "background 0.2s ease",
            flexShrink: 0,
        }}
    >
        <div
            className="custom-cart-public-addons__toggle-slider custom-cart-public-addons__toggle-switch"
            style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transform: on ? "translateX(18px)" : "translateX(0px)",
                transition: "transform 0.2s ease",
            }}
        />
    </button>
);

export default function AddOns({ addonsSettings, currency }) {
    const [toggled, setToggled] = useState(false);

    if (addonsSettings?.enabled) return null;

    const isShipping = addonsSettings.type === "shipping_protection";
    const product = addonsSettings.selectedProduct;

    const handleToggle = () => {
        setToggled(true);
        setTimeout(() => {
            setToggled(false);
        }, 200);
    };

    const truncateText = (text, limit = 50) => {
        if (!text) return "";
        return text.length > limit ? text.slice(0, limit).trim() + "..." : text;
    };

    return (
        <div className="cart-addon-tile upcart-addons custom-cart-public-addons custom-cart-addons">
            {isShipping ? (
                <ShippingIcon />
            ) : (
                <div
                    className="upcart-addons-image-wrapper custom-cart-addons-image-wrapper custom-cart-public-addons__image-wrapper"
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: 5,
                        overflow: "hidden",
                        border: "1px solid #E8E8E8",
                        flexShrink: 0,
                        background: "#f0f0f0",
                    }}
                >
                    {product?.image && (
                        <img
                            src={product.image}
                            alt={product.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    )}
                </div>
            )}

            {/* INFO */}
            <div className="cart-addon-tile__info custom-cart-public-addons__content-wrapper">
                <div className="cart-addon-tile__title-row custom-cart-public-addons__content-title-wrapper custom-cart-addons-title">
                    <span className="cart-addon-tile__title upcart-addons-title custom-cart-public-addons__content-title">
                        {truncateText(isShipping ? addonsSettings.title : product?.title || "Product add-on")}
                    </span>
                    <span className="cart-addon-tile__price upcart-addons-price upcart-public-addons__price custom-cart-public-addons__content-price">
                        {isShipping ? (
                            ``
                        ) : (
                            <>
                                {product?.compareAtPrice && (
                                    <span className="cart-addon-tile__compare custom-cart-addons-compare-price custom-cart-public-addons__compare-at-price">${product.compareAtPrice}</span>
                                )}
                                <span>{currency} {product?.price || ""} </span>
                            </>
                        )}
                    </span>
                </div>
                <p className="cart-addon-tile__desc custom-cart-addons-product-description custom-cart-public-addons__content-description upcart-addons-product-description upcart-public-addons__content-description">
                    {truncateText(isShipping ? addonsSettings.description : product?.description || "", 60)}
                </p>
            </div>
            {isShipping && (<span className="cart-addon-tile__price custom-cart-addons-price custom-cart-public-addons__price"> {currency} {addonsSettings.price}</span>)}

            {/* TOGGLE */}
            <div className="upcart-addons-toggle custom-cart-addons-toggle upcart-public-addons__toggle-wrapper custom-cart-public-addons__toggle-wrapper">
                <Toggle on={toggled} onChange={handleToggle} />
            </div>
        </div>
    );
}