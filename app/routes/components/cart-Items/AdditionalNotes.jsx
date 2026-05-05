import { useState } from "react";

export default function AdditionalNotes({ additionalNotesSettings }) {
    const [open, setOpen] = useState(false);

    const isBelowItems = additionalNotesSettings?.placement === "below_items";

    return (
        <div
            className={`cart-additional-notes custom-cart-public-notes ${isBelowItems ? "notes-below-items" : ""}`}
        >
            <button
                type="button"
                className="cart-additional-notes__toggle custom-cart-public-component-collapse__dropdown-container"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="custom-cart-public-notes__text-container" style={{ display: 'flex', gap: '4px', lineHeight: '1' }}>
                    <div><img src="https://hubsyntax.com/cart-images/Group.svg" alt="icon" /></div>
                    <span dangerouslySetInnerHTML={{ __html: additionalNotesSettings?.title || "Add special instructions" }} />
                    <span
                        className="custom-cart-public-component-collapse__expand-icon"
                        style={{
                            display: 'inline-flex',
                            transition: 'transform 0.3s ease',
                            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                        }}
                    >
                        <img src="https://hubsyntax.com/cart-images/Vector%20(3).svg" alt="icon" />
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
                            className="cart-additional-notes__textarea custom-cart-public-notes__textarea"
                            placeholder={additionalNotesSettings?.placeholder || "Special instructions for your order"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}