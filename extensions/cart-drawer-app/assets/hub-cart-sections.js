// Cart sections that mirror the editor preview (Banner, Timer, Login, Age verification,
// Payment badges), plus the shared helpers: section order, section backgrounds,
// Template theme, checkout button options and the Cart Visibility schedule.

// ── helpers ────────────────────────────────────────────────────────────────


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

window.cartPlusSetEmptyHeaderVisibility = function (drawer, isEmpty) {
  if (!drawer) return;
  drawer.classList.toggle("hub-cart-is-empty", isEmpty);
  drawer
    .querySelectorAll(".hub-cart-header-hide-when-empty")
    .forEach((section) => {
      section.hidden = isEmpty;
    });
};

function cartPlusTimerIconHTML(value, size, color) {
  const defaultIcon = { type: "icon", name: "clock" };
  return (
    window.hubLibraryIconHTML?.(value || defaultIcon, size, color) ||
    window.hubLibraryIconHTML?.(defaultIcon, size, color) ||
    `<svg viewBox="0 0 20 20" width="${size}" height="${size}" fill="${color || "currentColor"}" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 5.5V10l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
}

// ── Timer templates: boxes / clock / inline / rings / text / progress / bar ──
// Mirrors the editor's cart-Items/Timer.jsx. Returns { css, html } for the #cart-plus-timer-* element.
function cartPlusTimerRing(size, value, max, color, track, inner) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, value / max));
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;"><svg width="${size}" height="${size}" style="transform:rotate(-90deg);"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${dash} ${c}" style="transition:stroke-dasharray 1s linear;"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;">${inner}</div></div>`;
}

window.cartPlusTimerTemplate = function (timer, design, left, total) {
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
  const color = timer.textColor || design.accentText || design.textColor || "inherit";
  const title = String(timer.message || "").replace(TOKEN, "").trim();
  const eyebrow = timer.eyebrow || "";
  const subText = String(timer.subText || "").replace(/\{\{minutes\}\}/gi, String(Math.ceil(s / 60)));
  const digitsColor = timer.digitsColor || color;
  const track = timer.barBackground || "rgba(0,0,0,0.12)";
  const fill = timer.barColor || design.buttonColor || "#303030";
  const bg = !timer.background
    ? "transparent"
    : typeof timer.background === "string"
      ? timer.background
      : window.cartPlusBgCss(timer.background);
  const justify =
    timer.alignment === "right" ? "flex-end" : timer.alignment === "center" ? "center" : "flex-start";
  const icon = (size) =>
    cartPlusTimerIconHTML(timer.icon, size, timer.iconColor || (color === "inherit" ? undefined : color));

  const wrapper = `background:${bg};color:${color};padding:14px 16px;margin:12px;border-radius:14px;font-size:14px;text-align:${timer.alignment};display:flex;align-items:center;justify-content:${justify};gap:12px;`;

  const iconBubble = `<span style="width:44px;height:44px;border-radius:50%;background:${timer.iconBg || "rgba(0,0,0,0.06)"};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${icon(22)}</span>`;
  const heading = `<div style="flex:1;min-width:0;text-align:left;">${
    eyebrow
      ? `<div style="font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;opacity:.85;margin-bottom:2px;">${eyebrow}</div>`
      : ""
  }<div style="font-size:17px;font-weight:700;">${title}</div></div>`;

  // boxes: icon + heading + digit boxes
  if (timer.style === "boxes") {
    const cells = [
      ...(parts.days ? [["days", parts.days]] : []),
      ["hrs", parts.hrs],
      ["min", parts.min],
      ["sec", parts.sec],
    ];
    const boxes = cells
      .map(
        ([k, v], i) =>
          `${i > 0 ? `<span style="font-weight:700;line-height:34px;color:${digitsColor};opacity:.6;">:</span>` : ""}<div style="text-align:center;min-width:34px;"><div style="font-size:16px;font-weight:700;line-height:34px;color:${digitsColor};background:${timer.boxColor || "rgba(0,0,0,0.08)"};border-radius:8px;padding:0 6px;">${pad(v)}</div><div style="font-size:9px;margin-top:3px;text-transform:uppercase;color:${timer.labelsColor || color};opacity:.8;">${timer.labels?.[k] ?? ""}</div></div>`,
      )
      .join("");
    return { css: wrapper, html: `${iconBubble}${heading}<div style="display:flex;align-items:flex-start;gap:4px;">${boxes}</div>` };
  }

  // clock: ring with mm:ss + title + sub text
  if (timer.style === "clock") {
    const ring = cartPlusTimerRing(50, s, total, fill, track, `<span style="font-size:11px;font-weight:600;color:${digitsColor};">${clock}</span>`);
    return {
      css: wrapper,
      html: `${ring}<div style="flex:1;font-size:17px;font-weight:700;text-align:left;">${title}</div>${subText ? `<div style="font-size:12px;opacity:.7;text-align:right;">${subText}</div>` : ""}`,
    };
  }

  // inline: icon + title, bold time + sub text below
  if (timer.style === "inline") {
    const h = parts.hrs + parts.days * 24;
    return {
      css: wrapper,
      html: `${iconBubble}<div style="flex:1;text-align:left;"><div>${title}</div><div style="margin-top:2px;"><strong style="font-size:16px;color:${digitsColor};">${h}h ${parts.min}m ${parts.sec}s</strong>${subText ? `<span style="margin-left:6px;">${subText}</span>` : ""}</div></div>`,
    };
  }

  // rings: icon + heading + circular hrs / min / sec
  if (timer.style === "rings") {
    const rings = [
      ["hrs", parts.hrs + parts.days * 24, 24],
      ["min", parts.min, 60],
      ["sec", parts.sec, 60],
    ]
      .map(([k, v, max]) =>
        cartPlusTimerRing(
          46,
          v,
          max,
          fill,
          track,
          `<span style="font-size:13px;font-weight:700;color:${digitsColor};">${pad(v)}</span><span style="font-size:7px;text-transform:uppercase;color:${timer.labelsColor || color};opacity:.8;">${timer.labels?.[k] ?? ""}</span>`,
        ),
      )
      .join("");
    return { css: wrapper, html: `${iconBubble}${heading}<div style="display:flex;gap:6px;">${rings}</div>` };
  }

  // text: small pill with the message and live countdown
  if (timer.style === "text") {
    const msg = String(timer.message || "").replace(TOKEN, `<strong>${clock}</strong>`);
    return {
      css: `${wrapper}background:transparent;padding:10px 16px;margin:12px 12px 0;`,
      html: `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};padding:6px 14px;border-radius:999px;font-size:13px;">${icon(16)}<span>${msg}</span></span>`,
    };
  }

  // progress: message left, clock right, thin bar below
  if (timer.style === "progress") {
    const pct = Math.max(0, Math.min(100, (s / total) * 100));
    return {
      css: `${wrapper}display:block;`,
      html: `<div style="display:flex;justify-content:space-between;align-items:center;font-size:14px;"><span style="display:inline-flex;align-items:center;gap:6px;">${icon(18)}<span>${title || "Offer expires soon"}</span></span><strong style="color:${digitsColor};">${clock}</strong></div><div style="height:4px;border-radius:4px;background:${track};margin-top:8px;"><div style="width:${pct}%;height:100%;border-radius:4px;background:${fill};transition:width 1s linear;"></div></div>`,
    };
  }

  // bar (also the fallback): icon + title + progress bar + clock
  const pct = Math.max(0, Math.min(100, (s / total) * 100));
  return {
    css: wrapper,
    html: `${iconBubble}<span style="font-weight:700;font-size:15px;">${title}</span><div style="flex:1;height:8px;border-radius:4px;background:${track};"><div style="width:${pct}%;height:100%;border-radius:4px;background:${fill};transition:width 1s linear;"></div></div><strong style="color:${digitsColor};">${clock}</strong>`,
  };
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
    cartPlusTimerIconHTML(timer.icon, size, design.accentText || window.cartPlusDarkColor(timer.iconColor, "#000000", design.textColor));

  const tpl = window.cartPlusTimerTemplate(timer, design, left, total);
  el.style.cssText = tpl.css;
  el.innerHTML = tpl.html;
  return;

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

// template name -> layout (same as the editor's AGE_TEMPLATES)
const CART_PLUS_AGE_LAYOUTS = {
  inline_yes_no: "inline",
  toggle: "toggle",
  confirm_continue: "confirm",
  small_badge: "badge-row",
  big_badge: "badge-stack",
  title_blue: "title",
};

const cartPlusAgeBadge = (size, color, label, ring) =>
  `<span style="width:${size}px;height:${size}px;border-radius:50%;border:${ring}px solid ${color};color:${color};display:inline-flex;align-items:center;justify-content:center;font-size:${size * 0.38}px;font-weight:700;flex-shrink:0;box-sizing:border-box;">${label}</span>`;

window.cartPlusAgeHTML = function (blockId, cartSettings) {
  const s = cartPlusGetAge(cartSettings);
  if (!s.enabled) return "";
  const f = (v) => cartPlusFillAge(v, s.minimumAge);
  const hidden = s.applyTo !== "all" ? "display:none;" : "";
  const errorHtml = `<div id="cart-plus-age-error-${blockId}" role="alert" style="display:none;margin-top:6px;font-size:12px;color:#c0281c;">${f(s.errorText)}</div>`;
  const layout = CART_PLUS_AGE_LAYOUTS[s.template];

  // Classic: the original checkbox box
  if (!layout) {
    return `<div id="cart-plus-age-${blockId}" class="cart-plus-age-verification" style="padding:8px 16px;${hidden}">
    <div class="cart-plus-age-box" style="padding:12px;border-radius:${s.borderRadius}px;border:1px solid ${s.borderColor};--cp-age-edge:${s.borderColor};background:${window.cartPlusBgCss(s.background)};">
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
        <input type="checkbox" id="cart-plus-age-check-${blockId}" class="cart-plus-age-check" onchange="cartPlusAgeChanged('${blockId}')" style="--cp-age-toggle:${s.toggleColor};--cp-age-border:${s.borderColor};">
        <span><span style="font-size:14px;">${f(s.checkboxText)}</span><span style="display:block;font-size:12px;opacity:.7;">${f(s.subtitle)}</span></span>
      </label>
      ${errorHtml}
    </div>
  </div>`;
  }

  // Templates: the checkbox stays in the page (hidden) so the checkout check keeps working
  const accent = s.accent ?? "#111827";
  const accentText = s.accentText ?? "#ffffff";
  const secBg = s.secondaryBg ?? "#f1f3f5";
  const secText = s.secondaryText ?? "#1a1a1a";
  const badgeColor = s.badgeColor ?? "#e5383b";
  const badgeLabel = `${s.minimumAge}+`;
  const set = (on) => `cartPlusAgeSet('${blockId}',${on})`;
  const btnBase =
    "border:none;cursor:pointer;font-size:12px;font-weight:600;padding:8px 14px;border-radius:6px;white-space:nowrap;";

  const question = (size = 14, center = false, weight = 500) =>
    `<div style="font-size:${size}px;font-weight:${weight};text-align:${center ? "center" : "left"};">${f(s.checkboxText)}</div>`;
  const sub = (center = false) =>
    s.subtitle
      ? `<div style="font-size:12px;opacity:.7;margin-top:2px;text-align:${center ? "center" : "left"};">${f(s.subtitle)}</div>`
      : "";
  const yesBtn = (extra = "") =>
    `<button type="button" class="cp-age-yes" onclick="${set(true)}" style="${btnBase}background:${accent};color:${accentText};${extra}">${f(s.yesText)}</button>`;
  const noBtn = (extra = "") =>
    `<button type="button" class="cp-age-no" onclick="${set(false)}" style="${btnBase}background:${secBg};color:${secText};${extra}">${f(s.noText)}</button>`;
  const noLink = () =>
    `<button type="button" class="cp-age-no" onclick="${set(false)}" style="border:none;background:transparent;cursor:pointer;font-size:11px;text-decoration:underline;color:${secText};padding:0;">${f(s.noText)}</button>`;
  const column = (inner, gap = 10) =>
    `<div style="display:flex;flex-direction:column;align-items:center;gap:${gap}px;">${inner}</div>`;

  let content = "";
  let input = `<input type="checkbox" id="cart-plus-age-check-${blockId}" style="display:none;">`;

  if (layout === "inline") {
    content = `<div style="display:flex;align-items:center;gap:12px;">
      ${cartPlusAgeBadge(32, badgeColor, badgeLabel, 1.5)}
      <div style="flex:1;">${question()}${sub()}</div>
      <div style="display:flex;gap:6px;">${yesBtn("padding:7px 14px;")}${noBtn("padding:7px 14px;")}</div>
    </div>`;
  } else if (layout === "toggle") {
    content = `<div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:15px;font-weight:800;color:${badgeColor};">${badgeLabel}</span>
      <div style="flex:1;">${question(13)}${sub()}</div>
      <button type="button" role="switch" aria-checked="false" class="cp-age-switch" onclick="cartPlusAgeSet('${blockId}',this.getAttribute('aria-checked')!=='true')" style="width:42px;height:24px;border-radius:999px;border:none;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:flex-start;background:#d1d5db;transition:background .15s;flex-shrink:0;"><span style="width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);"></span></button>
    </div>`;
  } else if (layout === "confirm") {
    // a visible checkbox + a Continue button that unlocks once it is ticked
    const box = `<input type="checkbox" id="cart-plus-age-check-${blockId}" class="cart-plus-age-check" onchange="cartPlusAgeSet('${blockId}',this.checked)" style="--cp-age-toggle:${accent};--cp-age-border:${s.borderColor};">`;
    content = `<div style="display:flex;align-items:center;gap:10px;">
      <label style="display:flex;gap:8px;align-items:center;cursor:pointer;flex:1;">
        ${box}
        <span style="font-size:12px;">${f(s.checkboxText)}${s.subtitle ? `<span style="display:block;font-size:11px;opacity:.7;">${f(s.subtitle)}</span>` : ""}</span>
      </label>
      <button type="button" class="cp-age-continue" disabled style="${btnBase}padding:8px 22px;background:${accent};color:${accentText};opacity:.35;cursor:not-allowed;">${f(s.continueText)}</button>
    </div>`;
    input = "";
  } else if (layout === "badge-row") {
    content = column(
      `${cartPlusAgeBadge(30, badgeColor, badgeLabel, 1.5)}${question(13, true)}${sub(true)}
       <div style="display:flex;gap:8px;width:100%;">${yesBtn("flex:1;")}${noBtn("flex:1;")}</div>`,
    );
  } else if (layout === "badge-stack") {
    content = column(
      `${cartPlusAgeBadge(74, badgeColor, badgeLabel, 3)}${question(13, true)}
       <div style="display:flex;flex-direction:column;gap:8px;width:100%;">${yesBtn("width:100%;")}${noBtn("width:100%;")}</div>`,
      12,
    );
  } else if (layout === "title") {
    content = column(`${question(18, true, 700)}${sub(true)}${yesBtn("width:100%;")}${noLink()}`, 8);
  }

  return `<div id="cart-plus-age-${blockId}" class="cart-plus-age-verification" style="padding:12px 16px;${hidden}">
    <div class="cart-plus-age-box" style="padding:14px;border-radius:${s.borderRadius}px;border:1px solid ${s.borderColor};--cp-age-edge:${s.borderColor};background:${window.cartPlusBgCss(s.background)};">
      ${content}${input}
      ${errorHtml}
    </div>
  </div>`;
};

// Yes / No / switch / confirm checkbox: keep the hidden checkbox and the template's look in step
window.cartPlusAgeSet = function (blockId, on) {
  const input = document.getElementById(`cart-plus-age-check-${blockId}`);
  if (input) input.checked = on;
  const root = document.getElementById(`cart-plus-age-${blockId}`);
  if (!root) return;
  const accent = cartPlusGetAge(window.__HUB_ACTIVE_CART__?.cartSettings).accent ?? "#111827";
  root.querySelectorAll(".cp-age-yes").forEach((b) => {
    b.style.boxShadow = on ? `0 0 0 2px #fff, 0 0 0 4px ${accent}` : "none";
  });
  root.querySelectorAll(".cp-age-switch").forEach((b) => {
    b.setAttribute("aria-checked", String(on));
    b.style.background = on ? accent : "#d1d5db";
    b.style.justifyContent = on ? "flex-end" : "flex-start";
  });
  root.querySelectorAll(".cp-age-continue").forEach((b) => {
    b.disabled = !on;
    b.style.opacity = on ? "1" : ".35";
    b.style.cursor = on ? "pointer" : "not-allowed";
  });
  window.cartPlusAgeChanged(blockId);
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

// ── Announcement templates (same as the editor's ANNOUNCEMENT_TEMPLATES) ───
const CART_PLUS_ANN_TEMPLATES = {
  free_shipping: { text: "<b>Free shipping</b> on orders over $50", background: "#111111", color: "#ffffff", iconColor: "#ffffff" },
  coupon: { text: "<b>10% OFF</b> your first order", background: "#fde8ec", color: "#7a1030", iconColor: "#7a1030", code: "WELCOME", accentBg: "#8a1538", accentText: "#ffffff" },
  progress: { text: "You're only <b>{remaining}</b> away from free shipping!", background: "#e6f6ec", color: "#14351f", iconColor: "#1a9a4a", current: 38, goal: 50, accentBg: "#1a9a4a" },
  vip: { text: "<b>VIP members</b> get exclusive perks", background: "#fff6e5", color: "#3b2a00", iconColor: "#e5a100", linkText: "Learn more" },
  countdown: { text: "Limited time only — <b>up to 30% OFF</b> sitewide", background: "#efe8ff", color: "#4b2a9a", iconColor: "#6b3fd4", seconds: 2 * 3600 + 14 * 60 + 36, accentBg: "#ddd0ff", accentText: "#4b2a9a" },
  flash_sale: { text: "<b>Flash Sale!</b> &nbsp;|&nbsp; Extra <b>15% OFF</b> ends today", background: "#ff4d5e", color: "#ffffff", iconColor: "#ffffff", buttonText: "Shop now →", accentBg: "#ffffff", accentText: "#ff4d5e" },
  free_gift: { text: "<b>Free gift</b> on orders over $60", background: "#ffc93c", color: "#2b2100", iconColor: "#2b2100", buttonText: "View gift →", accentBg: "#ffffff", accentText: "#2b2100" },
};

const CART_PLUS_ANN_GIFT = '<rect x="3" y="8" width="18" height="13"/><path d="M12 8v13M3 12h18M12 8c-3-5-7-2-4 0M12 8c3-5 7-2 4 0"/>';
const CART_PLUS_ANN_ICONS = {
  free_shipping: '<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  coupon: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1"/>',
  progress: CART_PLUS_ANN_GIFT,
  vip: '<path d="M3 18l-1-10 5 4 5-8 5 8 5-4-1 10z"/>',
  countdown: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  flash_sale: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  free_gift: CART_PLUS_ANN_GIFT,
};

// { css, html } for the announcement bar, or null when no template is picked
window.cartPlusAnnouncementTemplate = function (ann, cart) {
  const t = CART_PLUS_ANN_TEMPLATES[ann?.template];
  if (!t) return null;
  const color = ann.textColor || t.color;
  const iconColor = ann.iconColor || t.iconColor;
  const accentBg = ann.accentBg || t.accentBg;
  const accentText = ann.accentText || t.accentText;
  const current = Number(
    ann.template === "progress"
      ? (cart?.total_price || 0) / 100
      : (ann.current ?? t.current),
  ) || 0;
  const goal = Number(ann.goal ?? t.goal) || t.goal || 1;
  const remaining = Math.max(0, goal - current);
  const formatAmount = (amount) =>
    window.hubUtils?.formatMoney
      ? window.hubUtils.formatMoney(amount * 100)
      : Number(amount).toLocaleString();
  const text = (ann.text || t.text).replace(
    /\{remaining\}/g,
    formatAmount(remaining),
  );
  const padding = { slim: "4px 20px", normal: "10px 20px", thick: "18px 20px" }[ann.height] || "10px 20px";
  const themedBackground =
    ann.template === "default"
      ? window.cartPlusTemplateBackground?.(
          window.__HUB_ACTIVE_CART__?.designSettings,
        )
      : undefined;
  const bg = themedBackground
    ? window.cartPlusBgCss(themedBackground)
    : ann.background
      ? window.cartPlusBgCss(ann.background)
      : t.background;
  const pill = `background:#fff;color:#111;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:700;white-space:nowrap;line-height:1.3;box-sizing:border-box;`;

  const icon = ann.icon
    ? window.hubLibraryIconHTML?.(ann.icon, 22, iconColor) || ""
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CART_PLUS_ANN_ICONS[ann.template]}</svg>`;

  let right = "";
  if (ann.template === "coupon") {
    right = `<span style="${pill}background:${accentBg};color:${accentText};">Use code: ${ann.couponCode || t.code}</span>`;
  } else if (ann.template === "progress") {
    const pct = Math.min(100, (current / goal) * 100);
    right = `<span style="display:inline-flex;align-items:center;gap:8px;"><span style="display:block;width:90px;height:6px;border-radius:6px;background:${accentBg}33;overflow:hidden;"><span class="cp-ann-progress-fill" style="display:block;width:${pct}%;height:100%;background:${accentBg};transition:width 450ms ease;"></span></span><small>${formatAmount(current)} / ${formatAmount(goal)}</small></span>`;
  } else if (ann.template === "vip") {
    right = `<a href="${ann.link || "#"}" style="color:${color};font-weight:700;text-decoration:underline;">${ann.linkText || t.linkText}</a>`;
  } else if (ann.template === "countdown") {
    const total = Number(ann.seconds ?? t.seconds) || 0;
    const cell = (k) => `<span data-cp-ann-${k} style="background:${accentBg};color:${accentText};border-radius:6px;padding:2px 8px;">00</span>`;
    right = `<span class="cp-ann-countdown" data-total="${total}" style="display:inline-flex;gap:4px;align-items:center;font-weight:700;">${cell("h")}:${cell("m")}:${cell("s")}</span>`;
  } else if (ann.template === "flash_sale" || ann.template === "free_gift") {
    right = `<a href="${ann.link || "#"}" style="${pill}background:${accentBg};color:${accentText};text-decoration:none;">${ann.buttonText || t.buttonText}</a>`;
  }

  const closable = ann.showClose !== false && ann.template !== "progress" && ann.template !== "vip";
  const close = closable
    ? `<button type="button" aria-label="Close" onclick="this.closest('.cart-plus-announcement').style.display='none'" style="background:none;border:0;color:${color};cursor:pointer;font-size:18px;line-height:1;padding:0;">×</button>`
    : "";

  return {
    css: `display:flex;align-items:center;gap:12px;padding:${padding};border-radius:${ann.borderRadius ?? 12}px;color:${color};background:${bg};font-size:${ann.fontSize || 15}px;line-height:1.3;box-sizing:border-box;text-align:left;`,
    html: `<span style="display:inline-flex;flex-shrink:0;">${icon}</span><span style="flex:1;min-width:0;">${text}</span><span style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0;">${right}${close}</span>`,
  };
};

// ticks the Countdown template (loops back to the start, like the editor preview)
window.cartPlusAnnouncementBind = function (root) {
  const cd = root?.querySelector(".cp-ann-countdown");
  clearInterval(window._cartPlusAnnTimer);
  if (!cd) return;
  const total = Number(cd.dataset.total) || 0;
  let left = total;
  const pad = (n) => String(n).padStart(2, "0");
  const paint = () => {
    cd.querySelector("[data-cp-ann-h]").textContent = pad(Math.floor(left / 3600));
    cd.querySelector("[data-cp-ann-m]").textContent = pad(Math.floor((left % 3600) / 60));
    cd.querySelector("[data-cp-ann-s]").textContent = pad(left % 60);
  };
  paint();
  window._cartPlusAnnTimer = setInterval(() => {
    if (!document.body.contains(cd)) return clearInterval(window._cartPlusAnnTimer);
    left = left > 0 ? left - 1 : total;
    paint();
  }, 1000);
};

// ── Progress bar themes: card / gift / ring / unlock / striped / almost ─────
// Mirrors the editor's utils/rewardThemes.js + the themed branch of cart-Items/TieredRewards.jsx.
const CART_PLUS_REWARD_THEMES = {
  card: { bg: "#ffffff", accent: "#1a1a1a", track: "#e5e5e5" },
  gift: { bg: "#e6f6ec", accent: "#1a9a4a", track: "#c4e8d1" },
  ring: { bg: "#efeaff", accent: "#4b2fc0", track: "#d8cfff" },
  unlock: { bg: "#fff8ea", accent: "#f59e0b", track: "#f6e3b8" },
  striped: { bg: "#eef4ff", accent: "#2563eb", track: "#d6e2fb" },
  almost: { bg: "#fff0f2", accent: "#e11d48", track: "#f9cdd5" },
};
const CART_PLUS_REWARD_COMMON = {
  textColor: "#1a1a1a",
  iconBg: "#ffffff",
  iconColor: "",
  radius: 14,
  padding: 14,
  fontSize: 14,
  barHeight: 6,
  showIcon: true,
  showLabels: true,
  dotSize: 18,
  iconSize: 20,
};
const cartPlusRewardIc = (name) => ({ type: "icon", name });
const CART_PLUS_REWARD_EXTRA = {
  card: { icon: cartPlusRewardIc("delivery") },
  gift: { icon: cartPlusRewardIc("gift") },
  ring: { ringSize: 44, subText: "Only {remaining} more to go", showNext: true, nextBg: "#ffffff" },
  unlock: { titleWidth: 34 },
  striped: { icon: cartPlusRewardIc("product"), showNext: true, nextBg: "#ffffff" },
  almost: {
    icon: cartPlusRewardIc("star"),
    buttonText: "Shop more →",
    buttonBg: "",
    buttonColor: "#ffffff",
    showButton: true,
    showCounter: true,
  },
};

// html for one of the six themes, or "" when barStyle is not one of them
// ctx: { sorted, cartTotal, maxAmount, getTierValue, fmt }
window.cartPlusRewardThemed = function (barStyle, rewards, ctx) {
  if (!CART_PLUS_REWARD_THEMES[barStyle]) return "";
  const { sorted, cartTotal, maxAmount, getTierValue, fmt } = ctx;
  const overrides = Object.fromEntries(
    Object.entries(rewards.styleConfig?.[barStyle] || {}).filter(([, v]) => v !== undefined && v !== null),
  );
  const t = {
    ...CART_PLUS_REWARD_COMMON,
    ...CART_PLUS_REWARD_THEMES[barStyle],
    ...CART_PLUS_REWARD_EXTRA[barStyle],
    ...overrides,
  };
  const { bg, accent, track } = t;
  const h = t.barHeight;
  const iconColor = t.iconColor || accent;
  const iconHtml =
    typeof t.icon === "string" ? t.icon : window.hubLibraryIconHTML?.(t.icon, t.iconSize, iconColor) || "";

  const currentTier = sorted.find((tier) => cartTotal < getTierValue(tier));
  const remainingNext = currentTier ? Math.max(0, getTierValue(currentTier) - cartTotal) : 0;
  const pctRound = Math.round(Math.min(100, (cartTotal / maxAmount) * 100));
  const n = sorted.length;

  const messageHtml =
    cartTotal >= maxAmount
      ? rewards.successText || ""
      : (currentTier?.title || "").replace("{AMOUNT}", fmt(remainingNext));

  const shell = `background:${bg};border-radius:${t.radius}px;padding:${t.padding}px 16px;margin:12px;color:${t.textColor};display:flex;align-items:center;gap:12px;`;
  const msg = `<div style="font-size:${t.fontSize}px;font-weight:700;line-height:1.3;">${messageHtml}</div>`;
  const sub = (text) => `<div style="font-size:11px;opacity:.7;margin-top:2px;">${text}</div>`;
  const iconBox = (content, round = true) =>
    `<div style="width:40px;height:40px;flex-shrink:0;border-radius:${round ? "50%" : "10px"};background:${t.iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;font-size:20px;">${content}</div>`;
  const simpleBar = (striped, pct) =>
    `<div style="height:${h}px;border-radius:${h}px;background:${track};overflow:hidden;"><div class="cp-reward-progress-fill" style="width:${pct}%;height:100%;background:${
      striped ? `repeating-linear-gradient(45deg, ${accent} 0 6px, ${accent}99 6px 12px)` : accent
    };transition:width .4s;"></div></div>`;

  // overall fill (0-100) across the whole bar
  const getStep = (i) => (100 / n) * (i + 1);
  const fillPercent = (() => {
    if (!n) return 0;
    const first = getTierValue(sorted[0]);
    if (cartTotal < first) return (cartTotal / (first || 1)) * getStep(0);
    for (let i = 0; i < n - 1; i++) {
      const a = getTierValue(sorted[i]);
      const b = getTierValue(sorted[i + 1]);
      if (cartTotal >= a && cartTotal < b) return getStep(i) + ((cartTotal - a) / (b - a)) * (getStep(i + 1) - getStep(i));
    }
    return 100;
  })();

  // fill when the tiers are spread evenly along the track
  const evenPos = (i) => (n > 1 ? (i / (n - 1)) * 100 : 100);
  const evenFill = (() => {
    if (!n) return 0;
    const first = getTierValue(sorted[0]);
    if (n === 1) return Math.min(100, (cartTotal / (first || 1)) * 100);
    if (cartTotal <= first) return 0;
    for (let i = 0; i < n - 1; i++) {
      const a = getTierValue(sorted[i]);
      const b = getTierValue(sorted[i + 1]);
      if (cartTotal < b) return evenPos(i) + ((cartTotal - a) / (b - a)) * (evenPos(i + 1) - evenPos(i));
    }
    return 100;
  })();

  const tierTrack = () => {
    const dots = sorted
      .map((tier, i) => {
        const pos = evenPos(i);
        const reached = cartTotal >= getTierValue(tier);
        return `<div style="position:absolute;left:${pos}%;top:${h / 2}px;transform:translateX(-${pos}%);display:flex;flex-direction:column;align-items:center;font-size:10px;text-align:center;white-space:nowrap;"><span style="width:${t.dotSize}px;height:${t.dotSize}px;border-radius:50%;box-sizing:border-box;background:${reached ? accent : "#fff"};border:2px solid ${reached ? accent : track};color:#fff;font-size:${Math.max(8, t.dotSize - 8)}px;line-height:${t.dotSize - 4}px;">${reached ? "✓" : ""}</span>${
          t.showLabels
            ? `<b style="margin-top:6px;">${fmt(getTierValue(tier))}</b><span style="opacity:.7;">${tier.description || ""}</span>`
            : ""
        }</div>`;
      })
      .join("");
    return `<div style="position:relative;padding-top:${t.dotSize / 2}px;padding-bottom:${t.showLabels ? 44 : t.dotSize / 2}px;">${simpleBar(false, evenFill)}${dots}</div>`;
  };

  const nextCard =
    t.showNext && currentTier
      ? `<div style="background:${t.nextBg};border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;color:${accent};flex-shrink:0;">${hubUtils.getTierIcon(currentTier.type, accent)}<div style="color:${t.textColor};font-size:11px;line-height:1.3;"><b style="display:block;font-size:13px;">${fmt(getTierValue(currentTier))}</b>${currentTier.description || ""}</div></div>`
      : "";

  const wrap = (inner, extra = "") => `<div class="cart-plus-rewards" style="${shell}${extra}">${inner}</div>`;

  if (barStyle === "card") {
    return wrap(
      `${t.showIcon ? iconBox(iconHtml, false) : ""}<div style="flex:1;">${msg}<div style="margin-top:8px;">${simpleBar(false, fillPercent)}</div>${
        t.showLabels ? `<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:3px;"><span>${fmt(0)}</span><span>${fmt(maxAmount)}</span></div>` : ""
      }</div>`,
    );
  }

  if (barStyle === "gift") {
    return wrap(`${t.showIcon ? iconBox(iconHtml) : ""}<div style="flex:1;">${msg}<div style="margin-top:14px;">${tierTrack()}</div></div>`, "align-items:flex-start;");
  }

  if (barStyle === "ring") {
    const size = t.ringSize;
    const stroke = 4;
    const r = (size - stroke - 2) / 2;
    const c = 2 * Math.PI * r;
    const subHtml = String(t.subText || "").replace(/\{remaining\}/gi, fmt(remainingNext));
    return wrap(
      `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;"><svg width="${size}" height="${size}" style="transform:rotate(-90deg);"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle class="hub-reward-progress-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${accent}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * pctRound) / 100} ${c}"/></svg><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${accent};">${pctRound}%</span></div><div style="flex:1;">${msg}${remainingNext > 0 && subHtml ? sub(subHtml) : ""}</div>${nextCard}`,
    );
  }

  if (barStyle === "unlock") {
    return wrap(`<div style="width:${t.titleWidth}%;flex-shrink:0;">${msg}</div><div style="flex:1;padding-top:6px;">${tierTrack()}</div>`, "align-items:flex-start;");
  }

  if (barStyle === "striped") {
    return wrap(`${t.showIcon ? iconBox(iconHtml, false) : ""}<div style="flex:1;">${msg}<div style="margin-top:8px;">${simpleBar(true, fillPercent)}</div></div>${nextCard}`);
  }

  // almost
  return wrap(
    `${t.showIcon ? iconBox(iconHtml) : ""}<div style="flex:1;">${msg}<div style="margin-top:8px;">${simpleBar(false, fillPercent)}</div></div>${
      t.showCounter ? `<div style="font-size:11px;font-weight:700;white-space:nowrap;">${fmt(cartTotal)} / ${fmt(maxAmount)}</div>` : ""
    }${
      t.showButton
        ? `<span style="background:${t.buttonBg || accent};color:${t.buttonColor};border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;white-space:nowrap;">${t.buttonText}</span>`
        : ""
    }`,
  );
};

// ── Discount code templates (same layouts as the editor's DISCOUNT_TEMPLATES) ─
const CART_PLUS_DISCOUNT_LAYOUTS = {
  apply_coupon: { layout: "card", icon: "discount" },
  popular_codes: { layout: "chips", icon: "discount" },
  underline: { layout: "underline", icon: "discount" },
  view_coupons: { layout: "rows", icon: "discount" },
  coupons_offers: { layout: "offers", icon: "gift" },
  simple: { layout: "stacked", icon: "discount" },
};

const CART_PLUS_DISCOUNT_TEMPLATE_DEFAULTS = {
  compact_card: {
    layout: "compact",
    heading: "You're Saving",
    textColor: "#1a1a1a",
    accent: "#16803c",
    badgeRadius: 22,
    showDashedBox: false,
    showMoreOffers: true,
    icon: { type: "icon", name: "gift" },
  },
  chip_badges: {
    layout: "chipbadges",
    heading: "Total Savings",
    textColor: "#2b1a5c",
    accent: "#6d4bc3",
    badgeRadius: 12,
    showDashedBox: true,
    showMoreOffers: false,
    icon: { type: "icon", name: "discount" },
  },
};

const CART_PLUS_DISCOUNT_TOKEN_DEFAULTS = {
  bg: "#ffffff",
  textColor: "#1a1a1a",
  accent: "#16803c",
  radius: 16,
  padding: 16,
  shadow: true,
  showBanner: true,
  heading: "You're Saving",
  headingColor: "",
  amountColor: "",
  amountSize: 22,
  bannerBg: "",
  bannerRadius: 12,
  badgeBg: "",
  badgeColor: "#ffffff",
  badgeRadius: 22,
  badgeText: "%",
  appliedLabel: "{n} Discounts Applied",
  clearAllText: "Remove All",
  pillBg: "#ffffff",
  pillColor: "",
  pillBorder: "",
  showList: true,
  rowColor: "",
  rowIconColor: "",
  rowAmountColor: "",
  rowDivider: "#eceef0",
  removeColor: "",
  chipBg: "",
  chipColor: "",
  chipRadius: 10,
  showMoreOffers: true,
  moreOffersText: "more offers",
  moreOffersColor: "",
  showEnterLink: true,
  linkText: "Enter a coupon code",
  linkColor: "",
  icon: { type: "icon", name: "gift" },
  iconColor: "",
  inputBg: "#ffffff",
  inputColor: "",
  inputBorder: "#dcdcdc",
  inputRadius: 8,
  buttonBg: "",
  buttonColor: "#ffffff",
  buttonRadius: 8,
  showDashedBox: false,
  dashedColor: "",
  dashedRadius: 12,
  invalidColor: "#D72C0D",
};

function cartPlusGetDiscountTemplateStyle(settings = {}) {
  const template = CART_PLUS_DISCOUNT_TEMPLATE_DEFAULTS[settings.template];
  if (!template) return null;
  const defaults = { ...CART_PLUS_DISCOUNT_TOKEN_DEFAULTS, ...template };
  const style = { layout: defaults.layout };

  Object.keys(defaults).forEach((key) => {
    if (key === "layout" || key === "label") return;
    const value = settings[key];
    style[key] =
      value !== undefined && value !== null && value !== ""
        ? value
        : defaults[key];
  });

  const chip = style.layout === "chipbadges";
  style.headingColor ||= chip ? style.accent : style.textColor;
  style.amountColor ||= chip ? style.accent : style.textColor;
  style.badgeBg ||= style.accent;
  style.pillColor ||= style.accent;
  style.pillBorder ||= `${style.accent}55`;
  style.rowColor ||= style.textColor;
  style.rowIconColor ||= style.textColor;
  style.rowAmountColor ||= style.textColor;
  style.removeColor ||= style.textColor;
  style.chipBg ||= `${style.accent}1a`;
  style.chipColor ||= style.accent;
  style.moreOffersColor ||= style.accent;
  style.linkColor ||= style.textColor;
  style.iconColor ||= style.accent;
  style.inputColor ||= style.textColor;
  style.buttonBg ||= style.accent;
  style.dashedColor ||= `${style.accent}55`;
  style.bannerBg ||= `linear-gradient(90deg, ${style.accent}1f, ${style.accent}0d)`;
  return style;
}

window.__HUB_CART_PLUS_RESOLVE_DISCOUNT_STYLE =
  cartPlusGetDiscountTemplateStyle;

window.cartPlusShowDiscountError = function (element, textOverride) {
  if (!element) return;
  const settings = window.__HUB_ACTIVE_CART__?.discountCodesSettings || {};
  const style = cartPlusGetDiscountTemplateStyle(settings);
  const message =
    textOverride ??
    settings.invalidCodeMessage ??
    "This discount code isn't valid. Please check the code and try again.";
  if (!String(message).replace(/<[^>]*>|&nbsp;/g, "").trim()) {
    element.innerHTML = "";
    return;
  }

  const source = new DOMParser().parseFromString(String(message), "text/html").body;
  const allowedTags = new Set([
    "B",
    "BR",
    "DIV",
    "EM",
    "I",
    "P",
    "SPAN",
    "STRONG",
    "U",
  ]);
  const copyNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const fragment = document.createDocumentFragment();
    const tag = node.tagName.toUpperCase();
    if (!allowedTags.has(tag)) {
      node.childNodes.forEach((child) => fragment.appendChild(copyNode(child)));
      return fragment;
    }

    const safeElement = document.createElement(tag.toLowerCase());
    const color = node.style?.color || "";
    if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(color)) {
      safeElement.style.color = color;
    }
    const fontSize = node.style?.fontSize || "";
    if (/^\d{1,2}(px|em|rem|%)$/i.test(fontSize)) {
      safeElement.style.fontSize = fontSize;
    }
    const fontWeight = node.style?.fontWeight || "";
    if (/^(normal|bold|[1-9]00)$/i.test(fontWeight)) {
      safeElement.style.fontWeight = fontWeight;
    }
    if (/^(normal|italic|oblique)$/i.test(node.style?.fontStyle || "")) {
      safeElement.style.fontStyle = node.style.fontStyle;
    }
    if (/^(none|underline|line-through)$/i.test(node.style?.textDecoration || "")) {
      safeElement.style.textDecoration = node.style.textDecoration;
    }
    node.childNodes.forEach((child) => safeElement.appendChild(copyNode(child)));
    return safeElement;
  };

  const content = document.createDocumentFragment();
  source.childNodes.forEach((node) => content.appendChild(copyNode(node)));
  element.innerHTML = "";
  element.appendChild(content);
  element.style.color =
    style?.invalidColor || settings.invalidColor || "#D72C0D";
  clearTimeout(element._cartPlusMessageTimer);
  element._cartPlusMessageTimer = setTimeout(() => {
    element.innerHTML = "";
  }, 4000);
};

window.cartPlusToggleDiscountInput = function (blockId) {
  const input = document.getElementById(`hub-discount-input-wrap-${blockId}`);
  if (!input) return;
  if (input.dataset.hasDiscount !== "true") {
    input.style.display = "flex";
    return;
  }
  input.dataset.cartPlusOpen =
    input.dataset.cartPlusOpen === "true" ? "false" : "true";
  input.style.display =
    input.dataset.cartPlusOpen === "true" ? "flex" : "none";
};

function renderDiscountTemplateHTMLInternal(blockId, settings, style) {
  const escape = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  const color = style.textColor;
  const placeholder = escape(settings.placeholder || "Discount code");
  const buttonText = settings.buttonText || "Apply";
  const icon = style.icon || { type: "icon", name: "discount" };
  const iconHtml =
    window.hubLibraryIconHTML?.(icon, 18, style.iconColor) || "";
  const shell = `background:${style.bg};color:${color};border-radius:${style.radius}px;padding:${style.padding}px;margin:12px;box-shadow:${style.shadow ? "0 1px 3px rgba(0,0,0,.08)" : "none"};flex:1 1 auto;min-width:0;box-sizing:border-box;`;
  const pairStyle = `display:flex;gap:8px;align-items:center;margin-top:12px;padding:${style.showDashedBox ? "6px" : "0"};border-radius:${style.dashedRadius}px;border:${style.showDashedBox ? `1.5px dashed ${style.dashedColor}` : "none"};`;
  const input = `<input type="text" id="discount-code-input-${blockId}" placeholder="${placeholder}" class="hub-discount-input cart-plus-discount-code-text cart-plus-discount-code-input" style="flex:1;min-width:0;padding:10px 12px;font-size:13px;color:${style.inputColor};background:${style.inputBg};border:1px solid ${style.inputBorder};border-radius:${style.inputRadius}px;outline:none;box-shadow:none;${style.showDashedBox ? "border:0;background:transparent;" : ""}">`;
  const button = `<button type="button" onclick="applyDiscountCode(this)" class="hub-discount-apply-btn cart-plus-public-discount-code__button cart-plus-discount-code-button" style="background:${style.buttonBg};color:${style.buttonColor};border:0;border-radius:${style.buttonRadius}px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;">${buttonText}</button>`;
  const message = `<div class="error-discount"><p id="discount-message" class="hub-discount-message"></p></div>`;
  const status = `<div id="hub-discount-status-${blockId}" class="hub-discount-status-code" data-layout="${style.layout}"></div>`;
  const arrow = `<svg viewBox="0 0 20 20" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path fill-rule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"/></svg>`;
  const compactEnterLink = `<button type="button" onclick="cartPlusToggleDiscountInput('${blockId}')" style="flex:1;display:flex;align-items:center;justify-content:flex-end;gap:4px;background:none;border:0;padding:0;color:${style.linkColor};font-size:13px;cursor:pointer;">${escape(style.linkText)} ${arrow}</button>`;
  const chipEnterLink = `<button type="button" onclick="hubOpenOffersPanel('${blockId}')" style="display:flex;align-items:center;gap:4px;background:none;border:0;padding:0;color:${style.linkColor};font-size:12px;cursor:pointer;">${escape(style.linkText)} ${arrow}</button>`;
  const inputWrap = `<div class="hub-discount-input-btn" id="hub-discount-input-wrap-${blockId}" style="${pairStyle}">${input}${button}</div>`;
  const banner = `<div data-discount-banner style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:${style.bannerRadius}px;background:${style.bannerBg};">
    <span style="width:44px;height:44px;border-radius:${style.badgeRadius}px;background:${style.badgeBg};color:${style.badgeColor};display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${escape(style.badgeText)}</span>
    <div style="flex:1;"><div style="font-size:12px;font-weight:600;color:${style.headingColor};">${escape(style.heading)}</div><div data-discount-total style="font-size:${style.amountSize}px;font-weight:800;color:${style.amountColor};">${hubUtils.formatMoney(0)}</div></div>
    ${
      style.layout === "compact"
        ? `<span data-discount-pill style="border:1px solid ${style.pillBorder};color:${style.pillColor};background:${style.pillBg};border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;"></span>`
        : `<button type="button" data-discount-clear-all onclick="removeDiscountCode(this,'${blockId}')" style="border:1px solid ${style.pillBorder};background:${style.pillBg};color:${style.pillColor};border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">${escape(style.clearAllText)}</button>`
    }
  </div>`;
  const list = `<div data-discount-list style="${style.layout === "chipbadges" ? "display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;" : "margin-top:4px;"}"></div>`;
  const moreOffers = style.showMoreOffers
    ? `<button type="button" onclick="hubOpenOffersPanel('${blockId}')" style="flex:1;display:flex;align-items:center;gap:8px;background:none;border:0;padding:0;color:${style.moreOffersColor};font-size:13px;font-weight:700;cursor:pointer;">${iconHtml}+1 ${escape(style.moreOffersText)}</button>`
    : "";
  const shellContent =
    style.layout === "compact"
      ? `${style.showBanner ? banner : ""}${style.showList ? list : ""}${(style.showMoreOffers || style.showEnterLink) ? `<div style="display:flex;align-items:center;margin-top:10px;">${style.showMoreOffers ? moreOffers : ""}${style.showMoreOffers && style.showEnterLink ? `<span style="width:1px;align-self:stretch;background:#e1e3e5;margin:0 12px;"></span>` : ""}${style.showEnterLink ? compactEnterLink : ""}</div>` : ""}${inputWrap}${message}`
      : `${style.showBanner ? banner : ""}${style.showList ? list : ""}${inputWrap}${message}${style.showEnterLink ? `<div style="margin-top:10px;">${chipEnterLink}</div>` : ""}`;
  return `<div class="hub-discount-input-row-items cart-plus-discount-code-row cart-plus-public-discount-code" id="hub-discount-row-${blockId}" style="padding:0;"><div class="cart-plus-discount-tpl" style="${shell}">${status}${shellContent}</div></div>`;
}

// html for the Discount code row when a template is picked, "" for the classic row.
// Keeps the ids / classes the apply + status code relies on (.hub-discount-input, .hub-discount-apply-btn,
// .hub-discount-input-btn, #hub-discount-status-*, #discount-message).
window.cartPlusDiscountTemplateHTML = function (blockId, s) {
  const style = window.__HUB_CART_PLUS_RESOLVE_DISCOUNT_STYLE?.(s);
  if (style) return renderDiscountTemplateHTMLInternal(blockId, s, style);

  const meta = CART_PLUS_DISCOUNT_LAYOUTS[s?.template];
  if (!meta) return "";
  const layout = meta.layout;
  const color = s.textColor ?? "#1a1a1a";
  const accent = s.accent ?? "#0a7d3b";
  const bg = s.bg ?? "#ffffff";
  const radius = s.radius ?? 12;
  const heading = s.heading ?? "";
  const subtitle = s.subtitle ?? "";
  const linkText = s.linkText ?? "View all coupon code options";
  const placeholder = s.placeholder || "Discount code";
  const buttonText = s.buttonText || "Apply";
  const showAll = s.showOfferBox ?? false;
  const chips = String(s.popularCodes || "").split(",").map((c) => c.trim()).filter(Boolean);
  const icon = s.icon || { type: "icon", name: meta.icon };
  const iconColor = s.iconColor || accent;
  const iconSvg = (size) => window.hubLibraryIconHTML?.(icon, size, iconColor) || "";

  const shell = `background:${bg};color:${color};border-radius:${radius}px;padding:16px;margin:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);flex:1 1 auto;min-width:0;box-sizing:border-box;`;
  const status = `<div id="hub-discount-status-${blockId}" class="hub-discount-status-code"></div>`;
  const message = `<div class="error-discount"><p id="discount-message" class="hub-discount-message"></p></div>`;
  const arrow = `<svg viewBox="0 0 20 20" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path fill-rule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"/></svg>`;
  const openOffers = `hubOpenOffersPanel('${blockId}')`;

  const input = (extra = "") =>
    `<input type="text" id="discount-code-input-${blockId}" placeholder="${placeholder}" class="hub-discount-input cart-plus-discount-code-text cart-plus-discount-code-input" style="flex:1;min-width:0;padding:10px 12px;font-size:13px;color:${color};background:#fff;border:1px solid #dcdcdc;border-radius:8px;outline:none;box-shadow:none;${extra}">`;
  const button = (extra = "") =>
    `<button type="button" onclick="applyDiscountCode(this)" class="hub-discount-apply-btn cart-plus-public-discount-code__button cart-plus-discount-code-button" style="background:${accent};color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;${extra}">${buttonText}</button>`;
  // input + button row; carries .hub-discount-input-btn so the applied-state code can find it
  const pair = (inner, extra = "display:flex;gap:8px;") =>
    `<div class="hub-discount-input-btn" id="hub-discount-input-wrap-${blockId}" style="padding:0;margin:0;background:transparent;border-radius:0;width:100%;${extra}">${inner}</div>`;
  const linkBtn = (extra = "") =>
    showAll
      ? `<button type="button" onclick="${openOffers}" style="display:flex;align-items:center;gap:4px;background:none;border:0;padding:0;font-size:12px;color:${color};cursor:pointer;${extra}">${linkText} ${arrow}</button>`
      : "";
  const iconBubble = `<span style="width:32px;height:32px;border-radius:50%;background:${iconColor}22;color:${iconColor};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(16)}</span>`;
  const wrap = (inner) =>
    `<div class="hub-discount-input-row-items cart-plus-discount-code-row cart-plus-public-discount-code" id="hub-discount-row-${blockId}" style="padding:0;">${inner}</div>`;

  if (layout === "card") {
    return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
      ${status}
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">${iconBubble}<div><div style="font-size:12px;font-weight:700;">${heading}</div><div style="font-size:11px;opacity:.65;">${subtitle}</div></div></div>
      ${pair(`${input()}${button()}`)}
      ${message}
      ${showAll ? `<div style="margin-top:12px;">${linkBtn("text-decoration:underline;")}</div>` : ""}
    </div>`);
  }

  if (layout === "chips") {
    return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
      ${status}
      ${showAll ? `<div style="margin-bottom:10px;">${linkBtn("width:100%;justify-content:space-between;")}</div>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><b style="font-size:13px;">${heading}</b>${
        subtitle ? `<span style="font-size:10px;font-weight:700;color:#c0283d;background:#fde8ec;border-radius:6px;padding:2px 8px;">${subtitle}</span>` : ""
      }</div>
      ${pair(`${input()}${button()}`)}
      ${message}
      ${
        chips.length
          ? `<div style="margin-top:10px;"><div style="font-size:11px;opacity:.6;margin-bottom:6px;">Popular codes</div><div style="display:flex;gap:6px;flex-wrap:wrap;">${chips
              .map(
                (c) =>
                  `<button type="button" onclick="var i=document.getElementById('discount-code-input-${blockId}');if(i){i.value='${c.replace(/'/g, "\\'")}';i.focus();}" style="border:1px solid #dcdcdc;background:#fff;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">${c}</button>`,
              )
              .join("")}</div></div>`
          : ""
      }
    </div>`);
  }

  if (layout === "underline") {
    return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
      ${status}
      <div style="font-size:15px;font-weight:700;margin-bottom:10px;">${heading}</div>
      ${pair(
        `${input("border:0;border-radius:0;background:transparent;padding-left:0;")}${button(`background:transparent;color:${accent};padding:8px 0;`)}`,
        `display:flex;align-items:center;border-bottom:2px solid ${accent};`,
      )}
      ${message}
      ${showAll ? `<div style="display:flex;align-items:center;gap:6px;margin-top:12px;">${iconSvg(20)}${linkBtn("width:100%;justify-content:space-between;")}</div>` : ""}
    </div>`);
  }

  if (layout === "rows") {
    if (showAll) {
      const rowBtn = (inner, extra) =>
        `<button type="button" onclick="${openOffers}" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:none;border:0;cursor:pointer;${extra}">${inner}</button>`;
      return wrap(`<div class="cart-plus-discount-tpl" style="${shell}padding:0;overflow:hidden;">
        <div style="display:none;">${pair(`${input()}${button()}`)}${status}${message}</div>
        ${rowBtn(`${iconBubble}<span style="flex:1;text-align:left;">${heading}</span>${arrow}`, `color:${accent};font-size:13px;`)}
        ${rowBtn(`${iconBubble}<span style="flex:1;"><b style="display:block;font-size:13px;">${linkText}</b><span style="font-size:11px;opacity:.65;">${subtitle}</span></span>${arrow}`, `color:${color};text-align:left;background-color:#f7f7f7;border-top:1px solid #e9e9e9;`)}
      </div>`);
    }
    return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
      ${status}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">${iconBubble}<b style="font-size:13px;">${heading}</b></div>
      ${pair(`${input()}${button()}`)}
      ${message}
    </div>`);
  }

  if (layout === "offers") {
    return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
      ${status}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;"><span style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></span><b style="font-size:14px;">${heading}</b></div>
      ${pair(`${input("text-transform:uppercase;")}${button(`background:#fff;color:${color};border:1px solid #dcdcdc;`)}`)}
      ${message}
      <button type="button" onclick="${openOffers}" style="display:flex;align-items:center;gap:10px;width:100%;margin-top:12px;padding:0;background:none;border:0;cursor:pointer;color:${color};text-align:left;">${iconBubble}<span style="flex:1;"><b style="display:block;font-size:13px;">${linkText}</b><span style="font-size:11px;opacity:.65;">${subtitle}</span></span>${arrow}</button>
    </div>`);
  }

  // stacked
  return wrap(`<div class="cart-plus-discount-tpl" style="${shell}">
    ${status}
    <div style="font-size:11px;font-weight:700;margin-bottom:8px;">${heading}</div>
    ${pair(`${input("width:100%;box-sizing:border-box;")}${button("width:100%;margin-top:10px;border-radius:999px;")}`, "display:block;")}
    ${message}
    ${showAll ? `<div style="margin-top:10px;">${linkBtn("width:100%;justify-content:space-between;")}</div>` : ""}
  </div>`);
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
