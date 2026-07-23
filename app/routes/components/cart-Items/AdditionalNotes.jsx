import { useState } from "react";

export default function AdditionalNotes({ additionalNotesSettings, designSettings }) {
    const [open, setOpen] = useState(false);

    const isBelowItems = additionalNotesSettings?.placement === "below_items";
    const iconColor = designSettings?.iconColor || "#000000";

    return (
        <div
            className={`cart-additional-notes cart-plus-public-notes ${isBelowItems ? "notes-below-items" : ""}`}
        >
            <button
                type="button"
                className="cart-additional-notes__toggle cart-plus-public-component-collapse__dropdown-container"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="cart-plus-public-notes__text-container" style={{ display: 'flex', gap: '4px', lineHeight: '1' }}>
                    <div>
                        {/* Pencil / edit icon (was Group.svg) */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </div>
                    <span dangerouslySetInnerHTML={{ __html: additionalNotesSettings?.title || "Add special instructions" }} />
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
                <div style={{ overflow: 'hidden' }}>
                    <div className={`cart-additional-notes__body ${open ? "cart-additional-notes__body--open" : ""}`}>
                        <textarea
                            className="cart-additional-notes__textarea cart-plus-public-notes__textarea"
                            placeholder={additionalNotesSettings?.placeholder || "Special instructions for your order"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}