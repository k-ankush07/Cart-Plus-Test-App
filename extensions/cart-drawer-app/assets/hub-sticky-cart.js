// === Custom CSS: scoped exactly like the editor preview ===
// Merchant CSS such as `#cart-plus { ... }` or `.cart-plus__badge { ... }` is
// prefixed with the block scope and every declaration gets !important, so it
// beats the inline styles of the widget. The scope class sits on a wrapper
// element, and #cart-plus lives inside it (same as `.rapi-preview-viewport`
// in the editor).
function applyStickyCustomCSS(blockId, css) {
  const styleId = `hub-sticky-css-${blockId}`;
  let style = document.getElementById(styleId);

  // CSS cleared in the editor -> remove the old rules
  if (!css || !String(css).trim()) {
    if (style) style.remove();
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = scopeCss(css, `.hub-sticky-scope-${blockId}`);
}

function scopeCss(css, scope) {
  if (!css) return "";
  return String(css)
    .replace(/<\/style/gi, "")
    .replace(
      /(@[\w-]+(?:\s+[\w-]+)?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})|([^{}@]+)\{([^{}]*)\}/g,
      (match, atRule, selectors, declarations) => {
        if (atRule) return atRule;

        const scoped = selectors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `${scope} ${s}`)
          .join(", ");

        const body = declarations.trim();
        const withSemi = !body || body.endsWith(";") ? body : `${body};`;
        const important = withSemi.replace(
          /([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g,
          (_m, prop, val, semi) => `${prop}${val.trim()} !important${semi}`,
        );

        return `${scoped} { ${important} }`;
      },
    );
}

(function () {
  /* ────────────────────────────────────────────────────────────────────── */
  /* Settings (same rules as the editor's buildSettings)                     */
  /* ────────────────────────────────────────────────────────────────────── */

  const TEMPLATE_IDS = ["bubble", "pill", "ring", "tab", "bar"];

  const ICON_SIZE = { min: 16, max: 40, def: 24 };
  const BUTTON_SIZE = { min: 40, max: 100, def: 60 };

  const FLOAT_POSITIONS = [
    "bottom-right",
    "center-right",
    "top-right",
    "bottom-left",
    "center-left",
    "top-left",
  ];
  const positionsFor = (template) =>
    template === "tab"
      ? ["right", "left"]
      : template === "bar"
        ? ["bottom"]
        : FLOAT_POSITIONS;

  // keep a saved position valid for the template (bottom-right -> right for the tab, ...)
  function coercePosition(template, pos) {
    if (positionsFor(template).includes(pos)) return pos;
    if (template === "bar") return "bottom";
    const isLeft = typeof pos === "string" && pos.includes("left");
    if (template === "tab") return isLeft ? "left" : "right";
    return isLeft ? "bottom-left" : "bottom-right";
  }

  const POSITION_CSS = {
    "bottom-right": "bottom:16px;right:16px;",
    "center-right": "top:50%;right:16px;transform:translateY(-50%);",
    "top-right": "top:16px;right:16px;",
    "bottom-left": "bottom:16px;left:16px;",
    "center-left": "top:50%;left:16px;transform:translateY(-50%);",
    "top-left": "top:16px;left:16px;",
    right: "bottom:16px;right:0;",
    left: "bottom:16px;left:0;",
    bottom: "bottom:16px;left:16px;right:16px;",
  };

  const clamp = (n, min, max, fallback) => {
    const v = Number(n);
    return Number.isFinite(v)
      ? Math.min(max, Math.max(min, Math.round(v)))
      : fallback;
  };

  // values go into style="" / src="" attributes
  const clean = (v) => String(v ?? "").replace(/["<>]/g, "");

  // stroke icons that take the chosen colour + size (same set as the editor)
  const ICON_DEFS = {
    cart: `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`,
    basket: `<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>`,
    "basket-2": `<path d="M3 10h18"/><path d="M5 10l1.3 8.4A2 2 0 0 0 8.3 20h7.4a2 2 0 0 0 2-1.6L19 10"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>`,
    bag: `<path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`,
    "bag-2": `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
    tote: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7v1a3 3 0 0 0 6 0V7"/>`,
  };

  function getSettings(data) {
    const template = TEMPLATE_IDS.includes(data?.template)
      ? data.template
      : "bubble";
    const customIconUrl = data?.customIconUrl ?? null;
    const rawIcon = data?.selectedIcon ?? "bag";
    const selectedIcon =
      rawIcon === "custom"
        ? customIconUrl
          ? "custom"
          : "bag"
        : ICON_DEFS[rawIcon]
          ? rawIcon
          : "bag";

    // older records only had `device` ("all" | "mobile" | "desktop")
    const displayOnMobile =
      data?.displayOnMobile ??
      (data?.device ? data.device !== "desktop" : true);

    const position = coercePosition(template, data?.position ?? "bottom-right");
    const mobilePosition = coercePosition(
      template,
      data?.mobilePosition ?? position,
    );

    return {
      enabled: data?.enabled ?? false,
      template,
      selectedIcon,
      customIconUrl,
      bgColor: data?.bgColor ?? "#000000",
      iconColor: data?.iconColor ?? "#ffffff",
      iconSize: clamp(data?.iconSize, ICON_SIZE.min, ICON_SIZE.max, ICON_SIZE.def),
      buttonSize: clamp(
        data?.buttonSize,
        BUTTON_SIZE.min,
        BUTTON_SIZE.max,
        BUTTON_SIZE.def,
      ),
      barRadius: clamp(data?.barRadius, 0, 50, 50),
      qBgColor: data?.qBgColor ?? "#6d3bff",
      qTextColor: data?.qTextColor ?? "#ffffff",
      enableCount: data?.enableCount ?? true,
      position,
      mobilePosition,
      displayOnMobile,
      hideOnEmptyCart: data?.hideOnEmptyCart ?? false,
      customCss: data?.customCss ?? "",
    };
  }

  /* ────────────────────────────────────────────────────────────────────── */
  /* Markup for each template (mirrors the editor's StickyWidget)            */
  /* ────────────────────────────────────────────────────────────────────── */

  const SHADOW = "0 4px 14px rgba(0,0,0,0.22)";
  const BASE = `position:fixed;z-index:2147483638;cursor:pointer;transition:all .2s;`;

  function glyphMarkup(s) {
    const size = s.iconSize;
    if (s.selectedIcon === "custom" && s.customIconUrl) {
      return `<img src="${clean(s.customIconUrl)}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;display:block;">`;
    }
    const defs = ICON_DEFS[s.selectedIcon] || ICON_DEFS.bag;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${clean(s.iconColor)}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${defs}</svg>`;
  }

  function buildTemplate(s, ctx) {
    const { count, total, thumbs, position, progress } = ctx;
    const pos = POSITION_CSS[position] || POSITION_CSS["bottom-right"];
    const btn = s.buttonSize;
    const bg = clean(s.bgColor);
    const fg = clean(s.iconColor);
    const showBadge = s.enableCount && count > 0;
    const countLabel = count > 99 ? "99+" : String(count);

    const glyph = `<span class="cart-plus__glyph cart-plus-sticky-cart-icon" style="display:flex;align-items:center;justify-content:center;">${glyphMarkup(s)}</span>`;

    const badge = (absolute) =>
      showBadge
        ? `<span class="cart-plus__badge cart-plus-sticky-cart-quantity-icon" style="${
            absolute ? "position:absolute;top:-4px;right:-4px;" : ""
          }min-width:20px;height:20px;padding:0 6px;border-radius:10px;box-sizing:border-box;background:${clean(s.qBgColor)};color:${clean(s.qTextColor)};font-size:12px;font-weight:600;font-family:sans-serif;display:flex;align-items:center;justify-content:center;pointer-events:none;"><span class="cart-plus-sticky-cart-quantity-icon-text" style="line-height:1;">${countLabel}</span></span>`
        : "";

    const round = `${BASE}${pos}width:${btn}px;height:${btn}px;border-radius:50%;background:${bg};box-shadow:${SHADOW};display:flex;align-items:center;justify-content:center;`;

    // ── Pill with label ──
    if (s.template === "pill") {
      return {
        css: `${BASE}${pos}height:${btn}px;padding:0 ${Math.round(btn * 0.4)}px;border-radius:${btn / 2}px;background:${bg};color:${fg};box-shadow:${SHADOW};display:flex;align-items:center;gap:10px;font-weight:600;font-size:${Math.max(13, Math.round(btn * 0.27))}px;white-space:nowrap;font-family:sans-serif;`,
        html: `${glyph}<span>Cart${showBadge ? ` • ${countLabel}` : ""}</span>`,
      };
    }

    // ── Progress ring ──
    if (s.template === "ring") {
      const size = btn + 12;
      const r = (size - 4) / 2;
      const circ = 2 * Math.PI * r;
      return {
        css: round,
        html: `<svg class="cart-plus__ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;top:-6px;left:-6px;transform:rotate(-90deg);pointer-events:none;" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${clean(s.qBgColor)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circ * progress} ${circ}" style="transition:stroke-dasharray .4s ease;"/></svg>${glyph}${badge(true)}`,
      };
    }

    // ── Edge tab ──
    if (s.template === "tab") {
      const isLeft = position === "left";
      return {
        css: `${BASE}${pos}width:${Math.round(btn * 0.8)}px;min-height:${Math.round(btn * 1.3)}px;padding:10px 0;box-sizing:border-box;background:${bg};border-radius:${isLeft ? "0 12px 12px 0" : "12px 0 0 12px"};box-shadow:${SHADOW};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;`,
        html: `${glyph}${badge(false)}`,
      };
    }

    // ── Bottom bar ──
    if (s.template === "bar") {
      const h = btn + 10;
      const thumb = h - 28;
      const arrow = Math.min(h - 20, 40);
      const chevron = Math.min(s.iconSize, arrow - 8);
      const fallbackColors = ["#d9d2c5", "#cbc3b3", "#bdb4a1"];
      const items = thumbs.length
        ? thumbs.slice(0, 3)
        : [null];
      const thumbsHtml = items
        .map((src, i) => {
          const fill = src
            ? `background:#eee url('${clean(src)}') center/cover no-repeat;`
            : `background:${fallbackColors[i]};`;
          return `<span style="width:${thumb}px;height:${thumb}px;border-radius:8px;${fill}margin-left:${
            i ? -Math.round(thumb * 0.45) : 0
          }px;border:2px solid ${bg};box-sizing:border-box;display:block;flex-shrink:0;"></span>`;
        })
        .join("");

      return {
        css: `${BASE}${pos}height:${h}px;padding:0 ${Math.round(h * 0.18)}px 0 ${Math.round(h * 0.22)}px;border-radius:${s.barRadius}px;background:${bg};color:${fg};box-shadow:${SHADOW};display:flex;align-items:center;gap:14px;font-family:sans-serif;`,
        html: `<span class="cart-plus__glyph cart-plus-sticky-cart-icon" style="display:flex;">${thumbsHtml}</span><span style="display:flex;flex-direction:column;line-height:1.2;flex:1;"><strong style="font-size:18px;">${total}</strong>${
          showBadge
            ? `<span style="font-size:12px;opacity:.85;">${count} ${count === 1 ? "Product" : "Products"}</span>`
            : ""
        }</span><span style="width:${arrow}px;height:${arrow}px;border-radius:50%;background:${fg};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="${chevron}" height="${chevron}" viewBox="0 0 24 24" fill="none" stroke="${bg}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span>`,
      };
    }

    // ── Bubble (default) ──
    return { css: round, html: `${glyph}${badge(true)}` };
  }

  /* ────────────────────────────────────────────────────────────────────── */
  /* Cart state + painting                                                   */
  /* ────────────────────────────────────────────────────────────────────── */

  let _bound = false;
  let _state = { count: 0, totalCents: 0, thumbs: [] };

  const isMobileNow = () => window.matchMedia("(max-width: 768px)").matches;

  function formatTotal(cents) {
    try {
      if (window.hubUtils?.formatMoney) return window.hubUtils.formatMoney(cents);
    } catch (_) {}
    const currency = window.Shopify?.currency?.active;
    try {
      return new Intl.NumberFormat(undefined, {
        style: currency ? "currency" : "decimal",
        currency: currency || undefined,
        minimumFractionDigits: 2,
      }).format(cents / 100);
    } catch (_) {
      return (cents / 100).toFixed(2);
    }
  }

  // 0..1 for the Progress ring. Uses the cart's progress bar if it exposes it.
  function getProgress() {
    try {
      if (typeof window.hubGetRewardProgress === "function") {
        const v = Number(window.hubGetRewardProgress());
        if (Number.isFinite(v)) return Math.max(0, Math.min(1, v));
      }
      const fill = document.querySelector(".cp-reward-progress-fill");
      if (fill) {
        const w = parseFloat(fill.style.width);
        if (Number.isFinite(w)) return Math.max(0, Math.min(1, w / 100));
      }
      const ring = document.querySelector(".hub-reward-progress-ring-fill");
      if (ring) {
        const [a, c] = String(ring.getAttribute("stroke-dasharray") || "")
          .split(" ")
          .map(parseFloat);
        if (c > 0) return Math.max(0, Math.min(1, a / c));
      }
    } catch (_) {}
    return 0;
  }

  function paint() {
    const wrapper = document.querySelector(".cart-plus-sticky-widget");
    const root = wrapper?.querySelector("#cart-plus");
    if (!wrapper || !root) return;

    const s = getSettings(window.__HUB_STICKY_CART__);
    const position = isMobileNow() ? s.mobilePosition : s.position;

    const out = buildTemplate(s, {
      count: _state.count,
      total: formatTotal(_state.totalCents),
      thumbs: _state.thumbs,
      position,
      progress: getProgress(),
    });
    root.style.cssText = out.css;
    root.innerHTML = out.html;

    // "Hide when cart is empty" hides the whole button, not just the badge
    const hide = s.hideOnEmptyCart && _state.count === 0;
    wrapper.style.display = hide ? "none" : "contents";
  }

  async function updateStickyBadge() {
    try {
      const res = await fetch("/cart.js");
      const cart = await res.json();

      const includeAddonsInCount =
        window.__HUB_ACTIVE_CART__?.addonsSettings?.includeInItemCount === true;

      const items = cart.items.filter(
        (i) =>
          !i.properties?._triggered_reward &&
          (includeAddonsInCount ||
            (!i.properties?._hub_addon && !i.properties?.__upcartAddon)),
      );

      _state = {
        count: items.reduce((sum, i) => sum + i.quantity, 0),
        totalCents: cart.total_price || 0,
        thumbs: items
          .map((i) => i.featured_image?.url || i.image)
          .filter(Boolean)
          .slice(0, 3),
      };
      paint();
    } catch (_) {}
  }

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render                                                                  */
  /* ────────────────────────────────────────────────────────────────────── */

  window.renderStickyCart = function () {
    const data = window.__HUB_STICKY_CART__;
    const blockId = window.HUB_CART_BLOCK_ID;
    const existing = document.querySelector(".cart-plus-sticky-widget");

    if (!data || !data.enabled) {
      if (existing) existing.remove();
      return;
    }

    applyStickyCustomCSS(blockId, data.customCss);

    const s = getSettings(data);

    if (!_bound) {
      _bound = true;
      document.addEventListener("cart:updated", () => {
        updateStickyBadge();
        setTimeout(updateStickyBadge, 300);
      });
      // crossing the mobile breakpoint: rebuild with the other position / visibility
      const mq = window.matchMedia("(max-width: 768px)");
      const onChange = () => {
        document.querySelector(".cart-plus-sticky-widget")?.remove();
        window.renderStickyCart();
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    // not shown on mobile
    if (isMobileNow() && !s.displayOnMobile) {
      if (existing) existing.remove();
      return;
    }

    if (existing) {
      // re-render call: just refresh state
      updateStickyBadge();
      paint();
      return;
    }

    // wrapper carries the scope class (so custom CSS can target #cart-plus
    // as a descendant); it has no box of its own
    const wrapper = document.createElement("div");
    wrapper.classList.add(
      "cart-plus-sticky-widget",
      `hub-sticky-scope-${blockId}`,
    );
    wrapper.style.display = s.hideOnEmptyCart ? "none" : "contents";

    const btn = document.createElement("div");
    btn.id = "cart-plus";
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", "Open cart");
    btn.tabIndex = 0;

    const openDrawer = () => {
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      const bg = document.getElementById(`hub-cart-bg-${blockId}`);
      if (drawer && bg) {
        drawer.classList.add(`hub-visible-${blockId}`);
        bg.classList.add(`hub-visible-${blockId}`);
        document.body.classList.add("no-scroll", "overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        document.body.style.overflow = "hidden";
        if (window.hubCartRender) {
          window.hubCartRender(drawer, { showSkeleton: true });
        }
      }
    };
    btn.addEventListener("click", openDrawer);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer();
      }
    });

    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);

    paint();
    updateStickyBadge();
  };
})();