import { useState } from "react";
import { backgroundToCss } from "../utils/background";

const MAX_CHARS = 500;

export default function AdditionalNotes({ additionalNotesSettings, designSettings }) {
    const s = additionalNotesSettings || {};
    const expandable = s.expandable ?? true;
    const collapsedByDefault = s.collapsedByDefault ?? true;

    const [open, setOpen] = useState(expandable ? !collapsedByDefault : false);
    const [text, setText] = useState("");
    const [saved, setSaved] = useState("");

    const isBelowItems = s.placement === "below_items";
    const iconColor = designSettings?.iconColor || "#000000";
    const limit = s.limitChars ?? true;

    const buttonBg = backgroundToCss(s.noteButtonBackground);
    const noteBg = backgroundToCss(s.orderNoteBackground);
    const saveBg = backgroundToCss(s.saveNoteBackground) || designSettings?.buttonColor || "#303030";

    const noteBox = (
        <div
            className={`cart-additional-notes__body ${open ? "cart-additional-notes__body--open" : ""}`}
            style={{
                ...(noteBg ? { background: noteBg } : {}),
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {(s.heading ?? "Order note") && (
                <div
                    style={{ fontSize: 13, fontWeight: 600 }}
                    dangerouslySetInnerHTML={{ __html: s.heading ?? "Order note" }}
                />
            )}
            <textarea
                className="cart-additional-notes__textarea cart-plus-public-notes__textarea"
                placeholder={s.placeholder || "Special instructions for your order"}
                value={text}
                maxLength={limit ? MAX_CHARS : undefined}
                onChange={(e) => setText(e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {limit ? (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                        {text.length}/{MAX_CHARS}
                    </span>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    onClick={() => {
                        setSaved(text);
                        setOpen(false);
                    }}
                    style={{
                        border: "none",
                        cursor: "pointer",
                        padding: "8px 14px",
                        borderRadius: `${designSettings?.buttonRadius ?? 6}px`,
                        background: saveBg,
                        color: designSettings?.buttonTextColor || "#ffffff",
                        fontSize: 13,
                    }}
                    dangerouslySetInnerHTML={{ __html: s.saveLabel ?? "Save note" }}
                />
            </div>
        </div>
    );

    // ── Not expandable: a "Note" button that opens the note box ──
    if (!expandable) {
        return (
            <div className={`cart-additional-notes cart-plus-public-notes ${isBelowItems ? "notes-below-items" : ""}`}>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.15)",
                        ...(buttonBg ? { background: buttonBg } : { background: "transparent" }),
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: s.buttonLabel ?? "Note" }} />
                </button>
                {saved && !open && (
                    <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{saved}</div>
                )}
                {open && <div style={{ marginTop: 8 }}>{noteBox}</div>}
            </div>
        );
    }

    // ── Expandable row ──
    return (
        <div
            className={`cart-additional-notes cart-plus-public-notes ${isBelowItems ? "notes-below-items" : ""}`}
        >
            <button
                type="button"
                className="cart-additional-notes__toggle cart-plus-public-component-collapse__dropdown-container"
                onClick={() => setOpen((prev) => !prev)}
                style={buttonBg ? { background: buttonBg } : undefined}
            >
                <span className="cart-plus-public-notes__text-container" style={{ display: 'flex', gap: '4px', lineHeight: '1' }}>
                    <div className="hub-notes-icon">
                        {/* Pencil / edit icon (was Group.svg) */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </div>
                    <span dangerouslySetInnerHTML={{ __html: s.title || "Add special instructions" }} />
                    <span
                        className="cart-plus-public-component-collapse__expand-icon"
                        style={{
                            display: 'inline-flex',
                            transition: 'transform 0.3s ease',
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    >
                        <svg  viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </span>
                </span>
            </button>

            {/* Smooth open/close wrapper */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateRows: open ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s ease',
                }}
            >
                <div style={{ overflow: 'hidden' }}>{noteBox}</div>
            </div>
        </div>
    );
}
