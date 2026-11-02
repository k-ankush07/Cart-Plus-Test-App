// Cross-sell layouts that need their own markup: "compact" (small tiles in a scroll strip with
// prev / next arrows) and "side" (a strip of cards beside the cart). Row / List / Carousel
// still go through renderProducts. Mirrors the editor's cart-Items/Upsells.jsx.

// same rule as the editor: the saved layout wins, "row" and legacy settings fall back to direction
window.cartPlusUpsellLayout = function (settings) {
  if (settings?.layout && settings.layout !== "row") return settings.layout;
  return settings?.direction === "carousel" ? "carousel" : "list";
};

const cartPlusUpsellColors = () => {
  const u = window._cartPlusUpsellOverride || window.__HUB_ACTIVE_CART__?.upsellsSettings || {};
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
  return { u, ds, primary: u.primaryTextColor || ds.textColor || "#6b7280" };
};

const cartPlusFirstImage = (p) =>
  p?.images?.[0]?.src || p?.featured_image?.url || p?.featured_image || "";

function cartPlusCompactPriceHTML(variant, settings) {
  const { ds } = cartPlusUpsellColors();
  const fmt = hubUtils.formatMoney;
  const baseCents = Math.round(Number(variant.price) * 100) || 0;
  const offer = hubUtils.cartPlusApplyOfferDiscount(
    {
      discountType: settings.discountType || "none",
      discountValue: settings.discountValue,
    },
    baseCents,
  );
  const saleCents = offer.saved > 0 ? offer.final : baseCents;
  const compareCents =
    offer.saved > 0
      ? baseCents
      : Math.round(Number(variant.compare_at_price) * 100) || 0;
  const hasCompare = compareCents > saleCents;
  const savedCents = hasCompare ? compareCents - saleCents : 0;
  const savingsText = window.__HUB_ACTIVE_CART__?.cartSettings?.savingsText || "Save";
  const savingColor = ds.savingsColor || "#16a34a";
  const label = String(settings.labelText || "Save {{saved_percentage}}")
    .replace(/\{\{saved_percentage\}\}/gi, `${offer.percent}%`)
    .replace(/\{\{saved_amount\}\}/gi, fmt(offer.saved));
  const offerLabel =
    offer.saved > 0 && settings.showLabel !== false
      ? `<span class="hub-compact-label">${label}</span>`
      : "";

  return `<div class="hub-compact-price">
    <div class="hub-compact-price-row">
      <span class="hub-compact-sale-price">${fmt(saleCents)}</span>
      ${hasCompare ? `<span class="hub-compact-compare-price">${fmt(compareCents)}</span><span class="hub-compact-saving" style="--hub-compact-saving-color:${savingColor};">${savingsText} ${fmt(savedCents)}</span>` : ""}
    </div>
    ${offerLabel}
  </div>`;
}

// ── Compact ────────────────────────────────────────────────────────────────
window.cartPlusCompactHTML = function (products) {
  const { u, ds, primary } = cartPlusUpsellColors();
  const fmt = hubUtils.formatMoney;
  const bg = window.cartPlusBgCss(u.cardBackground) || ds.accentColor || "";
  const cardBorder = ds.accentBorder || "rgba(0, 0, 0, 0.08)";
  const radius = u.radius ?? 8;
  const btnBg = window.cartPlusBgCss(u.buttonBackground) || ds.buttonColor || "#000";
  const btnText = u.buttonTextColor || ds.buttonTextColor || "#fff";
  const tileW = Math.max(88, Math.min(u.imageSize || 96, 128));

  const tiles = products
    .filter((p) => (p.variants || []).length)
    .map((p) => {
      const v = p.variants[0];
      const imgOf = (x) =>
        (x.image_id && p.images?.find((i) => i.id === x.image_id)?.src) ||
        x.featured_image?.src ||
        "";
      const select =
        p.variants.length > 1
          ? `<select class="hub-compact-variant" style="width:100%;min-width:0;font-size:11px;color:${primary};">${p.variants
              .map(
                (x) =>
                  `<option value="${x.id}" data-price="${Number(x.price) || 0}" data-compare-price="${Number(x.compare_at_price) || 0}" data-image="${imgOf(x)}"${x.id === v.id ? " selected" : ""}>${x.title}</option>`,
              )
              .join("")}</select>`
          : "";
      return `<div class="hub-rec-product hub-rec-product-compact hub-compact-tile" style="position:relative;flex:0 0 auto;scroll-snap-align:start;width:${tileW}px;background:${bg};border:1px solid ${cardBorder};border-radius:${radius}px;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;">
        <img class="hub-compact-img" src="${imgOf(v) || cartPlusFirstImage(p)}" alt="${p.title}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:${u.radius ?? 6}px;display:block;">
        <button type="button" class="hub-compact-add" data-variant="${v.id}" aria-label="${u.buttonText || "Add"}" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;cursor:pointer;background:${btnBg};color:${btnText};font-size:14px;line-height:20px;padding:0;">+</button>
        <a href="/products/${p.handle}" class="cart-plus-internal-component-upsell-tile__title-link" style="text-decoration:none;"><h3 class="cart-plus-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title" style="color:${primary};font-size:13px;line-height:1.3;margin:0;text-decoration:none;font-weight:600; display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</h3></a>
        ${cartPlusCompactPriceHTML(v, u)}
        ${select}
      </div>`;
    })
    .join("");

  return `<div class="hub-compact-track" onscroll="cartPlusCompactEdges(this)" style="display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;align-items:stretch;">${tiles}</div>`;
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
    const tile = btn.closest(".hub-compact-tile");
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = '<span class="hub-compact-add-spinner" aria-hidden="true"></span>';
    tile?.classList.add("hub-compact-tile--adding");
    window.cartPlusUpsellAdd(btn.dataset.variant, tile).finally(() => {
      if (!btn.isConnected) return;
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.innerHTML = originalContent;
      tile?.classList.remove("hub-compact-tile--adding");
    });
  });
}

if (!window._cartPlusCompactVariantBound) {
  window._cartPlusCompactVariantBound = true;
  document.addEventListener("change", (e) => {
    const select = e.target.closest?.(".hub-compact-variant");
    if (!select) return;
    const tile = select.closest(".hub-compact-tile");
    const opt = select.options[select.selectedIndex];
    const add = tile?.querySelector(".hub-compact-add");
    const price = tile?.querySelector(".hub-compact-price");
    const img = tile?.querySelector(".hub-compact-img");
    if (add) add.dataset.variant = select.value;
    if (price) {
      const settings = window.__HUB_ACTIVE_CART__?.upsellsSettings || {};
      price.outerHTML = cartPlusCompactPriceHTML(
        {
          price: Number(opt.dataset.price),
          compare_at_price: Number(opt.dataset.comparePrice),
        },
        settings,
      );
    }
    if (img && opt.dataset.image) img.src = opt.dataset.image;
  });
}

// ── Side panel ─────────────────────────────────────────────────────────────
window.cartPlusRemoveSidePanel = function (blockId) {
  document.getElementById(`hub-upsell-side-${blockId}`)?.remove();
  // the cart goes back to its own spot once the panel is gone
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  drawer?.classList.remove("hub-side-shifted");
};

// cards stacked in a strip beside the cart, with the Cross-sell title on top (same as the editor)
window.cartPlusRenderSidePanel = function (blockId, products, settings) {
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  if (!drawer) return;
  const { ds } = cartPlusUpsellColors();
  const cards = products
    .map((p) =>
      hubUtils.getProductCardHTML(p, {
        ...(settings || window.__HUB_ACTIVE_CART__?.upsellsSettings || {}),
        upsellSettings: settings,
        upsellLayout: "side",
      }),
    )
    .join("");

  // title + icon, like the other layouts
  const { u, primary } = cartPlusUpsellColors();
  const cfg = settings || u;
  const titleIcon = cfg.icon === undefined ? { type: "icon", name: "star" } : cfg.icon;
  const iconHtml = titleIcon
    ? `<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${window.hubLibraryIconHTML?.(titleIcon, 18, cfg.iconColor || undefined) || ""}</span>`
    : "";
  const titleHtml = cfg.title
    ? `<div class="hub-side-title upcart-internal-style__title-large" style="color:${primary};text-align:left;flex-shrink:0;font-weight:450;font-size:14px;">${iconHtml}${cfg.title}</div>`
    : "";
  const html = titleHtml + cards;

  let panel = document.getElementById(`hub-upsell-side-${blockId}`);
  if (!cards.trim()) {
    window.cartPlusRemoveSidePanel(blockId);
    return;
  }
  const signature = html;
  if (panel && panel.dataset.sig === signature) return;
  if (!panel) {
    panel = document.createElement("div");
    panel.id = `hub-upsell-side-${blockId}`;
    panel.className = "hub-upsell-side-panel upsell-products";
    if (/hub-visible-/.test(drawer.className)) {
      panel.style.transition = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => (panel.style.transition = "")));
    }
    drawer.insertAdjacentElement("afterend", panel);
  }
  panel.dataset.sig = signature;

  const bodyBg =
    window.cartPlusBgCss(window.__HUB_ACTIVE_CART__?.cartSettings?.cartItem?.sectionBackground) ||
    ds.bodyBackground ||
    ds.backgroundColor ||
    "#ffffff";
  const width = drawer.getBoundingClientRect().width || 440;
  const drawerOnLeft = drawer.classList.contains("hub-cart-left");
  const floating = drawer.classList.contains("hub-cart-floating");
  const sideInset = floating ? 16 : 0;
  panel.style.top = `${floating ? 16 : 0}px`;
  // Editor "Left" / "Right" of the cart. Outer side: next to the drawer. Inner side: at the screen edge,
  // and the cart moves over to make room (same as the editor preview).
  const wantRight = (settings || window.__HUB_ACTIVE_CART__?.upsellsSettings || {}).sidePanelPosition === "right";
  const outer = !wantRight !== drawerOnLeft;
  const edge = drawerOnLeft ? "left" : "right";
  panel.style.left = "";
  panel.style.right = "";
  if (outer) {
    drawer.classList.remove("hub-side-shifted");
    panel.style[edge] = `${width + sideInset}px`;
  } else {
    panel.style[edge] = `${sideInset}px`;
    // only while the cart is open (see .hub-side-shifted in the css), so a closed cart stays off screen
    drawer.style.setProperty("--hub-side-offset", `${190 + sideInset}px`);
    drawer.classList.add("hub-side-shifted");
  }
  // slide the panel exactly as far as the cart travels (and fade it), so both come and go together
  const travel = outer ? width : width + 190 + sideInset;
  panel.style.setProperty("--hub-side-shift", `${(drawerOnLeft ? -1 : 1) * travel}px`);
  panel.style.height = floating ? "calc(100% - 32px)" : "100%";
  panel.style.background = bodyBg;
  panel.innerHTML = html;
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
