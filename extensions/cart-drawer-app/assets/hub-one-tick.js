// One Tick Upsell (cartSettings.oneTick). Mirrors the editor preview: a title with icon and one
// card per offer (Row / List / Carousel layout) with a Button, Checkbox or Toggle that adds the
// offer's product to the cart. An offer disappears while its product is in the cart.
const CART_PLUS_ONE_TICK_DEFAULTS = {
  enabled: false,
  title: "You might also like",
  icon: { type: "icon", name: "star" },
  iconColor: "#000000",
  layout: "list", // "row" | "list" | "carousel"
  trigger: "button", // "button" | "checkbox" | "toggle"
  buttonLabel: "Add",
  offers: [],
  imageSize: 120,
  radius: 8,
  primaryTextColor: "#000000",
  secondaryTextColor: "#616161",
  buttonRadius: 6,
  buttonFontSize: 14,
  buttonBackground: { type: "plain", color: "#303030" },
  buttonTextColor: "#ffffff",
  cardBackground: null,
};

function cartPlusGetOneTick(cartSettings) {
  return { ...CART_PLUS_ONE_TICK_DEFAULTS, ...(cartSettings?.oneTick || {}) };
}

// price after the offer's discount, plus what was saved (all in cents)
function cartPlusApplyOfferDiscount(offer, cents) {
  const base = Number(cents) || 0;
  const value = Number(offer.discountValue) || 0;
  let final = base;
  if (offer.discountType === "percentage")
    final = base * (1 - Math.min(100, value) / 100);
  if (offer.discountType === "amount") final = base - value * 100;
  final = Math.max(0, Math.round(final));
  const saved = base - final;
  return { final, saved, percent: base ? Math.round((saved / base) * 100) : 0 };
}

const cartPlusIdOf = (gid) =>
  String(gid || "")
    .split("/")
    .pop();

window.cartPlusOneTickContainerHTML = function (blockId, cartSettings) {
  const s = cartPlusGetOneTick(cartSettings);
  if (!s.enabled || !s.offers.length) return "";
  return `<div id="cart-plus-onetick-${blockId}" class="cart-plus-one-tick" style="display:none;"></div>`;
};

// ── products ───────────────────────────────────────────────────────────────
// /products.json gives prices as "12.00"; the recommendations endpoint gives cents
function cartPlusNormalizeProduct(p, pricesInCents) {
  const toCents = (v) =>
    pricesInCents ? Number(v) || 0 : Math.round(Number(v) * 100) || 0;
  const image =
    p.featured_image?.url ||
    p.featured_image ||
    p.image?.src ||
    p.images?.[0]?.src ||
    p.images?.[0] ||
    "";
  return {
    id: String(p.id),
    title: p.title,
    image: typeof image === "string" ? image : image?.src || "",
    variants: (p.variants || []).map((v) => ({
      id: String(v.id),
      title: v.title,
      price: toCents(v.price),
      image: v.featured_image?.src || "",
    })),
  };
}

async function cartPlusLoadAllProducts() {
  if (window._cartPlusAllProducts) return window._cartPlusAllProducts;
  window._cartPlusAllProducts = (async () => {
    const all = [];
    for (let page = 1; page <= 8; page++) {
      const data = await fetch(`/products.json?limit=250&page=${page}`)
        .then((r) => r.json())
        .catch(() => ({ products: [] }));
      if (!data.products?.length) break;
      all.push(...data.products);
      if (data.products.length < 250) break;
    }
    return all.map((p) => cartPlusNormalizeProduct(p, false));
  })();
  return window._cartPlusAllProducts;
}

// offerId -> product, for the offers that currently apply
async function cartPlusLoadOfferProducts(oneTick, cart) {
  const key = JSON.stringify(
    oneTick.offers.map((o) => [o.id, o.mode, o.selected?.items?.variants]),
  );
  const cache = (window._cartPlusOneTickCache ||= {});
  if (cache.key === key && cache.products) return cache.products;

  const products = {};
  const manual = oneTick.offers.filter(
    (o) => o.mode === "manual" && o.selected?.items?.variants?.length,
  );
  const auto = oneTick.offers.filter((o) => !manual.includes(o));

  if (manual.length) {
    const all = await cartPlusLoadAllProducts();
    manual.forEach((offer) => {
      const wanted = offer.selected.items.variants.map(cartPlusIdOf);
      const product = all.find((p) =>
        p.variants.some((v) => wanted.includes(v.id)),
      );
      if (!product) return;
      // only the variants ticked in the picker
      const chosen = product.variants.filter((v) => wanted.includes(v.id));
      products[offer.id] = {
        ...product,
        variants: chosen.length ? chosen : product.variants,
      };
    });
  }

  if (auto.length) {
    const first = (cart.items || [])[0];
    if (first) {
      const data = await fetch(
        `/recommendations/products.json?product_id=${first.product_id}&limit=${Math.max(auto.length, 4)}`,
      )
        .then((r) => r.json())
        .catch(() => ({ products: [] }));
      const list = (data.products || [])
        .map((p) => cartPlusNormalizeProduct(p, true))
        .filter((p) => p.variants.length);
      auto.forEach((offer, i) => {
        if (list[i] || list[0]) products[offer.id] = list[i] || list[0];
      });
    }
  }

  // keep the result for later renders; auto picks depend on the cart, so only manual ones are reused
  cache.key = key;
  cache.products = manual.length === oneTick.offers.length ? products : null;
  return products;
}

// ── painting ───────────────────────────────────────────────────────────────
function cartPlusOneTickTrigger(blockId, oneTick, offer, variantId) {
  const accent = window.cartPlusBgCss(oneTick.buttonBackground) || "#303030";
  const call = (on) =>
    `cartPlusOneTickToggle('${blockId}','${offer.id}','${variantId}',${on})`;
  if (oneTick.trigger === "checkbox") {
    return `<label class="cart-plus-onetick-check" aria-label="${oneTick.buttonLabel}">
      <input type="checkbox" onchange="var c=this.checked;setTimeout(function(){${call("c")}},c?450:0)" />
      <span class="cart-plus-onetick-check__box" style="--cp-accent:${accent};--cp-tick:${oneTick.buttonTextColor || "#fff"};--cp-border:${oneTick.secondaryTextColor || "#8a8a8a"};"></span>
    </label>`;
  }
  if (oneTick.trigger === "toggle") {
    return `<button type="button" role="switch" aria-checked="false" aria-label="${oneTick.buttonLabel}" class="cart-plus-onetick-switch" style="--cp-accent:${accent};--cp-off:${window.__HUB_ACTIVE_CART__?.designSettings?.accentBorder || "#c9cccf"};" onclick="this.setAttribute('aria-checked','true');setTimeout(function(){${call("true")}},450)"><span></span></button>`;
  }
  return `<button type="button" class="cart-plus-onetick-btn" onclick="${call("true")}" style="width:100%; border:none;cursor:pointer;padding:8px 16px;border-radius:${oneTick.buttonRadius}px;font-size:${oneTick.buttonFontSize}px;background:${accent};color:${oneTick.buttonTextColor};">${oneTick.buttonLabel}</button>`;
}

function cartPlusOneTickCard(blockId, oneTick, offer, product, cardBg) {
  const cardBorder =
    window.__HUB_ACTIVE_CART__?.designSettings?.accentBorder ||
    "rgba(0,0,0,.08)";
  const fmt = hubUtils.formatMoney;
  const chosenId = (window._cartPlusOneTickVariant ||= {})[offer.id];
  const variant =
    product.variants.find((v) => v.id === chosenId) || product.variants[0];
  const { final, saved, percent } = cartPlusApplyOfferDiscount(
    offer,
    variant.price,
  );
  const label = String(offer.label || "")
    .replace(/\{\{saved_percentage\}\}/gi, `${percent}%`)
    .replace(/\{\{saved_amount\}\}/gi, fmt(saved));
  const isCarousel = oneTick.layout === "carousel";
  const isRow = oneTick.layout === "row" || oneTick.layout === "list";

  const price = `<div style="font-size:13px;color:${oneTick.primaryTextColor};">${fmt(final)}${
    saved > 0
      ? ` <span style="text-decoration:line-through;color:${oneTick.secondaryTextColor};font-size:12px;">${fmt(variant.price)}</span>`
      : ""
  }</div>`;
  const labelHtml =
    offer.showLabel && saved > 0
      ? `<div style="font-size:11px;color:${oneTick.secondaryTextColor};">${label}</div>`
      : "";
  const select =
    product.variants.length > 1
      ? `<select onchange="cartPlusOneTickVariant('${blockId}','${offer.id}',this.value)" style="width:100%;font-size:12px;margin-top:4px;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:${oneTick.secondaryTextColor};">${product.variants
          .map(
            (v) =>
              `<option value="${v.id}"${v.id === variant.id ? " selected" : ""}>${v.title}</option>`,
          )
          .join("")}</select>`
      : "";
  const trigger = cartPlusOneTickTrigger(blockId, oneTick, offer, variant.id);
  const img = variant.image || product.image;

  if (isCarousel) {
    return `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:8px;flex:0 0 43%;min-width:0;box-sizing:border-box;scroll-snap-align:start;">
      <img src="${img}" alt="${product.title}" style="width:${oneTick.imageSize}px;max-width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:${oneTick.radius}px;display:block;align-self:center;">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;min-width:0;">
        <div style="font-weight:600;font-size:13px;line-height:1.3;color:${oneTick.primaryTextColor};display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${product.title}</div>
        ${price}${labelHtml}${select}
      </div>
      <div style="display:flex;justify-content:center;">${trigger}</div>
    </div>`;
  }

  const savingHtml =
    offer.showLabel && saved > 0
      ? `<div style="font-size:11px;font-weight:600;color:#1e7e34;white-space:nowrap;flex-shrink:0;">${label}</div>`
      : "";
  return `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;padding:12px;display:flex;flex-direction:row;align-items:center;gap:12px;">
    <div class="cart-plus-drawer__xs-row-thumb" style="width:90px;height:90px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
      <img src="${img}" alt="${product.title}" style="width:${oneTick.imageSize * 0.45}px;height:${oneTick.imageSize * 0.45}px;max-width:100%;max-height:100%;display:block;object-fit:cover;border-radius:${oneTick.radius * 0.45}px;">
    </div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div style="font-weight:600;font-size:13px;line-height:1.25;color:${oneTick.primaryTextColor};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.title}</div>
        ${savingHtml}
      </div>
      <div style="margin-top:2px;">${price}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <div style="flex:1;min-width:0;">${select.replace("margin-top:4px;", "")}</div>
        ${isRow ? `<div style="flex-shrink:0; display:flex">${trigger}</div>` : ""}
      </div>
      ${!isRow ? `<div style="margin-top:12px;">${trigger}</div>` : ""}
    </div>
  </div>`;
}

window.cartPlusRenderOneTick = async function (blockId, cart) {
  const el = document.getElementById(`cart-plus-onetick-${blockId}`);
  if (!el) return;
  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const oneTick = cartPlusGetOneTick(cartSettings);
  // Appearance: Dark -> the saved light text colours become the dark theme's
  const dsx = window.__HUB_ACTIVE_CART__?.designSettings || {};
  const dotAccent = dsx.accentText || "#1a56db";
  oneTick.primaryTextColor = window.cartPlusDarkColor(
    oneTick.primaryTextColor,
    "#000000",
    dsx.textColor,
  );
  oneTick.secondaryTextColor = window.cartPlusDarkColor(
    oneTick.secondaryTextColor,
    "#616161",
    "#a8a8ad",
  );
  oneTick.iconColor = window.cartPlusDarkColor(
    oneTick.iconColor,
    "#000000",
    dsx.textColor,
  );
  if (!oneTick.enabled || !oneTick.offers.length || !cart?.items?.length) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }
  window._cartPlusOneTickCart = cart;

  const products = await cartPlusLoadOfferProducts(oneTick, cart);
  const inCart = new Set(cart.items.map((i) => String(i.variant_id)));
  const cards = oneTick.offers
    .map((offer) => ({ offer, product: products[offer.id] }))
    // an offer is hidden while its product is in the cart (back again when it is removed)
    .filter(
      (c) => c.product && !c.product.variants.some((v) => inCart.has(v.id)),
    );
  if (!cards.length) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  // white unless a Card background is set in the editor
  const cardBg =
    window.cartPlusBgCss(oneTick.cardBackground) ||
    (dsx.dark ? "var(--cp-card, #2a2a2d)" : "#ffffff");
  const isCarousel = oneTick.layout === "carousel";
  const title = oneTick.title
    ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-weight:600;color:${oneTick.primaryTextColor};">${
        window.hubLibraryIconHTML?.(oneTick.icon, 20, oneTick.iconColor) || ""
      }<span>${oneTick.title}</span></div>`
    : "";

  el.style.cssText = "padding:12px 16px;display:block;";

  // Row layout with more than one offer: cards stacked like a deck (top card in front, two peeking behind)
  if (oneTick.layout === "row" && cards.length > 1) {
    el.innerHTML = `${title}<div class="cart-plus-drawer__ups-stack">${cards
      .map(
        (c, i) =>
          `<div class="cart-plus-drawer__ups-stack-item" data-rapi-ups-stack-pos="${i}" aria-hidden="${i !== 0}">${cartPlusOneTickCard(blockId, oneTick, c.offer, c.product, cardBg)}</div>`,
      )
      .join("")}</div>`;
    return;
  }

  const dotBg = (active) =>
    active
      ? `color-mix(in srgb, ${dotAccent} 85%, #121212 15%)`
      : `color-mix(in srgb, ${dotAccent} 22%, #ffffff 78%)`;

  const dots =
    isCarousel && cards.length > 1
      ? `<div class="cart-plus-onetick-dots" style="display:flex;justify-content:center;gap:6px;margin-top:10px;">${cards
          .map(
            (_, i) =>
              `<button type="button" class="cart-plus-onetick-dot" aria-label="Go to offer ${i + 1}" onclick="cartPlusOneTickGoTo('${blockId}',${i})" style="width:6px;height:6px;padding:0;border:none;border-radius:50%;cursor:pointer;background:${dotBg(i === 0)};"></button>`,
          )
          .join("")}</div>`
      : "";

  el.innerHTML = `${title}<div class="${isCarousel ? "cart-plus-onetick-track" : ""}" style="display:flex;flex-direction:${isCarousel ? "row" : "column"};gap:${isCarousel ? 10 : 8}px;${isCarousel ? "overflow-x:auto;scroll-snap-type:x mandatory;align-items:stretch;" : ""}">${cards
    .map((c) =>
      cartPlusOneTickCard(blockId, oneTick, c.offer, c.product, cardBg),
    )
    .join("")}</div>${dots}`;

  // scroll ke saath active dot update karo
  if (dots) {
    const track = el.querySelector(".cart-plus-onetick-track");
    const dotEls = el.querySelectorAll(".cart-plus-onetick-dot");
    track.addEventListener(
      "scroll",
      () => {
        const first = track.firstElementChild;
        if (!first) return;
        const step = first.getBoundingClientRect().width + 10;
        const idx = Math.max(
          0,
          Math.min(dotEls.length - 1, Math.round(track.scrollLeft / step)),
        );
        dotEls.forEach((d, i) => (d.style.background = dotBg(i === idx)));
      },
      { passive: true },
    );
  }
};

window.cartPlusOneTickGoTo = function (blockId, i) {
  const track = document.querySelector(`#cart-plus-onetick-${blockId} .cart-plus-onetick-track`);
  const child = track?.children[i];
  if (!track || !child) return;
  track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
};

window.cartPlusOneTickVariant = function (blockId, offerId, variantId) {
  (window._cartPlusOneTickVariant ||= {})[offerId] = variantId;
  if (window._cartPlusOneTickCart)
    window.cartPlusRenderOneTick(blockId, window._cartPlusOneTickCart);
};

// tick = the offer's product goes into the cart, untick = it is removed again
window.cartPlusOneTickToggle = async function (
  blockId,
  offerId,
  variantId,
  on,
) {
  try {
    if (on) {
      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(variantId),
          quantity: 1,
          properties: { _cart_plus_one_tick: offerId },
        }),
      });
    } else {
      const latest = await (await fetch("/cart.js")).json();
      const match = latest.items.find(
        (i) => String(i.variant_id) === String(variantId),
      );
      if (match) {
        await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: match.key, quantity: 0 }),
        });
      }
    }
  } catch (e) {
    console.error("[CartPlus] One Tick Upsell failed:", e);
  }
  document.dispatchEvent(new CustomEvent("cart:updated"));
};

// the cart just became empty: drop the section right away instead of waiting for the next full render
window.cartPlusHideOneTick = function (blockId) {
  const el = document.getElementById(`cart-plus-onetick-${blockId}`);
  window._cartPlusOneTickCart = null;
  if (!el) return;
  el.style.display = "none";
  el.innerHTML = "";
};
