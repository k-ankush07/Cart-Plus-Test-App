import { useState } from "react";

export default function CartItem({ showStrikethrough, textColor, savingColor, Subscription,
  subscriptionUpgradesSettings, cartSettings }) {
  const [qty, setQty] = useState(2);

  return (
    <div className="upcart-products-section cart-app__items">
      <div className="cart-app-item upcart-product-item upcart-public-component-product-tile">
        <div className="cart-app-item__image upcart-product-image-wrapper upcart-public-component-product-tile__image-wrapper">
          <img
            className="upcart-public-component-product-tile__image"
            src="https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg"
            alt="product"
          />
        </div>

        <div className="cart-app-item__content upcart-public-component-product-tile__info">
          <div className="upcart-public-component-product-tile__header">
            <a href="#no" className="upcart-product-title-link upcart-public-component-product-tile__title-link">
              <div className="cart-app-item__title upcart-product-title upcart-public-component-product-tile__product-title" style={{ color: textColor }}>
                Placeholder product
              </div>
            </a>
          </div>

          <div className="cart-app-item__variant upcart-item-option upcart-public-component-product-tile__variant" style={{ color: textColor }}>
            <span className="upcart-item-option-category">Size</span>
            <span className="upcart-item-option-value">: Medium</span>
          </div>

          <div className="upcart-item-properties upcart-public-component-product-tile__properties">
            <span className="upcart-item-property" style={{ color: textColor }}></span>
          </div>

          <div className="cart-app-item__price-row upcart-item-prices-row upcart-public-component-product-tile__product-pricing">
            {showStrikethrough && (
              <span className="cart-app-item__price-old upcart-item-compare-price upcart-public-component-product-tile__price-compare-at" style={{ color: textColor }}>$120.00</span>
            )}
            <span className="cart-app-item__price-new upcart-item-price upcart-public-component-product-tile__price" style={{ color: textColor }}>
              $84.00
            </span>
            {cartSettings.showSavingsBelowPrices && (
              <span className="cart-app-item__save upcart-product-savings upcart-public-component-product-tile__savings" style={{ color: savingColor }}>
                ({cartSettings.savingsText} $36.00)
              </span>
            )}
          </div>

          <div className="cart-app-item__actions upcart-public-component-product-tile__controls">
            <div className="cart-app-item__qty upcart-public-component-product-tile__quantity-selector">
              <button
                onClick={() => qty > 1 && setQty(qty - 1)}
                className="cart-app-item__qty-btn upcart-product-quantity-minus upcart-public-component-product-tile__quantity-minus"
              >
                −
              </button>

              <span className="cart-app-item__qty-value upcart-product-quantity-input">{qty}</span>

              <button
                onClick={() => setQty(qty + 1)}
                className="cart-app-item__qty-btn upcart-product-quantity-plus upcart-public-component-product-tile__quantity-plus"
              >
                +
              </button>
            </div>
            <span className="cart-app-item__badge">Auto 5</span>
          </div>
        </div>
      </div>
      {!subscriptionUpgradesSettings.enabled && (<Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} />)}
    </div>
  );
}
