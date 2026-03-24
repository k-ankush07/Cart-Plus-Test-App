import { BadgePercent, } from "lucide-react";

export default function Discount({ btnborderRadius, headingColor, discountBadgeColor, priceColor, buttonColor,
    buttonTextColor, checkoutButtonColor, checkoutButtonTextColor, iconColor, discountCode,
    buttonText, isDiscountVisible, checkoutText, discountText, totalDiscountText, discountSize,
    totalDiscountSize, checkoutSize, 

}) {
    return (
        <div className='cart-items-custom'>
            {isDiscountVisible && (
                <div className="cart-discount cart-sections-default">
                    <input type="text" placeholder={discountCode} />
                    <button
                        className="btn-apply"
                        style={{
                            borderRadius: `${btnborderRadius}px`,
                            background: buttonColor,
                            color: buttonTextColor,
                        }}
                    >
                        {buttonText}
                    </button>
                </div>
            )}
            <div className='discount-code cart-sections-default'>
                <div className='discount-lable' style={{ color: headingColor, fontSize: `${discountSize}px`, }}>
                    <span>{discountText || "Discount"}</span></div>
                <div className='discount-lable-code' >
                    <div className="discount-icon-code">
                        <span className="icon-btn discount" style={{ color: iconColor }}>
                            <BadgePercent size={18} />
                        </span>
                        <span style={{ color: discountBadgeColor }}> SUMMERSALE</span>
                    </div>
                    <span style={{ color: priceColor }}>₹5.00</span>
                </div>
            </div>

            <div className="cart-discount cart-sections-default" style={{ fontSize: `${totalDiscountSize}px` }}>
                <span style={{ color: headingColor }}>{totalDiscountText || "Total discount"}</span>
                <span style={{ color: priceColor }}>₹5.00</span>
            </div>

            <div className="checkout-btn"
                style={{
                    borderRadius: `${btnborderRadius}px`,
                    backgroundColor: checkoutButtonColor,
                    color: checkoutButtonTextColor,
                    fontSize: `${checkoutSize}px`,
                }}>
                <span>{checkoutText || "Checkout - ₹45.00"}</span>
            </div>
        </div>
    )
}
