import { useState, useRef } from "react";

const PRODUCT_IMAGE = "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg";

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function hexToRGBA(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ─── Undo Toast ───────────────────────────────────────────────────────────────
function UndoToast({ message, onUndo, onDismiss }) {
  return (
    <div style={{
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#222",
      color: "#fff",
      borderRadius: 8,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      zIndex: 9999,
      minWidth: 220,
      maxWidth: 340,
      whiteSpace: "nowrap",
      animation: "slideUp 0.25s ease",
      top: 100
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        Removed '<strong>{message}</strong>'.
      </span>
      <button
        onClick={onUndo}
        style={{
          background: "none",
          border: "none",
          color: "#7ec8f4",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          marginLeft: "auto",
          flexShrink: 0,
          padding: 0,
        }}
      >
        Undo
      </button>
    </div>
  );
}

// ─── Qty Stepper ──────────────────────────────────────────────────────────────
function QtyStepper({ qty, onDecrement, onIncrement, loadingType }) {
  return (
    <div className="cart-app-item__qty custom-cart-public-component-product-tile__quantity-selector">
      <button onClick={onDecrement} className="cart-app-item__qty-btn upcart-product-quantity-minus custom-cart-public-component-product-tile__quantity-minus">
        {loadingType === "dec" ? <span className="loader"></span> : "−"}
      </button>
      <span className="cart-app-item__qty-value upcart-product-quantity-input custom-cart-public-component-product-tile__quantity-plus">{qty}</span>
      <button onClick={onIncrement} className="cart-app-item__qty-btn upcart-product-quantity-plus custom-cart-public-component-product-tile__quantity-plus">
        {loadingType === "inc" ? <span className="loader"></span> : "+"}
      </button>
    </div>
  );
}

// ─── Classic Layout ───────────────────────────────────────────────────────────
function ClassicLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription, designSettings }) {
  return (
    <div className="cart-app-item upcart-product-item custom-cart-public-component-product-tile" style={{ flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "10px", width: "100%" }}>
        <div className="cart-app-item__image upcart-product-image-wrapper custom-cart-public-component-product-tile__image-wrapper">
          <img className="upcart-public-component-product-tile__image custom-cart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
        </div>

        <div className="custom-cart-public-component-product-tile__info" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0 }}>
            <div className="cart-app-item__title upcart-product-title custom-cart-public-component-product-tile__header custom-cart-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500, wordBreak: "break-word", overflowWrap: "break-word" }}>
              {productName}
            </div>
            <div style={{ fontSize: "10px", lineHeight: '8px', color: textColor }}>Premium Global Brands</div>
            <div className="cart-app-item__variant custom-cart-public-component-product-tile__variant" style={{ color: textColor, fontSize: "10px", lineHeight: '8px', }}>
              Size: STANDARD
            </div>
            <div className="cart-app-item__variant custom-cart-public-component-product-tile__variant" style={{ color: textColor, fontSize: "10px", lineHeight: '8px', }}>
              Color: BLACK
            </div>
            <span className="custom-cart-public-component-product-tile__discount-codes"
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "#e6f4ea", color: "#1e7e34",
                fontSize: "11px", fontWeight: 600,
                padding: "3px 8px", borderRadius: "20px", width: "fit-content",
              }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
             MEGA20
            </span>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0, lineHeight: '12px' }}>
            <div className="custom-cart-public-component-product-tile__product-pricing" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="custom-cart-public-component-product-tile__price-group custom-cart-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>$200.00</span>
              {showStrikethrough && (
                <span className="" style={{ color: "#999", textDecoration: "line-through", fontSize: "9px" }}>$400.00</span>
              )}
            </div>
            {cartSettings.showSavingsBelowPrices && (
              <div
                className="custom-cart-public-component-product-tile__savings"
                style={{
                  background: hexToRGBA(savingColor, 0.1),
                  color: savingColor,
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "5px 7px",
                  borderRadius: "14px",
                }}
              >
                {cartSettings.savingsText} 50%
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="custom-cart-public-component-product-tile__controls">
              <QtyStepper
                qty={qty}
                loadingType={loadingType}
                onDecrement={() => updateQty("dec")}
                onIncrement={() => updateQty("inc")}
              />
              <button
                className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button"
                onClick={onRemoveClick}
              >
                <TrashIcon />
              </button>
            </div>
          </div>

        </div>
      </div>

      {!subscriptionUpgradesSettings.enabled && (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} designSettings={designSettings} />
        </div>
      )}
    </div>
  );
}

// ─── Subscription Layout ──────────────────────────────────────────────────────
function SubscriptionLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription, designSettings }) {
  return (
    <div className="cart-app-item upcart-product-item custom-cart-public-component-product-tile upcart-layout-subscription">
      <div className="cart-app-item__image upcart-product-image-wrapper custom-cart-public-component-product-tile__image-wrapper" style={{ width: "72px", height: "72px", flexShrink: 0 }}>
        <img className="upcart-public-component-product-tile__image custom-cart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
      </div>
      <div className="custom-cart-public-component-product-tile__info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="cart-app-item__title upcart-product-title custom-cart-public-component-product-tile__header custom-cart-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
              {productName}
            </div>
            <div className="custom-cart-public-component-product-tile__variant" style={{ fontSize: "10px", color: textColor, }}>Premium Global Brands</div>
            <div className="custom-cart-public-component-product-tile__variant" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: textColor }}>
              <span style={{ color: textColor }}>Qty: 100ml</span>
              <span style={{ color: "#ccc" }}>|</span>
              <span style={{ color: textColor }}>Bottles: 1</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <button
              className="cart-app-item__remove"
              onClick={onRemoveClick}
            >
              <TrashIcon />
            </button>
            <span className="custom-cart-public-component-product-tile__discount-codes" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1e7e34", fontSize: "10px", fontWeight: 700 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              MEGA20
            </span>
          </div>
        </div>

        <div className="custom-cart-public-component-product-tile__product-pricing" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span className="custom-cart-public-component-product-tile__price-group custom-cart-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>$27.00</span>
          {showStrikethrough && (
            <span style={{ color: "#999", textDecoration: "line-through", fontSize: "9px" }}>$40.00</span>
          )}
          {cartSettings.showSavingsBelowPrices && (
            <span className="custom-cart-public-component-product-tile__savings" style={{ background: "#e6f4ea", color: savingColor, fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "14px", lineHeight:'18px' }}>
              {cartSettings.savingsText} 10%
            </span>
          )}
        </div>

        <div>
          <QtyStepper
            qty={qty}
            loadingType={loadingType}
            onDecrement={() => updateQty("dec")}
            onIncrement={() => updateQty("inc")}
          />
        </div>

        {!subscriptionUpgradesSettings.enabled && (
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} designSettings={designSettings} />
        )}
      </div>
    </div>
  );
}

// ─── Modern Layout ────────────────────────────────────────────────────────────
function ModernLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, savingColor, subscriptionUpgradesSettings, Subscription, cartSettings }) {
  return (
    <div className="cart-app-item upcart-product-item custom-cart-public-component-product-tile upcart-layout-modern">

      <div style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        {cartSettings.showSavingsBelowPrices && (
          <span className="custom-cart-public-component-product-tile__savings"
            style={{ background: "#e6f4ea", color: savingColor, fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "14px", lineHeight:'18px' }}>{cartSettings.savingsText} 50%</span>
        )}
        <div style={{ width: "80px", height: "80px", borderRadius: "6px", overflow: "hidden" }} className="cart-app-item__image custom-cart-public-component-product-tile__image-wrapper">
          <img className="upcart-public-component-product-tile__image custom-cart-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>

      <div className="custom-cart-public-component-product-tile__info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", lineHeight: '8px', }}>
          <div>
            <div className="cart-app-item__title upcart-product-title custom-cart-public-component-product-tile__header custom-cart-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
              <span dangerouslySetInnerHTML={{ __html: productName }} />
            </div>
            <div className="custom-cart-public-component-product-tile__variant" style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button
              className="cart-app-item__remove"
              onClick={onRemoveClick}
            >
              <TrashIcon />
            </button>
            {showStrikethrough && (
              <span className="custom-cart-public-component-product-tile__product-pricing" style={{ color: "#999", textDecoration: "line-through", fontSize: "9px" }}>$400.00</span>
            )}
            <span className="custom-cart-public-component-product-tile__price-group custom-cart-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>$200.00</span>
            <span className="custom-cart-public-component-product-tile__discount-codes" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1e7e34", fontSize: "10px", fontWeight: 600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              MEGA20
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <QtyStepper
                qty={qty}
                loadingType={loadingType}
                onDecrement={() => updateQty("dec")}
                onIncrement={() => updateQty("inc")}
              />
            </div>
          </div>
        </div>

        {!subscriptionUpgradesSettings.enabled && (
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} cartSettings={cartSettings} />
        )}
      </div>
    </div>
  );
}

// ─── Main CartItem ────────────────────────────────────────────────────────────
export default function CartItem({
  showStrikethrough,
  textColor,
  savingColor,
  Subscription,
  subscriptionUpgradesSettings,
  cartSettings,
  productName = "The Monaco - Black",
  qty,
  setQty,
  designSettings
}) {
  const [loadingType, setLoadingType] = useState(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const layout = cartSettings.cartItemLayout || "classic";
  const undoTimerRef = useRef(null);

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

  const handleRemoveClick = () => {
    setIsRemoved(true);
    setShowToast(true);

    clearTimeout(undoTimerRef.current);

    undoTimerRef.current = setTimeout(() => {
      setShowToast(false);

      setIsRemoved(false);

    }, 4000);
  };

  const handleUndo = () => {
    clearTimeout(undoTimerRef.current);
    setIsRemoved(false);
    setShowToast(false);
  };

  const sharedProps = {
    qty,
    setQty,
    loadingType,
    setLoadingType,
    updateQty,
    onRemoveClick: handleRemoveClick,
    showStrikethrough,
    textColor,
    savingColor,
    cartSettings,
    subscriptionUpgradesSettings,
    Subscription,
    productName,
    designSettings
  };

  return (
    <div style={{ position: 'relative' }} className="custom-cart-public-cart-items">
      {/* Item wrapper — dimmed when removed */}
      <div
        className="upcart-products-section cart-app__items custom-cart-public-cart-item"
        style={{
          opacity: isDeleting ? 0 : isRemoved ? 0.4 : 1,
          pointerEvents: isRemoved ? "none" : "auto",
          transition: "opacity 0.3s ease",
        }}
      >
        {layout === "subscription" ? (
          <SubscriptionLayout {...sharedProps} />
        ) : layout === "modern" ? (
          <ModernLayout {...sharedProps} />
        ) : (
          <ClassicLayout {...sharedProps} />
        )}
      </div>

      {/* Undo Toast */}
      {showToast && (
        <UndoToast
          message={productName}
          onUndo={handleUndo}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}