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
    id: cartPlusIdOf(p.id),
    handle: p.handle,
    title: p.title,
    image: typeof image === "string" ? image : image?.src || "",
    variants: (p.variants || []).map((v) => ({
      id: cartPlusIdOf(v.id),
      title: v.title,
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      price: toCents(v.price),
      image: v.featured_image?.src || v.image?.src || v.image || "",
    })),
  };
}

function cartPlusOneTickOptionParts(variant) {
  const optionValues = [variant.option1, variant.option2, variant.option3];
  if (optionValues.some((value) => value != null && value !== "")) {
    const values = optionValues.map((value) => String(value ?? "").trim());
    while (values.length && !values[values.length - 1]) values.pop();
    return values;
  }
  return String(variant.title || "")
    .split(/\s*\/\s*/)
    .map((value) => value.trim());
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
  const autoCache = (cache.autoProducts ||= {});
  if (cache.key === key && cache.products) return cache.products;

  const products = {};
  const manual = oneTick.offers.filter(
    (o) => o.mode === "manual" && o.selected?.items?.variants?.length,
  );
  const auto = oneTick.offers.filter((o) => !manual.includes(o));

  if (manual.length) {
    await Promise.all(manual.map(async (offer) => {
      const wanted = offer.selected.items.variants.map(cartPlusIdOf);
      const savedProducts = offer.selected.items.productData || [];
      const savedProduct = savedProducts.find((product) =>
        product.variants?.some((variant) =>
          wanted.includes(cartPlusIdOf(variant.id)),
        ),
      );
      if (savedProduct?.handle) {
        const liveProduct = await hubUtils.getLiveProduct(savedProduct);
        products[offer.id] = cartPlusNormalizeProduct(liveProduct, false);
        return;
      }
    }));

    const unresolvedManual = manual.filter((offer) => !products[offer.id]);
    if (unresolvedManual.length) {
      const all = await cartPlusLoadAllProducts();
      unresolvedManual.forEach((offer) => {
        const wanted = offer.selected.items.variants.map(cartPlusIdOf);
        const product = all.find((p) =>
          p.variants.some((v) => wanted.includes(v.id)),
        );
        if (!product) return;
        products[offer.id] = product;
      });
    }
  }

  if (auto.length) {
    const first = (cart.items || [])[0];
    if (first) {
      const autoCacheKey = `${key}:${first.product_id}`;
      const cachedAuto = autoCache[autoCacheKey];
      if (cachedAuto) {
        Object.assign(
          products,
          typeof cachedAuto.then === "function" ? await cachedAuto : cachedAuto,
        );
      } else {
        const request = (async () => {
          const data = await fetch(
            `/recommendations/products.json?product_id=${first.product_id}&limit=${Math.max(auto.length, 4)}`,
          )
            .then((r) => r.json())
            .catch(() => ({ products: [] }));
          const list = (data.products || [])
            .map((p) => cartPlusNormalizeProduct(p, true))
            .filter((p) => p.variants.length);
          const autoProducts = {};
          auto.forEach((offer, i) => {
            if (list[i] || list[0]) {
              autoProducts[offer.id] = list[i] || list[0];
            }
          });
          return autoProducts;
        })();
        autoCache[autoCacheKey] = request;
        const autoProducts = await request;
        Object.assign(products, autoProducts);
        if (Object.keys(autoProducts).length) {
          autoCache[autoCacheKey] = autoProducts;
        } else {
          delete autoCache[autoCacheKey];
        }
      }
    }
  }

  // Manual offers are stable; auto recommendations are cached by their source product.
  cache.key = key;
  cache.products = manual.length === oneTick.offers.length ? products : null;
  return products;
}

// ── painting ───────────────────────────────────────────────────────────────
function cartPlusOneTickTrigger(blockId, oneTick, offer, variantId) {
  const design = window.__HUB_ACTIVE_CART__?.designSettings || {};
  // untouched default (#303030) follows the Template theme colour / gradient
  const bgSetting = oneTick.buttonBackground;
  const untouched =
    !bgSetting || (bgSetting.type === "plain" && String(bgSetting.color).toLowerCase() === "#303030");
  const themeBg = window.cartPlusTemplateBackground?.(design);
  const accent =
    window.cartPlusBgCss(untouched && themeBg ? themeBg : bgSetting) || "#303030";
  const activeColor = design.accentSolid || design.themeColor || accent;
  const call = (on, button = "", trigger = "") =>
    `cartPlusOneTickToggle('${blockId}','${offer.id}','${variantId}',${on}${button}${trigger})`;
  if (oneTick.trigger === "checkbox") {
    return `<label class="cart-plus-onetick-check" aria-label="${oneTick.buttonLabel}">
      <input type="checkbox" class="cart-plus-onetick-input" style="--cp-accent:${activeColor};--cp-tick:${oneTick.buttonTextColor || "#fff"};--cp-border:${oneTick.secondaryTextColor || "#8a8a8a"};" onchange="var c=this.checked;${call("c", ",null,this")}" />
    </label>`;
  }
  if (oneTick.trigger === "toggle") {
    return `<button type="button" role="switch" aria-checked="false" aria-label="${oneTick.buttonLabel}" class="cart-plus-onetick-switch" style="--cp-accent:${activeColor};--cp-off:${design.accentBorder || "#c9cccf"};" onclick="this.setAttribute('aria-checked','true');${call("true", ",null,this")}"><span></span></button>`;
  }
  return `<button type="button" class="cart-plus-onetick-btn" onclick="${call("true", ",this")}" style="width:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:none;cursor:pointer;padding:6px 8px;border-radius:${oneTick.buttonRadius}px;font-size:${oneTick.buttonFontSize}px;background:${accent};color:${oneTick.buttonTextColor};">${oneTick.buttonLabel}</button>`;
}

function cartPlusOneTickVariantSelects(
  blockId,
  oneTick,
  offer,
  product,
  variant,
) {
  if (product.variants.length < 2) return "";

  const selectedParts = cartPlusOneTickOptionParts(variant);
  const optionGroups = Math.max(
    0,
    ...product.variants.map((item) => cartPlusOneTickOptionParts(item).length),
  );
  const escape = hubUtils._escHtml;

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(75px,1fr));gap:4px;width:100%;margin-top:4px;">
    ${Array.from({ length: optionGroups }, (_, index) => {
      const values = [
        ...new Set(
          product.variants
            .map(cartPlusOneTickOptionParts)
            .filter((parts) =>
              selectedParts
                .slice(0, index)
                .every((selected, previous) => parts[previous] === selected),
            )
            .map((parts) => parts[index])
            .filter(Boolean),
        ),
      ];

      return `<select aria-label="Variant option ${index + 1}" onchange="cartPlusOneTickOption('${blockId}','${offer.id}',${index},this.value)" style="width:100%;min-width:0;box-sizing:border-box;font-size:12px;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:${oneTick.secondaryTextColor};">
        ${values
          .map(
            (value) =>
              `<option value="${escape(value)}"${value === selectedParts[index] ? " selected" : ""}>${escape(value)}</option>`,
          )
          .join("")}
      </select>`;
    }).join("")}
  </div>`;
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
  const select = cartPlusOneTickVariantSelects(
    blockId,
    oneTick,
    offer,
    product,
    variant,
  );
  const trigger = cartPlusOneTickTrigger(blockId, oneTick, offer, variant.id);
  const img = variant.image || product.image;

  if (isCarousel) {
    return `<div class="cart-plus-onetick-card" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:8px;flex:0 0 43%;min-width:0;box-sizing:border-box;scroll-snap-align:start;">
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
      ? `<div style="font-size:11px;font-weight:400;color:#1e7e34;white-space:nowrap;flex-shrink:0;">${label}</div>`
      : "";
  return `<div class="cart-plus-onetick-card" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;padding:12px;display:flex;flex-direction:row;align-items:center;gap:12px;">
    <div class="cart-plus-drawer__xs-row-thumb" style="width:90px;height:90px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
      <img src="${img}" alt="${product.title}" style="width:${oneTick.imageSize * 0.45}px;height:${oneTick.imageSize * 0.45}px;max-width:100%;max-height:100%;display:block;object-fit:cover;border-radius:${oneTick.radius * 0.45}px;">
    </div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div style="font-weight:500;font-size:13px;line-height:1.25;color:${oneTick.primaryTextColor};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.title}</div>
        ${savingHtml}
      </div>
      <div style="margin-top:2px;">${price}</div>
      <div style="display:flex;flex-direction:row;align-items:center;gap:8px;margin-top:8px;">
        <div style="flex:1;min-width:0;">${select}</div>
        <div style="flex-shrink:0;">${trigger}</div>
      </div>
    </div>
  </div>`;
}

async function cartPlusCollapseSection(el, section, renderAt) {
  const hide = () => {
    if (renderAt !== window._cartPlusOneTickAt) return;
    section.style.display = "none";
    el.style.display = "none";
    el.innerHTML = "";
    delete el.dataset.sig;
  };

  if (
    !section.isConnected ||
    section.style.display === "none" ||
    !section.offsetHeight ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    hide();
    return;
  }

  section.style.overflow = "hidden";
  section.style.transition = "none";
  section.style.maxHeight = `${section.scrollHeight}px`;
  section.style.opacity = "1";
  void section.offsetHeight;
  section.style.transition =
    "max-height 220ms ease, opacity 180ms ease, padding 220ms ease";

  requestAnimationFrame(() => {
    if (renderAt !== window._cartPlusOneTickAt) return;
    section.style.maxHeight = "0px";
    section.style.opacity = "0";
    section.style.paddingTop = "0";
    section.style.paddingBottom = "0";
  });

  await new Promise((resolve) => setTimeout(resolve, 240));
  hide();
}

window.cartPlusRenderOneTick = async function (blockId, cart) {
  const el = document.getElementById(`cart-plus-onetick-${blockId}`);
  if (!el) return;
  const section = el.closest(".cp-bg") || el;
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
  // untouched icon colour (#000000) follows the Template theme colour
  {
    const themeIcon = window.cartPlusTemplateBackground?.(dsx)?.color;
    const c = String(oneTick.iconColor || "").toLowerCase();
    if (themeIcon && (!c || c === "#000000")) oneTick.iconColor = themeIcon;
  }
  // A render that was started with an older cart than the one already on screen must not redraw
  // (it would bring a card back for a moment, then the newer render removes it again: a blink).
  const _at = cart?._hubAt || Date.now();
  if (_at < (window._cartPlusOneTickAt || 0)) return;
  window._cartPlusOneTickAt = _at;

  [el, section].forEach((target) => {
    target.style.maxHeight = "";
    target.style.opacity = "";
    target.style.overflow = "";
    target.style.transition = "";
    target.style.paddingTop = "";
    target.style.paddingBottom = "";
  });
  if (section !== el) section.style.display = "";

  if (!oneTick.enabled || !oneTick.offers.length || !cart?.items?.length) {
    el.style.display = "none";
    el.innerHTML = "";
    delete el.dataset.sig;
    return;
  }
  window._cartPlusOneTickCart = cart;

  const products = await cartPlusLoadOfferProducts(oneTick, cart);
  if (_at < (window._cartPlusOneTickAt || 0)) return; // a newer render started while loading
  window._cartPlusOneTickProducts = products;
  const inCart = new Set(cart.items.map((i) => String(i.variant_id)));
  const cards = oneTick.offers
    .map((offer) => ({ offer, product: products[offer.id] }))
    .filter(
      (c) => c.product && !c.product.variants.some((v) => inCart.has(v.id)),
    );
  if (!cards.length) {
    await cartPlusCollapseSection(el, section, _at);
    return;
  }

  const cardBg =
    window.cartPlusBgCss(oneTick.cardBackground) ||
    (dsx.dark ? "var(--cp-card, #2a2a2d)" : "#ffffff");
  const isCarousel = oneTick.layout === "carousel";
  const title = oneTick.title
    ? `<div style="line-height:15px; font-size:14px; display:flex;align-items:center;gap:6px;margin-bottom:5px;font-weight:600;color:${oneTick.primaryTextColor};">${
        window.hubLibraryIconHTML?.(oneTick.icon, 20, oneTick.iconColor) || ""
      }<span>${oneTick.title}</span></div>`
    : "";

  section.style.display = "";
  el.style.cssText = "padding:12px 16px;display:block;";

  // only touch the DOM when something actually changed (re-writing identical HTML makes it blink)
  const put = (html) => {
    if (el.dataset.sig === html && el.firstChild) return false;
    el.dataset.sig = html;
    el.innerHTML = html;
    return true;
  };

  // Row layout with more than one offer: cards stacked like a deck (top card in front, two peeking behind)
  if (oneTick.layout === "row" && cards.length > 1) {
    put(`${title}<div class="cart-plus-drawer__ups-stack">${cards
      .map(
        (c, i) =>
          `<div class="cart-plus-drawer__ups-stack-item" data-rapi-ups-stack-pos="${i}" aria-hidden="${i !== 0}">${cartPlusOneTickCard(blockId, oneTick, c.offer, c.product, cardBg)}</div>`,
      )
      .join("")}</div>`);
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

  if (!put(`${title}<div class="${isCarousel ? "cart-plus-onetick-track" : ""}" style="display:flex;flex-direction:${isCarousel ? "row" : "column"};gap:${isCarousel ? 10 : 8}px;${isCarousel ? "overflow-x:auto;scroll-snap-type:x mandatory;align-items:stretch;" : ""}">${cards
    .map((c) =>
      cartPlusOneTickCard(blockId, oneTick, c.offer, c.product, cardBg),
    )
    .join("")}</div>${dots}`)) return;

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

function cartPlusWaitForItemInDrawer(drawer, itemKey) {
  const isRendered = () =>
    Array.from(drawer.querySelectorAll("[data-item-key]")).some(
      (row) =>
        row.getAttribute("data-item-key") === String(itemKey) &&
        row.querySelector(".hub-cart-item"),
    );
  if (isRendered()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (!isRendered()) return;
      clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out waiting for the One Tick item to render"));
    }, 10000);
    observer.observe(drawer, { childList: true, subtree: true });
  });
}

window.cartPlusOneTickVariant = function (blockId, offerId, variantId) {
  (window._cartPlusOneTickVariant ||= {})[offerId] = variantId;
  if (window._cartPlusOneTickCart)
    window.cartPlusRenderOneTick(blockId, window._cartPlusOneTickCart);
};

window.cartPlusOneTickOption = function (blockId, offerId, optionIndex, value) {
  const product = window._cartPlusOneTickProducts?.[offerId];
  if (!product) return;

  const selectedId = window._cartPlusOneTickVariant?.[offerId];
  const current =
    product.variants.find((variant) => variant.id === selectedId) ||
    product.variants[0];
  if (!current) return;

  const selectedParts = cartPlusOneTickOptionParts(current);
  const candidates = product.variants.filter((variant) => {
    const parts = cartPlusOneTickOptionParts(variant);
    return (
      parts[optionIndex] === value &&
      selectedParts
        .slice(0, optionIndex)
        .every((selected, index) => parts[index] === selected)
    );
  });
  const best =
    candidates.find((candidate) =>
      cartPlusOneTickOptionParts(candidate).every(
        (part, index) => index <= optionIndex || part === selectedParts[index],
      ),
    ) || candidates[0];

  if (best) window.cartPlusOneTickVariant(blockId, offerId, best.id);
};

// tick = the offer's product goes into the cart, untick = it is removed again
window.cartPlusOneTickToggle = async function (
  blockId,
  offerId,
  variantId,
  on,
  button,
  trigger,
) {
  if (on && button?.classList.contains("loading")) return;
  const card = (trigger || button)?.closest(".cart-plus-onetick-card");
  const originalButtonHTML = button?.innerHTML;
  if (on) card?.classList.add("cart-plus-onetick-card--adding");
  if (on && button) {
    button.classList.add("loading");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = '<span class="loader" aria-hidden="true"></span>';
  }

  try {
    if (on) {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(variantId),
          quantity: 1,
          properties: { _cart_plus_one_tick: offerId },
        }),
        hubCartSkipItemRerender: true,
        hubCartSkipOneTickRefresh: true,
        hubCartSkipCartCountUpdate: true,
      });
      if (!response.ok) {
        throw new Error(`One Tick add failed with status ${response.status}`);
      }
      const cartResponse = await fetch("/cart.js");
      if (!cartResponse.ok) {
        throw new Error(`One Tick cart refresh failed with status ${cartResponse.status}`);
      }
      const cart = await cartResponse.json();
      window.updateCartCount?.(cart);
      const addedItem = cart.items.find(
        (item) =>
          String(item.variant_id) === String(variantId) &&
          String(item.properties?._cart_plus_one_tick) === String(offerId),
      );
      if (!addedItem) {
        throw new Error("One Tick item was not found in the refreshed cart");
      }
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      if (drawer && window.hubCartRender) {
        await window.hubCartRender(drawer, {
          showSkeleton: false,
          cart,
          awaitOneTick: true,
        });
        await cartPlusWaitForItemInDrawer(drawer, addedItem.key);
      }
    } else {
      const latest = await (await fetch("/cart.js")).json();
      const match = latest.items.find(
        (i) => String(i.variant_id) === String(variantId),
      );
      let cart = latest;
      if (match) {
        const response = await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: match.key, quantity: 0 }),
          hubCartSkipItemRerender: true,
          hubCartSkipOneTickRefresh: true,
          hubCartSkipCartCountUpdate: true,
        });
        if (!response.ok) {
          throw new Error(`One Tick removal failed with status ${response.status}`);
        }
        cart = await response.json();
      }
      window.updateCartCount?.(cart);
      await new Promise((resolve) => setTimeout(resolve, 220));
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      if (drawer && window.hubCartRender) {
        await window.hubCartRender(drawer, {
          showSkeleton: false,
          cart,
          awaitOneTick: true,
        });
      }
    }
  } catch (e) {
    console.error("[CartPlus] One Tick Upsell failed:", e);
  }

  if (button?.isConnected) {
    button.classList.remove("loading");
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = originalButtonHTML;
  }
  card?.classList.remove("cart-plus-onetick-card--adding");
};

// the cart just became empty: drop the section right away instead of waiting for the next full render
window.cartPlusHideOneTick = function (blockId) {
  const el = document.getElementById(`cart-plus-onetick-${blockId}`);
  window._cartPlusOneTickAt = Math.max(
    Date.now(),
    (window._cartPlusOneTickAt || 0) + 1,
  );
  window._cartPlusOneTickCart = null;
  if (!el) return;
  el.style.display = "none";
  el.innerHTML = "";
  delete el.dataset.sig;
};

// ── fast refresh ───────────────────────────────────────────────────────────
// The full cart render does many things before it gets to the One Tick section, so after an add /
// remove it showed up several seconds late. This redraws just this section from a fresh /cart.js
// (the offer products are cached), so a product leaving or entering the cart shows up right away.
window.cartPlusOneTickQuickRefresh = async function () {
  const blockId = window.HUB_CART_BLOCK_ID;
  if (!blockId || !document.getElementById(`cart-plus-onetick-${blockId}`)) return;
  const seq = (window._cartPlusOneTickSeq = (window._cartPlusOneTickSeq || 0) + 1);
  try {
    const cart = await (await fetch("/cart.js")).json();
    if (seq !== window._cartPlusOneTickSeq) return; // a newer refresh is on its way
    await window.cartPlusRenderOneTick(blockId, cart);
  } catch (_) {}
};

if (!window._cartPlusOneTickQuickBound) {
  window._cartPlusOneTickQuickBound = true;
  document.addEventListener("cart:updated", (event) => {
    if (window.__HUB_CART_INACTIVE__) return;
    if (event?.detail?.skipOneTickRefresh) return;
    window.cartPlusOneTickQuickRefresh();
  });
}
