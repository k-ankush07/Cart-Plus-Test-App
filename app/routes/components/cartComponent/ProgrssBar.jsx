import { Eye, EyeOff, Settings, GripVertical, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

export default function ProgrssBar({
    showForm, setOpenForm, showProgressBar, setShowProgressBar, tiers, setTiers, textAfter, setTextAfter,
    allTiers, testAmount, setTestAmount, products, addedProgressProducts, setAddedProgressProducts,
    setShowPopup, selectedProgressProducts, setSelectedProgressProducts, rewardFontsize, setRewardFontsize,
    showPopup, tierTitle, setTierTitle, tierRewardTitle, setRewardTitle, tierFontsize, setTierFontsize,
    beforeColor, setBeforeColor, beforeBar, setBeforeBar,afterColor, setAfterColor,afterIcon, setAfterIcon
}) {

    const [visibleProducts, setVisibleProducts] = useState(products || []);
    const [loadedCount, setLoadedCount] = useState(products.length);
    const listRef = useRef(null);
    const [pickerColor, setPickerColor] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [currentSetter, setCurrentSetter] = useState(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const pickerRef = useRef(null);

    const toggleForm = () => {
        setOpenForm(showForm ? null : "ProgrssBar");
    };

    const toggleVisibility = () => {
        setShowProgressBar(!showProgressBar);
    };

    const addTier = () => {
        if (tiers.length < allTiers.length) {
            const nextTier = allTiers[tiers.length];
            setTiers([...tiers, { ...nextTier }]);
        }
    };

    const updateTier = (index, field, value) => {
        const updatedTiers = [...tiers];

        if (field === "rewardType") {
            const defaultTier = allTiers.find((t) => t.rewardType === value);

            updatedTiers[index] = {
                ...updatedTiers[index],
                ...defaultTier,
                discountMode: "percentage",
                discountValue: 0,
            };
        } else {
            updatedTiers[index][field] = value;
        }

        setTiers(updatedTiers);
    };

    const deleteTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const maxAmount = tiers.length > 0 ? Math.max(...tiers.map((t) => t.minAmount)) : 200;

    const handleCheckboxChange = (id) => {
        setSelectedProgressProducts((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleSaveProducts = () => {
        const selected = products.filter((p) => selectedProgressProducts.includes(String(p.id)));
        setAddedProgressProducts(selected);
        setShowPopup(false);
    };

    const handleOpenPopup = () => {
        setSelectedProgressProducts(addedProgressProducts.map((p) => String(p.id)));
        setShowPopup(true);
    };

    const togglePicker = (value, setter, event) => {
        const rect = event.target.getBoundingClientRect();

        setCurrentSetter(() => setter);
        setPickerColor(value);

        setPickerPosition({
            top: rect.bottom + window.scrollY + 6,
            left: rect.left + window.scrollX,
        });

        setShowPicker(true);
    };

    const handleColorChange = (color) => {
        setPickerColor(color);
        if (currentSetter) currentSetter(color);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const textColors = [
        { label: "Tier color", value: tierTitle, setter: setTierTitle },
        { label: "Reward text color", value: tierRewardTitle, setter: setRewardTitle },
    ];

    const iconColors = [
        { label: "Reward icon color", value: beforeColor, setter: setBeforeColor },
        { label: "Bar color", value: beforeBar, setter: setBeforeBar },
    ];

    const afterColors = [
        { label: "Reward icon color", value: afterColor, setter: setAfterColor },
        { label: "Bar color", value: afterIcon, setter: setAfterIcon },
    ];

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Progress Bar</span>
                </div>

                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="icon-btn"
                        title={showProgressBar ? "Hide" : "Show"}
                        onClick={toggleVisibility}
                    >
                        {showProgressBar ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>

                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    {tiers.map((tier, index) => (
                        <div key={index} className="tier-section">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h4>Tier {index + 1}</h4>

                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => deleteTier(index)}
                                        title="Delete Tier"
                                        style={{ background: "none", border: "none", cursor: "pointer" }}
                                    >
                                        <X size={16} color="red" />
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Reward Type</label>
                                <select
                                    value={tier.rewardType}
                                    onChange={(e) => updateTier(index, "rewardType", e.target.value)}
                                >
                                    <option value="Shipping">Shipping</option>
                                    <option value="Discount">Discount</option>
                                    <option value="Product">Product</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Minimum Amount</label>
                                <input
                                    type="number"
                                    value={tier.minAmount}
                                    onChange={(e) => updateTier(index, "minAmount", Number(e.target.value))}
                                />
                            </div>

                            {(tier.rewardType === "Discount" || tier.rewardType === "Product") && (
                                <>
                                    <div className="form-group">
                                        <label>Discount Type</label>
                                        <select
                                            value={tier.discountMode || "percentage"}
                                            onChange={(e) => updateTier(index, "discountMode", e.target.value)}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Discount Value {tier.discountMode === "fixed" ? "(₹)" : "(%)"}</label>
                                        <input
                                            type="number"
                                            value={tier.discountValue || 0}
                                            onChange={(e) =>
                                                updateTier(index, "discountValue", Number(e.target.value))
                                            }
                                        />
                                        {tier.discountMode === "fixed" && (
                                            <span style={{ marginLeft: "8px", fontSize: "20px" }}>₹</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {tier.rewardType === "Product" && (
                                <>
                                    <button onClick={handleOpenPopup}>Add Product</button>
                                    <div className="added-products-list">
                                        {addedProgressProducts.map((product) => (
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
                                </>
                            )}
                            {showPopup && (
                                <div className="popup-overlay">
                                    <div className="popup">
                                        <h3>Select Products</h3>
                                        <div className="popup-product-list" ref={listRef}>
                                            {visibleProducts.map((product) => (
                                                <div key={product.id} className="popup-product-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProgressProducts.includes(String(product.id))}
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
                                                disabled={selectedProgressProducts.length === 0}
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

                            <div className="form-group">
                                <label>Reward Description</label>
                                <input
                                    type="text"
                                    value={tier.rewardDescription}
                                    onChange={(e) => updateTier(index, "rewardDescription", e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Text Before Completing Tier</label>
                                <textarea
                                    value={tier.textBefore}
                                    onChange={(e) => updateTier(index, "textBefore", e.target.value)}
                                />
                            </div>

                            <hr />
                        </div>
                    ))}

                    <div className="form-group">
                        <label>Text After Completing Full Rewards Bar</label>
                        <textarea
                            value={textAfter}
                            onChange={(e) => setTextAfter(e.target.value)}
                            placeholder="Congratulations! You have achieved Free gift(s)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Test Cart Amount (Try slider)</label>
                        <input
                            type="range"
                            min="0"
                            max={maxAmount}
                            value={testAmount}
                            onChange={(e) => setTestAmount(Number(e.target.value))}
                        />
                        <span>{testAmount}</span>
                    </div>

                    {tiers.length < allTiers.length && (
                        <button type="button" className="add-tier-btn" onClick={addTier}>
                            <Plus size={16} /> Add Tier
                        </button>
                    )}

                    <div className="form-group">
                        <h2>Design</h2>
                        <div className="text-colors">
                            {textColors.map(({ label, value, setter }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ flex: 1 }}>{label}</label>
                                    <div
                                        className="color-preview"
                                        style={{
                                            backgroundColor: value,
                                        }}
                                        onClick={(e) => togglePicker(value, setter, e)}
                                    ></div>
                                    <input
                                        type="text"
                                        value={value.toUpperCase()}
                                        onChange={(e) => setter(e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="text-font-size">
                            <label htmlFor="">Tier text size</label>
                            <input type="number"
                                value={tierFontsize}
                                onChange={(e) => setTierFontsize(e.target.value)}
                            />
                        </div>
                        <div className="text-font-size">
                            <label htmlFor="">Reward text size</label>
                            <input type="number"
                                value={rewardFontsize}
                                onChange={(e) => setRewardFontsize(e.target.value)}
                            />
                        </div>
                        <div>
                            <h2>Before reach tier</h2>
                            <div className="text-colors">
                                {iconColors.map(({ label, value, setter }) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                        <label style={{ flex: 1 }}>{label}</label>
                                        <div
                                            className="color-preview"
                                            style={{
                                                backgroundColor: value,
                                            }}
                                            onClick={(e) => togglePicker(value, setter, e)}
                                        ></div>
                                        <input
                                            type="text"
                                            value={value.toUpperCase()}
                                            onChange={(e) => setter(e.target.value)}
                                            className="color-text-input"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2>After reach tier</h2>
                            <div className="text-colors">
                                {afterColors.map(({ label, value, setter }) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                        <label style={{ flex: 1 }}>{label}</label>
                                        <div
                                            className="color-preview"
                                            style={{
                                                backgroundColor: value,
                                            }}
                                            onClick={(e) => togglePicker(value, setter, e)}
                                        ></div>
                                        <input
                                            type="text"
                                            value={value.toUpperCase()}
                                            onChange={(e) => setter(e.target.value)}
                                            className="color-text-input"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {showPicker && (
                            <div
                                ref={pickerRef}
                                className="color-picker-popup"
                                style={{
                                    position: "absolute",
                                    top: pickerPosition.top,
                                    left: pickerPosition.left,
                                    zIndex: 999,
                                    boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                                }}
                            >
                                <HexColorPicker color={pickerColor} onChange={handleColorChange} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
