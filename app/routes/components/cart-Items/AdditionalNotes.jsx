import { useState } from "react";
import { Icon } from "@shopify/polaris";
import { ChevronUpIcon, ChevronDownIcon } from "@shopify/polaris-icons";

export default function AdditionalNotes({ additionalNotesSettings }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="cart-additional-notes">
            <button
                type="button"
                className="cart-additional-notes__toggle"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span style={{display:'flex', gap:'4px'}}>
                    <span dangerouslySetInnerHTML={{ __html: additionalNotesSettings?.title || "Add special instructions" }} />
                    <Icon source={open ? ChevronUpIcon : ChevronDownIcon} />
                </span>
            </button>
            <div className={`cart-additional-notes__body${open ? " cart-additional-notes__body--open" : ""}`}>
                <textarea
                    className="cart-additional-notes__textarea"
                    placeholder={additionalNotesSettings?.placeholder || "Special instructions for your order"}
                />
            </div>
        </div>
    );
}
