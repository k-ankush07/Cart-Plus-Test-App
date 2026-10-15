window.hubUtils = {
  authHeaders(extra = {}) {
    const API_KEY =
      "8f4c2a91d7e3b6f5a8c1d9e2f7b4c6a9e1d3f8b5c2a7d4e9f6b1c8a3d7e5f2";
    return {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      ...extra,
    };
  },
  formatMoney(cents) {
    const currency = window.__SHOPIFY_CURRENCY__;
    const amount = (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    let result;
    if (currency?.format?.includes("{{amount}}")) {
      result = currency.format.replace("{{amount}}", amount);
    } else if (currency?.symbol) {
      result = `${currency.symbol}${amount}`;
    } else {
      result = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency?.code || "USD",
      }).format(cents / 100);
    }

    const div = document.createElement("div");
    div.innerHTML = result;
    return div.textContent || div.innerText || result;
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

  async getSellingPlans(handle, variantId) {
    const res = await fetch(`/products/${handle}.js`);
    const product = await res.json();

    const variant = product.variants?.find(
      (v) => String(v.id) === String(variantId),
    );

    const allowedPlanIds = new Set(
      (variant?.selling_plan_allocations || []).map(
        (a) => a.selling_plan_group_id,
      ),
    );

    return (product.selling_plan_groups || []).filter((g) =>
      allowedPlanIds.has(g.id),
    );
  },

  getAdditionalNotesHTML(blockId, settings, note = "") {
    if (settings?.enabled !== false) return "";
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};
    const iconColor = designSettings.iconColor || "";

    return `
<div class="cart-plus-public-notes hub-additional-notes ${settings.placement}">
  <div class="hub-notes-title cart-plus-public-component-collapse__dropdown-container">
     <div class="hub-notes-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    </div>
    ${settings.title}
  <span class="drop-icon cart-plus-public-component-collapse__expand-icon">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
</span>
  </div>

  <div class="hub-notes-content cart-plus-public-notes__textarea">
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
      const title = wrapper?.querySelector(".hub-notes-title");

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
          const t2 = w2?.querySelector(".hub-notes-title");
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
    <div class="hub-trust-badges-inner cart-trust-badges__img upcart-trust-badge-image cart-plus-public-trust-badges__image cart-plus-trust-badge-image">
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

    const ratingHTML = settings.showReviews
      ? `<div class="upcart-internal-component-upsell-tile__rating hub-rating-slot cart-plus-public-component-upsell-tile__rating-row"
       data-pid="${product.id}"></div>`
      : "";

    const upsellSettings = window.__HUB_ACTIVE_CART__?.upsellsSettings;
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};
    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};

    const savingsText = cartSettings.savingsText || "Save";

    const salePrice = Number(firstVariant?.price || 0);
    const comparePrice = Number(firstVariant?.compare_at_price || 0);
    const hasDiscount = comparePrice > salePrice;
    const savePct = hasDiscount
      ? Math.round((1 - salePrice / comparePrice) * 100)
      : 0;

    const comparePriceHTML = hasDiscount
      ? `<span class="hub-compare-price cart-plus-public-component-upsell-tile__price-compare-at">${hubUtils.formatMoney(Math.round(comparePrice * 100))}</span>
     <span class="hub-item-save" style="background: ${hexToRGBA(designSettings?.savingsColor, 0.1)}; color: ${designSettings.savingsColor};">
     ${savingsText}  ${hubUtils.formatMoney(Math.round((comparePrice - salePrice) * 100))} 
     </span>`
      : "";

    const hasMultipleVariants = variants.length > 1;

    const btnColor = designSettings.buttonColor || "#000000";
    const btnHoverColor = designSettings.buttonHoverColor || "#333333";
    const textColor = designSettings.buttonTextColor || "#ffffff";

    return `
    <div class="hub-rec-product upcart-internal-component-upsell-tile cart-plus-public-component-upsell-tile" style="background-color: ${designSettings.accentColor};">
      <div class="upcart-internal-component-upsell-tile__info_count cart-plus-public-component-upsell-tile">
        <div class="upcart-internal-component-upsell-tile__image-container cart-plus-public-component-upsell-tile__image-container">
          <img class="hub-product-img cart-plus-public-component-upsell-tile__image"
               src="${mainImage}"
               alt="${product.title}" />
        </div>
        <div class="upcart-internal-component-upsell-tile__info cart-plus-internal-component-upsell-tile__info">
          <a href="/products/${product.handle}"
            class="upcart-internal-component-upsell-tile__title-link cart-plus-internal-component-upsell-tile__title-link" style="color:${designSettings.textColor};">
            <h4 class="upcart-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title" style="color:${designSettings.textColor};">
              ${product.title}
            </h4>
          </a>
          ${ratingHTML}
          <div class="price cart-plus-public-component-upsell-tile__price-row" style="color:${designSettings.textColor};">
            <span class="sale-price cart-plus-public-component-upsell-tile__price" style="color:${designSettings.textColor};">
              ${hubUtils.formatMoney(Math.round(salePrice * 100))}
            </span>
            ${comparePriceHTML}
          </div>
        </div>
      </div>
      <div class="upcart-internal-component-upsell-tile__variant-row">
           ${
             hasMultipleVariants
               ? `<select class="hub-variant-select cart-plus-public-component-upsell-tile__variant-row" style="color:${designSettings.textColor};">
                     ${variantOptions}
                   </select>`
               : ""
           }
          <button class="hub-add-btn cart-plus-public-component__button" data-variant="${firstVariant?.id}" 
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
  `;
  },

  // Fetches product ratings from the Remix proxy (Admin API → reviews metafields)
  // and fills every .hub-rating-slot[data-pid] inside `container`.
  async applyRatings(container) {
    const ratingsUrl = window.__HUB_RATINGS_URL__;
    const shop = window.__SHOPIFY_SHOP__?.domain;
    if (!ratingsUrl || !shop) return;

    window._hubRatingsCache = window._hubRatingsCache || {};

    const slots = container.querySelectorAll(".hub-rating-slot[data-pid]");
    if (!slots.length) return;

    // Step 1: turant cached ratings dikhao (agar available hain), koi flicker nahi
    slots.forEach((slot) => {
      const cached = window._hubRatingsCache[slot.dataset.pid];
      if (cached?.rating) {
        slot.innerHTML = `
        <span class="hub-stars" style="--rating: ${cached.rating};" aria-label="Rating: ${cached.rating} out of 5"></span>
        ${cached.count ? `<span class="hub-rating-count">(${cached.count})</span>` : ""}
      `;
      }
    });

    const missingIds = [...slots]
      .map((s) => s.dataset.pid)
      .filter((id) => !window._hubRatingsCache[id]);

    const uniqueMissing = [...new Set(missingIds)];
    if (!uniqueMissing.length) return;

    const ids = uniqueMissing.join(",");

    try {
      const res = await fetch(
        `${ratingsUrl}/api/product-ratings?shop=${shop}&ids=${ids}`,
        { headers: this.authHeaders({ "ngrok-skip-browser-warning": "true" }) },
      );
      const { ratings } = await res.json();

      // cache update karo
      Object.entries(ratings || {}).forEach(([pid, r]) => {
        window._hubRatingsCache[pid] = r;
      });

      slots.forEach((slot) => {
        const r = ratings[slot.dataset.pid];
        if (!r?.rating) return;
        slot.innerHTML = `
        <span class="hub-stars" style="--rating: ${r.rating};" aria-label="Rating: ${r.rating} out of 5"></span>
        ${r.count ? `<span class="hub-rating-count">(${r.count})</span>` : ""}
      `;
      });
    } catch (err) {
      console.warn("Could not fetch ratings:", err);
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

    const fmt = hubUtils.formatMoney;

    const updateGrandTotalAndCheckout = (shippingCents) => {
      const finalTotal = window._hubCartFinalTotal || 0;
      const grandTotal = finalTotal + shippingCents;
      const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
      if (grandEl) grandEl.textContent = fmt(grandTotal);

      const checkoutBtn = document.getElementById(
        `hub-checkout-btn-${blockId}`,
      );
      if (checkoutBtn) {
        checkoutBtn.textContent = hubUtils.getCheckoutButtonText(
          window.__HUB_ACTIVE_CART__?.cartSettings || {},
          fmt(grandTotal),
        );
      }
    };

    try {
      // ─── STEP 1: Free shipping discount check ──────────────────────────
      const { allDiscountCodes = [], activeDiscountCodes = [] } =
        await hubUtils.getDiscounts();

      const combined = [...activeDiscountCodes, ...allDiscountCodes];
      const seenIds = new Set();
      const uniqueDiscounts = combined.filter((d) => {
        const id = d.id || d.title;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });

      const isFreeShippingType = (d) =>
        d.type === "DiscountAutomaticFreeShipping";
      const isActive = (d) => d.status === "ACTIVE";
      const cartTotalRupees = (cartTotalCents || 0) / 100;

      const getMinRequirement = (d) => {
        if (!d.minimumRequirement) return 0;
        return parseFloat(d.minimumRequirement.value || 0);
      };

      const eligibleFreeShipping = uniqueDiscounts.find((d) => {
        if (!isFreeShippingType(d)) return false;
        if (!isActive(d)) return false;
        return cartTotalRupees >= getMinRequirement(d);
      });

      if (eligibleFreeShipping) {
        window._hubShippingPriceCents = 0;
        shippingRow.style.display = "";
        shippingCostEl.textContent = "Free";
        updateGrandTotalAndCheckout(0);
        return;
      }

      // ─── STEP 2: Shipping-zone rate calculation ────────────────────────
      if (!window._hubShippingZonesCache) {
        if (window._hubShippingZonesPromise) {
          await window._hubShippingZonesPromise;
        } else {
          const url = `${ratingsUrl}/api/shipping-zones?shop=${shop}`;
          const res = await fetch(url, {
            headers: this.authHeaders({ "ngrok-skip-browser-warning": "true" }),
          });
          if (!res.ok) {
            // FIX: hide row instead of leaving stale state
            window._hubShippingPriceCents = 0;
            shippingRow.style.display = "none";
            updateGrandTotalAndCheckout(0);
            return;
          }
          window._hubShippingZonesCache = await res.json();
        }
      }

      const data = window._hubShippingZonesCache;

      // FIX: agar zone data hi nahi hai to row hide karo, silently return mat karo
      if (!data?.shipping) {
        window._hubShippingPriceCents = 0;
        shippingRow.style.display = "none";
        updateGrandTotalAndCheckout(0);
        return;
      }

      const input = document.querySelector('input[name="country_code"]');
      const countryCode =
        input?.value ||
        window.__SHOPIFY_COUNTRY_CODE__ ||
        window.__SHOPIFY_SHOP__?.locale?.split("-")[1];

      // FIX: country code na mile to bhi row hide karo
      if (!countryCode) {
        window._hubShippingPriceCents = 0;
        shippingRow.style.display = "none";
        updateGrandTotalAndCheckout(0);
        return;
      }

      const shopCurrency = window.__SHOPIFY_SHOP__?.currency;
      const activeCurrency = window.__SHOPIFY_CURRENCY__?.code;
      const sameCurrency =
        !shopCurrency || !activeCurrency || shopCurrency === activeCurrency;
      const rate = sameCurrency
        ? 1
        : parseFloat(
            window.__SHOPIFY_CURRENCY_RATE__ ||
              window.Shopify?.currency?.rate ||
              1,
          ) || 1;

      const cartTotalBase = (cartTotalCents || 0) / 100 / rate;

      let matchedRate = null;

      data.shipping.forEach((profile) => {
        profile.zones.forEach((zone) => {
          const hasCountry = zone.countries.some(
            (country) => country.code === countryCode,
          );
          if (!hasCountry) return;

          zone.shipping_rates.forEach((r) => {
            let isApplicable = true;
            if (r.conditions?.length) {
              r.conditions.forEach((condition) => {
                const amount = parseFloat(condition.amount || 0);
                if (
                  condition.field === "TOTAL_PRICE" &&
                  condition.operator === "GREATER_THAN_OR_EQUAL_TO"
                ) {
                  if (cartTotalBase < amount) isApplicable = false;
                }
                if (
                  condition.field === "TOTAL_PRICE" &&
                  condition.operator === "LESS_THAN_OR_EQUAL_TO"
                ) {
                  if (cartTotalBase > amount) isApplicable = false;
                }
              });
            }
            if (isApplicable) {
              if (parseFloat(r.price || 0) === 0) {
                matchedRate = r;
                return;
              }
              if (!matchedRate) matchedRate = r;
            }
          });
        });
      });

      // FIX: koi rate match na ho to row explicitly hide karo (stale state prevent)
      if (!matchedRate) {
        window._hubShippingPriceCents = 0;
        shippingRow.style.display = "none";
        updateGrandTotalAndCheckout(0);
        return;
      }

      const basePrice = parseFloat(matchedRate.price || 0);
      const price = basePrice * rate;
      const shippingCents = Math.round(price * 100);

      window._hubShippingPriceCents = shippingCents;

      shippingRow.style.display = "";
      shippingCostEl.textContent = price === 0 ? "Free" : fmt(shippingCents);

      updateGrandTotalAndCheckout(shippingCents);
    } catch (err) {
      // FIX: error case mein bhi row ko hide/reset karo, stale state mat chhodo
      window._hubShippingPriceCents = 0;
      if (shippingRow) shippingRow.style.display = "none";
      updateGrandTotalAndCheckout(0);
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
    const fillPctNum = parseFloat(fillPct);
    const currentTier = sorted.find((t) => cartTotal < getTierValue(t));

    let titleHtml = "";
    if (cartTotal >= maxAmount) {
      titleHtml = `<p class="hub-rewards-title cart-plus-public-rewards__message">${rewards.successText || "All rewards unlocked!"}</p>`;
    } else if (currentTier) {
      const remaining = getTierValue(currentTier) - cartTotal;
      const amountStr = isQuantity
        ? `${remaining} items`
        : hubUtils.formatMoney(remaining * 100);
      const raw = currentTier.title || "You're {AMOUNT} away!";
      titleHtml = `<p class="hub-rewards-title cart-plus-public-rewards__message">${raw.replace("{AMOUNT}", `<strong>${amountStr}</strong>`)}</p>`;
    }

    const segFills = sorted.map((tier, index) => {
      const segStart = index === 0 ? 0 : getStepPosition(index - 1);
      const segEnd = getStepPosition(index);
      let segFill = 0;
      if (fillPctNum >= segEnd) segFill = 100;
      else if (fillPctNum > segStart)
        segFill = ((fillPctNum - segStart) / (segEnd - segStart)) * 100;
      return segFill;
    });

    el.style.display = "block";

    const existingFills = el.querySelectorAll(".hub-cell-fill");

    if (existingFills.length === sorted.length) {
      const dots = el.querySelectorAll(".hub-rewards-dot");
      const icons = el.querySelectorAll(".hub-rewards-dot svg");

      sorted.forEach((tier, i) => {
        existingFills[i].style.width = `${segFills[i].toFixed(2)}%`;

        const done = cartTotal >= getTierValue(tier);
        const dotBg = done ? fillColor : trackColor;
        const iconColor = done
          ? rewards.completeIconColor || "#ffffff"
          : rewards.incompleteIconColor || "#000000";

        if (dots[i]) dots[i].style.background = dotBg;
        if (icons[i]) icons[i].setAttribute("fill", iconColor);
      });

      const titleEl = el.querySelector(".hub-rewards-title");
      if (titleEl && titleHtml) {
        const tmp = document.createElement("div");
        tmp.innerHTML = titleHtml;
        titleEl.innerHTML = tmp.firstElementChild.innerHTML;
      } else if (!titleEl && titleHtml) {
        el.querySelector(".hub-rewards-wrap")?.insertAdjacentHTML(
          "afterbegin",
          titleHtml,
        );
      } else if (titleEl && !titleHtml) {
        titleEl.remove();
      }
      return;
    }

    const tiersHtml = sorted
      .map((tier, index) => {
        const segFill = segFills[index];
        const done = cartTotal >= getTierValue(tier);
        const iconColor = done
          ? rewards.completeIconColor || "#ffffff"
          : rewards.incompleteIconColor || "#000000";
        const dotBg = done ? fillColor : trackColor;

        return `<div class="hub-tier-cell cart-plus-public-component-segmented-progress-bar__segments-container">
  <div class="hub-cell-bar cart-plus-public-component-segmented-progress-bar__segment" style="background:${trackColor};height:${barLength}px">
    <div class="hub-cell-fill cart-plus-public-rewards__bar cart-plus-public-component-segmented-progress-bar" style="width:${segFill.toFixed(2)}%;background:${fillColor}"></div>
  </div>

  ${
    tier.showIcon
      ? `
    <div class="hub-circle-wrap cart-plus-public-component-segmented-progress-bar__milestone--middle icon-circle" style="padding:0 ${barGap}px">
      <div class="hub-rewards-dot cart-plus-public-component-segmented-progress-bar__segment" style="background:${dotBg};width:${dotSize}px;height:${dotSize}px">
        ${hubUtils.getTierIcon(tier.type, iconColor)}
      </div>
      <span class="hub-rewards-dot-label cart-plus-public-component-segmented-progress-bar__milestone-label--align-center">${tier.description || ""}</span>
    </div>
  `
      : ""
  }

</div>`;
      })
      .join("");

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
        headers: this.authHeaders({ "ngrok-skip-browser-warning": "true" }),
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
      return { allDiscountCodes: [], activeDiscountCodes: [] };
    }
  },

  // ── Skeleton helpers ──────────────────────────────────────────────────────────
  showCartSkeleton(blockId) {
    const skeleton = document.getElementById(`hub-skeleton-${blockId}`);
    const items = document.getElementById(`hub-cart-items-${blockId}`);
    if (skeleton) skeleton.style.display = "block";
    if (items) items.style.visibility = "visible";

    const footerSkel = document.getElementById(
      `hub-footer-skeleton-${blockId}`,
    );
    const footer = document.querySelector(
      `#hub-cart-drawer-${blockId} .hub-cart-footer`,
    );
    if (footerSkel) footerSkel.style.display = "flex";
    if (footer) footer.classList.add("hub-footer-loading");
  },
  hideCartSkeleton(blockId) {
    const skeleton = document.getElementById(`hub-skeleton-${blockId}`);
    if (skeleton) skeleton.style.display = "none";

    const footerSkel = document.getElementById(
      `hub-footer-skeleton-${blockId}`,
    );
    const footer = document.querySelector(
      `#hub-cart-drawer-${blockId} .hub-cart-footer`,
    );
    if (footerSkel) footerSkel.style.display = "none";
    if (footer) footer.classList.remove("hub-footer-loading");
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

    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};
    const iconColor = designSettings.iconColor || "";
    const discountColor = designSettings.discountBageColor || "#1e7e34";
    const savingsColor = designSettings.savingsColor || "#16a34a";

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
            <svg viewBox="0 0 20 20" style="fill: ${iconColor};">
          <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/>
         <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
         <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
         <path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/>
         </svg>
          </div>

          <div class="hub-discount-chip">
            <div class="hub-discount-title-btn">
              <span class="code-cart" style="background:${hexToRGBA(discountColor, 0.1)}; color:${discountColor};">${app.title}</span>

              ${
                isManual
                  ? `<button onclick="removeDiscountCode(this, '${blockId}')" class="remove-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>`
                  : ""
              }

            </div>

             ${
               app.total_allocated_amount
                 ? `<div class="saved-badge" style="background:${hexToRGBA(savingsColor, 0.1)}; color:${savingsColor};">
        Saved ${
          app.value_type === "percentage" && app.value
            ? `${parseFloat(app.value)}%`
            : hubUtils.formatMoney(app.total_allocated_amount)
        }
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

hubUtils.getCheckoutButtonText = function (cartSettings, totalFormatted) {
  const goToCartPageOnCheckout =
    cartSettings?.goToCartPageOnCheckout === true ||
    cartSettings?.goToCartPageOnCheckout === "true";

  if (goToCartPageOnCheckout) {
    return cartSettings?.viewCartName || "View cart";
  }
  const rawText = cartSettings?.checkoutButtonText || "Proceed to checkout";
  return rawText.replace("{{total_price}}", totalFormatted || "");
};
