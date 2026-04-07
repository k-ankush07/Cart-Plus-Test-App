export default function DiscountCode({ discountCodesSettings }) {
    if (discountCodesSettings?.enabled) return null;

    return (
        <div className="cart-discount-row upcart-discount-code-row upcart-discount-code-module upcart-public-discount-code">
            <div className="upcart-discount-code-input-wrapper upcart-public-discount-code__input-wrapper">
                <input
                    type="text"
                    className="cart-discount-row__input upcart-discount-code-input upcart-public-discount-code__input"
                    placeholder={discountCodesSettings?.placeholder || "Discount code"}
                />
                <button type="button" className="cart-discount-row__btn upcart-discount-code-button upcart-public-discount-code__button">
                    {discountCodesSettings?.buttonText || "Apply"}
                </button>
            </div>
            <div className="upcart-discount-code-badge" style={{ display: "none" }}>
                <span className="upcart-discount-code-icon" />
                <span className="upcart-discount-code-text" />
            </div>
        </div>
    );
}
