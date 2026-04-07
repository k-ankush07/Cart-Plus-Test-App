import { useState } from "react";

const ShippingIcon = () => (
    <div style={{ position: "relative", width: "44px", height: "44px", flexShrink: 0 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="8" fill="#f0f0f0" />
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="22">📦</text>
        </svg>
        <div style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#1a73e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    </div>
);

const Toggle = ({ on, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            background: on ? "#00a651" : "#c4c4c4",
            border: "none",
            padding: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: on ? "flex-end" : "flex-start",
            transition: "background 0.2s ease",
            flexShrink: 0,
        }}
    >
        <div style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
    </button>
);

export default function AddOns({ addonsSettings, currency }) {
    const [toggled, setToggled] = useState(false);

    if (addonsSettings?.enabled) return null;

    const isShipping = addonsSettings.type === "shipping_protection";
    const product = addonsSettings.selectedProduct;

    return (
        <div className="cart-addon-tile upcart-addons upcart-public-addons">
            {isShipping ? (
                <ShippingIcon />
            ) : (
                <div className="upcart-addons-image-wrapper upcart-public-addons__image-wrapper" style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#f0f0f0",
                }}>
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
            <div className="cart-addon-tile__info">
                <div className="cart-addon-tile__title-row">
                    <span className="cart-addon-tile__title upcart-addons-title upcart-public-addons__content-title">
                        {isShipping ? addonsSettings.title : product?.title || "Product add-on"}
                    </span>
                    <span className="cart-addon-tile__price upcart-addons-price upcart-public-addons__price">
                        {isShipping ? (
                            `$${addonsSettings.price}`
                        ) : (
                            <>
                                {product?.compareAtPrice && (
                                    <span className="cart-addon-tile__compare">${product.compareAtPrice}</span>
                                )}
                                <span>{product?.price || ""} {currency}</span>
                            </>
                        )}
                    </span>
                </div>
                <p className="cart-addon-tile__desc upcart-addons-product-description upcart-public-addons__content-description">
                    {isShipping
                        ? addonsSettings.description
                        : product?.description || ""}
                </p>
            </div>

            {/* TOGGLE */}
            <div className="upcart-addons-toggle upcart-public-addons__toggle-wrapper">
                <Toggle on={toggled} onChange={setToggled} />
            </div>
        </div>
    );
}
