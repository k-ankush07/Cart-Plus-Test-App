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
      <p class="hub-notes-title">
        <img src="https://hubsyntax.com/cart-images/Group.svg" alt="icon">
        ${settings.title}
        <span class="drop-icon">
          <img src="https://hubsyntax.com/cart-images/Vector%20(3).svg" alt="icon">
        </span>
      </p>

      <div class="hub-notes-content">
        <textarea 
          id="hub-cart-note-${blockId}" 
          class="hub-notes-textarea"
          placeholder="${settings.placeholder}"
        >${note || ""}</textarea>
      </div>
    </div>
  `;
  },

  initNoteListener(blockId) {
    const textarea = document.getElementById(`hub-cart-note-${blockId}`);
    if (!textarea) return;

    if (!document.getElementById("hub-note-spin-style")) {
      const style = document.createElement("style");
      style.id = "hub-note-spin-style";
      style.textContent = `
      @keyframes hub-note-spin {
        to { transform: rotate(360deg); }
      }
      .hub-note-spinner {
        display: inline-block !important;
        width: 12px !important;
        height: 12px !important;
        min-width: 12px !important;
        min-height: 12px !important;
        border: 2px solid #ccc !important;
        border-top-color: red !important;
        border-radius: 50% !important;
        animation: hub-note-spin 0.7s linear infinite !important;
        vertical-align: middle !important;
        margin-left: 6px !important;
        box-sizing: border-box !important;
      }
    `;
      document.head.appendChild(style);
    }

    let debounceTimer;

    textarea.addEventListener("input", () => {
      clearTimeout(debounceTimer);

      const wrapper = textarea.closest(".hub-additional-notes");
      const title = wrapper?.querySelector("p");

      title?.querySelectorAll(".hub-note-spinner").forEach((s) => s.remove());

      if (title) {
        const spinner = document.createElement("span");
        spinner.classList.add("hub-note-spinner");
        title.appendChild(spinner);
      }

      debounceTimer = setTimeout(async () => {
        try {
          await fetch("/cart/update.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: textarea.value }),
          });
        } catch (err) {
        } finally {
          const w2 = textarea.closest(".hub-additional-notes");
          const t2 = w2?.querySelector("p");
          t2?.querySelectorAll(".hub-note-spinner").forEach((s) => s.remove());
        }
      }, 800);
    });
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

    const upsellSettings = window.__HUB_ACTIVE_CART__?.upsellsSettings;
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};

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

    const btnColor = designSettings.buttonColor || "#000000";
    const btnHoverColor = designSettings.buttonHoverColor || "#333333";
    const textColor = designSettings.buttonTextColor || "#ffffff";

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
            class="upcart-internal-component-upsell-tile__title-link" style="color:${designSettings.textColor};">
            <h4 class="upcart-internal-component-upsell-tile__title" style="color:${designSettings.textColor};">
              ${product.title}
            </h4>
          </a>
          ${ratingHTML}
          <div class="price" style="color:${designSettings.textColor};">
            <span class="sale-price" style="color:${designSettings.textColor};">
              ${hubUtils.formatMoney(Math.round(salePrice * 100))}
            </span>
            ${comparePriceHTML}
          </div>
           <div class="upcart-internal-component-upsell-tile__variant-row">
           ${
             hasMultipleVariants
               ? `<select class="hub-variant-select" style="color:${designSettings.textColor};">
                     ${variantOptions}
                   </select>`
               : ""
           }
          <button class="hub-add-btn" data-variant="${firstVariant?.id}" 
          style="
          --btn-bg:${btnColor};
          --btn-hover:${btnHoverColor};
          --btn-text:${textColor};
          border-radius:${designSettings.buttonRadius}px;
      ">
            ${upsellSettings.buttonText || "Add"}
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
      return `
  <svg 
  aria-hidden="true" 
  focusable="false"
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 20 20" 
  width="20" 
  height="20" 
  fill="${color}">

  <path 
    d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" 
    fill-rule="evenodd"/>
</svg>`;
    }
    if (type === "shipping") {
      return ` <svg 
  aria-hidden="true" 
  focusable="false"
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 20 20" 
  width="20" 
  height="20" 
  fill="${color}">

  <path 
    d="M4.75 4.5a.75.75 0 0 0 0 1.5h3.25a1 1 0 0 1 0 2h-4.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 0 0 1.5h.458a2.5 2.5 0 1 0 4.78.75h3.024a2.5 2.5 0 1 0 4.955-.153 1.75 1.75 0 0 0 1.033-1.597v-1.22a1.75 1.75 0 0 0-1.326-1.697l-1.682-.42a.25.25 0 0 1-.18-.174l-.426-1.494a2.75 2.75 0 0 0-2.645-1.995h-6.991Zm2.75 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" 
    fill-rule="evenodd"/>
</svg>`;
    }
    return `<svg 
  aria-hidden="true" 
  focusable="false"
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 20 20" 
  width="20" 
  height="20" 
  fill="${color}">

  <path d="M7.835 9.5h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .463.142.563.363l.403.887Z"/>
  <path d="M10.665 9.5h.96c.343 0 .625-.28.625-.628 0-.344-.28-.622-.619-.622-.242 0 .463.142-.563.363l-.403.887Z"/>
  <path d="M8.5 4h-3.25c-1.519 0-2.75 1.231-2.75 2.75v2.25h1.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.25v2.75c0 1.519 1.231 2.75 2.75 2.75h3.441c-.119-.133-.191-.308-.191-.5v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0 .192-.072.367-.191.5h4.941c1.519 0 2.75-1.231 2.75-2.75v-2.75h-2.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2.75v-2.25c0-1.519-1.231-2.75-2.75-2.75h-4.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.25Zm.297 3.992c-.343-.756-1.097-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Z" fill-rule="evenodd"/>
</svg>`;
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

  ${
    tier.showIcon
      ? `
    <div class="hub-circle-wrap" style="padding:0 ${barGap}px">
      <div class="hub-rewards-dot" style="background:${dotBg};width:${dotSize}px;height:${dotSize}px">
        ${hubUtils.getTierIcon(tier.type, iconColor)}
      </div>
      <span class="hub-rewards-dot-label">${tier.description || ""}</span>
    </div>
  `
      : ""
  }

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
  updateDiscountUI(blockId, cart) {
    const manualCodes = new Set(
      (cart.discount_codes || []).map((d) => d.code.toLowerCase()),
    );

    const seen = new Set();
    const allDiscounts = [];

    (cart.cart_level_discount_applications || []).forEach((app) => {
      const key = app.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        allDiscounts.push(app);
      }
    });

    (cart.items || []).forEach((item) => {
      (item.line_level_discount_allocations || []).forEach((d) => {
        const app = d.discount_application;
        if (!app) return;

        const key = app.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allDiscounts.push(app);
        }
      });
    });

    const discountStatus = document.getElementById(
      `hub-discount-status-${blockId}`,
    );
    const inputWrap = document.querySelector(
      `#hub-discount-row-${blockId} .hub-discount-input-btn`,
    );
    const applyBtn = document.querySelector(
      `#hub-discount-row-${blockId} .hub-discount-apply-btn`,
    );

    if (!discountStatus || !inputWrap || !applyBtn) return;

    const hasDiscount = allDiscounts.length > 0;

    if (!hasDiscount) {
      discountStatus.innerHTML = "";
      inputWrap.style.display = "flex";
      applyBtn.innerText = "Apply";
      applyBtn.disabled = false;
      return;
    }

    discountStatus.innerHTML = allDiscounts
      .map((app) => {
        const isManual = manualCodes.has(app.title.toLowerCase());

        return `
      <div class="hub-discount-row">

        <!-- LEFT -->
        <div class="hub-discount-left">
          
          <div class="hub-discount-image">
            <img 
              src="https://hubsyntax.com/cart-images/Group%20(1).svg" 
              class="discount-icon"
            />
          </div>

          <div class="hub-discount-chip">

            <div class="hub-discount-title-btn">
              <span class="code">${app.title}</span>

              ${
                isManual
                  ? `<button onclick="removeDiscountCode(this, '${blockId}')" class="remove-btn">
                      <img 
                        src="https://hubsyntax.com/cart-images/Vector%20(5).svg" 
                        class="hub-remove-icon"
                      />
                    </button>`
                  : ""
              }

            </div>

            ${
              app.total_allocated_amount
                ? `<div class="saved-badge">
                    Saved ${hubUtils.formatMoney(app.total_allocated_amount)}
                   </div>`
                : ""
            }

          </div>
        </div>

        <!-- RIGHT -->
        <div class="hub-discount-right">
          Applied ✓
        </div>

      </div>
    `;
      })
      .join("");

    inputWrap.style.display = "none";
    applyBtn.innerText = "Applied";
    applyBtn.disabled = true;
  },
  hexToRGBA(hex, opacity) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
