import { useState } from "react";

const PRODUCT_IMAGE = "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg";

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function QtyStepper({ qty, onDecrement, onIncrement, loadingType }) {
  return (
    <div className="cart-app-item__qty upcart-public-component-product-tile__quantity-selector">
      <button onClick={onDecrement} className="cart-app-item__qty-btn upcart-product-quantity-minus upcart-public-component-product-tile__quantity-minus">{loadingType === "dec" ? <span className="loader"></span> : "−"}</button>
      <span className="cart-app-item__qty-value upcart-product-quantity-input">{qty}</span>
      <button onClick={onIncrement} className="cart-app-item__qty-btn upcart-product-quantity-plus upcart-public-component-product-tile__quantity-plus"> {loadingType === "inc" ? <span className="loader"></span> : "+"}</button>
    </div>
  );
}

function ClassicLayout({ qty, loadingType, setLoadingType, updateQty, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription }) {
  return (
    <div className="cart-app-item upcart-product-item upcart-public-component-product-tile" style={{ flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
        <div className="cart-app-item__image upcart-product-image-wrapper upcart-public-component-product-tile__image-wrapper">
          <img className="upcart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: 0 }}>
            <div className="cart-app-item__title upcart-product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500, wordBreak: "break-word", overflowWrap: "break-word" }}>
              The Power Backpack Duffel
            </div>
            <div style={{ fontSize: "12px", color: "#777" }}>Premium Global Brands</div>
            <div className="cart-app-item__variant" style={{ color: textColor, fontSize: "12px" }}>
              Size: <strong>STANDARD</strong>
            </div>
            <div className="cart-app-item__variant" style={{ color: textColor, fontSize: "12px" }}>
              Color: <strong>BLACK</strong>
            </div>
            {/* Discount badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "#e6f4ea", color: "#1e7e34",
              fontSize: "11px", fontWeight: 600,
              padding: "3px 8px", borderRadius: "20px", width: "fit-content",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Travel25
            </span>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: textColor, fontWeight: 700, fontSize: "14px" }}>$200.00</span>
              {showStrikethrough && (
                <span style={{ color: "#999", textDecoration: "line-through", fontSize: "12px" }}>$400.00</span>
              )}
            </div>
            {cartSettings.showSavingsBelowPrices && (
              <div style={{
                background: "#e6f4ea", color: savingColor,
                fontSize: "11px", fontWeight: 700,
                padding: "2px 7px", borderRadius: "3px",
              }}>
                {cartSettings.savingsText} 50%
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <QtyStepper
                qty={qty}
                loadingType={loadingType}
                onDecrement={() => updateQty("dec")}
                onIncrement={() => updateQty("inc")}
              />
              <button
                className="cart-app-item__remove"
                disabled={loadingType === "remove"}
                onClick={async () => {
                  setLoadingType("remove");
                  await new Promise((res) => setTimeout(res, 800));
                  setLoadingType(null);
                }}
              >
                {loadingType === "remove" ? (
                  <span className="loader"></span>
                ) : (
                  <TrashIcon />
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {!subscriptionUpgradesSettings.enabled && (
        <div style={{ width: "100%", display: 'flex', justifyContent: 'center' }}>
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} />
        </div>
      )}
    </div>
  );
}

function SubscriptionLayout({ qty, loadingType, setLoadingType, updateQty, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription }) {
  return (
    <div className="cart-app-item upcart-product-item upcart-public-component-product-tile upcart-layout-subscription">
      <div className="cart-app-item__image upcart-product-image-wrapper" style={{ width: "72px", height: "72px", flexShrink: 0 }}>
        <img className="upcart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>

        {/* Title + trash + MEGA20 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="cart-app-item__title upcart-product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
              Pain oil
            </div>
            <div style={{ fontSize: "12px", color: "#777" }}>Premium Global Brands</div>

            {/* Variants */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#777" }}>
              <span>Qty: <strong style={{ color: textColor }}>100ml</strong></span>
              <span style={{ color: "#ccc" }}>|</span>
              <span>Bottles: <strong style={{ color: textColor }}>1</strong></span>
            </div>

          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <button
              className="cart-app-item__remove"
              disabled={loadingType === "remove"}
              onClick={async () => {
                setLoadingType("remove");

                await new Promise((res) => setTimeout(res, 800));

                console.log("removed");

                setLoadingType(null);
              }}
            >
              {loadingType === "remove" ? (
                <span className="loader"></span>
              ) : (
                <TrashIcon />
              )}
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1e7e34", fontSize: "12px", fontWeight: 600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              MEGA20
            </span>
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ color: textColor, fontWeight: 700, fontSize: "14px" }}>$27.00</span>
          {showStrikethrough && (
            <span style={{ color: "#999", textDecoration: "line-through", fontSize: "12px" }}>$40.00</span>
          )}
          {cartSettings.showSavingsBelowPrices && (
            <span style={{ background: "#e6f4ea", color: savingColor, fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px" }}>
              {cartSettings.savingsText} 10%
            </span>
          )}
        </div>

        {/* Qty +  button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
          <div>
            <QtyStepper
              qty={qty}
              loadingType={loadingType}
              onDecrement={() => updateQty("dec")}
              onIncrement={() => updateQty("inc")}
            />
          </div>
        </div>
        {!subscriptionUpgradesSettings.enabled && (<Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} />)}
      </div>
    </div>
  );
}

function ModernLayout({ qty, loadingType, setLoadingType, updateQty, showStrikethrough, textColor, savingColor, subscriptionUpgradesSettings, Subscription, cartSettings }) {
  return (
    <div className="cart-app-item upcart-product-item upcart-public-component-product-tile upcart-layout-modern">

      {/* Image with SAVE badge above */}
      <div style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        {cartSettings.showSavingsBelowPrices && (<span style={{
          background: "#e6f4ea", color: savingColor,
          fontSize: "10px", fontWeight: 700,
          padding: "2px 6px", borderRadius: "3px", width: "fit-content",
        }}>{cartSettings.savingsText} 50%</span>)}
        <div style={{ width: "80px", height: "80px", borderRadius: "6px", overflow: "hidden" }}>
          <img className="upcart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>

        {/* Title + trash + price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="cart-app-item__title upcart-product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
              The Denmark Teal -<br />Unbreakable Luggage
            </div>
            {/* Variant selectors */}
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "none", border: "1px solid #ccc",
                borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                padding: "3px 8px", cursor: "pointer", color: textColor || "inherit",
              }}>
                L <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "none", border: "1px solid #ccc",
                borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                padding: "3px 8px", cursor: "pointer", color: textColor || "inherit",
              }}>
                TEAL <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <button
              className="cart-app-item__remove"
              disabled={loadingType === "remove"}
              onClick={async () => {
                setLoadingType("remove");

                await new Promise((res) => setTimeout(res, 800));

                console.log("removed");

                setLoadingType(null);
              }}
            >
              {loadingType === "remove" ? (
                <span className="loader"></span>
              ) : (
                <TrashIcon />
              )}
            </button>
            {showStrikethrough && (
              <span style={{ color: "#999", textDecoration: "line-through", fontSize: "12px" }}>$400.00</span>
            )}
            <span style={{ color: textColor, fontWeight: 700, fontSize: "15px" }}>$200.00</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1e7e34", fontSize: "12px", fontWeight: 600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              MEGA20
            </span>
          </div>
        </div>

        {/* button + qty */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
          <QtyStepper
            qty={qty}
            loadingType={loadingType}
            onDecrement={() => updateQty("dec")}
            onIncrement={() => updateQty("inc")}
          />
        </div>
        {!subscriptionUpgradesSettings.enabled && (<Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} />)}
      </div>
    </div>
  );
}

export default function CartItem({ showStrikethrough, textColor, savingColor, Subscription,
  subscriptionUpgradesSettings, cartSettings }) {
  const [qty, setQty] = useState(1);
  const layout = cartSettings.cartItemLayout || "classic";

  const [loadingType, setLoadingType] = useState(null);

  const updateQty = async (type) => {
    if (loadingType) return;

    setLoadingType(type);

    await new Promise((res) => setTimeout(res, 800));

    setQty((prev) => {
      if (type === "inc") return prev + 1;
      if (type === "dec" && prev > 1) return prev - 1;
      return prev;
    });

    setLoadingType(null);
  };

  const sharedProps = {
    qty,
    setQty,
    loadingType,
    setLoadingType,
    updateQty,
    showStrikethrough,
    textColor,
    savingColor,
    cartSettings,
    subscriptionUpgradesSettings,
    Subscription
  };

  return (
    <div className="upcart-products-section cart-app__items">
      {layout === "subscription" ? (
        <SubscriptionLayout {...sharedProps} />
      ) : layout === "modern" ? (
        <ModernLayout {...sharedProps} />
      ) : (
        <ClassicLayout {...sharedProps} />
      )}
    </div>
  );
}
