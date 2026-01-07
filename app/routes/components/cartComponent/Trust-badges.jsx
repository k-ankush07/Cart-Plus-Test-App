import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Settings, GripVertical, Check, Trash2 } from "lucide-react";

const trustBadgeImages = [
    { id: 1, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_1.svg" },
    { id: 2, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_2.svg" },
    { id: 3, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_4.svg" },
    { id: 4, src: "http://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_5.svg" },
    { id: 5, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_15.svg" },
    { id: 6, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_22.svg" },
    { id: 7, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_34.svg" },
    { id: 8, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_24.svg" },
    { id: 9, src: "https://cdn.shopify.com/s/files/1/0660/0399/2727/files/Payment_method_icon_31.svg" },
];

export default function Trustbadges({ showForm, setOpenForm, isTrustVisible, setIsTrustVisible,
    customImages, setCustomImages, selectedImages, setSelectedImages, shop, accessToken
}) {

    useEffect(() => {
        if (!selectedImages || selectedImages.length === 0) {
            const defaultSelection = trustBadgeImages.slice(0, 3).map(img => ({
                ...img,
                type: "default",
                selectedAt: Date.now()
            }));
            setSelectedImages(defaultSelection);
        }
    }, []);

    const toggleForm = () => {
        setOpenForm(showForm ? null : "trustBadges");
    };

    const toggleVisibility = () => {
        setIsTrustVisible(!isTrustVisible);
        setOpenForm(!isTrustVisible);
    };

    const handleSelect = (img, isCustom) => {
        const exists = selectedImages.some(i => i.id === img.id);

        if (exists) {
            setSelectedImages(selectedImages.filter(i => i.id !== img.id));
        } else {
            setSelectedImages([
                ...selectedImages,
                {
                    ...img,
                    type: isCustom ? "custom" : "default",
                    selectedAt: Date.now()
                }
            ]);
        }
    };


    const handleDeleteCustomImage = (id) => {
        setCustomImages(customImages.filter(img => img.id !== id));
        setSelectedImages(selectedImages.filter(img => img.id !== id));
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);
        formData.append("shop", shop);
        formData.append("accessToken", accessToken);
        try {

            const res = await fetch("https://puzzles-tale-sphere-fiction.trycloudflare.com/upload-trust-badge", {
                method: "POST",
                body: formData,
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.log(" JSON parse error:", err);
                return;
            }
            if (!data.imageUrl) {
                console.warn(" imageUrl missing in backend response!");
            }

            setCustomImages([
                ...customImages,
                { id: Date.now(), src: data.imageUrl }
            ]);

        } catch (err) {
            console.error(" Upload failed:", err);
        }
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Trust Badges</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="icon-btn"
                        title={isTrustVisible ? "Hide" : "Show"}
                        onClick={toggleVisibility}
                    >
                        {isTrustVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <p>Default Payment Icons:</p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {trustBadgeImages.map((img) => (
                            <div
                                key={img.id}
                                onClick={() => handleSelect(img, false)}
                                style={{
                                    position: "relative",
                                    cursor: "pointer",
                                    border: selectedImages.some((i) => i.id === img.id)
                                        ? "2px solid black"
                                        : "2px solid transparent",
                                    borderRadius: "6px",
                                    width: "50px",
                                    height: "50px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <img
                                    src={img.src}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "6px",
                                        border: "1px solid rgb(227, 227, 227)",
                                    }}
                                />
                                {selectedImages.some((i) => i.id === img.id) && (
                                    <Check
                                        size={20}
                                        color="white"
                                        style={{
                                            position: "absolute",
                                            top: "-12px",
                                            right: "-9px",
                                            background: "#29845a",
                                            borderRadius: "50%",
                                            padding: "3px",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {customImages.length > 0 && (
                        <>
                            <p style={{ marginTop: "20px" }}>Your Uploaded Badges:</p>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {customImages.map((img) => (
                                    <div
                                        key={img.id}
                                        onClick={() => handleSelect(img, true)}
                                        style={{
                                            position: "relative",
                                            cursor: "pointer",
                                            border: selectedImages.some((i) => i.id === img.id)
                                                ? "2px solid black"
                                                : "2px solid transparent",
                                            borderRadius: "6px",
                                            width: "50px",
                                            height: "50px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <img
                                            src={img.src}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                borderRadius: "6px",
                                                border: "1px solid rgb(227, 227, 227)",
                                            }}
                                        />
                                        {selectedImages.some((i) => i.id === img.id) && (
                                            <Check
                                                size={20}
                                                color="white"
                                                style={{
                                                    position: "absolute",
                                                    top: "-12px",
                                                    right: "-9px",
                                                    background: "#29845a",
                                                    borderRadius: "50%",
                                                    padding: "3px",
                                                }}
                                            />
                                        )}
                                        <Trash2
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCustomImage(img.id);
                                            }}
                                            size={18}
                                            style={{
                                                position: "absolute",
                                                bottom: "-10px",
                                                right: "-10px",
                                                background: "white",
                                                borderRadius: "50%",
                                                padding: "3px",
                                                border: "1px solid rgb(200,200,200)",
                                                cursor: "pointer",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "15px" }}>
                                <label>Upload more custom badges:</label>
                                <br />
                                <button
                                    style={{
                                        marginTop: "6px",
                                        padding: "6px 12px",
                                        border: "1px solid black",
                                        cursor: "pointer",
                                        borderRadius: "4px",
                                    }}
                                    onClick={() => document.getElementById("addMoreUpload").click()}
                                >
                                    Add More Image
                                </button>

                                <input
                                    id="addMoreUpload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    style={{ display: "none" }}
                                />
                            </div>
                        </>
                    )}

                    {customImages.length === 0 && (
                        <div style={{ marginTop: "15px" }}>
                            <label>Upload your custom badge:</label>
                            <input type="file" accept="image/*" onChange={handleUpload} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
