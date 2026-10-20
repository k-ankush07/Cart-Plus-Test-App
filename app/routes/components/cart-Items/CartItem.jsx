import { useState, useRef } from "react";

const PRODUCT_IMAGE = "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg";

const TrashIcon = ({ color, hoverColor = "red" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isHovered ? hoverColor : (color || "currentColor")}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transition: "stroke 0.15s ease", cursor: "pointer" }}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
};

function hexToRGBA(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ─── Discount Badge ───────────────────────────────────────────────────────────
function DiscountBadge({ code = "MEGA20", color = "#1e7e34" }) {
  return (
    <span
      className="cart-plus-public-component-product-tile__discount-codes"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: color,
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: "20px",
        width: "fit-content",
        background: hexToRGBA(color, 0.1),
      }}
    >
      <svg viewBox="0 0 20 20" style={{ width: "15px", fill: color }}>
        <path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z" />
        <path
          fillRule="evenodd"
          d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"
        />
      </svg>
      {code}
    </span>
  );
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
      borderRadius: 4,
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
          textDecoration: "underline",
          textUnderlineOffset: "2px"
        }}
      >
        Undo
      </button>
    </div>
  );
}

// ─── Qty Stepper ──────────────────────────────────────────────────────────────
function QtyStepper({ qty, onDecrement, onIncrement, onQtyChange, loadingType, designSettings}) {
  const iconColor = designSettings.iconColor;

  return (
    <div className="cart-app-item__qty cart-plus-public-component-product-tile__quantity-selector">
      <button onClick={onDecrement} className="cart-app-item__qty-btn cart-plus-product-quantity-minus cart-plus-public-component-product-tile__quantity-minus">
        {loadingType === "dec"
          ? <span className="loader"></span>
          : <span className="svg-wrapper" style={{ color: iconColor }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-minus" viewBox="0 0 10 2" style={{ color: iconColor }}>
              <path fill="currentColor" fillRule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clipRule="evenodd"></path>
            </svg>
          </span>
        }
      </button>
      <input
        type="text"
        min="1"
        value={qty}
        onChange={(e) => onQtyChange && onQtyChange(Number(e.target.value))}
        className="cart-app-item__qty-value cart-plus-product-quantity-input cart-plus-public-component-product-tile__quantity-plus"
      />
      <button onClick={onIncrement} className="cart-app-item__qty-btn cart-plus-product-quantity-plus cart-plus-public-component-product-tile__quantity-plus">
        {loadingType === "inc"
          ? <span className="loader"></span>
          : <span className="svg-wrapper" style={{ color: iconColor }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-plus" viewBox="0 0 10 10" style={{ color: iconColor }}>
              <path fill="currentColor" fillRule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clipRule="evenodd"></path>
            </svg>
          </span>
        }
      </button>
    </div>
  );
}
// ─── Classic Layout ───────────────────────────────────────────────────────────
function ClassicLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription, designSettings, deleteLoading, currency }) {
  return (
    <div className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile" style={{ flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "10px", width: "100%" }}>
        <div className="cart-app-item__image cart-plus-product-image-wrapper cart-plus-bundle-item-image-wrapper cart-plus-public-component-product-tile__image-wrapper">
          <img className="cart-plus-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
        </div>

        <div className="cart-plus-public-component-product-tile__info" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0 }}>
            <div className="cart-app-item__title cart-plus-product-title cart-plus-product-title cart-plus-bundle-item-product-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500, wordBreak: "break-word", overflowWrap: "break-word" }}>
              <a href="#" className="cart-plus-product-title-link" onClick={(e) => e.preventDefault()} style={{ color: textColor, textDecoration: "none" }}>
                {productName}
              </a>
            </div>
            <div className="cart-plus-bundle-item-variant-title cart-app-item__variant cart-plus-public-component-product-tile__variant" style={{ color: textColor, fontSize: "10px", lineHeight: '8px', }}>
              Size: STANDARD
            </div>
            <div className=" cart-plus-bundle-item-variant-title cart-app-item__variant cart-plus-public-component-product-tile__variant" style={{ color: textColor, fontSize: "10px", lineHeight: '8px', }}>
              Color: BLACK
            </div>
            <DiscountBadge code="MEGA20" color={designSettings.discountBageColor || "#1e7e34"} />
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0, lineHeight: '12px' }}>
            <div className="cart-plus-public-component-product-tile__product-pricing" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>{currency} 200.00</span>
              {showStrikethrough && (
                <span className="cart-plus-item-compare-price" style={{ color: textColor, textDecoration: "line-through", fontSize: "9px" }}>{currency} 400.00</span>
              )}
            </div>
            {cartSettings.showSavingsBelowPrices && (
              <div
                className="cart-plus-public-component-product-tile__savings"
                style={{
                  background: hexToRGBA(savingColor, 0.1),
                  color: savingColor,
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "5px 7px",
                  borderRadius: "14px",
                }}
              >
                {cartSettings.savingsText} 50%
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="cart-plus-public-component-product-tile__controls">
              <QtyStepper
                qty={qty}
                loadingType={loadingType}
                onDecrement={() => updateQty("dec")}
                onIncrement={() => updateQty("inc")}
                onQtyChange={(newQty) => {
                  if (newQty >= 1) setQty(newQty);
                }}
                designSettings={designSettings}
              />
              <button
                className="cart-app-item__remove cart-plus-public-component-product-tile__remove-button"
                onClick={onRemoveClick}
              >
                {deleteLoading ? (
                  <span className="loader"></span>
                ) : (
                   <TrashIcon color={designSettings.iconColor} />
                )}
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
function SubscriptionLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, cartSettings, savingColor, subscriptionUpgradesSettings, Subscription, designSettings, deleteLoading, currency }) {
  return (
    <>
      <div className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile cart-plus-layout-subscription">
        <div className="cart-app-item__image cart-plus-bundle-item-image-wrapper cart-plus-product-image-wrapper cart-plus-public-component-product-tile__image-wrapper" style={{ width: "72px", height: "72px", flexShrink: 0 }}>
          <img className="cart-plus-public-component-product-tile__image cart-plus-public-component-product-tile__image" src={PRODUCT_IMAGE} alt="product" />
        </div>
        <div className="cart-plus-public-component-product-tile__info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="cart-app-item__title cart-plus-product-title cart-plus-bundle-item-product-title  cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
                <a href="#" className="cart-plus-product-title-link" onclick={(e) => e.preventDefault()} style={{ color: textColor, textDecoration: "none" }}>
                  {productName}
                </a>
              </div>
              <div className="cart-plus-bundle-item-variant-title cart-plus-public-component-product-tile__variant" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: textColor }}>
                <span style={{ color: textColor }}>Qty: 100ml</span>
                <span style={{ color: "#ccc" }}>|</span>
                <span style={{ color: textColor }}>Bottles: 1</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
              <button
                className="cart-app-item__remove"
                onClick={onRemoveClick}
              >
                {deleteLoading ? (
                  <span className="loader"></span>
                ) : (
                   <TrashIcon color={designSettings.iconColor} />
                )}
              </button>
              <DiscountBadge code="MEGA20" color={designSettings.discountBageColor || "#1e7e34"} />
            </div>
          </div>

          <div className="cart-plus-public-component-product-tile__product-pricing" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>{currency} 27.00</span>
            {showStrikethrough && (
              <span style={{ color: textColor, textDecoration: "line-through", fontSize: "9px" }} className="cart-plus-item-compare-price">{currency} 40.00</span>
            )}
            {cartSettings.showSavingsBelowPrices && (
              <span className="cart-plus-public-component-product-tile__savings" style={{ background: "#e6f4ea", color: savingColor, fontSize: "10px", fontWeight: 600, padding: "2px 10px", borderRadius: "14px", lineHeight: '18px' }}>
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
              onQtyChange={(newQty) => {
                if (newQty >= 1) setQty(newQty);
              }}
              designSettings={designSettings}
            />
          </div>

        </div>
      </div>

      <div className="cart_plus_subscription">
        {!subscriptionUpgradesSettings.enabled && (
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} designSettings={designSettings} />
        )}
      </div>
    </>
  );
}

// ─── Modern Layout ────────────────────────────────────────────────────────────
function ModernLayout({ productName, qty, loadingType, updateQty, onRemoveClick, showStrikethrough, textColor, savingColor, subscriptionUpgradesSettings, Subscription, cartSettings, designSettings, deleteLoading, currency }) {
  return (
    <>
      <div className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile cart-plus-layout-modern">

        <div style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
          {cartSettings.showSavingsBelowPrices && (
            <span className="cart-plus-public-component-product-tile__savings"
              style={{ background: "#e6f4ea", color: savingColor, fontSize: "10px", fontWeight: 600, padding: "2px 10px", borderRadius: "14px", lineHeight: '18px' }}>{cartSettings.savingsText} 50%</span>
          )}
          <div style={{ width: "80px", height: "80px", borderRadius: "6px", overflow: "hidden" }} className="cart-app-item__image cart-plus-bundle-item-image-wrapper cart-plus-public-component-product-tile__image-wrapper">
            <img className="cart-plus-public-component-product-tile__image " src={PRODUCT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </div>

        <div className="cart-plus-public-component-product-tile__info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", lineHeight: '8px', }}>
            <div>
              <div className="cart-app-item__title cart-plus-product-title cart-plus-bundle-item-product-title cart-plus-product-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style={{ color: textColor, fontSize: "14px", fontWeight: 500, lineHeight: 1 }}>
                <span dangerouslySetInnerHTML={{ __html: productName }} className="cart-plus-product-title-link" />
              </div>
              <div
                className="cart-plus-public-component-product-tile__variant cart-plus-bundle-item-variant-title"
                style={{
                  display: "flex",
                  gap: "6px",
                  flexDirection: "column",
                  marginTop: "10px",
                }}
              >
                <div
                  className="cart-app-item__variant cart-plus-public-component-product-tile__variant"
                  style={{
                    color: textColor,
                    fontSize: "10px",
                    lineHeight: "8px",
                  }}
                >
                  Size:
                  <select
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      padding: "1px 4px",
                      fontSize: "10px",
                      marginLeft: "4px",
                      background: "transparent",
                      color: textColor,
                      cursor: "pointer",
                    }}
                    defaultValue="STANDARD"
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="LARGE">LARGE</option>
                    <option value="SMALL">SMALL</option>
                  </select>
                </div>

                <div
                  className="cart-app-item__variant cart-plus-public-component-product-tile__variant"
                  style={{
                    color: textColor,
                    fontSize: "10px",
                    lineHeight: "8px",
                  }}
                >
                  Color:
                  <select
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      fontSize: "10px",
                      marginLeft: "4px",
                      background: "transparent",
                      color: textColor,
                      cursor: "pointer",
                    }}
                    defaultValue="BLACK"
                  >
                    <option value="BLACK">BLACK</option>
                    <option value="WHITE">WHITE</option>
                    <option value="BLUE">BLUE</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <button
                className="cart-app-item__remove"
                onClick={onRemoveClick}
              >
                {deleteLoading ? (
                  <span className="loader"></span>
                ) : (
                   <TrashIcon color={designSettings.iconColor} />
                )}
              </button>
              {showStrikethrough && (
                <span className="cart-plus-public-component-product-tile__product-pricing cart-plus-item-compare-price" style={{ color: textColor, textDecoration: "line-through", fontSize: "9px" }}>{currency} 400.00</span>
              )}
              <span className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price" style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}>{currency} 200.00</span>
              <DiscountBadge code="MEGA20" color={designSettings?.discountBageColor || "#1e7e34"} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <QtyStepper
                  qty={qty}
                  loadingType={loadingType}
                  onDecrement={() => updateQty("dec")}
                  onIncrement={() => updateQty("inc")}
                  onQtyChange={(newQty) => {
                    if (newQty >= 1) setQty(newQty);
                  }}
                  designSettings={designSettings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cart_plus_subscription">
        {!subscriptionUpgradesSettings.enabled && (
          <Subscription subscriptionUpgradesSettings={subscriptionUpgradesSettings} designSettings={designSettings} />
        )}
      </div>
    </>
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
  designSettings,
  currency
}) {
  const [loadingType, setLoadingType] = useState(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const layout = cartSettings.cartItemLayout || "classic";
  const deleteBehavior = cartSettings.deleteBehavior || "undo";

  const undoTimerRef = useRef(null);

  const updateQty = async (type) => {
    if (loadingType) return;

    setLoadingType(type);

    await new Promise((res) => setTimeout(res, 800));

    setQty((prev) => {
      let newQty = prev;

      if (type === "inc") {
        newQty = prev;
      }

      if (type === "dec") {
        newQty = Math.max(1, prev);
      }

      return parseInt(newQty, 10);
    });

    setLoadingType(null);
  };

  const handleRemoveClick = () => {
    if (deleteBehavior === "direct") {
      setDeleteLoading(true);

      setTimeout(() => {
        setDeleteLoading(false);
        console.log("Item deleted directly");
      }, 3000);
    } else {
      setIsRemoved(true);
      setShowToast(true);

      clearTimeout(undoTimerRef.current);

      undoTimerRef.current = setTimeout(() => {
        setShowToast(false);
        setIsRemoved(false);
      }, 4000);
    }
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
    designSettings,
    deleteLoading,
    currency
  };

  return (
    <div style={{ position: 'relative' }} className="cart-plus-public-cart-items cart-plus-products-section">
      {/* Item wrapper — dimmed when removed */}
      <div
        className="cart-plus-products-section cart-app__items cart-plus-public-cart-item cart-plus-product-item"
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