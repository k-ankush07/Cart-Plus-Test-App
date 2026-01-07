import React, { useState } from "react";
import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";

export default function CartItem({ showForm, setOpenForm, productNameSize, setProductNameSize,
    variantSize, setVariantSize, productPriceSize, setProductPriceSize, comparePriceSize, setComparePriceSize,
    savingPriceSize, setSavingPriceSize
}) {

    const toggleForm = () => {
        setOpenForm(showForm ? null : "cartItem");
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Cart item</span>
                </div>
                <div className="upsell-header-icons">
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <div className="form-group discount">
                        <label>Product name size</label>
                        <input
                            type="number"
                            value={productNameSize}
                            onChange={(e) => setProductNameSize(Number(e.target.value))}
                            placeholder="px"
                        />
                    </div>
                    <div className="form-group discount">
                        <label>Variant size</label>
                        <input
                            type="number"
                            value={variantSize}
                            onChange={(e) => setVariantSize(Number(e.target.value))}
                            placeholder="px"
                        />
                    </div>
                    <div className="form-group discount">
                        <label>Product price size</label>
                        <input
                            type="number"
                            value={productPriceSize}
                            onChange={(e) => setProductPriceSize(Number(e.target.value))}
                            placeholder="px"
                        />
                    </div>
                    <div className="form-group discount">
                        <label>Compare price size</label>
                        <input
                            type="number"
                            value={comparePriceSize}
                            onChange={(e) => setComparePriceSize(Number(e.target.value))}
                            placeholder="px"
                        />
                    </div>
                    <div className="form-group discount">
                        <label>Saving price size</label>
                        <input
                            type="number"
                            value={savingPriceSize}
                            onChange={(e) => setSavingPriceSize(Number(e.target.value))}
                            placeholder="px"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
