import React, { useState, useRef, useEffect } from "react";
import {
    RangeSlider,
} from "@shopify/polaris";
import { HexColorPicker } from "react-colorful";
import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";

export default function Announcement({ announcementHeight, setAnnouncementHeight, announcementPosition, setAnnouncementPosition,
    announcementTimer, setAnnouncementTimer, announcementText, setAnnouncementText, showForm, setOpenForm,
    announcementFontSize, setAnnouncementFontSize, announcementBgColor, setAnnouncementBgColor, announcementTextColor,
    setAnnouncementTextColor, announcementBorderColor, setAnnouncementBorderColor, setIsAnnouncementVisible, isAnnouncementVisible
}) {
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [showTextPicker, setShowTextPicker] = useState(false);
    const [showBorderPicker, setShowBorderPicker] = useState(false);

    const bgRef = useRef(null);
    const textRef = useRef(null);
    const borderRef = useRef(null);

    const toggleForm = () => {
        setOpenForm(showForm ? null : "announcement");
    };

    const togglePicker = (type) => {
        if (type === "bg") setShowBgPicker(!showBgPicker);
        if (type === "text") setShowTextPicker(!showTextPicker);
        if (type === "border") setShowBorderPicker(!showBorderPicker);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (bgRef.current && !bgRef.current.contains(event.target)) setShowBgPicker(false);
            if (textRef.current && !textRef.current.contains(event.target)) setShowTextPicker(false);
            if (borderRef.current && !borderRef.current.contains(event.target)) setShowBorderPicker(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleVisibility = () => {
        setIsAnnouncementVisible(!isAnnouncementVisible);
        setOpenForm(!isAnnouncementVisible);
    };

    return (
        <div className="announcements-bar cart-page-container-item">
            <div className="announcements-sections cart-page-wrap" onClick={toggleForm} >
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Announcements</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" title={isAnnouncementVisible ? "Hide" : "Show"} onClick={toggleVisibility}>
                        {isAnnouncementVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <span>Settings</span>
                    <div>
                        <label>Height</label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            {["Slim", "Normal", "Thick"].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setAnnouncementHeight(option)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        border: announcementHeight === option ? "1px solid #000" : "1px solid #ccc",
                                        background: announcementHeight === option ? "#eee" : "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Position</label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            {["Before products", "After products"].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setAnnouncementPosition(option)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        border: announcementPosition === option ? "1px solid #000" : "1px solid #ccc",
                                        background: announcementPosition === option ? "#eee" : "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Timer - format in mm:ss</label>
                        <input
                            type="text"
                            value={announcementTimer}
                            onChange={(e) => {
                                let val = e.target.value;
                                val = val.replace(/[^0-9:]/g, "");
                                const parts = val.split(":").slice(0, 2);
                                const minutes = parts[0] || "";
                                const seconds = parts[1] ? parts[1].slice(0, 2) : "";
                                const formatted = seconds ? `${minutes}:${seconds}` : minutes;
                                setAnnouncementTimer(formatted);
                            }}
                            placeholder="00:00"
                            style={{ display: "block", marginTop: "4px", padding: "6px", width: "100%" }}
                        />
                        <small>e.g., 05:00 = 5 minutes, 00:59 = 59 seconds</small>
                    </div>

                    <div >
                        <label>Announcement text</label>
                        <textarea
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            rows={4}
                            style={{ display: "block", marginTop: "4px", padding: "6px", width: "100%" }}
                        />
                        <small>Use {"{TIMER}"} to show countdown timer</small>
                    </div>
                    <div >
                        <label>Font size: {announcementFontSize}px</label>
                        <RangeSlider
                            min={10}
                            max={24}
                            value={announcementFontSize}
                            onChange={setAnnouncementFontSize}
                            output
                        />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Background Color</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <div
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: announcementBgColor,
                                    border: "1px solid #000",
                                    cursor: "pointer",
                                }}
                                onClick={() => togglePicker("bg")}
                            ></div>
                            <input
                                type="text"
                                value={announcementBgColor.toUpperCase()}
                                onChange={(e) => setAnnouncementBgColor(e.target.value)}
                                style={{ padding: "6px", width: "100px" }}
                            />
                        </div>
                        {showBgPicker && (
                            <div ref={bgRef} style={{ position: "absolute", zIndex: 1000, marginTop: "8px" }}>
                                <HexColorPicker color={announcementBgColor} onChange={setAnnouncementBgColor} />
                            </div>
                        )}
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Text Color</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <div
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: announcementTextColor,
                                    border: "1px solid #000",
                                    cursor: "pointer",
                                }}
                                onClick={() => togglePicker("text")}
                            ></div>
                            <input
                                type="text"
                                value={announcementTextColor.toUpperCase()}
                                onChange={(e) => setAnnouncementTextColor(e.target.value)}
                                style={{ padding: "6px", width: "100px" }}
                            />
                        </div>
                        {showTextPicker && (
                            <div ref={textRef} style={{ position: "absolute", zIndex: 1000, marginTop: "8px" }}>
                                <HexColorPicker color={announcementTextColor} onChange={setAnnouncementTextColor} />
                            </div>
                        )}
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                        <label>Border Color</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <div
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: announcementBorderColor,
                                    border: "1px solid #000",
                                    cursor: "pointer",
                                }}
                                onClick={() => togglePicker("border")}
                            ></div>
                            <input
                                type="text"
                                value={announcementBorderColor.toUpperCase()}
                                onChange={(e) => setAnnouncementBorderColor(e.target.value)}
                                style={{ padding: "6px", width: "100px" }}
                            />
                        </div>
                        {showBorderPicker && (
                            <div ref={borderRef} style={{ position: "absolute", zIndex: 1000, marginTop: "8px" }}>
                                <HexColorPicker color={announcementBorderColor} onChange={setAnnouncementBorderColor} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
