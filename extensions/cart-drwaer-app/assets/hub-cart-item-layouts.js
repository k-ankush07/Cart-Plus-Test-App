// Cart item layout renderers for classic, subscription, and modern layouts.
// Each function receives a context object and returns an HTML string.

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
      ? `<p class="hub-item-reward-badge">Free gift</p><p class="hub-item-unit-price"><s>${hubUtils.formatMoney(ctx.item.price)}</s></p>`
      : `<p class="hub-item-reward-badge">Free gift</p><p class="hub-item-unit-price">${hubUtils.formatMoney(ctx.item.price)}</p>`;
  }
  return `
    <div class="hub-item-unit-price-wrap">
      ${ctx.hasCompare ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(ctx.effectiveCompare)}</span>` : ""}
      <span class="hub-item-unit-price${ctx.hasCompare ? " hub-item-unit-price--sale" : ""}">${hubUtils.formatMoney(ctx.effectiveUnitPrice)}</span>
      ${ctx.hasCompare ? `<span class="hub-item-unit-save">Save ${hubUtils.formatMoney(ctx.unitSave)}</span>` : ""}
    </div>
    ${ctx.saveHtml}`;
}

function _discountBadgesHtml(item) {
  if (!item.line_level_discount_allocations?.length) return "";
  return item.line_level_discount_allocations.map(d => `
    <span class="hub-item-discount-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      ${d.discount_application.title}
    </span>`).join("");
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
  const { item, colorItems, showStrikethrough, isReward, priceHtml, variantHtml, propertiesHtml, discountHtml, sellingPlan, sellingPlanHtml, customHtmlBlocks, hasCompare, effectiveUnitPrice, effectiveCompare, saveHtml } = ctx;

  const rightCol = isReward
    ? `<span class="hub-price hub-price-free">FREE</span>`
    : `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
        <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}" style="font-weight:700">${hubUtils.formatMoney(effectiveUnitPrice)}</span>
        ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price">${hubUtils.formatMoney(effectiveCompare)}</span>` : ""}
       </div>
       ${saveHtml}
       <div class="hub-item-actions" style="justify-content:flex-end;margin-top:8px">
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
        ${sellingPlan ? `<p class="hub-item-subscription-label"> ${sellingPlan.selling_plan.name}</p>` : ""}
        ${variantHtml}
        ${propertiesHtml}
        ${discountHtml}
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
  const { item, colorItems, showStrikethrough, isReward, priceHtml, variantHtml, propertiesHtml, discountHtml, sellingPlan, sellingPlanHtml, customHtmlBlocks, hasCompare, effectiveUnitPrice, effectiveCompare, saveHtml } = ctx;

  const discountBadges = _discountBadgesHtml(item);

  const priceRow = isReward
    ? `<p class="hub-item-reward-badge">Free gift</p>`
    : `<div class="hub-item-price-row" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">
        <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}" style="font-weight:700">${hubUtils.formatMoney(effectiveUnitPrice)}</span>
        ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price" style="text-decoration:line-through;font-size:12px;color:#999">${hubUtils.formatMoney(effectiveCompare)}</span>` : ""}
        ${hasCompare && showStrikethrough ? `<span class="hub-item-unit-save" style="background:#e6f4ea;color:#1e7e34;font-size:11px;font-weight:700;padding:2px 7px;border-radius:3px">Save ${hubUtils.formatMoney(ctx.unitSave)}</span>` : ""}
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
        ${sellingPlan ? `<p class="hub-item-subscription-label"> ${sellingPlan.selling_plan.name}</p>` : ""}
         ${priceRow}
        ${propertiesHtml}
        ${discountHtml}
        ${isReward ? "" : `
          <div class="hub-item-actions" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:8px">
            ${_qtyControl(item.key, item.quantity)}
          </div>`}
      </div>
      ${sellingPlanHtml ? `<div class="hub-selling-plan-container" style="flex:0 0 100%">${sellingPlanHtml}</div>` : ""}
    </div>`;

  return _wrapper(item.key, inner, sellingPlanHtml, customHtmlBlocks);
}

// ── Layout 3: Modern ─────────────────────────────────────────────────────────
// SAVE badge above image | title + variant dropdowns left | trash + price right |
// subscribe-upgrade button + qty stepper bottom row
function modernItemHTML(ctx) {
  const { item, colorItems, showStrikethrough, isReward, priceHtml, variantHtml, propertiesHtml, discountHtml, sellingPlan, sellingPlanHtml, customHtmlBlocks, hasCompare, effectiveUnitPrice, effectiveCompare, unitSave, saveHtml } = ctx;

  const discountBadges = _discountBadgesHtml(item);

  const saveBadge = hasCompare
    ? `${saveHtml}`
    : "";

  const priceBlock = isReward
    ? `<span class="hub-price hub-price-free">FREE</span>`
    : `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        ${hasCompare && showStrikethrough ? `<span class="hub-item-compare-price" style="text-decoration:line-through;font-size:12px;color:#999">${hubUtils.formatMoney(effectiveCompare)}</span>` : ""}
        <span class="hub-item-unit-price${hasCompare && showStrikethrough ? " hub-item-unit-price--sale" : ""}" style="font-weight:700;font-size:15px">${hubUtils.formatMoney(effectiveUnitPrice)}</span>
        ${discountBadges}
       </div>`;

  const inner = `
    <div class="hub-cart-item hub-cart-item--modern" style="color:${colorItems};flex-wrap:wrap">
      <div style="display:flex;flex-direction:column;flex-shrink:0">
        ${saveBadge}
        <div class="hub-item-img-wrap">
          <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
        </div>
      </div>
      <div class="hub-item-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <a href="/products/${item.handle}" class="hub-item-title" style="color:${colorItems}">${item.product_title || item.title}</a>
            ${sellingPlan ? `<p class="hub-item-subscription-label"> ${sellingPlan.selling_plan.name}</p>` : ""}
            ${variantHtml}
            ${propertiesHtml}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            ${isReward ? "" : _deleteBtn(item.key, item.product_title)}
            ${priceBlock}
            ${isReward ? "" : `
          <div class="hub-item-actions" style="justify-content:space-between;margin-top:8px">
            <div></div>
            ${_qtyControl(item.key, item.quantity)}
          </div>`}
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
