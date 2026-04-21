const apiUrl =
  "https://023f-2401-4900-1c6f-445c-5962-ef6f-fb18-4f8.ngrok-free.app";

// Used by hubUtils.applyRatings() — same Express backend, no separate Remix URL needed

window.__HUB_RATINGS_URL__ = apiUrl;

function initCartDrawerAfterData() {
  const blockId = window.HUB_CART_BLOCK_ID;
  if (!blockId) return;

  const root =
    document.getElementById(`cart-drawer-App-${blockId}`) || document.body;

  // Only remove theme's native cart elements when our custom drawer is being injected
  if (window.__HUB_ACTIVE_CART__) {
    document
      .querySelectorAll(
        "cart-drawer, #CartDrawer, .cart-drawer, ajax-cart, cart-notification"
      )
      .forEach((el) => {
        // Patch theme methods to no-ops before removal so product-form.js
        // doesn't crash when it calls renderContents on the detached element
        if (typeof el.renderContents === "function") el.renderContents = () => {};
        if (typeof el.open === "function") el.open = () => {};
        el.remove();
      });
  }

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
        const count = cart.item_count || 0;
        const label = count === 1 ? "1 item" : `${count} items`;

        document.querySelectorAll(".cart-count-bubble").forEach((bubble) => {
          const numEl = bubble.querySelector('[aria-hidden="true"]');
          const lblEl = bubble.querySelector(".visually-hidden");
          if (numEl) numEl.textContent = count;
          if (lblEl) lblEl.textContent = label;
          if (!numEl && !lblEl) {
            bubble.innerHTML = `<span aria-hidden="true">${count}</span><span class="visually-hidden">${label}</span>`;
          }
        });

        if (!document.querySelector(".cart-count-bubble")) {
          const cartIcon = document.getElementById("cart-icon-bubble");
          if (cartIcon) {
            const bubble = document.createElement("div");
            bubble.className = "cart-count-bubble";
            bubble.innerHTML = `<span aria-hidden="true">${count}</span><span class="visually-hidden">${label}</span>`;
            cartIcon.appendChild(bubble);
          }
        }
      } catch (_) {}
    };

    function openDrawer(showSkeleton = false) {
      ensureDrawerReady(() => {
        drawer.classList.add(`hub-visible-${blockId}`);
        bg.classList.add(`hub-visible-${blockId}`);

        document.body.classList.add("no-scroll", "overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        document.body.style.overflow = "hidden";

        if (window.hubCartRender) {
          window.hubCartRender(drawer, { showSkeleton });
        }

        // Load recommendations only when drawer opens, and only once
        if (!window._hubRecLoaded && window.__HUB_ACTIVE_CART__) {
          window._hubRecLoaded = true;
          window.loadCartRecommendations?.(window.__HUB_ACTIVE_CART__.recommendationsSettings);
        }

        updateCartCount();
      });
    }

    function closeDrawer() {
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      const bg = document.getElementById(`hub-cart-bg-${blockId}`);

      if (!drawer || !bg) return;

      drawer.classList.remove(`hub-visible-${blockId}`);
      bg.classList.remove(`hub-visible-${blockId}`);
      hubCloseOffersPanel(blockId);
      document.body.classList.remove("no-scroll", "overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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
            if (!window.__HUB_ACTIVE_CART__) return;
            e.preventDefault();
            openDrawer(true);
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
        _cartUpdateTimer = setTimeout(() => openDrawer(true), 300);
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
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getCacheKey(shop) {
    return `hub-cart-settings-${shop}`;
  }

  function readCache(shop) {
    try {
      const raw = localStorage.getItem(getCacheKey(shop));
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function writeCache(shop, data) {
    try {
      localStorage.setItem(
        getCacheKey(shop),
        JSON.stringify({ data, ts: Date.now() })
      );
    } catch (_) {}
  }

  function applyCartData({ cartResult, stickyResult }) {
    // ── Cart drawer ──
    let hasPublishedCart = false;

    if (cartResult?.success && cartResult.data?.length) {
      const publishedCart = cartResult.data.find(
        (cart) => cart.status === "published"
      );

      if (publishedCart) {
        console.log("Published cart found:", publishedCart);
        window.__HUB_ACTIVE_CART__ = publishedCart;
        hasPublishedCart = true;
        initCartDrawerAfterData();
        // Start background prefetch immediately so data is ready when drawer opens
        window._hubRecPrefetch = window._hubFetchRecProducts?.(publishedCart.recommendationsSettings);
      } else {
        console.log("No published cart found");
      }
    } else {
      console.log("No carts found for this shop");
    }

    // ── Sticky cart ──
    if (stickyResult?.success) {
      console.log("Sticky Cart found:", stickyResult.data);
      window.__HUB_STICKY_CART__ = stickyResult.data;

      if (hasPublishedCart) {
        renderStickyCart();
      } else {
        const existingBtn = document.getElementById("hub-sticky-cart-btn");
        if (existingBtn) existingBtn.remove();
      }

      if (stickyResult.data.enabled) {
        console.log("Sticky cart is enabled");
      } else {
        console.log("Sticky cart is disabled");
      }
    } else {
      console.log("No sticky cart found");
    }
  }

  async function fetchCartSettings() {
    const shop = window.__SHOPIFY_SHOP__?.domain;

    if (!shop) {
      console.warn("Shop not set");
      return;
    }

    console.log("Shop:", shop);

    // ── 1. Render from cache immediately (zero wait) ──
    const cached = readCache(shop);
    if (cached) {
      console.log("[hub] Rendering from cache");
      applyCartData(cached);
    }

    // ── 2. Fetch fresh data in background (both requests in parallel) ──
    try {
      const [cartResult, stickyResult] = await Promise.all([
        fetch(`${apiUrl}/api/get-carts?shop=${shop}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        }).then((r) => r.json()),

        fetch(`${apiUrl}/api/get-sticky-cart/${shop}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        }).then((r) => r.json()),
      ]);

      // Store Remix app URL for product ratings API calls
      if (cartResult.remixUrl) {
        window.__HUB_RATINGS_URL__ = cartResult.remixUrl;
      }

      const freshData = { cartResult, stickyResult };

      // Save fresh data to cache
      writeCache(shop, freshData);

      const prevCart = JSON.stringify(window.__HUB_ACTIVE_CART__ ?? null);
      const prevSticky = JSON.stringify(window.__HUB_STICKY_CART__ ?? null);

      const nextCart = JSON.stringify(
        cartResult.data?.find((c) => c.status === "published") ?? null
      );
      const nextSticky = JSON.stringify(stickyResult.data ?? null);

      if (prevCart !== nextCart || prevSticky !== nextSticky) {
        console.log("[hub] Fresh data differs from cache — re-applying");
        applyCartData(freshData);
      } else {
        console.log("[hub] Fresh data matches cache — no re-render needed");
      }
    } catch (err) {
      console.error("Cart settings fetch error:", err);

      if (!cached) {
        console.warn("[hub] No cache and fetch failed — cart will not render");
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchCartSettings);
  } else {
    fetchCartSettings();
  }
})();

// Fetches recommendation products in the background (no rendering).
// Called on page load so data is ready before the drawer opens.
window._hubFetchRecProducts = async function (settings = {}) {
  const limit = settings.maxRecommendations || settings.productCount || 4;
  const selectedItems = settings?.selectedItems || [];
  const sourceType = settings.sourceType ||
    (selectedItems?.products?.length ? "products" : null) ||
    (selectedItems?.collections?.length ? "collections" : null) ||
    (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Collection/") ? "collections" : null) ||
    (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Product/") ? "products" : null);

  const cartRes = await fetch("/cart.js");
  if (!cartRes.ok) return [];
  const cart = await cartRes.json();
  const cartHandles = new Set((cart.items || []).map((item) => item.handle));

  let finalProducts = [];


  if (sourceType === "products") {
    const selectedProductIds =
      settings?.selectedItems?.products?.map((gid) => gid.split("/").pop()) || [];


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
        selectedProductIds.includes(String(p.id))
      );
    }
  } else if (sourceType === "collections") {
    const rawColIds = Array.isArray(selectedItems)
      ? selectedItems
      : (selectedItems?.collections || []);
    const collectionIds = rawColIds.map((gid) => gid.split("/").pop());

    const colRes = await fetch(`/collections.json?limit=250`);
    const colData = await colRes.json();

    const matchedCollections = colData.collections.filter((c) =>
      collectionIds.includes(String(c.id))
    );

    let allProducts = [];

    for (const col of matchedCollections) {
      let page = 1;
      let more = true;

      while (more) {
        const res = await fetch(
          `/collections/${col.handle}/products.json?limit=250&page=${page}`
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

  // Fetch ratings
  try {
    const shop = window.__SHOPIFY_SHOP__?.permanent_domain;
    const appUrl = window.__HUB_APP_URL__;
    if (shop && appUrl && finalProducts.length) {
      const handles = finalProducts.map((p) => p.handle).join(",");
      const ratingsRes = await fetch(
        `${appUrl}/api/hub-ratings?shop=${encodeURIComponent(shop)}&handles=${encodeURIComponent(handles)}`
      );
      if (ratingsRes.ok) {
        const ratings = await ratingsRes.json();
        finalProducts = finalProducts.map((p) => ({
          ...p,
          _hubRating: ratings[p.handle]?.rating ?? null,
          _hubReviewCount: ratings[p.handle]?.count ?? null,
        }));
      }
    }
  } catch (_) {}

  return finalProducts;
};

window.loadCartRecommendations = async function (settings = {}) {
  try {
    const container = document.getElementById("hub-rec-products");
    if (!container) return;

    // Always fetch fresh — prefetch was filtered by cart state at page load,
    // but recommendations show when cart is empty so that filter was wrong.
    window._hubRecPrefetch = null;
    const finalProducts = await window._hubFetchRecProducts(settings);

    window.renderProducts(container, finalProducts, settings);
  } catch (err) {
    console.error("Recommendations error:", err);
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

    const selectedItems = settings?.selectedItems || {};
    const sourceType = settings.sourceType ||
      (selectedItems?.products?.length ? "products" : null) ||
      (selectedItems?.collections?.length ? "collections" : null) ||
      (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Collection/") ? "collections" : null) ||
      (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Product/") ? "products" : null);

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
        // Fetch pages in parallel batches of 3 instead of one-by-one
        let allProducts = [];
        let page = 1;
        let done = false;

        while (!done) {
          const results = await Promise.all(
            [page, page + 1, page + 2].map((p) =>
              fetch(`/products.json?limit=250&page=${p}`)
                .then((r) => r.json())
                .catch(() => ({ products: [] })),
            ),
          );
          for (const data of results) {
            allProducts.push(...(data.products || []));
          }
          if (!results[2].products?.length) done = true;
          else page += 3;
        }

        products = allProducts.filter((p) => ids.includes(String(p.id)));
      }
    } else if (sourceType === "collections") {
      const rawColIds = Array.isArray(selectedItems)
        ? selectedItems
        : (selectedItems.collections || []);
      const colIds = rawColIds.map((gid) => gid.split("/").pop());

      if (colIds.length) {
        const colRes = await fetch(`/collections.json?limit=250`);
        const colData = await colRes.json();
        const matched = (colData.collections || []).filter((c) =>
          colIds.includes(String(c.id)),
        );

        const colResults = await Promise.all(
          matched.map((col) =>
            fetch(`/collections/${col.handle}/products.json?limit=250`)
              .then((r) => r.json())
              .then((d) => d.products || [])
              .catch(() => []),
          ),
        );

        products = colResults.flat();
      }
    }

    if (!settings.showIfAlreadyInCart && window._hubCartProductIds?.size) {
      products = products.filter((p) => !window._hubCartProductIds.has(String(p.id)));
    }

    if (settings.limitUpsellsInCart) {
      products = products.slice(0, settings.maxUpsellsInCart);
    }

    return products;
  } catch (err) {
    return [];
  }
};


// ── Triggered Rewards: auto-add / remove free gift products ──────────────────

window.handleTriggeredRewards = async function handleTriggeredRewards(cart) {
  if (window._hubRewardUpdating) return false;

  const triggeredSettings =
    window.__HUB_ACTIVE_CART__?.triggeredRewardsSettings;
  const rewards = triggeredSettings?.rewards || [];
  const enabledRewards = rewards.filter(
    (r) => r.enabled && r.reward?.type === "free_gift",
  );

  // Collect all active reward IDs so we can detect orphans
  const activeRewardIds = new Set(enabledRewards.map((r) => String(r.id)));

  // ── Remove orphaned gift items (reward was deleted or disabled) ──
  let changed = false;
  for (const item of cart.items) {
    const rewardId = item.properties?._triggered_reward;
    if (rewardId && !activeRewardIds.has(String(rewardId))) {
      try {
        window._hubRewardUpdating = true;
        await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.key, quantity: 0 }),
        });
        changed = true;
        console.log(
          "[triggered-reward] Removed orphaned gift item:",
          item.variant_id,
        );
      } catch (e) {
        console.error("[triggered-reward] Failed to remove orphan:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  if (!enabledRewards.length) return changed;

  // Exclude triggered-reward gift items from the trigger check — otherwise
  // the gift product itself can keep qualifying the trigger it was added by.
  const nonGiftItems = cart.items.filter((i) => !i.properties?._triggered_reward);

  const cartTotal = cart.total_price / 100;
  const cartProductIds = new Set(
    nonGiftItems.map((i) => `gid://shopify/Product/${i.product_id}`),
  );
  const cartVariantIds = new Set(
    nonGiftItems.map((i) => `gid://shopify/ProductVariant/${i.variant_id}`),
  );

  for (const reward of enabledRewards) {
    const qualifies = await checkTriggers(reward.triggers, {
      cartTotal,
      cartProductIds,
      cartVariantIds,
      cart,
    });
    const giftItems = reward.reward?.items || {};
    const giftVariantIds = giftItems.variants || [];
    const giftProductIds = new Set(giftItems.products || []);

    // Only match items that were actually added as a triggered reward —
    // a regular purchase of the same product must not block the free gift.
    const giftInCart = cart.items.find(
      (i) =>
        String(i.properties?._triggered_reward) === String(reward.id) &&
        (giftVariantIds.includes(
          `gid://shopify/ProductVariant/${i.variant_id}`,
        ) || giftProductIds.has(`gid://shopify/Product/${i.product_id}`)),
    );

    if (qualifies && !giftInCart && giftVariantIds.length > 0) {
      // Add first variant of the gift product
      const variantGid = giftVariantIds[0];
      const variantId = variantGid.replace("gid://shopify/ProductVariant/", "");

      try {
        window._hubRewardUpdating = true;
        const addRes = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                id: Number(variantId),
                quantity: 1,
                properties: { _triggered_reward: reward.id },
              },
            ],
          }),
        });
        if (!addRes.ok) {
          const errBody = await addRes.text();
          console.error(
            "[triggered-reward] /cart/add.js failed:",
            addRes.status,
            errBody,
          );
        } else {
          changed = true;
          console.log("[triggered-reward] Added free gift:", variantId);
        }
      } catch (e) {
        console.error("[triggered-reward] Failed to add gift:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }

    if (!qualifies && giftInCart) {
      try {
        window._hubRewardUpdating = true;
        await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: giftInCart.key, quantity: 0 }),
        });
        changed = true;
        console.log(
          "[triggered-reward] Removed free gift (trigger failed):",
          giftInCart.variant_id,
        );
      } catch (e) {
        console.error("[triggered-reward] Failed to remove gift:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  return changed;
};

async function checkTriggers(
  triggers,
  { cartTotal, cartProductIds, cartVariantIds, cart },
) {
  if (!triggers || triggers.length === 0) return true;
  for (const t of triggers) {
    const result = await checkTrigger(t, { cartTotal, cartProductIds, cartVariantIds, cart });
    if (!result) return false;
  }
  return true;
}

async function checkTrigger(
  trigger,
  { cartTotal, cartProductIds, cartVariantIds, cart },
) {
  switch (trigger.type) {
    case "cart_total":
      return cartTotal >= Number(trigger.minAmount || 0);

    case "cart_quantity": {
      const qty = cart.items.reduce((s, i) => s + i.quantity, 0);
      return qty >= Number(trigger.minQuantity || 0);
    }

    case "specific_products": {
      const pids = trigger.items?.products || [];
      const vids = trigger.items?.variants || [];
      return (
        pids.some((id) => cartProductIds.has(id)) ||
        vids.some((id) => cartVariantIds.has(id))
      );
    }

    case "specific_collections": {
      // trigger.items is a flat array of collection GIDs e.g. ["gid://shopify/Collection/123"]
      const collectionGids = Array.isArray(trigger.items) ? trigger.items : [];
      if (!collectionGids.length) return false;

      // Shopify storefront requires handle (not numeric ID) for /collections/{handle}/products.json
      // Build a one-time ID→handle map from /collections.json
      if (!window._hubCollHandleMap) {
        try {
          const res = await fetch("/collections.json?limit=250");
          if (res.ok) {
            const data = await res.json();
            window._hubCollHandleMap = {};
            for (const col of data.collections) {
              window._hubCollHandleMap[String(col.id)] = col.handle;
            }
          } else {
            window._hubCollHandleMap = {};
          }
        } catch (e) {
          console.error("[triggered-reward] Failed to fetch collections list:", e);
          window._hubCollHandleMap = {};
        }
      }

      window._hubCollCache = window._hubCollCache || {};

      for (const collGid of collectionGids) {
        const collId = collGid.replace("gid://shopify/Collection/", "");
        const handle = window._hubCollHandleMap[collId];
        if (!handle) {
          console.warn("[triggered-reward] No handle found for collection ID:", collId);
          continue;
        }
        try {
          let collProductIds = window._hubCollCache[collId];
          if (!collProductIds) {
            const res = await fetch(`/collections/${handle}/products.json?limit=250`);
            if (!res.ok) continue;
            const data = await res.json();
            collProductIds = new Set(
              data.products.map((p) => `gid://shopify/Product/${p.id}`),
            );
            window._hubCollCache[collId] = collProductIds;
          }
          for (const pid of cartProductIds) {
            if (collProductIds.has(pid)) return true;
          }
        } catch (e) {
          console.error("[triggered-reward] Collection check failed:", handle, e);
        }
      }
      return false;
    }

    case "customer_logged_in":
      return false;

    case "subscription":
      return false;

    default:
      return true;
  }
}

// ── Offers Panel ──────────────────────────────────────────────────────────────

function hubRenderOffersPanel(blockId, allDiscountCodes, activeDiscountCodes, cart) {
  const totalEl = document.getElementById(`hub-offers-cart-total-${blockId}`);
  if (totalEl) {
    totalEl.textContent = `Your Cart: ${hubUtils.formatMoney(cart.total_price || 0)}`;
  }

  const list = document.getElementById(`hub-offers-list-${blockId}`);
  if (!list) return;

  // cart.discount_codes is the real source — codes actually applied to this cart
  const appliedCodes = new Set(
    (cart.discount_codes || []).map((c) => (c.code || "").toUpperCase()).filter(Boolean)
  );

  const validCodes = (allDiscountCodes || []).filter(
    (d) => d.title && d.status !== "EXPIRED" && d.type !== "DiscountAutomaticApp"
  );

  if (validCodes.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:#888;font-size:13px;padding:20px 0;">No offers available</p>`;
    return;
  }

  list.innerHTML = validCodes.map((d) => {
    const label = d.title.toUpperCase();
    const isActive = appliedCodes.has(label);
    const savings = d.savings || d.description || "";
    const subtitle = d.subtitle || d.terms || "";
    const actionBtn = isActive
      ? `<button class="hub-coupon-action-btn remove" onclick="hubRemoveOfferCode('${label}','${blockId}')">REMOVE</button>`
      : `<button class="hub-coupon-action-btn apply" onclick="hubApplyOfferCode2('${label}','${blockId}')">APPLY</button>`;

    return `
      <div class="hub-coupon-card">
        <div class="hub-coupon-badge">${label}</div>
        <div class="hub-coupon-body">
          <div class="hub-coupon-top">
            <span class="hub-coupon-code">${label}</span>
            ${actionBtn}
          </div>
          ${savings ? `<div class="hub-coupon-savings">${savings}</div>` : ""}
          ${subtitle ? `<div class="hub-coupon-desc">${subtitle}</div>` : ""}
        </div>
      </div>`;
  }).join("");
}

window.hubOpenOffersPanel = function (blockId) {
  document.getElementById(`hub-offers-panel-${blockId}`)?.classList.add("hub-offers-open");
  document.getElementById(`hub-offers-backdrop-${blockId}`)?.classList.add("hub-offers-open");
  document.getElementById(`hub-offers-close-${blockId}`)?.classList.add("hub-offers-open");
  document.querySelector(`.hub-cart-block-${blockId}`)?.classList.add("hub-offers-open-body");
};

window.hubCloseOffersPanel = function (blockId) {
  document.getElementById(`hub-offers-panel-${blockId}`)?.classList.remove("hub-offers-open");
  document.getElementById(`hub-offers-backdrop-${blockId}`)?.classList.remove("hub-offers-open");
  document.getElementById(`hub-offers-close-${blockId}`)?.classList.remove("hub-offers-open");
  document.querySelector(`.hub-cart-block-${blockId}`)?.classList.remove("hub-offers-open-body");
};

window.hubApplyOfferCode = async function (blockId) {
  const input = document.getElementById(`hub-offers-input-${blockId}`);
  const code = input?.value?.trim();
  if (!code) return;
  await hubApplyOfferCode2(code, blockId);
  if (input) input.value = "";
};

async function hubApplyOfferCode2(code, blockId) {
  try {
    const cartBefore = await (await fetch("/cart.js")).json();
    const totalBefore = cartBefore.total_price || 0;

    const hasExisting = (cartBefore.discount_codes || []).some((c) => c.code);
    if (hasExisting) {
      await fetch("/cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: "" }),
      });
    }
    await fetch(`/discount/${encodeURIComponent(code)}`);

    const cartAfter = await (await fetch("/cart.js")).json();
    const savings = totalBefore - (cartAfter.total_price || 0);

    hubCloseOffersPanel(blockId);
    const drawer = document.querySelector(`.hub-cart-block-${blockId}`);
    if (drawer) await window.hubCartRender(drawer);

    const overlay = document.getElementById(`hub-coupon-success-${blockId}`);
    if (overlay) {
      const label = code.toUpperCase();
      document.getElementById(`hub-coupon-success-applied-${blockId}`).textContent = `"${label}" applied`;
      document.getElementById(`hub-coupon-success-headline-${blockId}`).textContent =
        savings > 0
          ? `${hubUtils.formatMoney(savings)} SAVINGS WITH THIS COUPON`
          : `COUPON APPLIED!`;
      document.getElementById(`hub-coupon-success-desc-${blockId}`).textContent =
        `Use code ${label} and save every time you order`;
      overlay.style.display = "flex";
    }
  } catch (e) {
    console.warn("[hub] Failed to apply offer code:", e);
  }
}

window.hubCloseCouponSuccess = function (blockId) {
  const overlay = document.getElementById(`hub-coupon-success-${blockId}`);
  if (overlay) overlay.style.display = "none";
};

window.hubRemoveOfferCode = async function (code, blockId) {
  try {
    await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: "" }),
    });
    hubCloseOffersPanel(blockId);
    const drawer = document.querySelector(`.hub-cart-block-${blockId}`);
    if (drawer) await window.hubCartRender(drawer);
  } catch (e) {
    console.warn("[hub] Failed to remove offer code:", e);
  }
};
