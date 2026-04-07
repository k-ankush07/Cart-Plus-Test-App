const apiUrl = "https://ebc3-2401-4900-1c6f-9a87-b999-5f1-b9d4-31c.ngrok-free.app";

(function () {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    // Skip event dispatch for internal reward updates
    if (window._hubRewardUpdating) return response;

    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (
      url.includes("/cart/add") ||
      url.includes("/cart/change") ||
      url.includes("/cart/clear")
    ) {
      try {
        const data = await response.clone().json();
        document.dispatchEvent(new CustomEvent("cart:updated", { detail: data }));
      } catch (_) {
        // Non-JSON response (e.g. 429) — still dispatch so UI updates
        document.dispatchEvent(new CustomEvent("cart:updated", { detail: null }));
      }
    }

    return response;
  };
})();

(function () {
  let isEventBound = false;

  function initCart() {
    const blockId = window.HUB_CART_BLOCK_ID;
    if (!blockId) return;

    document
      .querySelectorAll(
        `
      cart-drawer,
      #CartDrawer,
      .cart-drawer,
      ajax-cart,
      cart-notification
    `,
      )
      .forEach((el) => el.remove());

    let root =
      document.getElementById(`cart-drawer-App-${blockId}`) || document.body;

    if (!window.injectCartHTML) {
      console.error("injectCartHTML NOT FOUND");
      return;
    }

    window.injectCartHTML(blockId, root);

    const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
    const bg = document.getElementById(`hub-cart-bg-${blockId}`);

    if (!drawer || !bg) {
      console.error("Drawer not found");
      return;
    }

    window.updateCartCount = async function () {
      try {
        const res = await fetch("/cart.js");
        const cart = await res.json();

        const cartIcon = document.getElementById("cart-icon-bubble");
        if (!cartIcon) return;

        let bubble = cartIcon.querySelector(".cart-count-bubble");

        if (!bubble) {
          bubble = document.createElement("div");
          bubble.className = "cart-count-bubble";
          cartIcon.appendChild(bubble);
        }

        bubble.innerHTML = `
      <span aria-hidden="true">${cart.item_count}</span>
      <span class="visually-hidden">${cart.item_count} items</span>
    `;
      } catch (err) {
        console.error(err);
      }
    };

    function openDrawer() {
      drawer.classList.add(`hub-visible-${blockId}`);
      bg.classList.add(`hub-visible-${blockId}`);

      document.body.classList.add("no-scroll", "overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");

      document.body.style.overflow = "hidden";

      if (window.hubCartRender) {
        window.hubCartRender(drawer);
      }

      updateCartCount();
    }

    function closeDrawer() {
      drawer.classList.remove(`hub-visible-${blockId}`);
      bg.classList.remove(`hub-visible-${blockId}`);

      document.body.classList.remove("no-scroll", "overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      setTimeout(() => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }, 50);
    }

    if (!isEventBound) {
      isEventBound = true;

      document.addEventListener(
        "click",
        function (e) {
          const cartLink = e.target.closest(
            "#cart-icon-bubble, .header__icon--cart, .cart-icon, [data-cart]",
          );

          if (cartLink) {
            e.preventDefault();
            openDrawer();
            return;
          }

          const closeBtn = e.target.closest(`#hub-close-${blockId}`);
          const bgClick = e.target.closest(`#hub-cart-bg-${blockId}`);

          if (closeBtn || bgClick) {
            closeDrawer();
            return;
          }
        },
        true,
      );

      let _cartUpdateTimer = null;
      document.addEventListener("cart:updated", function () {
        if (window._hubRewardUpdating) return;
        clearTimeout(_cartUpdateTimer);
        _cartUpdateTimer = setTimeout(() => openDrawer(), 300);
      });
    }
  }

  window.addEventListener("load", initCart);
})();

// ── Announcement countdown timer ──
let _annTimerInterval = null;

window.startAnnTimer = function (blockId, timeStr) {
  if (_annTimerInterval) clearInterval(_annTimerInterval);

  const parts = timeStr.split(":").map(Number);
  let totalSeconds = parts.length === 2
    ? parts[0] * 60 + parts[1]
    : parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function tick() {
    const el = document.getElementById(`hub-timer-${blockId}`);
    if (el) el.textContent = fmt(totalSeconds);
    if (totalSeconds <= 0) { clearInterval(_annTimerInterval); return; }
    totalSeconds--;
  }

  tick();
  _annTimerInterval = setInterval(tick, 1000);
};

(function () {
  window.addEventListener("load", async function () {
    const shop = window.__SHOPIFY_SHOP__?.domain;

    if (!shop ) {
      console.warn(" Shop not set");
      return;
    }

    console.log("Shop:", shop);

    try {
      const res = await fetch(`${apiUrl}/api/get-carts?shop=${shop}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await res.json();

      if (!result.success || !result.data?.length) {
        console.log("No carts found for this shop");
        return;
      }

      const publishedCart = result.data.find(
        (cart) => cart.status === "published"
      );

      if (publishedCart) {
        console.log("Published cart found:", publishedCart);
        window.__HUB_ACTIVE_CART__ = publishedCart;
      } else {
        console.log("No published cart found for this shop");
      }
    } catch (err) {
      console.error("Cart settings fetch error:", err);
    }
  });
})();