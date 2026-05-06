import { useState } from "react";
import {
    DiscountIcon
} from '@shopify/polaris-icons';
import {
    Icon,
} from "@shopify/polaris";

export default function DiscountCode({ discountCodesSettings }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handlDiscount = () => {
        if (code === '') {
            setLoading(false);
            return
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setCode('')
        }, 2000);
    }

    if (discountCodesSettings?.enabled) return null;

    return (
        <div className="cart-discount-row upcart-discount-code-row upcart-discount-code-module custom-cart-public-discount-code">
            <div className="upcart-discount-code-input-wrapper custom-cart-public-discount-code__input-wrapper">
                <div class="hub-discount-heading">Coupon Code</div>
                <div className="hub-discount-input-row">
                    <div className="hub-discount-input-btn">
                        <Icon source={DiscountIcon} />
                        <input
                            type="text"
                            className="cart-discount-row__input hub-discount-input upcart-discount-code-input custom-cart-public-discount-code__input"
                            placeholder={discountCodesSettings?.placeholder || "Discount code"}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button
                            type="button"
                            className="cart-discount-row__btn upcart-discount-code-button custom-cart-public-discount-code__button"
                            onClick={handlDiscount}
                        >
                            {loading ? (
                                <span className="loader"></span>
                            ) : (
                                discountCodesSettings?.buttonText || "Apply"
                            )}
                        </button>
                    </div>
                    {discountCodesSettings.showOfferBox && (<div className="discount-offer-btn">
                        <button class="hub-view-offers-btn">View all offers</button>
                        <img src="https://hubsyntax.com/cart-images/Vector%20(4).svg" alt="discount-code" class="discount-code-img"></img>
                    </div>)}
                </div>
            </div>
            <div className="upcart-discount-code-badge" style={{ display: "none" }}>
                <span className="upcart-discount-code-icon" />
                <span className="upcart-discount-code-text" />
            </div>
        </div>
    );
}
