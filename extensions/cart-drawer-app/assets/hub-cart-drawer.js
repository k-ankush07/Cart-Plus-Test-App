// ─────────────────────────────────────────────────────────────────────────────
// HUB DRAWER CODE
const API_KEY =
  "8f4c2a91d7e3b6f5a8c1d9e2f7b4c6a9e1d3f8b5c2a7d4e9f6b1c8a3d7e5f2";

const authHeaders = (extra = {}) => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
  ...extra,
});

const apiUrl = "https://app.cartplus.io";

function getSessionId() {
  let sessionId = sessionStorage.getItem("hub_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("hub_session_id", sessionId);
  }
  return sessionId;
}

window._hubGetSessionId = getSessionId;
window.__HUB_API_URL__ = apiUrl;

function trackCartImpressionUnique() {
  const cartId = window.__HUB_ACTIVE_CART__?.cartId || null;
  const key = `hub_cart_impression_tracked_${cartId}`;

  if (localStorage.getItem(key)) {
    console.log("[HUB] Impression already tracked, skipping.");
    return;
  }

  localStorage.setItem(key, "true");

  fetch(`${apiUrl}/api/cart-impression`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      shop: window.__SHOPIFY_SHOP__?.domain,
      cartId,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("[HUB] Impression response:", data))
    .catch((err) => {
      localStorage.removeItem(key);
      console.error("[HUB] Impression error:", err);
    });
}

window.__HUB_RATINGS_URL__ = apiUrl;

function initCartDrawerAfterData() {
  const blockId = window.HUB_CART_BLOCK_ID;
  if (!blockId) return;

  const root =
    document.getElementById(`cart-drawer-App-${blockId}`) || document.body;

  if (window.__HUB_ACTIVE_CART__) {
    document
      .querySelectorAll(
        "cart-drawer, #CartDrawer, .cart-drawer, ajax-cart, cart-notification",
      )
      .forEach((el) => {
        if (typeof el.renderContents === "function")
          el.renderContents = () => {};
        if (typeof el.open === "function") el.open = () => {};
        el.remove();
      });
  }

  document.getElementById(`hub-cart-drawer-${blockId}`)?.remove();
  document.getElementById(`hub-cart-bg-${blockId}`)?.remove();
  window.injectCartHTML(blockId, root);
}

// ── FETCH INTERCEPTOR (defined ONCE) ─────────────────────────────────────────

(function () {
  // Guard: only patch once even if this file is loaded multiple times
  if (window.__hubFetchPatched) return;
  window.__hubFetchPatched = true;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    let [input, init] = args;
    const url = typeof input === "string" ? input : input?.url || "";

    // ── Inject hub tracking properties on cart/add ──
    if (url.includes("/cart/add")) {
      try {
        if (!init?.body || typeof init.body !== "string")
          throw new Error("skip");
        const body = JSON.parse(init.body);

        const isAlreadyTagged = (props = {}) =>
          props.__upcartAddon ||
          props.__upcartRecommendation ||
          props._hub_reward ||
          props._triggered_reward ||
          props._hub_addon;

        if (Array.isArray(body.items)) {
          body.items = body.items.map((item) => {
            const props = item.properties || {};
            return {
              ...item,
              properties: isAlreadyTagged(props)
                ? props
                : {
                    __upcartRewardProduct: String(item.id),
                    __upcartTier: "",
                    __upcartProductTier: "",
                    ...props,
                  },
            };
          });
        } else if (body.id) {
          const props = body.properties || {};
          body.properties = isAlreadyTagged(props)
            ? props
            : {
                __upcartRewardProduct: String(body.id),
                __upcartTier: "",
                __upcartProductTier: "",
                ...props,
              };
        }

        init = {
          ...init,
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
          },
        };
        args = [input, init];
      } catch (e) {
        console.warn("[hub] Could not inject properties:", e);
      }
    }

    if (
      url.includes("/cart/add") &&
      !window._hubRewardUpdating &&
      !window._hubVariantSwapping
    ) {
      const blockId = window.HUB_CART_BLOCK_ID;
      const items =
        blockId && document.getElementById(`hub-cart-items-${blockId}`);
      if (
        items &&
        items.querySelector(".hub-cart-empty") &&
        window.hubUtils?.getCartItemsSkeletonHTML
      ) {
        window._hubLastCartHadItems = true;
        items.innerHTML = window.hubUtils.getCartItemsSkeletonHTML(blockId);
        items.classList.remove("footer-empty");
        const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
        if (footerRec) footerRec.innerHTML = "";
        const footer = document.querySelector(
          `#hub-cart-drawer-${blockId} .hub-cart-footer`,
        );
        if (footer) footer.classList.remove("hub-empty-footer");
        window.hubUtils.showCartSkeleton(blockId);
      }
    }

    const response = await originalFetch.apply(this, args);

    // ── Fire cart:updated for mutations ──
    if (window._hubRewardUpdating || window._hubVariantSwapping)
      return response;
    if (window._hubCommitingRemoval) return response;

    if (
      url.includes("/cart/add") ||
      url.includes("/cart/change") ||
      url.includes("/cart/clear")
    ) {
      if (response.ok) {
        if (url.includes("/cart/add")) window._hubLastCartHadItems = true;
        else if (url.includes("/cart/clear"))
          window._hubLastCartHadItems = false;
      }
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

// ── CART INITIALISATION ───────────────────────────────────────────────────────
(function () {
  let isEventBound = false;

  function initCart() {
    const blockId = window.HUB_CART_BLOCK_ID;
    if (!blockId) return;

    let drawer = null;
    let bg = null;
    let _drawerOpening = false;

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
        window._hubLastCartHadItems = (cart.items?.length || 0) > 0;

        const includeAddonsInCount =
          window.__HUB_ACTIVE_CART__?.addonsSettings?.includeInItemCount ===
          true;

        const count = cart.items
          .filter(
            (i) =>
              !i.properties?._triggered_reward &&
              (includeAddonsInCount ||
                (!i.properties?._hub_addon && !i.properties?.__upcartAddon)),
          )
          .reduce((sum, i) => sum + i.quantity, 0);
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
      if (_drawerOpening) return;
      _drawerOpening = true;
      ensureDrawerReady(() => {
        drawer.classList.add(`hub-visible-${blockId}`);
        bg.classList.add(`hub-visible-${blockId}`);
        trackCartImpressionUnique();
        document.body.classList.add("no-scroll", "overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        document.body.style.overflow = "hidden";

        const drawerIsOpen = drawer.classList.contains(
          `hub-visible-${blockId}`,
        );
        const itemsEl = document.getElementById(`hub-cart-items-${blockId}`);
        const hasRenderedItems = !!itemsEl?.querySelector(".hub-cart-item");
        const shouldShowSkeleton =
          showSkeleton &&
          window._hubLastCartHadItems !== false &&
          (!drawerIsOpen || !hasRenderedItems);
        if (shouldShowSkeleton) {
          const itemsEl = document.getElementById(`hub-cart-items-${blockId}`);
          if (itemsEl) {
            itemsEl.innerHTML = `
          <div class="hub-skeleton-inject" style="padding:16px;">
            <div style="display:flex;gap:12px;margin-bottom:16px;">
              <div class="hub-skeleton" style="width:72px;height:72px;flex-shrink:0;border-radius:8px;">&nbsp;</div>
              <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                <div class="hub-skeleton hub-skeleton-line" style="width:80%;height:14px;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:50%;height:12px;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:40%;height:12px;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:60%;height:28px;border-radius:4px;">&nbsp;</div>
              </div>
            </div>
          </div>`;
            itemsEl.style.visibility = "visible";
            itemsEl.classList.remove("footer-empty");
          }

          const footerSkel = document.getElementById(
            `hub-footer-skeleton-${blockId}`,
          );
          const footer = document.querySelector(
            `#hub-cart-drawer-${blockId} .hub-cart-footer`,
          );
          if (footerSkel) footerSkel.style.display = "flex";
          if (footer) {
            footer.classList.add("hub-footer-loading");
            footer.classList.remove("hub-empty-footer");
          }

          const footerRec = document.getElementById(
            `hub-footer-rec-${blockId}`,
          );
          if (footerRec) footerRec.innerHTML = "";
        }

        if (window.hubCartRender && !window._hubRenderInProgress) {
          window.hubCartRender(drawer, { showSkeleton: false });
        } else if (window.hubCartRender && window._hubRenderInProgress) {
          window._hubPendingRender = { drawer, opts: { showSkeleton: false } };
        }

        if (!window._hubRecLoaded && window.__HUB_ACTIVE_CART__) {
          window._hubRecLoaded = true;
          window.loadCartRecommendations?.(
            window.__HUB_ACTIVE_CART__.recommendationsSettings,
          );
        }

        updateCartCount();
        _drawerOpening = false;
      });
    }

    function closeDrawer() {
      const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
      const bg = document.getElementById(`hub-cart-bg-${blockId}`);
      if (!drawer || !bg) return;
      drawer.classList.remove(`hub-visible-${blockId}`);
      bg.classList.remove(`hub-visible-${blockId}`);
      hubCloseOffersPanel(blockId);

      const breakdown = document.getElementById(
        `hub-total-breakdown-${blockId}`,
      );
      if (breakdown) {
        breakdown.classList.remove("hub-breakdown-open");

        const arrow = breakdown
          .closest(".hub-total-summary")
          ?.querySelector(".hub-total-arrow");
        if (arrow) arrow.style.transform = "rotate(0deg)";

        const totalSummary = breakdown.closest(".hub-total-summary");
        if (totalSummary)
          totalSummary.classList.remove("hub-total-summary--open");

        drawer.classList.remove("hub-cart-total-open");
      }

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
            [
              "#cart-icon-bubble",
              "#CartDrawer-Icon",
              "#cart-icon",
              "#CartLink",
              "#cart-link",
              "#CartDrawerIcon",
              ".cart-icon",
              ".cart-link",
              ".site-header__cart",
              ".header__icon--cart",
              ".header-cart",
              ".js-cart-toggle",
              ".js-drawer-open-cart",
              ".js-drawer-open-right",
              ".js-drawer-open",
              ".cart-toggle",
              ".cart-notification-icon",
              ".site-nav__link--cart",
              ".icon-cart",
              ".site-header__icon--cart",
              ".header__cart-toggle",
              ".mini-cart-link",
              ".cart__toggle",
              ".cart-drawer-trigger",
              ".cart-drawer__trigger",
              ".header-actions__cart",
              ".navlink--cart",
              ".cart-icon-bubble",
              ".btn--cart",
              ".cart-btn",
              "[data-cart]",
              "[data-cart-icon]",
              "[data-cart-drawer]",
              "[data-cart-toggle]",
              "[data-drawer-toggle='cart']",
              "[data-action='open-cart-drawer']",
              "[data-open-cart]",
              "[aria-controls='CartDrawer']",
              "[aria-controls='cart-drawer']",
              "[aria-controls='CartDrawer-Icon']",
              "a[href='/cart']",
              "a[href$='/cart']",
            ].join(", "),
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
      document.addEventListener("cart:updated", function (e) {
        if (window._hubRewardUpdating) return;

        window.updateCartCount();

        if (window._hubCommitingRemoval) return;

        clearTimeout(_cartUpdateTimer);

        if (e?.detail?.skipItemRerender) {
          return;
        }

        const shouldOpen =
          window.__HUB_ACTIVE_CART__?.cartSettings?.openOnAddToCart !== false;
        if (shouldOpen) {
          _cartUpdateTimer = setTimeout(() => openDrawer(true), 100);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".cart-count-bubble").forEach((el) => {
        el.style.visibility = "hidden";
      });
      initCart();
      window.updateCartCount?.().finally?.(() => {
        document.querySelectorAll(".cart-count-bubble").forEach((el) => {
          el.style.visibility = "";
        });
      });
    });
  } else {
    document.querySelectorAll(".cart-count-bubble").forEach((el) => {
      el.style.visibility = "hidden";
    });
    initCart();
    window.updateCartCount?.().finally?.(() => {
      document.querySelectorAll(".cart-count-bubble").forEach((el) => {
        el.style.visibility = "";
      });
    });
  }
})();

// ── ANNOUNCEMENT COUNTDOWN TIMER ──────────────────────────────────────────────
const _annTimerIntervals = {};

window.startAnnTimer = function (blockId, timeStr) {
  if (_annTimerIntervals[blockId]) {
    clearInterval(_annTimerIntervals[blockId]);
    delete _annTimerIntervals[blockId];
  }

  const storageKey = `hub-timer-${blockId}`;
  const storageMetaKey = `hub-timer-${blockId}-src`;

  const parts = timeStr.split(":").map(Number);
  const intendedSeconds =
    parts.length === 2
      ? parts[0] * 60 + parts[1]
      : parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);

  let totalSeconds;
  const savedEndTime = localStorage.getItem(storageKey);
  const savedSrc = localStorage.getItem(storageMetaKey);

  if (savedSrc !== timeStr) {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageMetaKey);
  }
  const freshEndTime = savedSrc === timeStr ? savedEndTime : null;

  if (freshEndTime) {
    const remaining = Math.floor((Number(freshEndTime) - Date.now()) / 1000);
    if (remaining > 0) {
      totalSeconds = remaining;
    } else {
      localStorage.setItem(`${storageKey}-done`, "true");
      const el = document.getElementById(`hub-timer-${blockId}`);
      if (el) el.style.display = "none";
      return;
    }
  } else {
    totalSeconds = intendedSeconds;
    localStorage.setItem(storageKey, String(Date.now() + totalSeconds * 1000));
    localStorage.setItem(storageMetaKey, timeStr);
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
      localStorage.setItem(`${storageKey}-done`, "true");
      const el = document.getElementById(`hub-timer-${blockId}`);
      if (el) el.style.display = "none";
    }
    const el = document.getElementById(`hub-timer-${blockId}`);
    if (el) el.textContent = fmt(totalSeconds);
    totalSeconds--;
  }

  tick();
  _annTimerIntervals[blockId] = setInterval(tick, 1000);
};

// ── CART SETTINGS CACHE & FETCH ───────────────────────────────────────────────
(function () {
  const CACHE_TTL = 5 * 60 * 1000;

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
        JSON.stringify({ data, ts: Date.now() }),
      );
    } catch (_) {}
  }

  function applyCartData({ cartResult, stickyResult }) {
    let hasPublishedCart = false;

    if (cartResult?.entitled === false) {
      console.log(
        "[hub] Store not entitled (free plan on a live store) — drawer disabled",
      );
      const blockId = window.HUB_CART_BLOCK_ID;
      // Tear down anything already rendered (e.g. from a stale cache hit) and
      // clear active state so no premium module can read it.
      document.getElementById(`hub-cart-drawer-${blockId}`)?.remove();
      document.getElementById(`hub-cart-bg-${blockId}`)?.remove();
      document.getElementById("hub-sticky-cart-btn")?.remove();
      window.__HUB_ACTIVE_CART__ = null;
      return;
    }

    if (cartResult?.success && cartResult.data?.length) {
      const publishedCart = cartResult.data.find(
        (cart) => cart.status === "published",
      );
      if (publishedCart) {
        console.log("Published cart found:", publishedCart);
        window.__HUB_ACTIVE_CART__ = publishedCart;
        hasPublishedCart = true;
        initCartDrawerAfterData();
        window._hubRecPrefetch = window._hubFetchRecProducts?.(
          publishedCart.recommendationsSettings,
        );

        trackCartImpressionUnique();
        queueMicrotask(() => {
          const drawerEl = document.getElementById(
            `hub-cart-drawer-${window.HUB_CART_BLOCK_ID}`,
          );
          if (drawerEl && window.hubCartRender) {
            window.hubCartRender(drawerEl, { showSkeleton: true });
          }
        });
      } else {
        console.log("No published cart found");
      }
    } else {
      console.log("No carts found for this shop");
    }

    if (stickyResult?.success) {
      console.log("Sticky Cart found:", stickyResult.data);
      window.__HUB_STICKY_CART__ = stickyResult.data;
      if (hasPublishedCart) {
        renderStickyCart();
      } else {
        const existingBtn = document.getElementById("hub-sticky-cart-btn");
        if (existingBtn) existingBtn.remove();
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

    const cached = readCache(shop);
    if (cached) {
      console.log("[hub] Rendering from cache");
      applyCartData(cached);
    }

    try {
      const [cartResult, stickyResult] = await Promise.all([
        fetch(`${apiUrl}/api/get-carts?shop=${shop}`, {
          headers: authHeaders(),
        }).then((r) => r.json()),
        fetch(`${apiUrl}/api/get-sticky-cart/${shop}`, {
          headers: authHeaders(),
        }).then((r) => r.json()),
      ]);

      if (cartResult.remixUrl) window.__HUB_RATINGS_URL__ = cartResult.remixUrl;

      const freshData = { cartResult, stickyResult };
      writeCache(shop, freshData);

      const prevCart = JSON.stringify(window.__HUB_ACTIVE_CART__ ?? null);
      const prevSticky = JSON.stringify(window.__HUB_STICKY_CART__ ?? null);
      const nextCart = JSON.stringify(
        cartResult.data?.find((c) => c.status === "published") ?? null,
      );
      const nextSticky = JSON.stringify(stickyResult.data ?? null);

      // Entitlement can flip independently of cart content (e.g. a plan
      // downgrade), so re-apply when it changes too — applyCartData() then
      // tears the drawer down if the store is no longer entitled.
      const entitlementChanged =
        (cached?.cartResult?.entitled ?? true) !==
        (cartResult?.entitled ?? true);

      if (
        prevCart !== nextCart ||
        prevSticky !== nextSticky ||
        entitlementChanged
      ) {
        console.log("[hub] Fresh data differs from cache — re-applying");
        applyCartData(freshData);
      } else {
        console.log("[hub] Fresh data matches cache — no re-render needed");
      }
    } catch (err) {
      console.error("Cart settings fetch error:", err);
      if (!cached)
        console.warn("[hub] No cache and fetch failed — cart will not render");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchCartSettings);
  } else {
    fetchCartSettings();
  }
})();

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────
window._hubFetchRecProducts = async function (settings = {}) {
  const limit = settings.maxRecommendations || settings.productCount || 4;
  const selectedItems = settings?.selectedItems || [];
  const sourceType =
    settings.sourceType ||
    (selectedItems?.products?.length ? "products" : null) ||
    (selectedItems?.collections?.length ? "collections" : null) ||
    (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Collection/")
      ? "collections"
      : null) ||
    (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Product/")
      ? "products"
      : null);

  const cartRes = await fetch("/cart.js");
  if (!cartRes.ok) return [];
  const cart = await cartRes.json();
  const cartHandles = new Set((cart.items || []).map((item) => item.handle));

  let finalProducts = [];

  if (sourceType === "products") {
    const selectedProductIds =
      settings?.selectedItems?.products?.map((gid) => gid.split("/").pop()) ||
      [];
    if (selectedProductIds.length) {
      let allProducts = [],
        page = 1,
        more = true;
      while (more) {
        const res = await fetch(`/products.json?limit=250&page=${page}`);
        const data = await res.json();
        if (data.products.length > 0) {
          allProducts.push(...data.products);
          page++;
        } else more = false;
      }
      finalProducts = allProducts.filter((p) =>
        selectedProductIds.includes(String(p.id)),
      );
    }
  } else if (sourceType === "collections") {
    const rawColIds = Array.isArray(selectedItems)
      ? selectedItems
      : selectedItems.collections || [];
    const collectionIds = rawColIds.map((gid) => gid.split("/").pop());

    let allProducts = [];
    for (const colId of collectionIds) {
      let page = 1,
        more = true;
      while (more) {
        const res = await fetch(
          `/collections/${colId}/products.json?limit=250&page=${page}`,
        );
        if (!res.ok) {
          more = false;
          break;
        }
        const data = await res.json();
        if (data.products?.length > 0) {
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
    let allProducts = [],
      page = 1,
      more = true;
    while (more) {
      const res = await fetch(`/products.json?limit=250&page=${page}`);
      const data = await res.json();
      if (data.products.length > 0) {
        allProducts.push(...data.products);
        page++;
      } else more = false;
    }
    finalProducts = allProducts;
  }

  finalProducts = finalProducts
    .filter((p) => !cartHandles.has(p.handle))
    .slice(0, limit);

  try {
    const shop = window.__SHOPIFY_SHOP__?.permanent_domain;
    const appUrl = window.__HUB_APP_URL__;
    if (shop && appUrl && finalProducts.length) {
      const handles = finalProducts.map((p) => p.handle).join(",");
      const ratingsRes = await fetch(
        `${appUrl}/api/hub-ratings?shop=${encodeURIComponent(shop)}&handles=${encodeURIComponent(handles)}`,
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
    const prefetched = window._hubRecPrefetch;
    window._hubRecPrefetch = null;
    const finalProducts = await (prefetched ||
      window._hubFetchRecProducts(settings));
    window.renderProducts(container, finalProducts, settings);
  } catch (err) {
    console.error("Recommendations error:", err);
  }
};

// ── SUBSCRIPTION PLAN HANDLERS ────────────────────────────────────────────────
document.addEventListener("click", (e) => {
  const upgradeBtn = e.target.closest(".hub-upgrade-btn");
  if (upgradeBtn) {
    const wrapper = upgradeBtn.closest(".hub-selling-plan-wrapper");
    const select = wrapper.querySelector(".hub-selling-plan-select");
    const key = select?.dataset.key;
    if (key) window._subscriptionOpen[key] = true;
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
    if (key) window._subscriptionOpen[key] = false;
    wrapper.classList.remove("show-subscription");
  }
});

document.addEventListener("change", async (e) => {
  const select = e.target.closest(".hub-selling-plan-select");
  if (!select) return;
  const key = select.dataset.key;
  const selling_plan = select.value;
  try {
    const cartRes = await fetch("/cart.js");
    const cart = await cartRes.json();
    const existingItem = cart.items.find((i) => i.key === key);
    const existingProps = existingItem?.properties || {};
    await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: key,
        quantity: 1,
        selling_plan: selling_plan || null,
        properties: selling_plan
          ? { ...existingProps, _hub_subscription: "true" }
          : (({ _hub_subscription, ...rest }) => rest)(existingProps),
      }),
    });
    document.dispatchEvent(new CustomEvent("cart:updated"));
  } catch (err) {
    console.error("Selling plan update error:", err);
  }
});

// ── UPSELL PRODUCTS ───────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

window.getUpsellProducts = async function (settings, productId) {
  try {
    let products = [];
    const selectedItems = settings?.selectedItems || {};
    const sourceType =
      settings.sourceType ||
      (selectedItems?.products?.length ? "products" : null) ||
      (selectedItems?.collections?.length ? "collections" : null) ||
      (Array.isArray(selectedItems) &&
      selectedItems[0]?.includes("/Collection/")
        ? "collections"
        : null) ||
      (Array.isArray(selectedItems) && selectedItems[0]?.includes("/Product/")
        ? "products"
        : null);

    if (settings.useAiRecommended) {
      let url = `/recommendations/products.json?product_id=${productId}`;
      if (settings.recommendationAlgorithm === "complementary")
        url += "&intent=complementary";
      const res = await fetch(url);
      const data = await res.json();
      products = (data.products || []).map((product) => ({
        ...product,
        variants: (product.variants || []).map((v) => ({
          ...v,
          price: v.price ? (Number(v.price) / 100).toFixed(2) : "0.00",
          compare_at_price: v.compare_at_price
            ? (Number(v.compare_at_price) / 100).toFixed(2)
            : null,
        })),
      }));
    } else if (sourceType === "products") {
      const ids =
        selectedItems.products?.map((gid) => gid.split("/").pop()) || [];
      if (ids.length) {
        let allProducts = [],
          page = 1,
          done = false;
        while (!done) {
          const results = await Promise.all(
            [page, page + 1, page + 2].map((p) =>
              fetch(`/products.json?limit=250&page=${p}`)
                .then((r) => r.json())
                .catch(() => ({ products: [] })),
            ),
          );
          for (const data of results)
            allProducts.push(...(data.products || []));
          if (!results[2].products?.length) done = true;
          else page += 3;
        }
        products = allProducts.filter((p) => ids.includes(String(p.id)));
      }
    } else if (sourceType === "collections") {
      const rawColIds = Array.isArray(selectedItems)
        ? selectedItems
        : selectedItems.collections || [];
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

    if (!settings.showIfAlreadyInCart) {
      try {
        const cartRes = await fetch(`/cart.js?_=${Date.now()}`);
        const cart = await cartRes.json();
        const cartProductIds = new Set(
          cart.items.map((i) => String(i.product_id)),
        );
        const cartHandles = new Set(cart.items.map((i) => i.handle));
        window._hubCartProductIds = cartProductIds;
        window._hubCartHandles = cartHandles;
        products = products.filter((p) => {
          const byId = cartProductIds.has(String(p.id));
          const byHandle = p.handle && cartHandles.has(p.handle);
          return !byId && !byHandle;
        });
      } catch (_) {
        if (window._hubCartProductIds?.size) {
          products = products.filter(
            (p) => !window._hubCartProductIds.has(String(p.id)),
          );
        }
      }
    }

    products = products.filter((p) => {
      const variants = p.variants || [];
      return (
        p.available !== false && variants.some((v) => v.available !== false)
      );
    });

    if (settings.limitUpsellsInCart)
      products = products.slice(0, settings.maxUpsellsInCart);
    return products;
  } catch (err) {
    console.error("[hub] getUpsellProducts error:", err);
    return [];
  }
};

// ── TRIGGERED REWARDS ─────────────────────────────────────────────────────────
window.handleTriggeredRewards = async function handleTriggeredRewards(cart) {
  if (window._hubRewardUpdating) return false;

  const triggeredSettings =
    window.__HUB_ACTIVE_CART__?.triggeredRewardsSettings;
  const rewards = triggeredSettings?.rewards || [];
  const enabledRewards = rewards.filter(
    (r) => r.enabled && r.reward?.type === "free_gift",
  );
  const activeRewardIds = new Set(enabledRewards.map((r) => String(r.id)));

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
      } catch (e) {
        console.error("[triggered-reward] Failed to remove orphan:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  if (!enabledRewards.length) return changed;

  const nonGiftItems = cart.items.filter(
    (i) => !i.properties?._triggered_reward,
  );
  const cartTotal =
    nonGiftItems.reduce((sum, i) => sum + i.final_line_price, 0) / 100;
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
      nonGiftItems,
    });
    const giftItems = reward.reward?.items || {};
    const giftVariantIds = giftItems.variants || [];
    const giftProductIds = new Set(giftItems.products || []);

    const giftInCart = cart.items.find(
      (i) =>
        String(i.properties?._triggered_reward) === String(reward.id) &&
        (giftVariantIds.includes(
          `gid://shopify/ProductVariant/${i.variant_id}`,
        ) ||
          giftProductIds.has(`gid://shopify/Product/${i.product_id}`)),
    );

    if (qualifies && !giftInCart && giftVariantIds.length > 0) {
      const variantId = giftVariantIds[0].replace(
        "gid://shopify/ProductVariant/",
        "",
      );
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
      } catch (e) {
        console.error("[triggered-reward] Failed to remove gift:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  return changed;
};

async function checkTriggers(triggers, ctx) {
  if (!triggers || triggers.length === 0) return true;
  for (const t of triggers) {
    if (!(await checkTrigger(t, ctx))) return false;
  }
  return true;
}

async function checkTrigger(
  trigger,
  { cartTotal, cartProductIds, cartVariantIds, cart, nonGiftItems },
) {
  switch (trigger.type) {
    case "cart_total":
      return cartTotal >= Number(trigger.minAmount || 0);
    case "cart_quantity": {
      const items =
        nonGiftItems ??
        cart.items.filter((i) => !i.properties?._triggered_reward);
      return (
        items.reduce((s, i) => s + i.quantity, 0) >=
        Number(trigger.minQuantity || 0)
      );
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
      const collectionGids = Array.isArray(trigger.items)
        ? trigger.items
        : Array.isArray(trigger.items?.ids)
          ? trigger.items.ids
          : [];
      if (!collectionGids.length) return false;
      if (!window._hubCollHandleMap) {
        try {
          const res = await fetch("/collections.json?limit=250");
          if (res.ok) {
            const data = await res.json();
            window._hubCollHandleMap = {};
            for (const col of data.collections)
              window._hubCollHandleMap[String(col.id)] = col.handle;
          } else {
            window._hubCollHandleMap = {};
          }
        } catch (e) {
          console.error(
            "[triggered-reward] Failed to fetch collections list:",
            e,
          );
          window._hubCollHandleMap = {};
        }
      }
      window._hubCollCache = window._hubCollCache || {};
      for (const collGid of collectionGids) {
        const collId = collGid.replace("gid://shopify/Collection/", "");
        const handle = window._hubCollHandleMap[collId];
        if (!handle) {
          console.warn(
            "[triggered-reward] No handle for collection ID:",
            collId,
          );
          continue;
        }
        try {
          let collProductIds = window._hubCollCache[collId];
          if (!collProductIds) {
            const res = await fetch(
              `/collections/${handle}/products.json?limit=250`,
            );
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
          console.error(
            "[triggered-reward] Collection check failed:",
            handle,
            e,
          );
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

// ── OFFERS PANEL ──────────────────────────────────────────────────────────────
function hubRenderOffersPanel(
  blockId,
  allDiscountCodes,
  activeDiscountCodes,
  cart,
) {
  const totalEl = document.getElementById(`hub-offers-cart-total-${blockId}`);
  if (totalEl)
    totalEl.textContent = `Your Cart: ${hubUtils.formatMoney(cart.total_price || 0)}`;

  const list = document.getElementById(`hub-offers-list-${blockId}`);
  if (!list) return;

  const appliedCodes = new Set(
    (cart.discount_codes || [])
      .filter((c) => c.applicable === true)
      .map((c) => (c.code || "").toUpperCase())
      .filter(Boolean),
  );

  const validCodes = (allDiscountCodes || []).filter(
    (d) =>
      d.title &&
      d.status !== "EXPIRED" &&
      d.type !== "DiscountAutomaticApp" &&
      d.type !== "DiscountAutomaticBasic",
  );

  if (validCodes.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:#888;font-size:13px;padding:20px 0;">No offers available</p>`;
    return;
  }

  list.innerHTML = validCodes
    .map((d) => {
      const label = d.title.toUpperCase();
      const isActive = appliedCodes.has(label);
      const savings = d.discountValue
        ? d.discountValue.type === "percentage"
          ? `Save ${d.discountValue.value}% on this order!`
          : `Save ${d.discountValue.value} on this order!`
        : "";
      const subtitle = d.minimumRequirement
        ? `Use code ${d.title.toUpperCase()} & get discount on orders above ${hubUtils.formatMoney(d.minimumRequirement)}`
        : `Use code ${d.title.toUpperCase()} & enjoy this offer`;
      const actionBtn = isActive
        ? `<button class="hub-coupon-action-btn remove" onclick="hubRemoveOfferCode('${label}','${blockId}', this)">REMOVE</button>`
        : `<button class="hub-coupon-action-btn apply" onclick="hubApplyOfferCodeFromList('${label}','${blockId}', this)">APPLY</button>`;
      return `
      <div class="hub-coupon-card">
        <div class="hub-coupon-badge">${label}</div>
        <div class="hub-coupon-body">
          <div class="hub-coupon-top"><span class="hub-coupon-code">${label}</span>${actionBtn}</div>
          ${savings ? `<div class="hub-coupon-savings">${savings}</div>` : ""}
          ${subtitle ? `<div class="hub-coupon-desc">${subtitle}</div>` : ""}
          <div class="hub-coupon-error" id="coupon-error-${label}" style="color:black;font-size:12px;margin-top:5px;"></div>
        </div>
      </div>`;
    })
    .join("");
}

window.hubOpenOffersPanel = function (blockId) {
  const panel = document.getElementById(`hub-offers-panel-${blockId}`);
  if (!panel) return;
  panel.style.display = "flex";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      panel.classList.add("hub-offers-open");
      document
        .getElementById(`hub-offers-backdrop-${blockId}`)
        ?.classList.add("hub-offers-open");
      document
        .getElementById(`hub-offers-close-${blockId}`)
        ?.classList.add("hub-offers-open");
      document
        .querySelector(`.hub-cart-block-${blockId}`)
        ?.classList.add("hub-offers-open-body");
    }),
  );
};

window.hubCloseOffersPanel = function (blockId) {
  const panel = document.getElementById(`hub-offers-panel-${blockId}`);
  if (!panel) return;
  panel.classList.remove("hub-offers-open");
  document
    .getElementById(`hub-offers-backdrop-${blockId}`)
    ?.classList.remove("hub-offers-open");
  document
    .getElementById(`hub-offers-close-${blockId}`)
    ?.classList.remove("hub-offers-open");
  document
    .querySelector(`.hub-cart-block-${blockId}`)
    ?.classList.remove("hub-offers-open-body");
  setTimeout(() => {
    panel.style.display = "none";
  }, 280);
};

function showMessage(el, text, color = "black") {
  el.style.color = color;
  el.innerText = text;
  setTimeout(() => {
    el.innerText = "";
  }, 4000);
}

window.hubApplyOfferCode = async function (blockId, btn) {
  const input = document.getElementById(`hub-offers-input-${blockId}`);
  const message = document.getElementById(`hub-offers-msg-${blockId}`);
  const code = input?.value?.trim();
  if (!code) {
    if (message) showMessage(message, "Please enter a discount code", "red");
    return;
  }
  if (btn && btn.classList.contains("loading")) return;
  if (btn) {
    btn.classList.add("loading");
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span>`;
    btn.disabled = true;
  }
  try {
    await hubApplyOfferCode2(code, blockId, message);
    if (input) input.value = "";
  } finally {
    if (btn) {
      btn.classList.remove("loading");
      btn.innerHTML = btn.dataset.original || "APPLY";
      btn.disabled = false;
    }
  }
};

window.hubApplyOfferCodeFromList = async function (code, blockId, btn) {
  if (btn && btn.classList.contains("loading")) return;
  if (btn) {
    btn.classList.add("loading");
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span>`;
    btn.disabled = true;
  }
  try {
    await hubApplyOfferCode2(code, blockId);
  } finally {
    if (btn) {
      btn.classList.remove("loading");
      btn.innerHTML = btn.dataset.original || "APPLY";
      btn.disabled = false;
    }
  }
};

hubUtils.getDiscounts().then(({ allDiscountCodes, activeDiscountCodes }) => {
  const blockId = window.HUB_CART_BLOCK_ID;
  if (!blockId) {
    console.warn("blockId not found");
    return;
  }
  window.__HUB_ALL_CODES__ = allDiscountCodes;
  hubRenderOffersPanel(
    blockId,
    allDiscountCodes,
    activeDiscountCodes,
    window.__HUB_ACTIVE_CART__ || { discount_codes: [] },
  );
});

async function hubApplyOfferCode2(code, blockId, messageEl = null) {
  try {
    const cartBefore = await (await fetch("/cart.js")).json();
    if (!code) return;
    document.querySelectorAll(".hub-coupon-error").forEach((el) => {
      el.innerText = "";
    });
    const existingCode = cartBefore.discount_codes?.find(
      (d) => d.applicable === true,
    );
    await fetch(`/discount/${encodeURIComponent(code)}`, {
      credentials: "include",
    });
    await new Promise((r) => setTimeout(r, 500));
    const cartAfter = await (await fetch("/cart.js")).json();
    const savings =
      (cartAfter.original_total_price || 0) - (cartAfter.total_price || 0);
    const discountObj = cartAfter.discount_codes?.find(
      (d) => d.code.toLowerCase() === code.toLowerCase(),
    );
    const allDiscountCodes = window.__HUB_ALL_CODES__ || [];
    const isAvailableCode = allDiscountCodes.some(
      (d) => d?.title && d.title.toLowerCase() === code.toLowerCase(),
    );
    const isValid = discountObj?.applicable === true;
    const isConflict = isAvailableCode && discountObj?.applicable === false;
    const errorEl = document.getElementById(
      `coupon-error-${code.toUpperCase()}`,
    );

    if (!isValid) {
      const errorMsg = isConflict
        ? `${code} couldn't be used with your existing discounts.`
        : "Enter a valid discount code";
      if (errorEl && isConflict) {
        errorEl.innerText = errorMsg;
        setTimeout(() => {
          errorEl.innerText = "";
        }, 4000);
      }
      if (messageEl) showMessage(messageEl, errorMsg, "red");
      if (existingCode)
        await fetch(`/discount/${existingCode.code}`, {
          credentials: "include",
        });
      return;
    }

    hubCloseOffersPanel(blockId);
    const drawer = document.querySelector(`.hub-cart-block-${blockId}`);
    if (drawer) await window.hubCartRender(drawer);

    const overlay = document.getElementById(`hub-coupon-success-${blockId}`);
    if (overlay) {
      const label = code.toUpperCase();
      document.getElementById(
        `hub-coupon-success-applied-${blockId}`,
      ).textContent = `"${label}" applied`;
      document.getElementById(
        `hub-coupon-success-headline-${blockId}`,
      ).textContent =
        savings > 0
          ? `${hubUtils.formatMoney(savings)} SAVINGS WITH THIS COUPON`
          : `COUPON APPLIED!`;
      document.getElementById(
        `hub-coupon-success-desc-${blockId}`,
      ).textContent = `Use code ${label} and save every time you order`;
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

window.hubRemoveOfferCode = async function (code, blockId, btn) {
  if (btn && btn.classList.contains("loading")) return;
  if (btn) {
    btn.classList.add("loading");
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span>`;
    btn.disabled = true;
  }
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
  } finally {
    if (btn) {
      btn.classList.remove("loading");
      btn.innerHTML = btn.dataset.original || "REMOVE";
      btn.disabled = false;
    }
  }
};
