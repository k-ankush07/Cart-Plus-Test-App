import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import {
    RangeSlider,
} from "@shopify/polaris";

export default function CartDesgin({ bgColor, setBgColor, headerfontSize, setHeaderFontSize,
    btnborderRadius, setBtnBorderRadius, headingColor, setHeadingColor, variantColor, setVariantColor,
    discountBadgeColor, setDiscountBadgeColor, priceColor, setPriceColor, quantityColor, setQuantityColor,
    originalPriceColor, setOriginalPriceColor, savingPriceColor, setSavingPriceColor, buttonColor, setButtonColor,
    buttonTextColor, setButtonTextColor, checkoutButtonColor, setCheckoutButtonColor, checkoutButtonTextColor, setCheckoutButtonTextColor,
    iconColor, setIconColor, setBtnLinkColor, btnLinkColor
}) {
    const [activeTab, setActiveTab] = useState("background");
    const [showPicker, setShowPicker] = useState(false);
    const [pickerColor, setPickerColor] = useState(bgColor);
    const [currentSetter, setCurrentSetter] = useState(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    const pickerRef = useRef(null);

    const togglePicker = (e) => {
        const rect = e.target.getBoundingClientRect();

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
        { label: "Heading text color", value: headingColor, setter: setHeadingColor },
        { label: "Variant color", value: variantColor, setter: setVariantColor },
        { label: "Discount badge text color", value: discountBadgeColor, setter: setDiscountBadgeColor },
        { label: "Price color", value: priceColor, setter: setPriceColor },
        { label: "Quantity color", value: quantityColor, setter: setQuantityColor },
        { label: "Original price color", value: originalPriceColor, setter: setOriginalPriceColor },
        { label: "Saving price color", value: savingPriceColor, setter: setSavingPriceColor },
    ];

    const buttonColors = [
        { label: "Button color", value: buttonColor, setter: setButtonColor },
        { label: "Button text color", value: buttonTextColor, setter: setButtonTextColor },
        { label: "Checkout button color", value: checkoutButtonColor, setter: setCheckoutButtonColor },
        { label: "Checkout button text color", value: checkoutButtonTextColor, setter: setCheckoutButtonTextColor },
        { label: "Button Link color", value: btnLinkColor, setter: setBtnLinkColor },
    ];

    return (
        <div>
            <div className="tabs" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                {["background", "text", "button", "icon"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setShowPicker(false);
                        }}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: activeTab === tab ? "1px solid black" : "1px solid #ccc",
                            background: activeTab === tab ? "#eee" : "#fff",
                            cursor: "pointer",
                            textTransform: "capitalize"
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {activeTab === "background" && (
                <div className="cart-bgColor">
                    <label className="color-picker-label">Background Color</label>
                    <div className="color-picker-wrapper">
                        <div
                            className="color-preview"
                            style={{
                                backgroundColor: bgColor,
                            }}
                            onClick={(e) => togglePicker(bgColor, setBgColor, e)}
                        ></div>
                        <input
                            type="text"
                            value={bgColor.toUpperCase()}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="color-text-input" />
                    </div>
                </div>
            )}

            {activeTab === "text" && (
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
            )}

            {activeTab === "button" && (
                <div>
                    {buttonColors.map(({ label, value, setter }) => (
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
            )}

            {activeTab === "icon" && (
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ flex: 1 }}>Icon Color</label>
                    <div
                        className="color-preview"
                        style={{
                            backgroundColor: iconColor,
                        }}
                        onClick={(e) => togglePicker(iconColor, setIconColor, e)}
                    ></div>
                    <input
                        type="text"
                        value={iconColor}
                        onChange={(e) => setIconColor(e.target.value)}
                        className="color-text-input"
                    />
                </div>
            )}

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
            <div className="cart-header-sections">
                <div>
                    <label>Header size {headerfontSize}px</label>
                    <input
                        type="number"
                        value={headerfontSize}
                        onChange={(e) => setHeaderFontSize(Number(e.target.value))}
                        style={{ marginLeft: "8px", width: "100%" }}
                    />
                </div>
                <div>
                    <label> Button Border radius : {btnborderRadius}px</label>
                    <RangeSlider
                        min={8}
                        max={100}
                        value={btnborderRadius}
                        onChange={setBtnBorderRadius}
                        output
                    />
                </div>
            </div>
        </div>
    )
}
