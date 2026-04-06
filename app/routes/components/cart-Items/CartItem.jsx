import { useState } from "react";

export default function CartItem({ showStrikethrough, textColor, savingColor, Subscription, subscriptionUpgradesSettings }) {
  const [qty, setQty] = useState(2);

  return (
    <>
      <div className="cart-app-item">
        <div className="cart-app-item__image">
          <img
            src="https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg"
            alt="product"
          />
        </div>

        <div className="cart-app-item__content">
          <div className="cart-app-item__title" style={{ color: textColor }}>
            Placeholder product
          </div>

          <div className="cart-app-item__variant" style={{ color: textColor }}>
            Size: Medium
          </div>

          <div className="cart-app-item__price-row">
            {showStrikethrough && (
              <span className="cart-app-item__price-old" style={{ color: textColor }}>$120.00</span>
            )}
            <span className="cart-app-item__price-new" style={{ color: textColor }}>
              $84.00
            </span>
            <span className="cart-app-item__save" style={{ color: savingColor }}>
              (Save $36.00)
            </span>
          </div>

          <div className="cart-app-item__actions">
            <div className="cart-app-item__qty">
              <button
                onClick={() => qty > 1 && setQty(qty - 1)}
                className="cart-app-item__qty-btn"
              >
                −
              </button>

              <span className="cart-app-item__qty-value">{qty}</span>

              <button
                onClick={() => setQty(qty + 1)}
                className="cart-app-item__qty-btn"
              >
                +
              </button>
            </div>
            <span className="cart-app-item__badge">Auto 5</span>
          </div>
        </div>
      </div>
      {!subscriptionUpgradesSettings.enabled && (<Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} />)}
    </>
  );
}