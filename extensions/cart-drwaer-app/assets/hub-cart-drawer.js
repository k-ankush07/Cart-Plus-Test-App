const apiUrl =
  "https://ed1d-2401-4900-1c71-48c-2890-1134-3b25-da99.ngrok-free.app";

function initCartDrawerAfterData() {
  const blockId = window.HUB_CART_BLOCK_ID;
  if (!blockId) return;

  const root =
    document.getElementById(`cart-drawer-App-${blockId}`) || document.body;

  document.getElementById(`hub-cart-drawer-${blockId}`)?.remove();
  document.getElementById(`hub-cart-bg-${blockId}`)?.remove();

  window.injectCartHTML(blockId, root);

}

(function () {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    if (window._hubRewardUpdating) return response;

    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (
      url.includes("/cart/add") ||
      url.includes("/cart/change") ||
      url.includes("/cart/clear")
    ) {
      try {
        const data = await response.clone().json();
        document.dispatchEvent(
          new CustomEvent("cart:updated", { detail: data }),
        );
      } catch (_) {
        document.dispatchEvent(
          new CustomEvent("cart:updated", { detail: null }),
        );
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

    // window.injectCartHTML(blockId, root);

    let drawer = null;
    let bg = null;

    function ensureDrawerReady(callback) {
      const interval = setInterval(() => {
        drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
        bg = document.getElementById(`hub-cart-bg-${blockId}`);

        if (drawer && bg) {
          clearInterval(interval);
          callback();
        }
      }, 100);
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
      ensureDrawerReady(() => {
        drawer.classList.add(`hub-visible-${blockId}`);
        bg.classList.add(`hub-visible-${blockId}`);

        document.body.classList.add("no-scroll", "overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        document.body.style.overflow = "hidden";

        if (window.hubCartRender) {
          window.hubCartRender(drawer);
        }

        updateCartCount();
      });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCart);
  } else {
    initCart();
  }
})();

// ── Announcement countdown timer ──
const _annTimerIntervals = {};

window.startAnnTimer = function (blockId, timeStr) {
  if (_annTimerIntervals[blockId]) {
    clearInterval(_annTimerIntervals[blockId]);
    delete _annTimerIntervals[blockId];
  }

  const storageKey = `hub-timer-${blockId}`;
  const storageMetaKey = `hub-timer-${blockId}-src`; // ← NEW: tracks which timeStr was saved

  // ← NEW: parse the intended duration from the API value first
  const parts = timeStr.split(":").map(Number);
  const intendedSeconds =
    parts.length === 2
      ? parts[0] * 60 + parts[1]
      : parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);

  let totalSeconds;
  const savedEndTime = localStorage.getItem(storageKey);
  const savedSrc = localStorage.getItem(storageMetaKey); // ← NEW: what timeStr was saved

  // ← NEW: if the API timeStr changed, throw away the old saved timer
  if (savedSrc !== timeStr) {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageMetaKey);
  }

  const freshEndTime = savedSrc === timeStr ? savedEndTime : null;

  if (freshEndTime) {
    const remaining = Math.floor((Number(freshEndTime) - Date.now()) / 1000);

    if (remaining > 0) {
      // Resume — API timeStr matches what was saved, timer still running
      totalSeconds = remaining;
    } else {
      // Expired while page was closed
      localStorage.removeItem(storageKey);
      localStorage.removeItem(storageMetaKey);
      const el = document.getElementById(`hub-timer-${blockId}`);
      if (el) el.textContent = "00:00";
      return;
    }
  } else {
    // Fresh start — either first visit or API changed the timeStr
    totalSeconds = intendedSeconds;
    localStorage.setItem(storageKey, String(Date.now() + totalSeconds * 1000));
    localStorage.setItem(storageMetaKey, timeStr); // ← NEW: record which timeStr we saved
  }

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function tick() {
    if (totalSeconds <= 0) {
      clearInterval(_annTimerIntervals[blockId]);
      delete _annTimerIntervals[blockId];
      localStorage.removeItem(storageKey);
      localStorage.removeItem(storageMetaKey);
      const el = document.getElementById(`hub-timer-${blockId}`);
      if (el) el.textContent = "00:00";
      return;
    }

    const el = document.getElementById(`hub-timer-${blockId}`);
    if (el) el.textContent = fmt(totalSeconds);
    totalSeconds--;
  }

  tick();
  _annTimerIntervals[blockId] = setInterval(tick, 1000);
};

(function () {
  async function fetchCartSettings() {
    const shop = window.__SHOPIFY_SHOP__?.domain;

    if (!shop) {
      console.warn("Shop not set");
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
        (cart) => cart.status === "published",
      );

      if (publishedCart) {
        console.log("Published cart found:", publishedCart);
        window.__HUB_ACTIVE_CART__ = publishedCart;
        initCartDrawerAfterData();

        loadCartRecommendations(publishedCart.recommendationsSettings);
      } else {
        console.log("No published cart found for this shop");
      }
    } catch (err) {
      console.error("Cart settings fetch error:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchCartSettings);
  } else {
    fetchCartSettings();
  }
})();

window.loadCartRecommendations = async function (settings = {}) {
  try {
    const container = document.getElementById("hub-rec-products");
    if (!container) return;

    const limit = settings.maxRecommendations || settings.productCount || 4;

    const sourceType = settings.sourceType;

    const selectedItems = settings?.selectedItems || [];

    const cartRes = await fetch("/cart.js");
    const cart = await cartRes.json();
    const cartHandles = new Set(cart.items.map((item) => item.handle));

    let finalProducts = [];

    if (sourceType === "products") {
      const selectedProductIds =
        settings?.selectedItems?.products?.map((gid) => gid.split("/").pop()) ||
        [];

      if (selectedProductIds.length) {
        let allProducts = [];
        let page = 1;
        let more = true;

        while (more) {
          const res = await fetch(`/products.json?limit=250&page=${page}`);
          const data = await res.json();

          if (data.products.length > 0) {
            allProducts.push(...data.products);
            page++;
          } else {
            more = false;
          }
        }

        finalProducts = allProducts.filter((p) =>
          selectedProductIds.includes(String(p.id)),
        );
      }
    } else if (sourceType === "collections") {
      const collectionIds = selectedItems.map((gid) => gid.split("/").pop());

      const colRes = await fetch(`/collections.json`);
      const colData = await colRes.json();

      const matchedCollections = colData.collections.filter((c) =>
        collectionIds.includes(String(c.id)),
      );

      let allProducts = [];

      for (const col of matchedCollections) {
        let page = 1;
        let more = true;

        while (more) {
          const res = await fetch(
            `/collections/${col.handle}/products.json?limit=250&page=${page}`,
          );
          const data = await res.json();

          if (data.products.length > 0) {
            allProducts.push(...data.products);
            page++;
          } else {
            more = false;
          }
        }
      }

      finalProducts = allProducts;
    }

    if (!finalProducts.length) {
      let allProducts = [];
      let page = 1;
      let more = true;

      while (more) {
        const res = await fetch(`/products.json?limit=250&page=${page}`);
        const data = await res.json();

        if (data.products.length > 0) {
          allProducts.push(...data.products);
          page++;
        } else {
          more = false;
        }
      }

      finalProducts = allProducts;
    }
    finalProducts = finalProducts.filter((p) => !cartHandles.has(p.handle));

    finalProducts = finalProducts.slice(0, limit);
    window.renderProducts(container, finalProducts, settings);
  } catch (err) {
    console.error(" Error:", err);
  }
};

document.addEventListener("click", (e) => {
  const upgradeBtn = e.target.closest(".hub-upgrade-btn");

  if (upgradeBtn) {
    const wrapper = upgradeBtn.closest(".hub-selling-plan-wrapper");
    const select = wrapper.querySelector(".hub-selling-plan-select");
    const key = select?.dataset.key;

    if (key) {
      window._subscriptionOpen[key] = true;
    }
    wrapper.classList.add("show-subscription");

    if (select) {
      const firstOption = select.querySelector("option:not([disabled])");

      if (firstOption) {
        select.value = firstOption.value;

        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  const backBtn = e.target.closest(".hub-back-to-one-time");
  if (backBtn) {
    const wrapper = backBtn.closest(".hub-selling-plan-wrapper");
    const key = wrapper.querySelector(".hub-selling-plan-select")?.dataset.key;

    if (key) {
      window._subscriptionOpen[key] = false;
    }

    wrapper.classList.remove("show-subscription");
  }
});

document.addEventListener("change", async (e) => {
  const select = e.target.closest(".hub-selling-plan-select");
  if (!select) return;

  const key = select.dataset.key;
  const selling_plan = select.value;

  try {
    await fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: key,
        quantity: 1,
        selling_plan: selling_plan,
      }),
    });

    document.dispatchEvent(new CustomEvent("cart:updated"));
  } catch (err) {
    console.error("Selling plan update error:", err);
  }
});

function debounce(fn, delay) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

document.addEventListener(
  "input",
  debounce(async (e) => {
    if (!e.target.classList.contains("hub-notes-textarea")) return;

    const note = e.target.value;

    try {
      const res = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();
      console.log("NOTE SAVED:", data);
    } catch (err) {
      console.error("Note save error:", err);
    }
  }, 500),
);

window.getUpsellProducts = async function (settings, productId) {
  try {
    let products = [];

    const sourceType = settings.sourceType;
    const selectedItems = settings?.selectedItems || {};

    if (settings.useAiRecommended) {
      let url = `/recommendations/products.json?product_id=${productId}`;

      if (settings.recommendationAlgorithm === "complementary") {
        url += "&intent=complementary";
      }

      const res = await fetch(url);
      const data = await res.json();

      products = data.products || [];
    } else if (sourceType === "products") {
      const ids =
        selectedItems.products?.map((gid) => gid.split("/").pop()) || [];

      if (ids.length) {
        let allProducts = [];
        let page = 1;
        let more = true;

        while (more) {
          const res = await fetch(`/products.json?limit=250&page=${page}`);
          const data = await res.json();

          if (data.products.length > 0) {
            allProducts.push(...data.products);
            page++;
          } else {
            more = false;
          }
        }

        products = allProducts.filter((p) => ids.includes(String(p.id)));
      }
    } else if (sourceType === "collections") {
      const colIds = (selectedItems.collections || []).map((gid) =>
        gid.split("/").pop(),
      );

      const colRes = await fetch(`/collections.json`);
      const colData = await colRes.json();

      const matchedCollections = colData.collections.filter((c) =>
        colIds.includes(String(c.id)),
      );

      let allProducts = [];

      for (const col of matchedCollections) {
        let page = 1;
        let more = true;

        while (more) {
          const res = await fetch(
            `/collections/${col.handle}/products.json?limit=250&page=${page}`,
          );

          const data = await res.json();

          if (data.products.length > 0) {
            allProducts.push(...data.products);
            page++;
          } else {
            more = false;
          }
        }
      }

      products = allProducts;
    }

    if (!settings.showIfAlreadyInCart && window.cart) {
      const cartHandles = new Set(window.cart.items.map((i) => i.handle));

      products = products.filter((p) => !cartHandles.has(p.handle));
    }

    if (settings.limitUpsellsInCart) {
      products = products.slice(0, settings.maxUpsellsInCart);
    }

    return products;
  } catch (err) {
    return [];
  }
};