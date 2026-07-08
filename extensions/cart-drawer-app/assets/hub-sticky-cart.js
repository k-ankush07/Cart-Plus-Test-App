// === Scope helper (unchanged) ===
function applyStickyCustomCSS(blockId, css) {
  if (!css) return;

  const styleId = `hub-sticky-css-${blockId}`;
  let style = document.getElementById(styleId);

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  const scopedCSS = scopeCss(css, `.hub-sticky-scope-${blockId}`);

  style.innerHTML = scopedCSS;
}

function scopeCss(css, scope) {
  if (!css) return "";

  let result = css.replace(
    /(@[\w-]+(?:\s+[\w-]+)?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})|([^{}@]+)\{([^{}]*)\}/g,
    (match, atRule, selectors, declarations) => {
      if (atRule) return atRule;

      const scoped = selectors
        .split(",")
        .map((s) => {
          const t = s.trim();
          if (!t) return t;
          return `${scope} ${t}`;
        })
        .join(", ");

      const important = declarations.replace(
        /([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g,
        (_m, prop, val, semi) => `${prop}${val.trim()} !important${semi}`,
      );

      return `${scoped} { ${important} }`;
    },
  );

  return result;
}

(function () {
  let _badgeListenerBound = false;

  // ── Now takes a size param and injects it into width/height ──
  function getStickyIcon(type, size = 45) {
    const icons = {
      bag: `<svg width="${size}" height="${size}" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Shopping bag"><title>Shopping bag</title><path d="M15.9348 18.7484C15.9348 22.3743 18.8741 25.3136 22.5 25.3136V25.3136C26.1259 25.3136 29.0652 22.3743 29.0652 18.7484" stroke="currentColor" stroke-width="2.8125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.9348 13.121V12.1832C15.9348 8.55728 18.8741 5.61792 22.5 5.61792V5.61792C26.1259 5.61792 29.0652 8.55728 29.0652 12.1832V13.121" stroke="currentColor" stroke-width="2.8125" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12.1158 13.1211C10.1347 13.1211 8.49519 14.6615 8.37161 16.6386L7.51063 30.4145C7.36528 32.7401 8.18772 35.0223 9.78313 36.7205C11.3785 38.4188 13.605 39.382 15.9351 39.382H29.0649C31.395 39.382 33.6215 38.4188 35.2169 36.7206C36.8124 35.0223 37.6348 32.7401 37.4895 30.4145L36.6285 16.6386C36.5049 14.6615 34.8653 13.1211 32.8843 13.1211H12.1158Z" stroke="currentColor" stroke-width="2.8125" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd" clip-rule="evenodd"></path></svg>`,
      tote: `<svg width="${size}" height="${size}" viewBox="0 0 45 45" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Shopping bag"><title>Shopping bag</title><path d="M7.4937 7.49365H37.5062C38.5422 7.49365 39.382 8.33347 39.382 9.36943V35.6304C39.382 37.7023 37.7023 39.3819 35.6304 39.3819H9.36948C7.29755 39.3819 5.61792 37.7023 5.61792 35.6304V9.36943C5.61792 8.33347 6.45774 7.49365 7.4937 7.49365Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"></path><path d="M5.61792 14.059H39.382Z" fill-rule="evenodd" clip-rule="evenodd" fill="white"></path><path d="M5.61792 14.059H39.382" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M30.0031 20.6245C30.0031 24.7684 26.6438 28.1276 22.5 28.1276C18.3561 28.1276 14.9968 24.7684 14.9968 20.6245" fill="currentColor"></path><path d="M30.0031 20.6245C30.0031 24.7684 26.6438 28.1276 22.5 28.1276C18.3561 28.1276 14.9968 24.7684 14.9968 20.6245" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
      cart: `<svg width="${size}" height="${size}" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Shopping cart"><title>Shopping cart</title><path d="M2.25 2.25C2.25 1.00736 3.26096 0 4.50805 0H7.89512C9.76575 0 11.2822 1.51104 11.2822 3.375V4.63623L39.5737 6.67839C41.5465 6.80125 42.995 8.57431 42.7154 10.5241L40.7687 24.1023C40.5304 25.765 39.1013 27 37.4157 27H11.2822V31.5H33.8788C37.6201 31.5 40.6529 34.5221 40.6529 38.25C40.6529 41.9779 37.6201 45 33.8788 45C30.1375 45 27.1046 41.9779 27.1046 38.25C27.1046 37.4611 27.2405 36.7037 27.4901 36H15.4128C15.6625 36.7037 15.7983 37.4611 15.7983 38.25C15.7983 41.9779 12.7654 45 9.02415 45C5.28289 45 2.25 41.9779 2.25 38.25C2.25 35.311 4.13504 32.8107 6.7661 31.8841V6.77078C6.766 6.75838 6.766 6.74596 6.7661 6.73352V4.5H4.50805C3.26096 4.5 2.25 3.49264 2.25 2.25ZM11.2822 9.14501V22.5H36.4365L38.0718 11.0936L11.2822 9.14501ZM31.6207 38.25C31.6207 37.0074 32.6317 36 33.8788 36C35.1259 36 36.1368 37.0074 36.1368 38.25C36.1368 39.4926 35.1259 40.5 33.8788 40.5C32.6317 40.5 31.6207 39.4926 31.6207 38.25ZM6.7661 38.25C6.7661 37.0074 7.77706 36 9.02415 36C10.2712 36 11.2822 37.0074 11.2822 38.25C11.2822 39.4926 10.2712 40.5 9.02415 40.5C7.77706 40.5 6.7661 39.4926 6.7661 38.25Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"></path></svg>`,
    };
    return icons[type] || icons.cart;
  }

  // ── Now takes iconSize and passes it through / applies it to custom images ──
  function getStickyIconMarkup(selectedIcon, customIconUrl, iconSize) {
    const px = iconSize || 45;

    if (selectedIcon === "custom" && customIconUrl) {
      return `<img src="${customIconUrl}" alt="Custom cart icon" style="width:${px}px;height:${px}px;object-fit:contain;display:block;" />`;
    }
    return getStickyIcon(selectedIcon, px);
  }

  async function updateStickyBadge() {
    try {
      const res = await fetch("/cart.js");
      const cart = await res.json();

      const includeAddonsInCount =
        window.__HUB_ACTIVE_CART__?.addonsSettings?.includeInItemCount === true;

      const count = cart.items
        .filter(
          (i) =>
            !i.properties?._triggered_reward &&
            (includeAddonsInCount ||
              (!i.properties?._hub_addon && !i.properties?.__upcartAddon)),
        )
        .reduce((sum, i) => sum + i.quantity, 0);

      // ── Uses new class instead of id ──
      const badgeText = document.querySelector(
        ".custom-cart-sticky-cart-quantity-icon-text",
      );
      const badgeWrapper = document.querySelector(
        ".custom-cart-sticky-cart-quantity-icon",
      );
      const widget = document.querySelector(".custom-cart-sticky-widget");

      if (badgeText && badgeWrapper) {
        badgeText.textContent = count > 99 ? "99+" : count;
        badgeWrapper.style.display = count > 0 ? "flex" : "none";
      }

      // ── Hide the entire sticky button (not just the badge) on empty cart ──
      if (widget) {
        const data = window.__HUB_STICKY_CART__ || {};
        const shouldHide = !!data.hideOnEmptyCart && count === 0;
        widget.style.display = shouldHide ? "none" : "flex";
      }
    } catch (_) {}
  }

  window.renderStickyCart = function () {
    const data = window.__HUB_STICKY_CART__;
    const blockId = window.HUB_CART_BLOCK_ID;
    if (!data || !data.enabled) return;

    applyStickyCustomCSS(blockId, data.customCss);

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (
      (data.device === "mobile" && !isMobile) ||
      (data.device === "desktop" && isMobile)
    ) {
      const existing = document.querySelector(".custom-cart-sticky-widget");
      if (existing) existing.remove();
      return;
    }

    if (!_badgeListenerBound) {
      _badgeListenerBound = true;
      document.addEventListener("cart:updated", () => {
        updateStickyBadge();
        setTimeout(updateStickyBadge, 300);
      });
    }

    if (document.querySelector(".custom-cart-sticky-widget")) {
      // Widget already exists (e.g. re-render call) — just refresh badge/visibility state
      updateStickyBadge();
      return;
    }

    // ── Root button ──
    const btn = document.createElement("div");
    btn.classList.add(
      "custom-cart-sticky-widget",
      `hub-sticky-scope-${blockId}`,
    );

    const buttonSize = Number(data.buttonSize) || 82;
    const pos = {
      "bottom-right": { bottom: "20px", right: "20px" },
      "center-right": {
        top: "50%",
        right: "20px",
        transform: "translateY(-50%)",
      },
      "top-right": { top: "20px", right: "20px" },
      "bottom-left": { bottom: "20px", left: "20px" },
      "center-left": {
        top: "50%",
        left: "20px",
        transform: "translateY(-50%)",
      },
      "top-left": { top: "20px", left: "20px" },
    };

    Object.assign(btn.style, {
      position: "fixed",
      zIndex: 2147483638,
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      borderRadius: "50%",
      background: data.bgColor || "#000",
      color: data.iconColor || "#fff",
      // ── Avoid a flash-of-visible-button before the initial cart fetch resolves ──
      display: data.hideOnEmptyCart ? "none" : "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      ...(pos[data.position] || pos["bottom-right"]),
    });

    // ── Badge wrapper ──
    const badgeWrapper = document.createElement("div");
    badgeWrapper.classList.add("custom-cart-sticky-cart-quantity-icon");
    Object.assign(badgeWrapper.style, {
      position: "absolute",
      top: "5px",
      left: `${Math.max(buttonSize - 24, 24)}px`,
      minWidth: "25px",
      height: "25px",
      borderRadius: "100%",
      background: data.qBgColor || "#e03e2d",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 4px",
      boxSizing: "border-box",
      pointerEvents: "none",
      zIndex: "1",
    });

    // ── Badge text ──
    const badgeText = document.createElement("span");
    badgeText.classList.add("custom-cart-sticky-cart-quantity-icon-text");
    Object.assign(badgeText.style, {
      color: data.qTextColor || "#fff",
      fontSize: "14px",
      fontWeight: "600",
      lineHeight: "1",
      fontFamily: "sans-serif",
    });
    badgeWrapper.appendChild(badgeText);
    btn.appendChild(badgeWrapper);

    // ── Icon wrapper ──
    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("custom-cart-sticky-cart-icon");
    iconWrapper.innerHTML = getStickyIconMarkup(
      data.selectedIcon,
      data.customIconUrl,
      data.iconSize,
    );
    btn.appendChild(iconWrapper);

    // ── Click → open drawer ──
    btn.addEventListener("click", () => {
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
    });

    document.body.appendChild(btn);

    updateStickyBadge();
  };
})();
