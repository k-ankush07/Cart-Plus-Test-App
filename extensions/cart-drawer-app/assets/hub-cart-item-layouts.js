// Cart item layout renderers for classic, subscription, and modern layouts.
// Each function receives a context object and returns an HTML string.
function hexToRGBA(hex, opacity) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const _trashIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>`;

function _qtyControl(key, quantity) {
  return `
    <div class="hub-qty-control">
      <button class="hub-qty-btn" data-type="minus" onclick="updateQty('${key}', ${quantity - 1}, this)"${quantity <= 1 ? " disabled" : ""}>−</button>
      <input type="text" value="${quantity}" class="hub-qty-input" oninput="handleQtyInput('${key}', this.value)" />
      <button class="hub-qty-btn" data-type="plus" onclick="updateQty('${key}', ${quantity + 1}, this)">+</button>
    </div>`;
}

function _deleteBtn(key, title) {
  const safeTitle = title?.replace(/'/g, "\\'") || "";
  return `
    <button class="hub-delete-btn" onclick="removeItem('${key}', '${safeTitle}')" aria-label="Remove item">
      ${_trashIcon}
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
      ${ctx.hasCompare ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(ctx.effectiveCompare * ctx.item.quantity)}</span>` : ""}
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

function _discountBadgesHtml(item) {
  if (!item.discounts?.length) return "";

  return item.discounts
    .map(
      (d) => `
    <span class="hub-item-discount-badge">
     <svg viewBox="0 0 20 20" class="Icon_Icon__uZZKy" style="width: 15px; fill:#10812f "><path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z"></path><path fill-rule="evenodd" d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"></path></svg>
      ${d.title}
    </span>`,
    )
    .join("");
}

function _wrapper(key, inner, sellingPlanHtml, customHtmlBlocks) {
  return `
    <div class="hub-cart-for-item" data-item-key="${key}" style="position:relative">
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
  } = ctx;

  const discountBadges = _discountBadgesHtml(item);

  // LINE TOTAL = item.final_line_price (unit price × quantity, after discounts)
  // COMPARE TOTAL = effectiveCompare × quantity (original price × quantity)
  const lineTotal = item.final_line_price;
  const compareTotal = effectiveCompare * item.quantity;

  const rightCol = isReward
    ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="hub-price hub-price-free">FREE</span>
          ${_deleteBtn(item.key, item.product_title)}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
            ${hubUtils.formatMoney(lineTotal)}
          </span>
          ${
            hasCompare && showStrikethrough
              ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(compareTotal)}</span>`
              : ""
          }
        </div>
      </div>`
    : `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
        <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
          ${hubUtils.formatMoney(lineTotal)}
        </span>
        ${
          hasCompare && showStrikethrough
            ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(compareTotal)}</span>`
            : ""
        }
      </div>
      ${saveHtml}
      <div class="hub-item-actions" style="justify-content:flex-end;">
        ${_qtyControl(item.key, item.quantity)}
        ${_deleteBtn(item.key, item.product_title)}
      </div>`;

  const inner = `
    <div class="hub-cart-item" style="color:${colorItems};flex-wrap:wrap">
      <div class="hub-item-img-wrap">
        <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
      </div>
      <div class="hub-item-info">
        <a href="/products/${item.handle}" class="hub-item-title" style="color:${colorItems}">${item.product_title || item.title}</a>
        ${sellingPlan ? `<p class="hub-item-subscription-label">${sellingPlan.selling_plan.name}</p>` : ""}
        ${variantHtml}
        ${propertiesHtml}
        ${discountHtml}
        ${discountBadges}
      </div>
      <div class="hub-item-total">
        ${rightCol}
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks);
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
  } = ctx;

  const discountBadges = _discountBadgesHtml(item);

  // LINE TOTAL = item.final_line_price (unit price × quantity, after discounts)
  // COMPARE TOTAL = effectiveCompare × quantity (original price × quantity)
  const lineTotal = item.final_line_price;
  const compareTotal = effectiveCompare * item.quantity;
  const totalSave = unitSave * item.quantity;

  const priceRow = isReward
    ? `<p class="hub-price hub-price-free">Free</p>
       <div class="hub-item-price-row" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
         <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
           ${hubUtils.formatMoney(lineTotal)}
         </span>
         ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(compareTotal)}</span>` : ""}
         ${hasCompare && showStrikethrough ? `<span class="hub-item-save" style="color:${savingsColor};background:${hexToRGBA(savingsColor, 0.1)};">${savingsText} ${hubUtils.formatMoney(totalSave)}</span>` : ""}
       </div>`
    : `<div class="hub-item-price-row" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
         <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
           ${hubUtils.formatMoney(lineTotal)}
         </span>
         ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(compareTotal)}</span>` : ""}
         ${hasCompare && showStrikethrough ? `<span class="hub-item-save" style="color:${savingsColor};background:${hexToRGBA(savingsColor, 0.1)};">${savingsText} ${hubUtils.formatMoney(totalSave)}</span>` : ""}
       </div>
       ${saveHtml}`;

  const inner = `
    <div class="hub-cart-item hub-cart-item--subscription" style="color:${colorItems};flex-wrap:wrap">
      <div class="hub-item-img-wrap hub-item-img-wrap--sm">
        <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
      </div>
      <div class="hub-item-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <a href="/products/${item.handle}" class="hub-item-title" style="color:${colorItems}">${item.product_title || item.title}</a>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
            ${_deleteBtn(item.key, item.product_title)}
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
                 ${_qtyControl(item.key, item.quantity)}
               </div>`
        }
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks);
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
  } = ctx;

  const discountBadges = _discountBadgesHtml(item);

  // LINE TOTAL = item.final_line_price (unit price × quantity, after discounts)
  // COMPARE TOTAL = effectiveCompare × quantity (original price × quantity)
  const lineTotal = item.final_line_price;
  const compareTotal = effectiveCompare * item.quantity;

  const saveBadge = hasCompare ? `${saveHtml}` : "";

  const priceBlock = `
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
      ${isReward ? `<span class="hub-price hub-price-free">FREE</span>` : ""}
      ${
        hasCompare && showStrikethrough
          ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(compareTotal)}</span>`
          : ""
      }
      <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}">
        ${hubUtils.formatMoney(lineTotal)}
      </span>
      ${discountBadges}
    </div>`;

  const inner = `
    <div class="hub-cart-item hub-cart-item--modern" style="color:${colorItems};flex-wrap:wrap">
      <div style="display:flex;flex-direction:column;flex-shrink:0;">
        ${saveBadge}
        <div class="hub-item-img-wrap" style="margin-top:5px;">
          <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
        </div>
      </div>
      <div class="hub-item-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div class="hub-cart-item--modern-title">
            <a href="/products/${item.handle}" class="hub-item-title" style="color:${colorItems}">${item.product_title || item.title}</a>
            ${sellingPlan ? `<p class="hub-item-subscription-label">${sellingPlan.selling_plan.name}</p>` : ""}
            ${variantHtml}
            ${propertiesHtml}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
           ${_deleteBtn(item.key, item.product_title)}
            ${priceBlock}
            ${
              isReward
                ? ""
                : `<div class="hub-item-actions" style="justify-content:space-between;">
                     <div></div>
                     ${_qtyControl(item.key, item.quantity)}
                   </div>`
            }
          </div>
        </div>
        ${discountHtml}
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks);
}

window.hubItemLayouts = {
  classic: classicItemHTML,
  subscription: subscriptionItemHTML,
  modern: modernItemHTML,
};