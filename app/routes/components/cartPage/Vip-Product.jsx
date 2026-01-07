import React, { useState } from "react";

export default function VipProduct({ addedVipProducts, showViPProduct }) {
    // const [toggledProducts, setToggledProducts] = useState({});

    // const handleToggle = (productId) => {
    //     setToggledProducts((prev) => ({
    //         ...prev,
    //         [productId]: !prev[productId],
    //     }));
    // };


    return (
        <>
            {showViPProduct && (
                <div className="cart-vipProduct">
                    {addedVipProducts.map((product) => {
                        const price =
                            product.variants && product.variants.length > 0
                                ? parseFloat(product.variants[0].price).toFixed(2)
                                : "0.00";

                        return (
                            <div key={product.id} className="vip-product-item">
                                <img
                                    src={product.image?.src || "https://via.placeholder.com/100"}
                                    alt={product.title}
                                    className="vip-product-image"
                                />
                                <div className="vip-product-info">
                                    <p className="vip-product-title">{product.title}</p>
                                </div>
                                <p className="vip-product-price">₹{price}</p>

                                {/* <label className="switch-vip">
                            <input
                                type="checkbox"
                                checked={!!toggledProducts[product.id]}
                                onChange={() => handleToggle(product.id)}
                            />
                            <span className="slider-vip"></span>
                        </label> */}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
