import AdditionalNotes from "./AdditionalNotes";

export default function CartFooter({ designSettings, additionalNotesSettings }) {
    return (
        <div className="cart-app__footer"
            style={{ backgroundColor: designSettings.accentColor }}>
            {!additionalNotesSettings?.enabled && additionalNotesSettings.placement === "top_of_footer" && (
                <AdditionalNotes additionalNotesSettings={additionalNotesSettings} />
            )}
            <div style={{padding:'16px'}}>
                <div className="cart-app__row-between">
                    <div className="cart-app__row cart-app__row--gap">
                        <span style={{ color: designSettings.textColor }}>Discounts</span>
                        <span className="cart-app__badge">Auto 5</span>
                    </div>
                    <span style={{ color: designSettings.textColor }}>- $36.00</span>
                </div>

                {designSettings.enableSubtotal && (
                    <div className="cart-app__row-between" style={{ color: designSettings.subtotalColor }}>
                        <span className="cart-app__subtotal">Subtotal</span>
                        <span className="cart-app__subtotal">$84.00</span>
                    </div>
                )}

                <button
                    className="cart-app__checkout"
                    style={{
                        borderRadius: `${designSettings.buttonRadius}px`,
                        backgroundColor: designSettings.buttonColor,
                        "--btn-hover-text": designSettings.buttonHoverColor,
                        "--btn-text": designSettings.buttonTextColor,
                    }}
                >
                    Checkout • $84.00
                </button>
            </div>
        </div>
    )
}
