window.hubUtils = {
  formatMoney(cents) {
    const currency = window.__SHOPIFY_CURRENCY__;
    const amount = (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (currency?.format?.includes("{{amount}}")) {
      return currency.format.replace("{{amount}}", amount);
    }
    if (currency?.symbol) return `${currency.symbol}${amount}`;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency?.code || "USD",
    }).format(cents / 100);
  },

  executeBeforeLoadScripts(scriptContent, scope) {
    if (!scriptContent) return;

    try {
      const fn = new Function("scope", scriptContent);
      fn(scope);
    } catch (e) {
      console.error("Error executing custom script:", e);
    }
  },

  scopeCss(css, scope) {
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
  },
  applyCustomCSS(blockId, css) {
    const styleId = `hub-custom-css-${blockId}`;
    let el = document.getElementById(styleId);
    if (!el) {
      el = document.createElement("style");
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = scopeCss(css, `.hub-cart-block-${blockId}`);
  },
  renderCustomHTML(content) {
    return content || "";
  },

  async getSellingPlans(handle) {
    const res = await fetch(`/products/${handle}.js`);
    const product = await res.json();
    return product.selling_plan_groups || [];
  },

  getAdditionalNotesHTML(blockId, settings, note = "") {
    if (settings?.enabled !== false) return "";

    return `
    <div class="hub-additional-notes ${settings.placement}">
      <p class="hub-notes-title">${settings.title}</p>
      <textarea 
        id="hub-cart-note-${blockId}" 
        class="hub-notes-textarea"
        placeholder="${settings.placeholder}"
      >${note || ""}</textarea>
    </div>
  `;
  },

  renderTrustBadges(blockId, settings, itemCount) {
    if (!settings || settings.enabled !== false) return;

    const position = settings.position || "bottom";

    const el = document.getElementById(
      `hub-trust-badges-${position}-${blockId}`,
    );

    if (!el) return;

    if (itemCount === 0) {
      el.style.display = "none";
      return;
    }

    let img = settings.customImage || settings.presetImage;

    if (!img) return;

    el.style.display = "block";

    el.innerHTML = `
    <div class="hub-trust-badges-inner">
      <img src="${img}" alt="Trust badges" class="hub-trust-badges-img"/>
    </div>
  `;
  },

  getProductCardHTML(product, settings = {}) {
    if (
      !settings.showIfAlreadyInCart &&
      window._hubCartProductIds?.has(String(product.id))
    )
      return "";
    const variants = product.variants || [];
    const mainImage =
      product?.images?.[0]?.src || product?.featured_image || "";
    const firstVariant = variants[0];

    const variantOptions = variants
      .map(
        (v) => `
      <option value="${v.id}"
        data-price="${Math.round(Number(v.price) * 100)}"
        data-image="${v.featured_image?.src || mainImage}">
        ${v.title}
      </option>
    `,
      )
      .join("");

    // Only render rating slot if merchant enabled showReviews
    const ratingHTML = settings.showReviews
      ? `<div class="upcart-internal-component-upsell-tile__rating hub-rating-slot" data-pid="${product.id}"></div>`
      : "";

    const salePrice = Number(firstVariant?.price || 0);
    const comparePrice = Number(firstVariant?.compare_at_price || 0);
    const hasDiscount = comparePrice > salePrice;
    const savePct = hasDiscount
      ? Math.round((1 - salePrice / comparePrice) * 100)
      : 0;
    const comparePriceHTML = hasDiscount
      ? `<span class="hub-compare-price">${hubUtils.formatMoney(Math.round(comparePrice * 100))}</span>
         <span class="hub-save-badge">SAVE ${savePct}%</span>`
      : "";

    const hasMultipleVariants = variants.length > 1;

    return `
    <div class="hub-rec-product upcart-internal-component-upsell-tile">
      <div class="upcart-internal-component-upsell-tile__info_count">
        <div class="upcart-internal-component-upsell-tile__image-container">
          <img class="hub-product-img"
               src="${mainImage}"
               alt="${product.title}" />
        </div>
        <div class="upcart-internal-component-upsell-tile__info">
          <a href="/products/${product.handle}"
            class="upcart-internal-component-upsell-tile__title-link">
            <h4 class="upcart-internal-component-upsell-tile__title">
              ${product.title}
            </h4>
          </a>
          ${ratingHTML}
          <div class="price">
            <span class="sale-price">
              ${hubUtils.formatMoney(Math.round(salePrice * 100))}
            </span>
            ${comparePriceHTML}
          </div>
           <div class="upcart-internal-component-upsell-tile__variant-row">
           ${
              hasMultipleVariants
                ? `<select class="hub-variant-select">
                     ${variantOptions}
                   </select>`
                : ""
            }
          <button class="hub-add-btn" data-variant="${firstVariant?.id}">
            Add
          </button>
        </div>
        </div>
      </div>
    </div>
  `;
  },

  // Fetches product ratings from the Remix proxy (Admin API → reviews metafields)
  // and fills every .hub-rating-slot[data-pid] inside `container`.
  async applyRatings(container) {
    const ratingsUrl = window.__HUB_RATINGS_URL__;
    const shop = window.__SHOPIFY_SHOP__?.domain;
    if (!ratingsUrl || !shop) return;

    const slots = container.querySelectorAll(".hub-rating-slot[data-pid]");
    if (!slots.length) return;

    const ids = [...new Set([...slots].map((s) => s.dataset.pid))].join(",");

    try {
      const res = await fetch(
        `${ratingsUrl}/api/product-ratings?shop=${shop}&ids=${ids}`,
        { headers: { "ngrok-skip-browser-warning": "true" } },
      );
      const { ratings } = await res.json();

      slots.forEach((slot) => {
        const r = ratings[slot.dataset.pid];
        if (!r?.rating) return;
        slot.innerHTML = `
          <span class="hub-stars" style="--rating: ${r.rating};" aria-label="Rating: ${r.rating} out of 5"></span>
          ${r.count ? `<span class="hub-rating-count">(${r.count})</span>` : ""}
        `;
      });
    } catch (err) {
      console.warn("[hub] Could not fetch ratings:", err);
    }
  },

  async shipping_Charges(container, cartTotalCents) {
    const ratingsUrl = window.__HUB_RATINGS_URL__;
    const shop = window.__SHOPIFY_SHOP__?.domain;
    if (!ratingsUrl || !shop) return;

    const blockId = window.HUB_CART_BLOCK_ID;
    const shippingRow = document.getElementById(`hub-shipping-row-${blockId}`);
    const shippingCostEl = document.getElementById(
      `hub-shipping-cost-${blockId}`,
    );
    if (!shippingRow || !shippingCostEl) return;

    try {
      // Use prefetch promise if cache not ready yet — avoids duplicate requests
      if (!window._hubShippingZonesCache) {
        if (window._hubShippingZonesPromise) {
          await window._hubShippingZonesPromise;
        } else {
          const url = `${ratingsUrl}/api/shipping-zones?shop=${shop}`;
          const res = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "true" },
          });
          if (!res.ok) return;
          window._hubShippingZonesCache = await res.json();
        }
      }
      const data = window._hubShippingZonesCache;
      if (!data) return;

      const input = document.querySelector('input[name="country_code"]');
      const countryCode = input?.value || window.__SHOPIFY_CURRENCY__?.code;
      if (!countryCode) return;

      const countryData = (data.countries || []).find(
        (c) => c.code === countryCode,
      );
      if (!countryData) return;

      const cartTotalDollars = (cartTotalCents || 0) / 100;
      const rates = countryData.price_based_shipping_rates || [];
      let applicableRate = null;
      for (const rate of rates) {
        const min = parseFloat(rate.min_order_subtotal ?? 0);
        const max =
          rate.max_order_subtotal != null
            ? parseFloat(rate.max_order_subtotal)
            : Infinity;
        if (cartTotalDollars >= min && cartTotalDollars <= max) {
          applicableRate = rate;
          break;
        }
      }

      if (!applicableRate) return;

      const price = parseFloat(applicableRate.price ?? 0);
      const shippingCents = price * 100;
      window._hubShippingPriceCents = shippingCents;

      shippingRow.style.display = "";
      shippingCostEl.textContent =
        price === 0 ? "Free" : hubUtils.formatMoney(shippingCents);

      // Patch grand total and checkout button now that shipping is resolved
      const finalTotal = window._hubCartFinalTotal || 0;
      const grandTotal = finalTotal + shippingCents;
      const fmt = hubUtils.formatMoney;

      const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
      if (grandEl) grandEl.textContent = fmt(grandTotal);

      const checkoutBtn = document.getElementById(
        `hub-checkout-btn-${blockId}`,
      );
      if (checkoutBtn) {
        const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
        const rawText =
          cartSettings.checkoutButtonText || "Proceed to checkout";
        checkoutBtn.textContent = rawText.replace(
          "{{total_price}}",
          fmt(grandTotal),
        );
      }
    } catch (err) {
      // silent fail
    }
  },

  async maybeUpdateRewardProducts(cart, rewards) {
    // FIX: was `rewards?.enabled` — inverted logic, ran when rewards were OFF
    if (rewards?.enabled || !rewards?.tiers?.length) return false;
    if (window._hubRewardUpdating) return false;

    const isQuantity = rewards.calculationType === "quantity";

    const rewardCartItems = cart.items.filter(
      (item) => item.properties?._hub_reward,
    );
    const rewardDeduction = isQuantity
      ? rewardCartItems.reduce((n, item) => n + item.quantity, 0)
      : rewardCartItems.reduce(
          (n, item) =>
            n +
            (rewards.usePreDiscount
              ? item.original_line_price
              : item.final_line_price),
          0,
        ) / 100;

    const rawValue = isQuantity
      ? cart.item_count
      : rewards.usePreDiscount
        ? (cart.original_total_price || cart.total_price) / 100
        : cart.total_price / 100;

    const cartValue = rawValue - rewardDeduction;

    const toAdd = [];
    const toRemove = [];

    for (const tier of rewards.tiers) {
      if (tier.type !== "product" && tier.type !== "shipping") continue;
      if (!tier.products?.length) continue;

      const threshold = isQuantity
        ? tier.minQuantity || 0
        : tier.minAmount || 0;
      const reached = cartValue >= threshold;

      const rewardItems = cart.items.filter(
        (item) => String(item.properties?._hub_reward) === String(tier.id),
      );

      if (reached) {
        for (const product of tier.products) {
          if (!product.available) continue;
          const numericId = Number(
            product.id.replace("gid://shopify/ProductVariant/", ""),
          );
          if (!rewardItems.some((item) => item.variant_id === numericId)) {
            toAdd.push({ id: numericId, tierId: String(tier.id) });
          }
        }
      } else {
        for (const ri of rewardItems) toRemove.push(ri.key);
      }
    }

    if (toAdd.length === 0 && toRemove.length === 0) return false;

    window._hubRewardUpdating = true;
    let success = false;
    try {
      for (const p of toAdd) {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: p.id,
            quantity: 1,
            properties: { _hub_reward: p.tierId },
          }),
        });
        if (res.ok) {
          success = true;
        } else {
          const body = await res.text();
          console.warn("[hub-rewards] add failed", p.id, res.status, body);
        }
      }
      for (const key of toRemove) {
        const res = await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: key, quantity: 0 }),
        });
        if (res.ok) success = true;
      }
    } finally {
      window._hubRewardUpdating = false;
    }

    return success;
  },
  getTierIcon(type, color) {
    if (type === "discount") {
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
    }
    if (type === "shipping") {
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
    }
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`;
  },
  renderRewardsBar(blockId, cart, rewards) {
    const el = document.getElementById(`hub-rewards-${blockId}`);
    if (!el) return;

    // FIX: was `rewards?.enabled` — inverted, hid bar when rewards were ON
    if (rewards?.enabled || !rewards?.tiers?.length) {
      el.style.display = "none";
      return;
    }

    if (!rewards.showOnEmptyCart && cart.items.length === 0) {
      el.style.display = "none";
      return;
    }

    const isQuantity = rewards.calculationType === "quantity";
    const getTierValue = (tier) =>
      isQuantity ? tier.minQuantity || 0 : tier.minAmount || 0;

    const rewardCartItems = cart.items.filter(
      (item) => item.properties?._hub_reward,
    );
    const rewardDeduction = isQuantity
      ? rewardCartItems.reduce((n, item) => n + item.quantity, 0)
      : rewardCartItems.reduce(
          (n, item) =>
            n +
            (rewards.usePreDiscount
              ? item.original_line_price
              : item.final_line_price),
          0,
        ) / 100;

    const rawTotal = isQuantity
      ? cart.item_count
      : rewards.usePreDiscount
        ? (cart.original_total_price || cart.total_price) / 100
        : cart.total_price / 100;

    const cartTotal = rawTotal - rewardDeduction;

    const sorted = [...rewards.tiers].sort(
      (a, b) => getTierValue(a) - getTierValue(b),
    );
    const len = sorted.length;
    const maxAmount = getTierValue(sorted[len - 1]) || 1;

    const trackColor = rewards.backgroundColor || "#c1c1c1";
    const fillColor = rewards.textColor || "#000000";
    const textColor = rewards.textColor || "#000000";
    const barLength = rewards.barLength || 4;
    const barGap = rewards.barGap || 0;
    const dotSize = 28 + barLength;

    const getStepPosition = (index) => (100 / len) * (index + 1);

    const getFillPercent = () => {
      if (len === 0) return 0;
      const firstTier = sorted[0];
      if (cartTotal < getTierValue(firstTier)) {
        return (cartTotal / getTierValue(firstTier)) * getStepPosition(0);
      }
      for (let i = 0; i < len - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];
        if (cartTotal >= getTierValue(curr) && cartTotal < getTierValue(next)) {
          const progress =
            (cartTotal - getTierValue(curr)) /
            (getTierValue(next) - getTierValue(curr));
          return (
            getStepPosition(i) +
            progress * (getStepPosition(i + 1) - getStepPosition(i))
          );
        }
      }
      return 100;
    };

    const fillPct = getFillPercent().toFixed(2);
    const currentTier = sorted.find((t) => cartTotal < getTierValue(t));

    let titleHtml = "";
    if (cartTotal >= maxAmount) {
      titleHtml = `<p class="hub-rewards-title">${rewards.successText || "All rewards unlocked!"}</p>`;
    } else if (currentTier) {
      const remaining = getTierValue(currentTier) - cartTotal;
      const amountStr = isQuantity
        ? `${remaining} items`
        : hubUtils.formatMoney(remaining * 100);
      const raw = currentTier.title || "You're {AMOUNT} away!";
      titleHtml = `<p class="hub-rewards-title">${raw.replace("{AMOUNT}", `<strong>${amountStr}</strong>`)}</p>`;
    }

    const fillPctNum = parseFloat(fillPct);

    const tiersHtml = sorted
      .map((tier, index) => {
        const segStart = index === 0 ? 0 : getStepPosition(index - 1);
        const segEnd = getStepPosition(index);
        let segFill = 0;
        if (fillPctNum >= segEnd) segFill = 100;
        else if (fillPctNum > segStart)
          segFill = ((fillPctNum - segStart) / (segEnd - segStart)) * 100;

        const done = cartTotal >= getTierValue(tier);
        const iconColor = done
          ? rewards.completeIconColor || "#ffffff"
          : rewards.incompleteIconColor || "#000000";
        const dotBg = done ? fillColor : trackColor;

        return `<div class="hub-tier-cell">
          <div class="hub-cell-bar" style="background:${trackColor};height:${barLength}px">
            <div class="hub-cell-fill" style="width:${segFill.toFixed(2)}%;background:${fillColor}"></div>
          </div>
          <div class="hub-circle-wrap" style="padding:0 ${barGap}px">
            <div class="hub-rewards-dot" style="background:${dotBg};width:${dotSize}px;height:${dotSize}px">
              ${tier.showIcon ? hubUtils.getTierIcon(tier.type, iconColor) : ""}
            </div>
            <span class="hub-rewards-dot-label">${tier.description || ""}</span>
          </div>
        </div>`;
      })
      .join("");

    el.style.display = "block";
    el.innerHTML = `
    <div class="hub-rewards-wrap">
      ${titleHtml}
      <div class="hub-rewards-segments">
        ${tiersHtml}
      </div>
    </div>`;
  },

  // Fetches active discount codes from the hub backend (Admin API → discountNodes)
  async getDiscounts() {
    const ratingsUrl = window.__HUB_RATINGS_URL__;
    const shop = window.__SHOPIFY_SHOP__?.domain;
    if (!ratingsUrl || !shop)
      return { allDiscountCodes: [], activeDiscountCodes: [] };

    try {
      const res = await fetch(`${ratingsUrl}/api/discounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ shop }),
      });
      const data = await res.json();
      return {
        allDiscountCodes: data.allDiscountCodes || [],
        activeDiscountCodes: data.activeDiscountCodes || [],
        total: data.total || 0,
        activeCount: data.activeCount || 0,
      };
    } catch (err) {
      console.warn("[hub] Could not fetch discounts:", err);
      return { allDiscountCodes: [], activeDiscountCodes: [] };
    }
  },

  // ── Skeleton helpers ──────────────────────────────────────────────────────────
  showCartSkeleton(blockId) {
    const skeleton = document.getElementById(`hub-skeleton-${blockId}`);
    const items = document.getElementById(`hub-cart-items-${blockId}`);
    if (skeleton) skeleton.style.display = "block";
    if (items) items.style.visibility = "visible";
  },
  hideCartSkeleton(blockId) {
    const skeleton = document.getElementById(`hub-skeleton-${blockId}`);
    if (skeleton) skeleton.style.display = "none";
  },
  revealCartItems(blockId) {
    const items = document.getElementById(`hub-cart-items-${blockId}`);
    if (items) items.style.visibility = "visible";
  },
};

hubUtils.getAllRecommendations = async function () {
  try {
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

    const colRes = await fetch(`/collections.json`);
    const colData = await colRes.json();

    for (const col of colData.collections) {
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

    const uniqueProducts = Object.values(
      allProducts.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {}),
    );

    return uniqueProducts;
  } catch (err) {
    console.error("Recommendation error:", err);
    return [];
  }
};
