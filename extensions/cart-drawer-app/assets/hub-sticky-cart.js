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
  css = css.replace(/\s*!important/gi, "");
  return css
    .replace(/([^{}@][^{}]*)\{/g, (_match, selectors) => {
      const scoped = selectors
        .split(",")
        .map((s) => {
          const t = s.trim();
          if (!t) return t;
          return `${scope} ${t}`;
        })
        .join(", ");
      return `${scoped} {`;
    })
    .replace(/([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g, (_m, prop, val, semi) => {
      return `${prop}${val.trim()} !important${semi}`;
    });
}

(function () {
  let _badgeListenerBound = false;

  function getStickyIcon(type) {
    const icons = {
      bag: `<svg width="45" height="45" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
      tote: `<svg width="45" height="45" viewBox="0 0 24 24" stroke="currentColor" fill="none"><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/></svg>`,
      cart: `<svg width="45" height="45" viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L23 6H6"/></svg>`,
    };
    return icons[type] || icons.cart;
  }

  async function updateStickyBadge() {
    try {
      const res = await fetch("/cart.js");
      const cart = await res.json();

      const count = cart.items
        .filter((i) => !i.properties?._triggered_reward)
        .reduce((sum, i) => sum + i.quantity, 0);

      const badge = document.getElementById("hub-sticky-badge");
      if (!badge) return;

      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = count > 0 ? "flex" : "none";
    } catch (_) {}
  }

  window.renderStickyCart = function () {
    const data = window.__HUB_STICKY_CART__;
    const blockId = window.HUB_CART_BLOCK_ID;

    if (!data || !data.enabled) return;

    applyStickyCustomCSS(blockId, data.customCss);

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isDesktop = !isMobile;

    const existingBtn = document.getElementById("hub-sticky-cart-btn");

    if (
      (data.device === "mobile" && !isMobile) ||
      (data.device === "desktop" && !isDesktop)
    ) {
      if (existingBtn) existingBtn.remove();
      return;
    }

    // ── Always update badge count even if button already exists ──
    updateStickyBadge();

    // ── Only bind the listener once ──
    if (!_badgeListenerBound) {
      _badgeListenerBound = true;

      document.addEventListener("cart:updated", () => {
        updateStickyBadge();

        setTimeout(updateStickyBadge, 300);
      });
    }

    // ── Only build the button DOM once ──
    if (document.getElementById("hub-sticky-cart-btn")) return;

    const btn = document.createElement("div");
    btn.id = "hub-sticky-cart-btn";

    btn.classList.add(`hub-sticky-scope-${blockId}`);

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

    const style = pos[data.position] || pos["bottom-right"];

    Object.assign(btn.style, {
      position: "fixed",
      zIndex: 2147483638,
      width: "82px",
      height: "82px",
      borderRadius: "50%",
      background: data.bgColor || "#000",
      color: data.iconColor || "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      ...style,
    });

    // ── Badge ──
    const badge = document.createElement("div");
    badge.id = "hub-sticky-badge";
    Object.assign(badge.style, {
      position: "absolute",
      top: "5px",
      left: "60px",
      minWidth: "25px",
      height: "25px",
      borderRadius: "100%",
      background: data.qBgColor || "#e03e2d",
      color: data.qTextColor || "#fff",
      fontSize: "14px",
      fontWeight: "600",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: "1",
      padding: "0 4px",
      boxSizing: "border-box",
      pointerEvents: "none",
      zIndex: "1",
      fontFamily: "sans-serif",
    });

    btn.appendChild(badge);
    btn.innerHTML += getStickyIcon(data.selectedIcon);

    btn.addEventListener("click", () => {
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      const bg = document.getElementById(`hub-cart-bg-${blockId}`);

      if (drawer && bg) {
        drawer.classList.add(`hub-visible-${blockId}`);
        bg.classList.add(`hub-visible-${blockId}`);

        // ── Same scroll lock as openDrawer() ──
        document.body.classList.add("no-scroll", "overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        document.body.style.overflow = "hidden";

        if (window.hubCartRender) {
          window.hubCartRender(drawer, { showSkeleton: true });
        }
      }
    });

    document.body.appendChild(btn);
  };
})();
