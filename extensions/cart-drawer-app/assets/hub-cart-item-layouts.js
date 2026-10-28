// Cart item layout renderers for classic, subscription, and modern layouts.
// Each function receives a context object and returns an HTML string.
function hexToRGBA(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// "Products in cart" options from the editor (cartSettings.cartItem)
window.cartPlusGetItemOptions = function (cartSettings) {
  const cs = cartSettings || window.__HUB_ACTIVE_CART__?.cartSettings || {};
  return {
    showVariants: true,
    showQuantity: true,
    showCompareAt: true,
    showDiscountTag: true,
    showSavings: null, // null = follow the Preferences setting
    singleItemPrice: false,
    imageSize: null,
    radius: null,
    primaryTextColor: null,
    secondaryTextColor: null,
    labelTextColor: null,
    labelBackground: null,
    deleteIcon: "trash",
    deleteColor: null,
    cardBackground: null,
    ...(cs.cartItem || {}),
  };
};

// same glyphs as the editor's DeleteGlyph
const _DELETE_GLYPHS = {
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  bin: '<path d="M5 7h14l-1.2 13a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 7h18"/>',
  lid: '<path d="M4 7h16"/><path d="M9 7l.5-2h5L15 7"/><path d="M6 7l1 13h10l1-13"/>',
  x: '<path d="M5 5l14 14"/><path d="M19 5L5 19"/>',
  "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
};

const _trashIcon = (color = "currentColor", hoverColor = "red") => `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
    class="hub-trash-icon"
    style="stroke:${window.cartPlusGetItemOptions().deleteColor || color}; --trash-hover-color:${hoverColor};"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${_DELETE_GLYPHS[window.cartPlusGetItemOptions().deleteIcon] || _DELETE_GLYPHS.trash}
  </svg>`;

function _qtyControl(key, quantity, iconColor = "currentColor") {
  if (!window.cartPlusGetItemOptions().showQuantity) return "";
  return `
    <div class="hub-qty-control cart-plus-public-component-product-tile__quantity-selector">
      <button class="hub-qty-btn minus cart-plus-public-component-product-tile__quantity-minus" data-type="minus" onclick="updateQty('${key}', ${quantity - 1}, this); _hubDisableQtySiblings(this)"${quantity <= 1 ? " disabled" : ""}>
        <span class="svg-wrapper" style="color:${iconColor}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="hub-icon hub-icon-minus" viewBox="0 0 10 2"><path fill="currentColor" fill-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clip-rule="evenodd"></path></svg></span>
      </button>
      <input type="text" value="${quantity}" class="hub-qty-input" oninput="handleQtyInput('${key}', this.value)" />
      <button class="hub-qty-btn plus cart-plus-public-component-product-tile__quantity-plus" data-type="plus" onclick="updateQty('${key}', ${quantity + 1}, this); _hubDisableQtySiblings(this)">
        <span class="svg-wrapper" style="color:${iconColor}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="hub-icon hub-icon-plus" viewBox="0 0 10 10"><path fill="currentColor" fill-rule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clip-rule="evenodd"></path></svg></span>
      </button>
    </div>`;
}

function _deleteBtn(key, title, iconColor = "currentColor") {
  const safeTitle = title?.replace(/'/g, "\\'") || "";
  return `
    <button class="hub-delete-btn" onclick="removeItem('${key}', '${safeTitle}')" aria-label="Remove item">
      ${_trashIcon(iconColor)}
    </button>`;
}

function _unitPriceBlock(ctx) {
  if (ctx.isReward) {
    return ctx.isTriggeredReward && ctx.item.price > 0
      ? `<p class="hub-item-reward-badge">Free</p><p class="hub-item-unit-price"><s>${hubUtils.formatMoney(ctx.item.price)}</s></p>`
      : `<p class="hub-item-reward-badge">Free</p><p class="hub-item-unit-price">${hubUtils.formatMoney(ctx.item.price)}</p>`;
  }
  return `
    <div class="hub-item-unit-price-wrap">
      ${ctx.hasCompare ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(ctx.effectiveCompare * ctx.item.quantity)}</span>` : ""}
      <span class="hub-item-unit-price${ctx.hasCompare ? " hub-item-unit-price--sale" : ""}">${hubUtils.formatMoney(ctx.item.final_line_price)}</span>
      ${
        ctx.hasCompare
          ? `<span class="hub-item-save" style="color:${ctx.savingsColor};
      background:${hexToRGBA(ctx.savingsColor, 0.1)};">${ctx.savingsText} ${hubUtils.formatMoney(ctx.unitSave * ctx.item.quantity)}</span>`
          : ""
      }
    </div>
    ${ctx.saveHtml}`;
}

function _discountBadgesHtml(item, discountColor = "#1e7e34") {
  const opts = window.cartPlusGetItemOptions();
  if (!opts.showDiscountTag || !item.discounts?.length) return "";
  discountColor = opts.labelTextColor || discountColor;

  return item.discounts
    .map(
      (d) => `
    <span class="hub-item-discount-badge cart-plus-public-component-product-tile__discount-codes" style="background:${window.cartPlusGetItemOptions().labelBackground || hexToRGBA(discountColor, 0.1)}; color:${discountColor};">
      <svg viewBox="0 0 20 20" class="Icon_Icon__uZZKy" style="width: 15px; fill:${discountColor}">
        <path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z"></path>
        <path fill-rule="evenodd" d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"></path>
      </svg>
      ${d.title}
    </span>`,
    )
    .join("");
}

function _wrapper(key, inner, sellingPlanHtml, customHtmlBlocks, isReward, item) {
  const linePrice = item?.final_line_price ?? 0;
  return `
    <div class="hub-cart-for-item cart-plus-public-cart-item" data-item-key="${key}"${isReward ? ' data-is-reward="1"' : ""} data-line-price="${linePrice}" style="position:relative">
      ${inner}
      <div>${hubUtils.renderCustomHTML(customHtmlBlocks.between_line_items)}</div>
    </div>
    <div>${hubUtils.renderCustomHTML(customHtmlBlocks.below_cart_items)}</div>`;
}

// ── Layout 1: Classic ────────────────────────────────────────────────────────
// Image left | info middle (title, variants, discounts) | right (price + save + qty + trash)
function classicItemHTML(ctx) {
  const {
    item,
    colorItems,
    showStrikethrough,
    savingsText,
    isReward,
    priceHtml,
    variantHtml,
    propertiesHtml,
    discountHtml,
    sellingPlan,
    sellingPlanHtml,
    customHtmlBlocks,
    hasCompare,
    effectiveUnitPrice,
    effectiveCompare,
    unitSave,
    saveHtml,
    discountColor,
    iconColor 
  } = ctx;

  const discountBadges = _discountBadgesHtml(item, discountColor);

  // LINE TOTAL = item.final_line_price (unit price × quantity, after discounts)
  // COMPARE TOTAL = effectiveCompare × quantity (original price × quantity)
  const lineTotal = ctx.singleItemPrice ? effectiveUnitPrice : item.final_line_price;
  const compareTotal = effectiveCompare * (ctx.singleItemPrice ? 1 : item.quantity);

  const rightCol = isReward
    ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="hub-price hub-price-free">FREE</span>
          ${_deleteBtn(item.key, item.product_title, iconColor)}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
            ${hubUtils.formatMoney(lineTotal)}
          </span>
          ${
            hasCompare && showStrikethrough
              ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(compareTotal)}</span>`
              : ""
          }
        </div>
      </div>`
    : `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end" class="cart-plus-public-component-product-tile__product-pricing">
        <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
          ${hubUtils.formatMoney(lineTotal)}
        </span>
        ${
          hasCompare && showStrikethrough
            ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(compareTotal)}</span>`
            : ""
        }
      </div>
      ${saveHtml}
      <div class="hub-item-actions" style="justify-content:flex-end;">
        ${_qtyControl(item.key, item.quantity, iconColor)}
        ${_deleteBtn(item.key, item.product_title, iconColor)}
      </div>`;

  const inner = `
    <div class="hub-cart-item cart-plus-public-component-product-tile" style="color:${colorItems};flex-wrap:wrap">
      <div class="hub-item-img-wrap cart-plus-public-component-product-tile__image-wrapper">
        <img src="${item.image}" alt="${item.product_title}" class="hub-item-img cart-plus-public-component-product-tile__image" />
      </div>
      <div class="hub-item-info cart-plus-public-component-product-tile__info">
        <a href="/products/${item.handle}" class="hub-item-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style="color:${colorItems}">${item.product_title || item.title}</a>
        ${sellingPlan ? `<p class="hub-item-subscription-label">${sellingPlan.selling_plan.name}</p>` : ""}
        ${variantHtml}
        ${propertiesHtml}
        ${discountHtml}
        ${discountBadges}
      </div>
      <div class="hub-item-total cart-plus-public-component-product-title-container">
        ${rightCol}
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks, isReward, item);
}

// ── Layout 2: Subscription ───────────────────────────────────────────────────
// Image left (smaller) | title + trash/discount-badge top-right | price row |
// variants | qty stepper | subscribe-upgrade button
function subscriptionItemHTML(ctx) {
  const {
    item,
    colorItems,
    showStrikethrough,
    savingsColor,
    savingsText,
    isReward,
    priceHtml,
    variantHtml,
    propertiesHtml,
    discountHtml,
    sellingPlan,
    sellingPlanHtml,
    customHtmlBlocks,
    hasCompare,
    effectiveUnitPrice,
    effectiveCompare,
    unitSave,
    saveHtml,
    discountColor,
    iconColor 
  } = ctx;

  const discountBadges = _discountBadgesHtml(item, discountColor);

  // LINE TOTAL = item.final_line_price (unit price × quantity, after discounts)
  // COMPARE TOTAL = effectiveCompare × quantity (original price × quantity)
  const lineTotal = ctx.singleItemPrice ? effectiveUnitPrice : item.final_line_price;
  const compareTotal = effectiveCompare * (ctx.singleItemPrice ? 1 : item.quantity);
  const totalSave = unitSave * (ctx.singleItemPrice ? 1 : item.quantity);

  const priceRow = isReward
    ? `<p class="hub-price hub-price-free">Free</p>
       <div class="hub-item-price-row" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
         <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
           ${hubUtils.formatMoney(lineTotal)}
         </span>
         ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(compareTotal)}</span>` : ""}
         ${hasCompare && showStrikethrough ? `<span class="hub-item-save" style="color:${savingsColor};background:${hexToRGBA(savingsColor, 0.1)};">${savingsText} ${hubUtils.formatMoney(totalSave)}</span>` : ""}
       </div>`
    : `<div class="hub-item-price-row" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
         <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
           ${hubUtils.formatMoney(lineTotal)}
         </span>
         ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(compareTotal)}</span>` : ""}
         ${hasCompare && showStrikethrough ? `<span class="hub-item-save" style="color:${savingsColor};background:${hexToRGBA(savingsColor, 0.1)};">${savingsText} ${hubUtils.formatMoney(totalSave)}</span>` : ""}
       </div>
       ${saveHtml}`;

  const inner = `
    <div class="hub-cart-item hub-cart-item--subscription cart-plus-public-component-product-tile" style="color:${colorItems};flex-wrap:wrap">
      <div class="hub-item-img-wrap hub-item-img-wrap--sm cart-plus-public-component-product-tile__image-wrapper">
        <img src="${item.image}" alt="${item.product_title}" class="hub-item-img cart-plus-public-component-product-tile__image" />
      </div>
      <div class="hub-item-info cart-plus-public-component-product-tile__info">
        <div style="width: 100%; display:flex;justify-content:space-between;align-items:flex-start">
          <a href="/products/${item.handle}" class="hub-item-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style="color:${colorItems}">${item.product_title || item.title}</a>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
            ${_deleteBtn(item.key, item.product_title, iconColor)}
            ${discountBadges}
          </div>
        </div>
        ${variantHtml}
        ${sellingPlan ? `<p class="hub-item-subscription-label">${sellingPlan.selling_plan.name}</p>` : ""}
        ${priceRow}
        ${propertiesHtml}
        ${discountHtml}
        ${
          isReward
            ? ""
            : `<div class="hub-item-actions" style="flex-direction:column;align-items:flex-start;gap:8px;">
                 ${_qtyControl(item.key, item.quantity, iconColor)}
               </div>`
        }
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks, isReward, item);
}

// ── Layout 3: Modern ─────────────────────────────────────────────────────────
// SAVE badge above image | title + variant dropdowns left | trash + price right |
// subscribe-upgrade button + qty stepper bottom row
function modernItemHTML(ctx) {
  const {
    item,
    colorItems,
    showStrikethrough,
    savingsColor,
    isReward,
    priceHtml,
    variantHtml,
    propertiesHtml,
    discountHtml,
    sellingPlan,
    sellingPlanHtml,
    customHtmlBlocks,
    hasCompare,
    effectiveUnitPrice,
    effectiveCompare,
    unitSave,
    saveHtml,
    discountColor,
    iconColor 
  } = ctx;

  const discountBadges = _discountBadgesHtml(item, discountColor);

  const lineTotal = ctx.singleItemPrice ? effectiveUnitPrice : item.final_line_price;
  const compareTotal = effectiveCompare * (ctx.singleItemPrice ? 1 : item.quantity);

  const saveBadge = hasCompare ? `${saveHtml}` : "";

  // ── BUILD VARIANT SELECT DROPDOWNS ──────────────────────────────────────
  const variantSelectHtml =
    item.options_with_values &&
    item.options_with_values.length > 0 &&
    !item.product_has_only_default_variant
      ? item.options_with_values
          .map((opt) => {
            const productData = window._hubProductDataByHandle?.[item.handle];

            const optIndex = item.options_with_values.findIndex(
              (o) => o.name === opt.name,
            );

            const currentVariantValue = (() => {
              const currentVariant = productData?.variants?.find(
                (v) => String(v.id) === String(item.variant_id),
              );

              if (currentVariant) {
                return optIndex === 0
                  ? currentVariant.option1
                  : optIndex === 1
                    ? currentVariant.option2
                    : currentVariant.option3;
              }
              return null;
            })();

            const allValues = productData
              ? [
                  ...new Set(
                    productData.variants
                      .map((v) => {
                        return optIndex === 0
                          ? v.option1
                          : optIndex === 1
                            ? v.option2
                            : v.option3;
                      })
                      .filter(Boolean),
                  ),
                ]
              : [opt.value];

            const encodedCurrentValue =
              currentVariantValue
                ?.replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;") ?? "";

            const optionsHTML = allValues
              .map((val) => {
                const encodedVal = val
                  .replace(/&/g, "&amp;")
                  .replace(/"/g, "&quot;");
                return `<option value="${encodedVal}" ${val === currentVariantValue ? "selected" : ""}>${val}</option>`;
              })
              .join("");

            return `
              <div class="hub-item-variant-select-wrap" style="display:flex;align-items:center;gap:4px;">
                <span class="hub-item-variant-name" style="color:${colorItems};font-size:10px;white-space:nowrap;">${opt.name}:</span>
                <select
                  class="hub-variant-option-select"
                  data-key="${item.key}"
                  data-option-name="${opt.name}"
                  data-option-index="${optIndex}" 
                  data-handle="${item.handle}"
                  style="font-size:10px;border:1px solid #d1d5db;border-radius:4px;padding:2px 4px;color:${colorItems};background:transparent;cursor:pointer;width:100%"
                  onchange="hubChangeVariantOption(this)"
                >
                  ${optionsHTML}
                </select>
              </div>`;
          })
          .join("")
      : variantHtml;

  const priceBlock = `
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
      ${isReward ? `<span class="hub-price hub-price-free">FREE</span>` : ""}
      ${
        hasCompare && showStrikethrough
          ? `<span class="hub-item-compare-price" style="color:${colorItems};">${hubUtils.formatMoney(compareTotal)}</span>`
          : ""
      }
      <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
        ${hubUtils.formatMoney(lineTotal)}
      </span>
      ${discountBadges}
    </div>`;

  const inner = `
    <div class="hub-cart-item hub-cart-item--modern cart-plus-public-component-product-tile" style="color:${colorItems};flex-wrap:wrap">
      <div style="display:flex;flex-direction:column;flex-shrink:0;">
        ${saveBadge}
        <div class="hub-item-img-wrap cart-plus-public-component-product-tile__image-wrapper" style="margin-top:${saveBadge ? "5px" : "0px"};">
          <img src="${item.image}" alt="${item.product_title}" class="hub-item-img cart-plus-public-component-product-tile__image" />
        </div>
      </div>
      <div class="hub-item-info cart-plus-public-component-product-tile__info">
        <div style="width: 100%; display:flex;justify-content:space-between;align-items:flex-start;gap:8px" class="cart-plus-public-component-product-title-container">
          <div class="hub-cart-item--modern-title">
            <a href="/products/${item.handle}" class="hub-item-title cart-plus-public-component-product-tile__header cart-plus-public-component-product-tile__product-title" style="color:${colorItems}">${item.product_title || item.title}</a>
            ${sellingPlan ? `<p class="hub-item-subscription-label">${sellingPlan.selling_plan.name}</p>` : ""}
             ${variantSelectHtml}
            ${propertiesHtml}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
           ${_deleteBtn(item.key, item.product_title,iconColor )}
            ${priceBlock}
            ${
              isReward
                ? ""
                : `<div class="hub-item-actions" style="justify-content:space-between;">
                     <div></div>
                     ${_qtyControl(item.key, item.quantity, iconColor)}
                   </div>`
            }
          </div>
        </div>
        ${discountHtml}
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks, isReward, item);
}

window.hubItemLayouts = {
  classic: classicItemHTML,
  subscription: subscriptionItemHTML,
  modern: modernItemHTML,
};
