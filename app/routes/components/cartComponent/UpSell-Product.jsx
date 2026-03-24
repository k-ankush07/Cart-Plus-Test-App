import React, { useState } from "react";
import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";

const templates = [
    { id: "center", label: "Center", img: "https://snapdrawer.feeniks.io/carouselTemplate.svg" },
    { id: "left", label: "Left", img: "https://snapdrawer.feeniks.io/leftSideTemplate.svg" },
    { id: "right", label: "Right", img: "https://snapdrawer.feeniks.io/rightSideTemplate.svg" },
];

export default function UpSellProduct({ upSellTitle, setUpSellTitle, upSelltext, listRef, handleScroll, selectedProducts,
    setUpSellText, upSellstyle, setUpSellStyle, setShowPopup, addedProducts, showPopup, visibleProducts, handleCheckboxChange,
    handleSaveProducts, loadedCount, products, setUpSellAdd, upSellAdd, upSellTotal, setUpSellTotal, isUpSellVisible, setIsUpSellVisible,
    upSellTemplate, SetUpSellTemplate, showForm, setOpenForm,
}) {
    const [showTemplatePopup, setShowTemplatePopup] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(upSellTemplate);
    
    const toggleForm = () => {
        setOpenForm(showForm ? null : "upsell");
    };

    const handleDone = () => {
        SetUpSellTemplate(selectedTemplate);
        if (selectedTemplate === "left" || selectedTemplate === "right") {
            setUpSellStyle("Vertical");
        }
        setShowTemplatePopup(false);
    };

    const toggleVisibility = () => {
        setIsUpSellVisible(!isUpSellVisible);
        setOpenForm(!isUpSellVisible);
    };

    return (
        <div className="upsell-container cart-page-container-item">
            <div className="upsell-header cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Upsells products</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" title={isUpSellVisible ? "Hide" : "Show"} onClick={toggleVisibility}>
                        {isUpSellVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <div className="upsell-template">
                        <span className="cart-custom-items" onClick={() => setShowTemplatePopup(true)}>
                            Change Template
                        </span>
                        <span>Selected template: {upSellTemplate}</span>
                        {showTemplatePopup && (
                            <div className="template popup-overlay">
                                <div className="template popup">
                                    <h3>Select a Template</h3>
                                    <div className="template-options popup-product-list">
                                        {templates.map((temp) => (
                                            <div
                                                key={temp.id}
                                                className={`template-option ${selectedTemplate === temp.id ? "selected" : ""}`}
                                                style={{
                                                    border: selectedTemplate === temp.id ? "2px solid black" : "1px solid #ccc",
                                                    padding: "5px",
                                                    borderRadius: "5px",
                                                    cursor: "pointer",
                                                    margin: "5px",
                                                }}
                                                onClick={() => setSelectedTemplate(temp.id)}
                                            >
                                                <img src={temp.img} alt={temp.label} />
                                                <div className="template-name">
                                                    <span>{temp.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="popup-buttons">
                                        <button className="save-btn" onClick={handleDone}>Done</button>
                                        <button className="cancel-btn" onClick={() => setShowTemplatePopup(false)}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <label>Upsell title</label>
                    <input
                        type="text"
                        value={upSellTitle}
                        onChange={(e) => setUpSellTitle(e.target.value)}
                    />

                    {upSellTemplate === "center" && (
                        <>
                            <label>Add text</label>
                            <input
                                type="text"
                                value={upSelltext}
                                onChange={(e) => setUpSellText(e.target.value)}
                            />

                            <label>Upsell style</label>
                            <select
                                value={upSellstyle}
                                onChange={(e) => setUpSellStyle(e.target.value)}
                            >
                                <option value="Horizontal">Horizontal</option>
                                <option value="Vertical">Vertical</option>
                            </select>
                        </>
                    )}

                    <label>Upsell Product</label>
                    <select
                        value={upSellAdd}
                        onChange={(e) => setUpSellAdd(e.target.value)}
                    >
                        <option value="Automatic">Automatically</option>
                        <option value="Manual">Manual</option>
                    </select>
                    {upSellAdd === "Manual" && (
                        <>
                            <label>Upsell Products</label>
                            <div className="cart-unsell-products">
                                <button onClick={() => setShowPopup(true)}>Add Product</button>
                            </div>

                            <div className="added-products-list">
                                {addedProducts.map((product) => (
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

                                        <div
                                            className="popup-product-list"
                                            ref={listRef}
                                            onScroll={handleScroll}
                                        >
                                            {visibleProducts.map((product) => (
                                                <div key={product.id} className="popup-product-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(String(product.id))}
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
                                                disabled={selectedProducts.length === 0}
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
                        </>
                    )}

                    {upSellAdd === "Automatic" && (
                        <div className="automatic-info">
                            <p>
                                Products will be automatically suggested based on your cart items.
                            </p>
                        </div>
                    )}

                    <div className="number-upsell-cart">
                        <label htmlFor="upSellTotal">UpSell Setting </label>
                        <span>Limit the number upsell in cart</span>
                        <input
                            id="upSellTotal"
                            type="number"
                            min={1}
                            value={upSellTotal}
                            onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                value = parseInt(value) || 1;
                                if (value < 1) value = 1;
                                setUpSellTotal(value);
                            }} />
                    </div>

                </div>
            )}
        </div>
    );
}
