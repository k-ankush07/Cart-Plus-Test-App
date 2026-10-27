import { createContext, useContext, useState, useEffect, useRef } from "react";
import { CART_ITEM_DEFAULTS, getCartItemOptions } from "../utils/cartItemOptions";
import { backgroundToCss } from "../utils/background";
import DeleteGlyph from "../ui/DeleteGlyph";

// "Products in cart" options (cartSettings.cartItem) for the rows below
const ItemOpts = createContext(CART_ITEM_DEFAULTS);

function CartItemSkeleton() {
  return (
    <div
      className="cart-plus-public-cart-items cart-plus-products-section"
      style={{ padding: "0 20px" }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          className="cart-plus-skeleton cart-plus-skeleton-img"
          style={{ width: "72px", height: "72px", flexShrink: 0, borderRadius: "8px" }}
        >
          &nbsp;
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="cart-plus-skeleton cart-plus-skeleton-line" style={{ width: "80%", height: "14px" }}>
            &nbsp;
          </div>
          <div className="cart-plus-skeleton cart-plus-skeleton-line" style={{ width: "45%", height: "10px" }}>
            &nbsp;
          </div>
          <div className="cart-plus-skeleton cart-plus-skeleton-line" style={{ width: "30%", height: "12px" }}>
            &nbsp;
          </div>
          <div
            className="cart-plus-skeleton cart-plus-skeleton-line"
            style={{ width: "90px", height: "28px", borderRadius: "4px", marginTop: "4px" }}
          >
            &nbsp;
          </div>
        </div>
      </div>
    </div>
  );
}

const TrashIcon = ({ color, hoverColor = "red" }) => {
  const opts = useContext(ItemOpts);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: "inline-flex", cursor: "pointer" }}
    >
      <DeleteGlyph
        kind={opts.deleteIcon}
        color={isHovered ? hoverColor : opts.deleteColor || color}
      />
    </span>
  );
};

function hexToRGBA(hex = "#16a34a", opacity = 1) {
  if (!hex || typeof hex !== "string" || hex.length < 7) hex = "#16a34a";
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const money = (currency, value) => `${currency} ${Number(value || 0).toFixed(2)}`;

// ─── Discount Badge ───────────────────────────────────────────────────────────
function DiscountBadge({ code = "MEGA20", color: baseColor = "#1e7e34" }) {
  const opts = useContext(ItemOpts);
  if (!opts.showDiscountTag) return null;
  const color = opts.labelTextColor || baseColor;
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
        background: opts.labelBackground || hexToRGBA(color, 0.1),
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
function UndoToast({ message, onUndo }) {
  return (
    <div
      style={{
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
        top: 100,
      }}
    >
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
          textUnderlineOffset: "2px",
        }}
      >
        Undo
      </button>
    </div>
  );
}

// ─── Qty Stepper ──────────────────────────────────────────────────────────────
function QtyStepper({
  qty,
  onDecrement,
  onIncrement,
  onQtyChange,
  loadingType,
  designSettings,
}) {
  const { showQuantity } = useContext(ItemOpts);
  if (!showQuantity) return null;
  const iconColor = designSettings.iconColor;

  return (
    <div className="cart-app-item__qty cart-plus-public-component-product-tile__quantity-selector">
      <button
        onClick={onDecrement}
        disabled={(parseInt(qty, 10) || 1) <= 1}
        style={
          (parseInt(qty, 10) || 1) <= 1
            ? { opacity: 0.4, cursor: "not-allowed" }
            : undefined
        }
        className="cart-app-item__qty-btn cart-plus-product-quantity-minus cart-plus-public-component-product-tile__quantity-minus"
      >
        {loadingType === "dec" ? (
          <span className="loader"></span>
        ) : (
          <span className="svg-wrapper" style={{ color: iconColor }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="icon icon-minus"
              viewBox="0 0 10 2"
              style={{ color: iconColor }}
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1"
                clipRule="evenodd"
              ></path>
            </svg>
          </span>
        )}
      </button>
      <input
        type="text"
        min="1"
        value={qty}
        onChange={(e) => onQtyChange && onQtyChange(Number(e.target.value))}
        className="cart-app-item__qty-value cart-plus-product-quantity-input cart-plus-public-component-product-tile__quantity-plus"
      />
      <button
        onClick={onIncrement}
        className="cart-app-item__qty-btn cart-plus-product-quantity-plus cart-plus-public-component-product-tile__quantity-plus"
      >
        {loadingType === "inc" ? (
          <span className="loader"></span>
        ) : (
          <span className="svg-wrapper" style={{ color: iconColor }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="icon icon-plus"
              viewBox="0 0 10 10"
              style={{ color: iconColor }}
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z"
                clipRule="evenodd"
              ></path>
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Classic Layout ───────────────────────────────────────────────────────────
function ClassicLayout({
  secondaryTextColor,
  imageBox,
  item,
  qty,
  setQty,
  loadingType,
  updateQty,
  onRemoveClick,
  showStrikethrough,
  textColor,
  cartSettings,
  savingColor,
  subscriptionUpgradesSettings,
  Subscription,
  designSettings,
  deleteLoading,
  currency,
}) {
  return (
    <div
      className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile"
      style={{ flexDirection: "column" }}
    >
      <div style={{ display: "flex", gap: "10px", width: "100%" }}>
        <div
          className="cart-app-item__image cart-plus-product-image-wrapper cart-plus-bundle-item-image-wrapper cart-plus-public-component-product-tile__image-wrapper"
          style={imageBox}
        >
          <img
            className="cart-plus-public-component-product-tile__image"
            src={item.image}
            alt={item.name}
          />
        </div>

        <div
          className="cart-plus-public-component-product-tile__info"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
            minWidth: 0,
          }}
        >
          {/* Left */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              className="cart-app-item__title cart-plus-product-title cart-plus-bundle-item-product-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title"
              style={{
                color: textColor,
                fontSize: "13px",
                fontWeight: 500,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              <a
                href="#"
                className="cart-plus-product-title-link"
                onClick={(e) => e.preventDefault()}
                style={{ color: textColor, textDecoration: "none" }}
              >
                {item.name}
              </a>
            </div>
            {item.variantTitle && (
              <div
                className="cart-plus-bundle-item-variant-title cart-app-item__variant cart-plus-public-component-product-tile__variant"
                style={{ color: secondaryTextColor || textColor, fontSize: "10px", lineHeight: "12px" }}
              >
                {item.variantTitle}
              </div>
            )}
            <DiscountBadge
              code="MEGA20"
              color={designSettings.discountBageColor || "#1e7e34"}
            />
          </div>

          {/* Right */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "5px",
              flexShrink: 0,
              lineHeight: "12px",
            }}
          >
            <div
              className="cart-plus-public-component-product-tile__product-pricing"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span
                className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price"
                style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}
              >
                {money(currency, item.price)}
              </span>
              {showStrikethrough && item.hasDiscount && (
                <span
                  className="cart-plus-item-compare-price"
                  style={{
                    color: secondaryTextColor || textColor,
                    textDecoration: "line-through",
                    fontSize: "9px",
                  }}
                >
                  {money(currency, item.compareAt)}
                </span>
              )}
            </div>
            {cartSettings.showSavingsBelowPrices && item.hasDiscount && (
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
                {cartSettings.savingsText} {item.savePct}%
              </div>
            )}
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              className="cart-plus-public-component-product-tile__controls"
            >
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
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <Subscription
            subscriptionUpgradesSettings={subscriptionUpgradesSettings}
            designSettings={designSettings}
          />
        </div>
      )}
    </div>
  );
}

// ─── Subscription Layout ──────────────────────────────────────────────────────
function SubscriptionLayout({
  secondaryTextColor,
  imageBox,
  item,
  qty,
  setQty,
  loadingType,
  updateQty,
  onRemoveClick,
  showStrikethrough,
  textColor,
  cartSettings,
  savingColor,
  subscriptionUpgradesSettings,
  Subscription,
  designSettings,
  deleteLoading,
  currency,
}) {
  return (
    <>
      <div className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile cart-plus-layout-subscription">
        <div
          className="cart-app-item__image cart-plus-bundle-item-image-wrapper cart-plus-product-image-wrapper cart-plus-public-component-product-tile__image-wrapper"
          style={{ width: "72px", height: "72px", flexShrink: 0, ...imageBox }}
        >
          <img
            className="cart-plus-public-component-product-tile__image"
            src={item.image}
            alt={item.name}
          />
        </div>
        <div
          className="cart-plus-public-component-product-tile__info"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                className="cart-app-item__title cart-plus-product-title cart-plus-bundle-item-product-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title"
                style={{ color: textColor, fontSize: "13px", fontWeight: 500 }}
              >
                <a
                  href="#"
                  className="cart-plus-product-title-link"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: textColor, textDecoration: "none" }}
                >
                  {item.name}
                </a>
              </div>
              {item.variantTitle && (
                <div
                  className="cart-plus-bundle-item-variant-title cart-plus-public-component-product-tile__variant"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "10px",
                    color: secondaryTextColor || textColor,
                  }}
                >
                  <span style={{ color: secondaryTextColor || textColor }}>{item.variantTitle}</span>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "5px",
              }}
            >
              <button className="cart-app-item__remove" onClick={onRemoveClick}>
                {deleteLoading ? (
                  <span className="loader"></span>
                ) : (
                  <TrashIcon color={designSettings.iconColor} />
                )}
              </button>
              <DiscountBadge
                code="MEGA20"
                color={designSettings.discountBageColor || "#1e7e34"}
              />
            </div>
          </div>

          <div
            className="cart-plus-public-component-product-tile__product-pricing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span
              className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price"
              style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}
            >
              {money(currency, item.price)}
            </span>
            {showStrikethrough && item.hasDiscount && (
              <span
                style={{
                  color: secondaryTextColor || textColor,
                  textDecoration: "line-through",
                  fontSize: "9px",
                }}
                className="cart-plus-item-compare-price"
              >
                {money(currency, item.compareAt)}
              </span>
            )}
            {cartSettings.showSavingsBelowPrices && item.hasDiscount && (
              <span
                className="cart-plus-public-component-product-tile__savings"
                style={{
                  background: hexToRGBA(savingColor, 0.1),
                  color: savingColor,
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "14px",
                  lineHeight: "18px",
                }}
              >
                {cartSettings.savingsText} {item.savePct}%
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
          <Subscription
            subscriptionUpgradesSettings={subscriptionUpgradesSettings}
            designSettings={designSettings}
          />
        )}
      </div>
    </>
  );
}

// ─── Modern Layout ────────────────────────────────────────────────────────────
function ModernLayout({
  secondaryTextColor,
  imageBox,
  item,
  qty,
  setQty,
  loadingType,
  updateQty,
  onRemoveClick,
  showStrikethrough,
  textColor,
  savingColor,
  subscriptionUpgradesSettings,
  Subscription,
  cartSettings,
  designSettings,
  deleteLoading,
  currency,
  variants,
  selectedVariantId,
  onVariantChange,
}) {
  return (
    <>
      <div className="cart-app-item cart-plus-product-item cart-plus-public-component-product-tile cart-plus-layout-modern">
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {cartSettings.showSavingsBelowPrices && item.hasDiscount && (
            <span
              className="cart-plus-public-component-product-tile__savings"
              style={{
                background: hexToRGBA(savingColor, 0.1),
                color: savingColor,
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 10px",
                borderRadius: "14px",
                lineHeight: "18px",
              }}
            >
              {cartSettings.savingsText} {item.savePct}%
            </span>
          )}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "6px",
              overflow: "hidden",
              ...imageBox,
            }}
            className="cart-app-item__image cart-plus-bundle-item-image-wrapper cart-plus-public-component-product-tile__image-wrapper"
          >
            <img
              className="cart-plus-public-component-product-tile__image"
              src={item.image}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </div>

        <div
          className="cart-plus-public-component-product-tile__info"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              lineHeight: "8px",
            }}
          >
            <div>
              <div
                className="cart-app-item__title cart-plus-product-title cart-plus-bundle-item-product-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title"
                style={{
                  color: textColor,
                  fontSize: "13px",
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                <span className="cart-plus-product-title-link">{item.name}</span>
              </div>

              {variants.length > 1 && (
                <div
                  className="cart-plus-public-component-product-tile__variant cart-plus-bundle-item-variant-title"
                  style={{ marginTop: "10px" }}
                >
                  <select
                    value={selectedVariantId}
                    onChange={(e) => onVariantChange(e.target.value)}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      fontSize: "10px",
                      background: "transparent",
                      color: textColor,
                      cursor: "pointer",
                      maxWidth: "140px",
                    }}
                  >
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              <button className="cart-app-item__remove" onClick={onRemoveClick}>
                {deleteLoading ? (
                  <span className="loader"></span>
                ) : (
                  <TrashIcon color={designSettings.iconColor} />
                )}
              </button>
              {showStrikethrough && item.hasDiscount && (
                <span
                  className="cart-plus-public-component-product-tile__product-pricing cart-plus-item-compare-price"
                  style={{
                    color: secondaryTextColor || textColor,
                    textDecoration: "line-through",
                    fontSize: "9px",
                  }}
                >
                  {money(currency, item.compareAt)}
                </span>
              )}
              <span
                className="cart-plus-public-component-product-tile__price-group cart-plus-item-prices-row cart-plus-public-component-product-tile__price"
                style={{ color: textColor, fontWeight: 700, fontSize: "12px" }}
              >
                {money(currency, item.price)}
              </span>
              <DiscountBadge
                code="MEGA20"
                color={designSettings?.discountBageColor || "#1e7e34"}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "4px",
                }}
              >
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
          <Subscription
            subscriptionUpgradesSettings={subscriptionUpgradesSettings}
            designSettings={designSettings}
          />
        )}
      </div>
    </>
  );
}

// ─── Single cart row ──────────────────────────────────────────────────────────
function CartItemRow({
  product,
  showStrikethrough,
  textColor,
  savingColor,
  Subscription,
  subscriptionUpgradesSettings,
  cartSettings,
  qty,
  setQty,
  designSettings,
  currency,
  onRemove,
}) {
  const [loadingType, setLoadingType] = useState(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? null,
  );

  const layout = cartSettings.cartItemLayout || "classic";
  const deleteBehavior = cartSettings.deleteBehavior || "undo";

  const undoTimerRef = useRef(null);

  // cleanup timer on unmount
  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  const updateQty = async (type) => {
    if (loadingType) return;

    setLoadingType(type);
    await new Promise((res) => setTimeout(res, 800));

    setQty((prev) => {
      const current = parseInt(prev, 10) || 1;
      return type === "inc" ? current + 1 : Math.max(1, current - 1);
    });

    setLoadingType(null);
  };

  const variants = product.variants || [];
  const variant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];
  if (!variant) return null;

  const price = parseFloat(variant.price) || 0;
  const compareAt = parseFloat(variant.compareAtPrice) || 0;
  const hasDiscount = compareAt > price;

  const variantTitle =
    variant.title && variant.title !== "Default Title" ? variant.title : "";

  const opts = getCartItemOptions(cartSettings);
  // line totals follow the quantity, unless "single item price" is on
  const shownQty = opts.singleItemPrice ? 1 : parseInt(qty, 10) || 1;

  const item = {
    name: product.title,
    image: variant.image || product.image,
    price: price * shownQty,
    compareAt: compareAt * shownQty,
    hasDiscount,
    savePct: hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0,
    variantTitle: opts.showVariants ? variantTitle : "",
  };

  // image size / radius from the "Styles" card (unset = the layout's own size)
  const imageBox = {
    ...(opts.imageSize ? { width: opts.imageSize, height: opts.imageSize } : {}),
    ...(opts.radius !== null ? { borderRadius: opts.radius, overflow: "hidden" } : {}),
  };

  const handleRemoveClick = () => {
    if (deleteBehavior === "direct") {
      setDeleteLoading(true);

      setTimeout(
        () => {
          setDeleteLoading(false);
          onRemove?.();
        },
        onRemove ? 600 : 3000,
      );
    } else {
      setIsRemoved(true);
      setShowToast(true);

      clearTimeout(undoTimerRef.current);

      undoTimerRef.current = setTimeout(() => {
        setShowToast(false);
        if (onRemove) onRemove();
        else setIsRemoved(false);
      }, 4000);
    }
  };

  const handleUndo = () => {
    clearTimeout(undoTimerRef.current);
    setIsRemoved(false);
    setShowToast(false);
  };

  const sharedProps = {
    item,
    qty,
    setQty,
    loadingType,
    updateQty,
    onRemoveClick: handleRemoveClick,
    showStrikethrough: showStrikethrough && opts.showCompareAt,
    textColor: opts.primaryTextColor || textColor,
    secondaryTextColor: opts.secondaryTextColor,
    imageBox,
    savingColor,
    // "Show Savings" overrides the Preferences setting once it has been touched
    cartSettings: {
      ...cartSettings,
      showSavingsBelowPrices:
        opts.showSavings ?? cartSettings.showSavingsBelowPrices,
    },
    subscriptionUpgradesSettings,
    Subscription,
    designSettings,
    deleteLoading,
    currency,
    variants,
    selectedVariantId: variant.id,
    onVariantChange: setSelectedVariantId,
  };

  return (
    <ItemOpts.Provider value={opts}>
    <div
      style={{ position: "relative", marginBottom:"15px"}}
      className="cart-plus-public-cart-items cart-plus-products-section"
    >
      {/* Item wrapper — dimmed when removed */}
      <div
        className="cart-plus-products-section cart-app__items cart-plus-public-cart-item cart-plus-product-item"
        style={{
          opacity: isRemoved ? 0.4 : 1,
          pointerEvents: isRemoved ? "none" : "auto",
          transition: "opacity 0.3s ease",
          // "Card color"
          ...(opts.cardBackground
            ? { background: backgroundToCss(opts.cardBackground) }
            : {}),
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
      {showToast && <UndoToast message={item.name} onUndo={handleUndo} />}
    </div>
    </ItemOpts.Provider>
  );
}

// ─── Main CartItem ────────────────────────────────────────────────────────────
// Shows exactly the products picked in "Previewing items" (none picked = no items).
export default function CartItem({
  previewProducts = [],
  loading = false,
  onRemovePreviewProduct,
  onSubtotalChange,
  qty,
  setQty,
  ...rest
}) {
  const [qtys, setQtys] = useState({});

  // every picked variant is its own cart line
  const rows = previewProducts.flatMap((p) =>
    p.variants.map((v) => ({
      key: `${p.id}:${v.id}`,
      productId: p.id,
      variantId: v.id,
      product: { ...p, variants: [v] },
    })),
  );

  // keep the header's "Cart • N" in sync with the previewed items
  const total = rows.reduce((sum, r) => sum + (qtys[r.key] ?? 1), 0);
  useEffect(() => {
    setQty(total);
  }, [total]);

  // cart subtotal = sum of unit price × quantity of every line
  const subtotal = rows.reduce(
    (sum, r) =>
      sum + (parseFloat(r.product.variants[0]?.price) || 0) * (qtys[r.key] ?? 1),
    0,
  );
  useEffect(() => {
    onSubtotalChange?.(subtotal);
  }, [subtotal]);

  const makeSetQty = (id) => (value) =>
    setQtys((prev) => {
      const current = prev[id] ?? 1;
      return {
        ...prev,
        [id]: typeof value === "function" ? value(current) : value,
      };
    });

  if (loading && !rows.length) return <CartItemSkeleton />;

  return (
    <div style={{padding: "12px 16px"}}>
      <style>{`@keyframes cpRowIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
      {rows.map((r) => (
        // a newly added line (e.g. from One Tick Upsell) eases in
        <div
          key={r.key}
          style={{ animation: "cpRowIn .35s ease" }}
        >
          <CartItemRow
            product={r.product}
            qty={qtys[r.key] ?? 1}
            setQty={makeSetQty(r.key)}
            onRemove={() => onRemovePreviewProduct?.(r.productId, r.variantId)}
            {...rest}
          />
        </div>
      ))}
    </div>
  );
}
