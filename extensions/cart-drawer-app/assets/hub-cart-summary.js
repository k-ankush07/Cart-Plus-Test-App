// Cart summary (cartSettings.summary). Mirrors the editor's Summary preview:
// Classic / Card / Striped designs, row icons and a title icon from the icon library.
const CART_PLUS_SUMMARY_DEFAULTS = {
  enabled: false,
  title: "Summary",
  expandable: false,
  collapsedByDefault: true,
  showSubtotal: true,
  subtotalLabel: "Subtotal",
  showDiscountsRow: true,
  discountsRowLabel: "Savings",
  compareAtSavings: true,
  compareAtMode: "original", // "original" | "percentage"
  showShipping: true,
  shippingLabel: "Shipping",
  showShippingFree: true,
  shippingFreeLabel: "Free",
  showAppliedDiscounts: true,
  appliedDiscountsLabel: "Discounts",
  design: "classic", // "classic" | "card" | "striped"
  showIcons: false,
  titleIcon: { type: "icon", name: "receipt" },
  textColor: "#303030",
  background: null,
};

const CART_PLUS_SUMMARY_ICONS = {
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  percent:
    "M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  receipt:
    "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 8h8M8 12h8M8 16h5",
  ticket:
    "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2zM13 5v2M13 17v2M13 11v2",
  truck:
    "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  total: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
};

window.cartPlusGetSummary = function (cartSettings) {
  return { ...CART_PLUS_SUMMARY_DEFAULTS, ...(cartSettings?.summary || {}) };
};

// same helper as the editor's backgroundToCss
function cartPlusBackgroundCss(bg) {
  if (!bg) return "";
  if (bg.type === "gradient") {
    return `linear-gradient(${Number(bg.angle) || 0}deg, ${bg.color || "#ffffff"}, ${bg.color2 || "#e2e2e2"})`;
  }
  return bg.color || "";
}

function cartPlusSummaryIcon(name, color) {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"><path d="${CART_PLUS_SUMMARY_ICONS[name]}"/></svg>`;
}

// Container, filled by cartPlusRenderSummary on every cart render
window.cartPlusSummaryContainerHTML = function (blockId, cartSettings) {
  const s = window.cartPlusGetSummary(cartSettings);
  if (!s.enabled) return "";
  return `<div id="cart-plus-summary-${blockId}" class="cart-plus-summary cart-plus-summary--${s.design}" style="display:none;"></div>`;
};

/**
 * data: { mrpTotal, finalTotal, grandTotal, shippingPrice, discountCodes } (all money in cents)
 */
window.cartPlusRenderSummary = function (blockId, data) {
  const el = document.getElementById(`cart-plus-summary-${blockId}`);
  if (!el) return;
  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const s = window.cartPlusGetSummary(cartSettings);
  if (!s.enabled) {
    el.style.display = "none";
    return;
  }

  const fmt = hubUtils.formatMoney;
  const total = data.finalTotal || 0;
  const compare = data.mrpTotal > total ? data.mrpTotal : 0;
  const saved = compare - total;

  const row = (icon, label, value, extraClass = "") =>
    `<div class="cart-plus-summary__row ${extraClass}">
       <span class="cart-plus-summary__label">${s.showIcons ? cartPlusSummaryIcon(icon, s.textColor) : ""}${label}</span>
       <span class="cart-plus-summary__value">${value}</span>
     </div>`;

  let subtotalValue = fmt(total);
  if (s.compareAtSavings && compare > 0) {
    subtotalValue += `<span class="cart-plus-summary__compare">${
      s.compareAtMode === "percentage"
        ? `(-${Math.round((saved / compare) * 100)}%)`
        : `<s>${fmt(compare)}</s>`
    }</span>`;
  }

  const shippingValue =
    data.shippingPrice > 0
      ? fmt(data.shippingPrice)
      : s.showShippingFree
        ? `<span class="cart-plus-summary__free">${s.shippingFreeLabel}</span>`
        : "";

  const rows = [
    row("tag", "Total MRP", fmt(compare || total)),
    s.showDiscountsRow && saved > 0
      ? row("percent", s.discountsRowLabel, `-${fmt(saved)}`)
      : "",
    s.showSubtotal ? row("receipt", s.subtotalLabel, subtotalValue) : "",
    s.showAppliedDiscounts && data.discountCodes?.length
      ? row("ticket", s.appliedDiscountsLabel, data.discountCodes.join(", "))
      : "",
    s.showShipping ? row("truck", s.shippingLabel, shippingValue) : "",
    row("total", "Grand Total", fmt(data.grandTotal), "cart-plus-summary__total"),
  ].join("");

  const hasTitle = s.title.replace(/<[^>]*>|&nbsp;/g, "").trim();
  const titleIcon =
    s.showIcons && s.titleIcon
      ? window.hubLibraryIconHTML?.(s.titleIcon, 18, s.textColor) || ""
      : "";
  const titleInner = `<span class="cart-plus-summary__title-text">${titleIcon}<span>${s.title}</span></span>`;

  // keep the open / closed state across re-renders
  let open = el.dataset.open;
  open =
    open === undefined
      ? s.expandable
        ? !s.collapsedByDefault
        : true
      : open === "true";
  if (!s.expandable) open = true;

  const chevron = `<svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="${s.textColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="cart-plus-summary__chevron" style="transform:${open ? "rotate(180deg)" : "rotate(0deg)"}"><path d="M1 1L6 6L11 1"/></svg>`;

  el.dataset.open = String(open);
  el.style.cssText = `color:${s.textColor};background:${cartPlusBackgroundCss(s.background)};`;
  el.innerHTML = `
    ${
      s.expandable
        ? `<button type="button" class="cart-plus-summary__toggle" aria-expanded="${open}" onclick="cartPlusToggleSummary('${blockId}')">${titleInner}${chevron}</button>`
        : hasTitle
          ? `<div class="cart-plus-summary__title">${titleInner}</div>`
          : ""
    }
    ${open ? `<div class="cart-plus-summary__rows">${rows}</div>` : ""}`;
};

window.cartPlusToggleSummary = function (blockId) {
  const el = document.getElementById(`cart-plus-summary-${blockId}`);
  if (!el) return;
  el.dataset.open = String(el.dataset.open !== "true");
  const last = window._cartPlusSummaryData;
  if (last) window.cartPlusRenderSummary(blockId, last);
};

// Works the summary out from a /cart.js response (same maths as the footer totals) and paints it
window.cartPlusSummaryFromCart = function (blockId, cart) {
  const el = document.getElementById(`cart-plus-summary-${blockId}`);
  if (!el || !cart) return;
  if (!cart.items?.length) {
    el.style.display = "none";
    return;
  }
  const mrpTotal = cart.items.reduce((sum, i) => {
    const isAddon = !!(i.properties?._hub_addon || i.properties?.__upcartAddon);
    const compareAt = isAddon
      ? 0
      : window._hubCompareCache?.[`${i.handle}_${i.variant_id}`] || 0;
    const unitMrp = compareAt > i.original_price ? compareAt : i.original_price;
    return sum + unitMrp * i.quantity;
  }, 0);
  const finalTotal = cart.total_price || 0;
  const shippingPrice = window._hubShippingPriceCents || 0;
  const appliedCodes = (cart.discount_codes || [])
    .filter((c) => c.applicable)
    .map((c) => c.code);
  window._cartPlusSummaryData = {
    mrpTotal,
    finalTotal,
    grandTotal: finalTotal + shippingPrice,
    shippingPrice,
    discountCodes: appliedCodes.length
      ? appliedCodes
      : (cart.cart_level_discount_applications || []).map((a) => a.title).filter(Boolean),
  };
  window.cartPlusRenderSummary(blockId, window._cartPlusSummaryData);
};

// shipping rate arrived (or changed): repaint with the new shipping and grand total
window.cartPlusRefreshSummary = function (blockId) {
  const data = window._cartPlusSummaryData;
  if (!data) return;
  data.shippingPrice = window._hubShippingPriceCents || 0;
  data.grandTotal = (window._hubCartFinalTotal ?? data.finalTotal) + data.shippingPrice;
  window.cartPlusRenderSummary(blockId, data);
};
