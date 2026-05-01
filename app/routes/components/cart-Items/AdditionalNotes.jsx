import { useState } from "react";
import { Icon } from "@shopify/polaris";
import { ChevronUpIcon, ChevronDownIcon } from "@shopify/polaris-icons";

export default function AdditionalNotes({ additionalNotesSettings }) {
    const [open, setOpen] = useState(false);

    const isBelowItems = additionalNotesSettings?.placement === "below_items";

    return (
        <div
            className={`cart-additional-notes custom-cart-public-notes ${isBelowItems ? "notes-below-items" : ""
                }`}
        >
            <button
                type="button"
                className="cart-additional-notes__toggle custom-cart-public-component-collapse__dropdown-container"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="custom-cart-public-notes__text-container" style={{ display: 'flex', gap: '4px' }}>
                    <span dangerouslySetInnerHTML={{ __html: additionalNotesSettings?.title || "Add special instructions" }} />
                    <span className="custom-cart-public-component-collapse__expand-icon"><Icon source={open ? ChevronUpIcon : ChevronDownIcon} /></span>
                </span>
            </button>
            <div className={`cart-additional-notes__body${open ? "cart-additional-notes__body--open" : ""}`}>
                <textarea
                    className="cart-additional-notes__textarea custom-cart-public-notes__textarea "
                    placeholder={additionalNotesSettings?.placeholder || "Special instructions for your order"}
                />
            </div>
        </div>
    );
}
