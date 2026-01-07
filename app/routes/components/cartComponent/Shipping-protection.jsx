import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Settings, GripVertical, Check, Trash2 } from "lucide-react";

export default function Shippingprotection({ showForm, setOpenForm, setShowPopup, showPopup, visibleProducts,
    handleScroll, listRef, products, addedShippingProducts, setAddedShippingProducts, selectedShippingProducts, setSelectedShippingProducts,
    showShippingProduct, setShowShippingProduct }) {

    const [loadedCount, setLoadedCount] = useState(visibleProducts.length || 0);

    const toggleForm = () => {
        setOpenForm(showForm ? null : "Shippingprotection");
    };

    const handleOpenPopup = () => {
        setSelectedShippingProducts(addedShippingProducts.map((p) => String(p.id)));
        setShowPopup(true);
    };

    const handleCheckboxChange = (id) => {
        setSelectedShippingProducts((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleSaveProducts = () => {
        const selected = products.filter((p) =>
            selectedShippingProducts.includes(String(p.id))
        );
        setAddedShippingProducts(selected);
        setShowPopup(false);
    };

    const toggleVisibility = () => {
        setShowShippingProduct(!showShippingProduct);
        setOpenForm(!showShippingProduct);
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Shipping Protection</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="icon-btn"
                        title={showShippingProduct ? "Hide" : "Show"}
                        onClick={toggleVisibility}
                    >
                        {showShippingProduct ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <div className="cart-unsell-products">
                        <button onClick={handleOpenPopup}>Add Product</button>
                    </div>

                    <div className="added-products-list">
                        {addedShippingProducts.map((product) => (
                            <div key={product.id} className="added-product-item">
                                <img
                                    src={product.image?.src || "https://via.placeholder.com/100"}
                                    alt={product.title}
                                    className="added-product-image"
                                />
                                <p className="added-product-title">{product.title}</p>
                            </div>
                        ))}
                    </div>

                    {showPopup && (
                        <div className="popup-overlay">
                            <div className="popup">
                                <h3>Select Products</h3>

                                <div className="popup-product-list" ref={listRef} onScroll={handleScroll}>
                                    {visibleProducts.map((product) => (
                                        <div key={product.id} className="popup-product-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedShippingProducts.includes(String(product.id))}
                                                onChange={() => handleCheckboxChange(String(product.id))}
                                            />
                                            <img
                                                src={product.image?.src || "https://via.placeholder.com/100"}
                                                alt={product.title}
                                                className="popup-product-image"
                                            />
                                            <div className="popup-product-info">
                                                <p>{product.title}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {loadedCount < products.length && (
                                        <div className="loading-text">Loading more products...</div>
                                    )}
                                </div>

                                <div className="popup-buttons">
                                    <button
                                        className="save-btn"
                                        onClick={handleSaveProducts}
                                        disabled={selectedShippingProducts.length === 0}
                                    >
                                        Save
                                    </button>
                                    <button className="cancel-btn" onClick={() => setShowPopup(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
