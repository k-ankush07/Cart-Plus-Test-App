// Cross-sell layouts that need their own markup: "compact" (small tiles in a scroll strip with
// prev / next arrows) and "side" (a strip of cards beside the cart). Row / List / Carousel
// still go through renderProducts. Mirrors the editor's cart-Items/Upsells.jsx.

// same rule as the editor: the saved layout wins, "row" and legacy settings fall back to direction
window.cartPlusUpsellLayout = function (settings) {
  if (settings?.layout && settings.layout !== "row") return settings.layout;
  return settings?.direction === "carousel" ? "carousel" : "list";
};

const cartPlusUpsellColors = () => {
  const u = window.__HUB_ACTIVE_CART__?.upsellsSettings || {};
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
  return { u, ds, primary: u.primaryTextColor || ds.textColor || "#6b7280" };
};

const cartPlusFirstImage = (p) =>
  p?.images?.[0]?.src || p?.featured_image?.url || p?.featured_image || "";

// ── Compact ────────────────────────────────────────────────────────────────
window.cartPlusCompactHTML = function (products) {
  const { u, ds, primary } = cartPlusUpsellColors();
  const fmt = hubUtils.formatMoney;
  const bg = window.cartPlusBgCss(u.cardBackground) || ds.accentColor || "";
  const radius = u.radius ?? 8;
  const btnBg = window.cartPlusBgCss(u.buttonBackground) || ds.buttonColor || "#000";
  const btnText = u.buttonTextColor || ds.buttonTextColor || "#fff";

  const tiles = products
    .filter((p) => (p.variants || []).length)
    .map((p) => {
      const v = p.variants[0];
      const price = Math.round(Number(v.price) * 100);
      return `<div class="hub-rec-product hub-compact-tile" style="position:relative;flex:0 0 auto;scroll-snap-align:start;width:${u.imageSize || 96}px;background:${bg};border-radius:${radius}px;padding:6px;box-sizing:border-box;">
        <img src="${cartPlusFirstImage(p)}" alt="${p.title}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:${u.radius ?? 6}px;display:block;">
        <button type="button" class="hub-compact-add" data-variant="${v.id}" aria-label="${u.buttonText || "Add"}" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;cursor:pointer;background:${btnBg};color:${btnText};font-size:14px;line-height:20px;padding:0;">+</button>
        <a href="/products/${p.handle}" class="cart-plus-internal-component-upsell-tile__title-link"><h3 class="cart-plus-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title" style="color:${primary};">${p.title}</h3></a>
        <div style="font-size:11px;color:${primary};margin-top:4px;">${fmt(price)}</div>
      </div>`;
    })
    .join("");

  return `<div class="hub-compact-track" onscroll="cartPlusCompactEdges(this)" style="display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;">${tiles}</div>`;
};

window.cartPlusCompactArrowsHTML = function () {
  const { ds, primary } = cartPlusUpsellColors();
  const arrow = (dir, d, label) =>
    `<button type="button" class="hub-compact-arrow" data-dir="${dir}" aria-label="${label}" onclick="cartPlusCompactScroll(this, ${dir})" style="width:24px;height:24px;padding:0;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${ds.iconColor || primary}" stroke-width="2"><path d="${d}"/></svg></button>`;
  return `<div class="hub-compact-arrows" style="display:flex;gap:4px;flex-shrink:0;">${arrow(-1, "M15 18l-6-6 6-6", "Previous")}${arrow(1, "M9 6l6 6-6 6", "Next")}</div>`;
};

window.cartPlusCompactScroll = function (btn, dir) {
  const root = btn.closest(".upsell-inner");
  const track = root?.querySelector(".hub-compact-track");
  if (!track) return;
  const tileW = track.firstElementChild?.getBoundingClientRect().width || 96;
  track.scrollBy({ left: dir * (tileW + 8) * 2, behavior: "smooth" });
};

// greys out the arrow that cannot move any further
window.cartPlusCompactEdges = function (track) {
  const root = track.closest(".upsell-inner");
  if (!root) return;
  const atStart = track.scrollLeft <= 2;
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  root.querySelectorAll(".hub-compact-arrow").forEach((b) => {
    const off = b.dataset.dir === "-1" ? atStart : atEnd;
    b.disabled = off;
    b.style.opacity = off ? "0.3" : "1";
    b.style.cursor = off ? "default" : "pointer";
  });
};

// "+" on a compact tile or a side-panel card: add the variant, drop the tile, refresh the cart
window.cartPlusUpsellAdd = async function (variantId, tile) {
  try {
    const res = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: variantId,
        quantity: 1,
        properties: { __upcartRecommendation: String(variantId) },
      }),
    });
    if (!res.ok && res.status !== 409) throw new Error("Add failed");
    if (!window.__HUB_ACTIVE_CART__?.upsellsSettings?.showIfAlreadyInCart) tile?.remove();
    document.dispatchEvent(new CustomEvent("cart:updated"));
  } catch (e) {
    console.error("[CartPlus] Cross-sell add failed:", e);
  }
};

if (!window._cartPlusCompactBound) {
  window._cartPlusCompactBound = true;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hub-compact-add");
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    window.cartPlusUpsellAdd(btn.dataset.variant, btn.closest(".hub-compact-tile"));
  });
}

// ── Side panel ─────────────────────────────────────────────────────────────
window.cartPlusRemoveSidePanel = function (blockId) {
  document.getElementById(`hub-upsell-side-${blockId}`)?.remove();
};

// cards stacked in a strip beside the cart, no title (same as the editor)
window.cartPlusRenderSidePanel = function (blockId, products) {
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  if (!drawer) return;
  const { ds } = cartPlusUpsellColors();
  const cards = products
    .map((p) => hubUtils.getProductCardHTML(p, window.__HUB_ACTIVE_CART__?.upsellsSettings || {}))
    .join("");

  let panel = document.getElementById(`hub-upsell-side-${blockId}`);
  if (!cards.trim()) {
    panel?.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = `hub-upsell-side-${blockId}`;
    panel.className = "hub-upsell-side-panel upsell-products";
    // sits right after the drawer so the CSS can show it only while the drawer is open
    drawer.insertAdjacentElement("afterend", panel);
  }

  // same fill as the cart body: the "Products in cart" background if set, else the Template tint
  const bodyBg =
    window.cartPlusBgCss(window.__HUB_ACTIVE_CART__?.cartSettings?.cartItem?.sectionBackground) ||
    ds.bodyBackground ||
    ds.backgroundColor ||
    "#ffffff";
  const width = drawer.getBoundingClientRect().width || 440;
  const onLeft = drawer.classList.contains("hub-cart-left");
  const floating = drawer.classList.contains("hub-cart-floating");
  panel.style.cssText = `
    top:${floating ? 16 : 0}px;
    ${onLeft ? "left" : "right"}:${width + (floating ? 16 : 0)}px;
    height:${floating ? "calc(100% - 32px)" : "100%"};
    --hub-side-shift:${(onLeft ? -1 : 1) * (width + 190 + (floating ? 16 : 0))}px;
    background:${bodyBg};
  `;
  panel.innerHTML = cards;
  // the side cards add through the shared button handler below
  panel.querySelectorAll(".hub-add-btn").forEach((b) => b.classList.add("hub-side-add"));
};

if (!window._cartPlusSideBound) {
  window._cartPlusSideBound = true;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hub-side-add");
    if (!btn || btn.disabled) return;
    const tile = btn.closest(".hub-rec-product");
    const select = tile?.querySelector(".hub-variant-select");
    btn.disabled = true;
    window.cartPlusUpsellAdd(select?.value || btn.dataset.variant, tile).finally(() => {
      btn.disabled = false;
    });
  });
  // changing the variant in a side card updates its price / image
  document.addEventListener("change", (e) => {
    const select = e.target.closest?.(".hub-upsell-side-panel .hub-variant-select");
    if (!select) return;
    const tile = select.closest(".hub-rec-product");
    const opt = select.options[select.selectedIndex];
    const price = tile?.querySelector(".sale-price");
    const img = tile?.querySelector(".hub-product-img");
    if (price) price.textContent = hubUtils.formatMoney(Number(opt.dataset.price));
    if (img && opt.dataset.image) img.src = opt.dataset.image;
  });
}
