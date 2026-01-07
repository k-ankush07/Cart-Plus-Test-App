import { Settings, GripVertical } from "lucide-react";
import { useState } from "react";

export default function CheckoutSection({ showForm, setOpenForm, viewCartText, setViewCartText, 
    checkoutText, setCheckoutText, discountText, setDiscountText, totalDiscountText, setTotalDiscountText,
    discountSize, setDiscountSize, totalDiscountSize, setTotalDiscountSize,checkoutSize, setCheckoutSize,
    viewCartSize, setViewCartSize, showViewCart, setShowViewCart
 }) {
    const toggleForm = () => {
        setOpenForm(showForm ? null : "CheckoutSection");
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Checkout Section</span>
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
                        <label>Checkout button text</label>
                        <input
                            type="text"
                            value={checkoutText}
                            onChange={(e) => setCheckoutText(e.target.value)}
                        />
                      
                        <label>Discount</label>
                        <input
                            type="text"
                            value={discountText}
                            onChange={(e) => setDiscountText(e.target.value)}
                        />

                        <label>Total discount</label>
                        <input
                            type="text"
                            value={totalDiscountText}
                            onChange={(e) => setTotalDiscountText(e.target.value)}
                        />

                        <label>
                            <input
                                type="checkbox"
                                checked={showViewCart}
                                onChange={() => setShowViewCart(!showViewCart)}
                            />
                            Show view cart button text
                        </label>

                        {showViewCart && (
                            <>
                                <label>"View cart" button</label>
                                <input
                                    type="text"
                                    value={viewCartText}
                                    onChange={(e) => setViewCartText(e.target.value)}
                                />
                            </>
                        )}

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap:'wrap' }}>
                            <div>
                                <label>Discount size</label>
                                <input
                                    type="number"
                                    value={discountSize}
                                    onChange={(e) => setDiscountSize(Number(e.target.value))}
                                />{" "}
                                px
                            </div>
                            <div>
                                <label>Total discount size</label>
                                <input
                                    type="number"
                                    value={totalDiscountSize}
                                    onChange={(e) => setTotalDiscountSize(Number(e.target.value))}
                                />{" "}
                                px
                            </div>
                            <div>
                                <label>Checkout button size</label>
                                <input
                                    type="number"
                                    value={checkoutSize}
                                    onChange={(e) => setCheckoutSize(Number(e.target.value))}
                                />{" "}
                                px
                            </div>
                            <div>
                                <label>"View cart" button size</label>
                                <input
                                    type="number"
                                    value={viewCartSize}
                                    onChange={(e) => setViewCartSize(Number(e.target.value))}
                                />{" "}
                                px
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
