// Empty cart (the editor's "Empty" view): Settings (icon, message, button, background),
// Login and Cross-sell. Mirrors cart-Items/EmptyCart.jsx. Data lives in
// cartSettings.emptyCart, cartSettings.emptyLogin and cartSettings.emptyUpsells.
const CART_PLUS_EMPTY_DEFAULTS = {
  message: null, // rich text; null = Preferences "Empty cart message"
  icon: { type: "icon", name: "product" },
  iconColor: "#1553d8",
  showButton: true,
  buttonText: "Continue Shopping",
  buttonUrl: "/",
  buttonRadius: 8,
  buttonFontSize: 16,
  buttonBackground: null,
  buttonTextColor: null,
  background: null,
};

// the Empty cart's own Cross-sell; off by default (enabled === true means switched off)
const CART_PLUS_EMPTY_UPSELL_DEFAULTS = {
  enabled: true,
  useAiRecommended: true,
  sourceType: "products",
  limitUpsellsInCart: false,
  maxUpsellsInCart: 3,
  showReviews: false,
  title: "You'll love these",
  buttonText: "Add",
  direction: "carousel",
  layout: "carousel",
  trigger: "button",
  carouselIndicator: "none",
  icon: { type: "icon", name: "star" },
};

window.cartPlusGetEmptyCart = (cartSettings) => ({
  ...CART_PLUS_EMPTY_DEFAULTS,
  ...(cartSettings?.emptyCart || {}),
});
window.cartPlusGetEmptyUpsells = (cartSettings) => ({
  ...CART_PLUS_EMPTY_UPSELL_DEFAULTS,
  ...(cartSettings?.emptyUpsells || {}),
});

window.cartPlusEmptyCartHTML = function (blockId) {
  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
  const s = window.cartPlusGetEmptyCart(cartSettings);
  const message = s.message ?? cartSettings.emptyCartMessage ?? "Your cart is empty";
  const customHtml = cartSettings.customHtmlBlocks?.empty_cart || "";
  const btnBg = window.cartPlusBgCss(s.buttonBackground) || ds.buttonColor || "#000000";
  const btnText = s.buttonTextColor || ds.buttonTextColor || "#ffffff";
  const login = window.cartPlusLoginHTML?.(cartSettings, "emptyLogin") || "";

  return `<div class="hub-cart-empty cart-plus-empty-cart" style="display:flex;flex-direction:column;flex:1 1 auto;width:100%;min-width:0;max-width:100%;box-sizing:border-box;background:${window.cartPlusBgCss(s.background)};">
    <div style="flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:48px 16px;text-align:center;">
      <div>${customHtml}</div>
      ${window.hubLibraryIconHTML?.(s.icon, 56, s.iconColor) || ""}
      <div class="hub-empty-title" style="font-size:16px;">${message}</div>
      ${login}
      ${
        s.showButton
          ? `<a href="${s.buttonUrl || "/"}" class="cart-plus-empty-btn" style="display:inline-block;padding:12px 24px;border-radius:${s.buttonRadius}px;font-size:${s.buttonFontSize}px;font-weight:600;text-decoration:none;background:${btnBg};color:${btnText};">${s.buttonText}</a>`
          : ""
      }
    </div>
    <div id="cart-plus-empty-upsell-${blockId}" style="width:100%;min-width:0;max-width:100%;overflow:hidden;box-sizing:border-box;"></div>
  </div>`;
};

// products for the empty cart's Cross-sell: the picked ones, else a few store products
async function cartPlusEmptyUpsellProducts(s) {
  const selected = s.selectedItems;
  const nothingPicked =
    s.sourceType === "products"
      ? !selected?.variants?.length && !selected?.products?.length
      : !selected?.length;
  if (!s.useAiRecommended && !nothingPicked && window.getUpsellProducts) {
    return window.getUpsellProducts({ ...s, useAiRecommended: false }, null);
  }
  const limit = s.limitUpsellsInCart ? s.maxUpsellsInCart || 3 : 3;
  const data = await fetch(`/products.json?limit=${Math.max(limit, 3)}`)
    .then((r) => r.json())
    .catch(() => ({ products: [] }));
  return (data.products || [])
    .filter((p) => (p.variants || []).some((v) => v.available !== false))
    .slice(0, limit);
}

window.cartPlusRenderEmptyUpsell = async function (blockId) {
  const host = document.getElementById(`cart-plus-empty-upsell-${blockId}`);
  if (!host) return;
  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const s = window.cartPlusGetEmptyUpsells(cartSettings);
  if (s.enabled !== false) {
    window.cartPlusRemoveSidePanel?.(blockId);
    host.innerHTML = "";
    return;
  }

  const products = await cartPlusEmptyUpsellProducts(s);
  if (!document.getElementById(`cart-plus-empty-upsell-${blockId}`)) return; // cart changed meanwhile
  if (!products.length) {
    host.innerHTML = "";
    return;
  }

  const layout = window.cartPlusUpsellLayout?.(s) || "list";
  if (layout !== "side") window.cartPlusRemoveSidePanel?.(blockId);
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};

  // same products and layout as what is already on screen: nothing to redraw
  const sig = JSON.stringify([layout, products.map((p) => p.id), s.title, s.trigger]);
  if (host.dataset.sig === sig && (layout === "side" || host.firstElementChild)) return;
  host.dataset.sig = sig;
  const primary = s.primaryTextColor || ds.textColor || "#6b7280";

  if (layout === "side") {
    host.innerHTML = "";
    window._cartPlusUpsellOverride = s;
    window.cartPlusRenderSidePanel?.(blockId, products, s);
    window._cartPlusUpsellOverride = null;
    return;
  }

  const titleIcon = s.icon === undefined ? { type: "icon", name: "star" } : s.icon;
  const iconHtml = titleIcon
    ? `<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${window.hubLibraryIconHTML?.(titleIcon, 18, s.iconColor || undefined) || ""}</span>`
    : "";
  const title = s.title
    ? `<h3 class="upsell-heading" style="color:${primary};${layout === "compact" ? "display:flex;align-items:center;justify-content:space-between;gap:8px;" : ""}"><div>${iconHtml}${s.title}</div>${layout === "compact" ? window.cartPlusCompactArrowsHTML?.() || "" : ""}</h3>`
    : "";

  host.innerHTML = `<div class="upsell-container upsell-bottom"><div class="upsell-inner">${title}<div class="upsell-products"></div></div></div>`;
  const productsDiv = host.querySelector(".upsell-products");

  if (layout === "compact") {
    window._cartPlusUpsellOverride = s;
    productsDiv.innerHTML = window.cartPlusCompactHTML(products);
    window._cartPlusUpsellOverride = null;
    const track = productsDiv.querySelector(".hub-compact-track");
    if (track) setTimeout(() => window.cartPlusCompactEdges(track), 0);
    return;
  }
  await window.renderProducts(productsDiv, products, {
    layout: layout === "carousel" ? "carousel" : "block",
    showReviews: s.showReviews,
    carouselIndicator: s.carouselIndicator,
    showIfAlreadyInCart: true,
    upsellSettings: s,
  });
};
