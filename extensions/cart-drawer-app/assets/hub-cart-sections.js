// Cart sections that mirror the editor preview (Banner, Timer, Login, Age verification,
// Payment badges), plus the shared helpers: section order, section backgrounds,
// Template theme, checkout button options and the Cart Visibility schedule.

// ── helpers ────────────────────────────────────────────────────────────────

// same as the editor's backgroundToCss: { type: "plain" | "gradient", color, color2, angle }
window.cartPlusBgCss = function (bg) {
  if (!bg) return "";
  if (bg.type === "gradient") {
    return `linear-gradient(${Number(bg.angle) || 0}deg, ${bg.color || "#ffffff"}, ${bg.color2 || "#e2e2e2"})`;
  }
  return bg.color || "";
};

// "Background color" of a sidebar section (cartSettings.sectionBackgrounds)
window.cartPlusSectionBg = function (cartSettings, key, html) {
  if (!html) return "";
  const css = window.cartPlusBgCss(cartSettings?.sectionBackgrounds?.[key]);
  return css ? `<div style="background:${css};">${html}</div>` : html;
};

// saved order + rows missing from it (custom blocks keep their place)
window.cartPlusResolveOrder = function (saved, fallback) {
  const known = (saved || []).filter(
    (k) => fallback.includes(k) || String(k).startsWith("custom-"),
  );
  return [...known, ...fallback.filter((k) => !known.includes(k))];
};

window.cartPlusDefaultOrder = {
  Header: ["Banner Image", "Announcement", "Timer", "Progress Bar"],
  Body: ["One Tick Upsell", "Products in cart", "Cross-sell"],
  Footer: [
    "Order notes",
    "Shipping Protection & Add-ons",
    "Summary",
    "Discount code",
    "Age Verification",
    "Login",
    "Checkout Button",
    "Payment Badges",
  ],
};

// ── Template theme (same maths as the editor's applyTemplateTheme) ───────────
const CART_PLUS_TEMPLATE_DEFAULTS = {
  layout: "sidebar",
  colorMode: "gradient",
  themeColor: "#FF2D2D",
  gradientStart: "#1A56DB",
  gradientEnd: "#7DB3F8",
  gradientAngle: 135,
  appearance: "light",
  tintHeader: 5,
  tintBody: 10,
  tintFooter: 5,
  radiusButtons: 6,
  radiusCards: 12,
  radiusFields: 10,
  radiusImages: 5,
  radiusDrawer: 14,
};

window.cartPlusApplyTemplateTheme = function (ds) {
  if (!ds || !ds.colorMode) return ds;
  const t = { ...CART_PLUS_TEMPLATE_DEFAULTS, ...ds };
  const dark = t.appearance === "dark";
  const surface = dark ? "#1c1c1e" : "#ffffff";
  const text = dark ? "#f3f3f3" : "#121212";
  const gradient = t.colorMode === "gradient";
  const angle = Number(t.gradientAngle) || 0;
  const mix = (color, pct, base) => `color-mix(in srgb, ${color} ${pct}%, ${base})`;

  const accent = gradient
    ? `linear-gradient(${angle}deg, ${t.gradientStart}, ${t.gradientEnd})`
    : t.themeColor;
  const tinted = (pct) =>
    gradient
      ? `linear-gradient(${angle}deg, ${mix(t.gradientStart, pct, surface)}, ${mix(t.gradientEnd, pct, surface)})`
      : mix(t.themeColor, pct, surface);

  return {
    ...ds,
    themed: true,
    dark, // Appearance: Dark
    backgroundColor: surface,
    textColor: text,
    subtotalColor: text,
    accentColor: mix(gradient ? t.gradientStart : t.themeColor, t.tintFooter, surface),
    accentBorder: mix(gradient ? t.gradientStart : t.themeColor, 22, surface),
    accentSolid: gradient ? t.gradientStart : t.themeColor,
    accentText: mix(gradient ? t.gradientStart : t.themeColor, 85, text),
    buttonColor: accent,
    buttonTextColor: "#ffffff",
    buttonRadius: String(t.radiusButtons),
    headerBackground: tinted(t.tintHeader),
    bodyBackground: tinted(t.tintBody),
    footerBackground: tinted(t.tintFooter),
    cardRadius: Number(t.radiusCards),
    fieldRadius: Number(t.radiusFields),
    imageRadius: Number(t.radiusImages),
    drawerRadius: Number(t.radiusDrawer),
    floating: t.layout === "floating",
  };
};

// Appearance: Dark -> a colour still at its saved light default (or unset) becomes the dark theme's colour
window.cartPlusDarkColor = function (value, lightDefault, darkValue) {
  const ds = window.__HUB_ACTIVE_CART__?.designSettings;
  if (!ds?.dark) return value;
  return !value || String(value).toLowerCase() === lightDefault ? darkValue : value;
};

// ── Cart Visibility (schedule). Markets are not matched on the storefront. ───
// "YYYY-MM-DD" + "HH:MM" in an IANA timezone -> UTC ms
function cartPlusZonedToUtc(date, time, timeZone) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(asUtc));
    const get = (t) => Number(parts.find((p) => p.type === t)?.value);
    const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    return asUtc - (shown - asUtc);
  } catch (_) {
    return asUtc;
  }
}

window.cartPlusIsVisible = function (cartSettings) {
  const v = cartSettings?.visibility;
  if (!v || v.publishMode !== "schedule") return true;
  const now = Date.now();
  const start = cartPlusZonedToUtc(v.startDate, v.startTime, v.timezone);
  if (start !== null && now < start) return false;
  if (v.endEnabled) {
    const end = cartPlusZonedToUtc(v.endDate, v.endTime, v.timezone);
    if (end !== null && now >= end) return false;
  }
  return true;
};

// ── Banner Image ───────────────────────────────────────────────────────────
window.cartPlusBannerHTML = function (headerSettings) {
  const b = { enabled: false, image: "", width: 100, padding: 0, radius: 0, ...(headerSettings?.banner || {}) };
  if (!b.enabled || !b.image) return "";
  return `<div class="cart-plus-banner-image" style="padding:${b.padding}px;display:flex;justify-content:center;">
    <img src="${b.image}" alt="" style="display:block;width:${b.width}%;max-width:100%;height:auto;border-radius:${b.radius}px;">
  </div>`;
};

// ── Timer ──────────────────────────────────────────────────────────────────
const CART_PLUS_TIMER_DEFAULTS = {
  enabled: false,
  style: "text",
  message: "This offer expires in {{timer}}",
  icon: { type: "icon", name: "clock" },
  iconColor: "#000000",
  alignment: "center",
  minutes: 10,
  labels: { days: "days", hrs: "hrs", min: "min", sec: "sec" },
  background: null,
};

function cartPlusGetTimer(headerSettings) {
  const t = headerSettings?.timer || {};
  return {
    ...CART_PLUS_TIMER_DEFAULTS,
    ...t,
    labels: { ...CART_PLUS_TIMER_DEFAULTS.labels, ...(t.labels || {}) },
  };
}

window.cartPlusTimerContainerHTML = function (blockId, headerSettings) {
  return cartPlusGetTimer(headerSettings).enabled
    ? `<div id="cart-plus-timer-${blockId}" class="cart-plus-timer"></div>`
    : "";
};

function cartPlusTimerPaint(blockId, left, total) {
  const el = document.getElementById(`cart-plus-timer-${blockId}`);
  if (!el) return;
  const cart = window.__HUB_ACTIVE_CART__ || {};
  const timer = cartPlusGetTimer(cart.headerSettings);
  const design = cart.designSettings || {};
  const pad = (n) => String(n).padStart(2, "0");
  const s = Math.max(0, left);
  const parts = {
    days: Math.floor(s / 86400),
    hrs: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    sec: s % 60,
  };
  const clock = `${pad(parts.min + parts.hrs * 60 + parts.days * 1440)}:${pad(parts.sec)}`;
  const TOKEN = /\{\{timer\}\}|\{timer\}/gi;
  const messageHtml = String(timer.message).replace(TOKEN, `<strong>${clock}</strong>`);
  const messageNoTimer = String(timer.message).replace(TOKEN, "").trim();
  const justify =
    timer.alignment === "left" ? "flex-start" : timer.alignment === "right" ? "flex-end" : "center";
  const icon = (size) =>
    window.hubLibraryIconHTML?.(timer.icon, size, design.accentText || window.cartPlusDarkColor(timer.iconColor, "#000000", design.textColor)) || "";

  // only the background picked for the Timer; by default it has none
  el.style.cssText = `background:${
    timer.background ? window.cartPlusBgCss(timer.background) : "transparent"
  };color:${design.accentText || design.textColor || "inherit"};padding:10px 20px;text-align:${timer.alignment};font-size:14px;border-bottom:1px solid ${
    design.accentBorder ||
    (design.textColor
      ? `color-mix(in srgb, ${design.textColor} 14%, transparent)`
      : "rgba(0,0,0,.08)")
  };`;

  if (timer.style === "digits") {
    const cells = [
      ...(parts.days ? [["days", parts.days]] : []),
      ["hrs", parts.hrs],
      ["min", parts.min],
      ["sec", parts.sec],
    ];
    const digitColor = timer.digitsColor ? `color:${timer.digitsColor};` : "";
    const colon = `<div style="font-size:20px;font-weight:700;line-height:28px;${digitColor}">:</div>`;
    el.innerHTML = `<div style="display:flex;justify-content:${justify};align-items:flex-start;gap:6px;">${cells
      .map(
        ([k, v], i) =>
          `${i > 0 ? colon : ""}<div style="min-width:40px;"><div style="font-size:20px;font-weight:700;line-height:28px;${digitColor}${timer.boxColor ? `background:${timer.boxColor};border-radius:6px;padding:0 8px;` : ""}">${pad(v)}</div><div style="font-size:10px;margin-top:2px;${timer.labelsColor ? `color:${timer.labelsColor};` : "opacity:.7;"}">${timer.labels[k]}</div></div>`,
      )
      .join("")}</div><div style="font-size:11px;opacity:.8;margin-top:4px;">${messageNoTimer}</div>`;
  } else if (timer.style === "bar") {
    const pct = Math.max(0, Math.min(100, (left / total) * 100));
    el.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:14px;">
        <span><span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${icon(22)}</span>${messageNoTimer || "Offer expires soon"}</span><strong${timer.digitsColor ? ` style="color:${timer.digitsColor};"` : ""}>${clock}</strong></div>
      <div style="height:8px;border-radius:4px;background:${timer.barBackground || "rgba(0,0,0,.12)"};margin-top:6px;"><div style="width:${pct}%;height:100%;border-radius:4px;background:${timer.barColor || design.buttonColor || "#303030"};transition:width 1s linear;"></div></div>`;
  } else {
    el.innerHTML = `<span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${icon(22)}</span>${messageHtml}`;
  }
}

// counts down from `minutes`; the end time is kept for the browser session
window.cartPlusStartTimer = function (blockId) {
  clearInterval(window._cartPlusTimerId);
  const timer = cartPlusGetTimer(window.__HUB_ACTIVE_CART__?.headerSettings);
  if (!timer.enabled) return;
  const total = Math.max(1, Number(timer.minutes) || 1) * 60;
  const key = `cartPlusTimerEnd:${total}`;
  let end = 0;
  try {
    end = Number(sessionStorage.getItem(key)) || 0;
  } catch (_) {}
  if (end < Date.now()) {
    end = Date.now() + total * 1000;
    try {
      sessionStorage.setItem(key, String(end));
    } catch (_) {}
  }
  const tick = () =>
    cartPlusTimerPaint(blockId, Math.max(0, Math.round((end - Date.now()) / 1000)), total);
  tick();
  window._cartPlusTimerId = setInterval(tick, 1000);
};

// ── Login message ──────────────────────────────────────────────────────────
window.cartPlusLoginHTML = function (cartSettings, key = "login") {
  const s = {
    enabled: false,
    beforeLink: "Have an account?",
    linkText: "Log in",
    afterLink: "to check out faster.",
    alignment: "center",
    top: 8,
    bottom: 8,
    ...(cartSettings?.[key] || {}),
  };
  if (!s.enabled || window.Shopify?.customerId || window.__st?.cid) return "";
  return `<div class="cart-plus-login-message" style="text-align:${s.alignment};padding:${s.top}px 16px ${s.bottom}px;font-size:15px;">
    <span>${s.beforeLink}</span> <a href="/account/login" style="color:inherit;"><span>${s.linkText}</span></a> <span>${s.afterLink}</span>
  </div>`;
};

// ── Age verification ───────────────────────────────────────────────────────
function cartPlusGetAge(cartSettings) {
  return {
    enabled: false,
    applyTo: "all", // "all" | "products" | "collections"
    selected: null, // { type, items } from the editor's product / collection picker
    minimumAge: 21,
    checkboxText: "I confirm I am {{minimumAge}} years of age or older.",
    subtitle: "This cart contains items you must be {{minimumAge}} or older to purchase.",
    errorText: "Confirm your age to continue to checkout.",
    background: null,
    borderRadius: 8,
    errorBorderRadius: 8,
    borderColor: "#dbe4f5",
    toggleColor: "#1553d8",
    errorBackground: "#fff1f1",
    errorBorderColor: "#f7b8b8",
    ...(cartSettings?.ageVerification || {}),
  };
}
const cartPlusFillAge = (html, age) =>
  String(html ?? "").replace(/\{\{\s*minimumAge\s*\}\}/g, String(age));

window.cartPlusAgeHTML = function (blockId, cartSettings) {
  const s = cartPlusGetAge(cartSettings);
  if (!s.enabled) return "";
  const f = (v) => cartPlusFillAge(v, s.minimumAge);
  return `<div id="cart-plus-age-${blockId}" class="cart-plus-age-verification" style="padding:8px 16px;${s.applyTo !== "all" ? "display:none;" : ""}">
    <div class="cart-plus-age-box" style="padding:12px;border-radius:${s.borderRadius}px;border:1px solid ${s.borderColor};--cp-age-edge:${s.borderColor};background:${window.cartPlusBgCss(s.background)};">
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
        <input type="checkbox" id="cart-plus-age-check-${blockId}" class="cart-plus-age-check" onchange="cartPlusAgeChanged('${blockId}')" style="--cp-age-toggle:${s.toggleColor};--cp-age-border:${s.borderColor};">
        <span><span style="font-size:14px;">${f(s.checkboxText)}</span><span style="display:block;font-size:12px;opacity:.7;">${f(s.subtitle)}</span></span>
      </label>
      <div id="cart-plus-age-error-${blockId}" role="alert" style="display:none;margin-top:6px;font-size:12px;color:#c0281c;">${f(s.errorText)}</div>
    </div>
  </div>`;
};

function cartPlusAgeShowError(blockId, error) {
  const s = cartPlusGetAge(window.__HUB_ACTIVE_CART__?.cartSettings);
  const box = document.querySelector(`#cart-plus-age-${blockId} .cart-plus-age-box`);
  const err = document.getElementById(`cart-plus-age-error-${blockId}`);
  if (!box || !err) return;
  err.style.display = error ? "block" : "none";
  box.style.background = error ? s.errorBackground : window.cartPlusBgCss(s.background);
  box.style.borderColor = error ? s.errorBorderColor : s.borderColor;
  box.style.setProperty("--cp-age-edge", error ? s.errorBorderColor : s.borderColor);
  box.style.borderRadius = `${error ? s.errorBorderRadius : s.borderRadius}px`;
}
window.cartPlusAgeChanged = function (blockId) {
  if (document.getElementById(`cart-plus-age-check-${blockId}`)?.checked) {
    cartPlusAgeShowError(blockId, false);
  }
};

// true = go on to checkout; false = blocked until the age box is ticked
window.cartPlusAgeAllowsCheckout = function (blockId) {
  const s = cartPlusGetAge(window.__HUB_ACTIVE_CART__?.cartSettings);
  if (!s.enabled || window._cartPlusAgeApplies === false) return true;
  const box = document.getElementById(`cart-plus-age-check-${blockId}`);
  if (!box || box.checked) return true;
  cartPlusAgeShowError(blockId, true);
  return false;
};

// ── Payment badges / trust badges ──────────────────────────────────────────
function cartPlusBadgeHTML(badge, height) {
  const box = `height:${height}px;min-width:${Math.round(height * 1.45)}px;border-radius:4px;border:1px solid #e3e3e3;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;`;
  if (badge.image) {
    return `<span style="${box}background:#fff;"><img src="${badge.image}" alt="${badge.name || badge.label || ""}" style="height:100%;width:auto;"></span>`;
  }
  if (badge.mastercard) {
    const r = height * 0.28;
    return `<span title="${badge.name}" style="${box}background:${badge.bg};"><svg width="${r * 3}" height="${r * 2}" viewBox="0 0 30 20"><circle cx="10" cy="10" r="10" fill="#eb001b"/><circle cx="20" cy="10" r="10" fill="#f79e1b" fill-opacity="0.9"/></svg></span>`;
  }
  return `<span title="${badge.name}" style="${box}padding:0 6px;background:${badge.bg};color:${badge.fg};font-family:Arial,sans-serif;font-weight:700;font-style:${badge.italic ? "italic" : "normal"};font-size:${Math.max(7, Math.round(height * 0.32))}px;white-space:nowrap;">${badge.label}</span>`;
}

window.cartPlusPaymentBadgesHTML = function (cartSettings) {
  const s = { ...(window.cartPlusPaymentDefaults || {}), ...(cartSettings?.paymentBadges || {}) };
  if (!s.enabled) return "";
  const library = window.cartPlusBadgeLibrary || [];
  const showPayment = s.show !== "trust";
  const showTrust = s.show !== "payment";
  const badges = showPayment
    ? (s.badges || [])
        .map((id) => library.find((b) => b.id === id) || (s.custom || []).find((b) => b.id === id))
        .filter(Boolean)
    : [];
  const trust = showTrust ? (s.trustBadges || []).filter((t) => t.text?.trim()) : [];
  if (!badges.length && !trust.length) return "";
  const justify =
    s.alignment === "left" ? "flex-start" : s.alignment === "right" ? "flex-end" : "center";
  const icons = window.cartPlusTrustIcons || {};
  return `<div class="cart-plus-payment-badges" style="display:flex;flex-direction:column;gap:8px;padding:8px 16px;background:${window.cartPlusBgCss(s.background)};">
    ${
      badges.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:${justify};">${badges.map((b) => cartPlusBadgeHTML(b, s.size || 28)).join("")}</div>`
        : ""
    }
    ${
      trust.length
        ? `<div class="cart-plus-trust-badges" style="display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:${justify};font-size:13px;">${trust
            .map(
              (t) =>
                `<span style="display:inline-flex;align-items:center;gap:6px;"><svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style="flex-shrink:0;">${icons[t.icon] || icons.lock || ""}</svg>${t.text}</span>`,
            )
            .join("")}</div>`
        : ""
    }
  </div>`;
};

// ── Checkout button options (cartSettings.checkoutButton) ──────────────────
window.cartPlusGetCheckoutButton = function (cartSettings) {
  return {
    label: null,
    radius: null,
    background: null,
    borderColor: null,
    sectionBackground: null,
    ...(cartSettings?.checkoutButton || {}),
  };
};
// {{Price}} / {{total_price}} -> formatted total
window.cartPlusFillPrice = (html, price) =>
  String(html ?? "").replace(/\{\{\s*(?:Price|total_price)\s*\}\}/gi, price);

// colour / gradient picked in the Template tab (editor's templateBackground); undefined when untouched
window.cartPlusTemplateBackground = function (ds) {
  if (!ds || !ds.colorMode) return undefined;
  const t = { ...CART_PLUS_TEMPLATE_DEFAULTS, ...ds };
  return t.colorMode === "gradient"
    ? { type: "gradient", color: t.gradientStart, color2: t.gradientEnd, angle: Number(t.gradientAngle) || 0 }
    : { type: "plain", color: t.themeColor };
};

// ── Age verification: only for the products / collections picked in the editor ──
const cartPlusNum = (gid) => String(gid || "").split("/").pop();

async function cartPlusCollectionProductIds(collectionGids) {
  const cache = (window._cartPlusAgeCollections ||= {});
  const key = collectionGids.join(",");
  if (cache[key]) return cache[key];
  cache[key] = (async () => {
    const wanted = collectionGids.map(cartPlusNum);
    const list = await fetch("/collections.json?limit=250")
      .then((r) => r.json())
      .then((d) => d.collections || [])
      .catch(() => []);
    const matched = list.filter((c) => wanted.includes(String(c.id)));
    const lists = await Promise.all(
      matched.map((c) =>
        fetch(`/collections/${c.handle}/products.json?limit=250`)
          .then((r) => r.json())
          .then((d) => d.products || [])
          .catch(() => []),
      ),
    );
    return new Set(lists.flat().map((p) => String(p.id)));
  })();
  return cache[key];
}

async function cartPlusAgeApplies(s, cart) {
  if (s.applyTo === "all") return true;
  const items = cart?.items || [];
  const sel = s.selected;
  if (!sel || sel.type !== s.applyTo) return false; // nothing picked for this type

  if (s.applyTo === "products") {
    const productIds = new Set((sel.items?.products || []).map(cartPlusNum));
    const variantIds = new Set((sel.items?.variants || []).map(cartPlusNum));
    return items.some(
      (i) => productIds.has(String(i.product_id)) || variantIds.has(String(i.variant_id)),
    );
  }
  if (s.applyTo === "collections") {
    const gids = Array.isArray(sel.items) ? sel.items : [];
    if (!gids.length) return false;
    const ids = await cartPlusCollectionProductIds(gids);
    return items.some((i) => ids.has(String(i.product_id)));
  }
  return true;
}

// shows / hides the age box for the current cart (called after every cart render)
window.cartPlusAgeUpdate = async function (blockId, cart) {
  const el = document.getElementById(`cart-plus-age-${blockId}`);
  if (!el) return;
  const s = cartPlusGetAge(window.__HUB_ACTIVE_CART__?.cartSettings);
  const applies = await cartPlusAgeApplies(s, cart);
  window._cartPlusAgeApplies = applies;
  el.style.display = applies ? "" : "none";
};
