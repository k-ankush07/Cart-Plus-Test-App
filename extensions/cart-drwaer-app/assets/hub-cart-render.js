function formatMoney(cents) {
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
}

async function maybeUpdateRewardProducts(cart, rewards) {
  if (!rewards?.enabled || !rewards?.tiers?.length) return false;
  if (window._hubRewardUpdating) return false;

  const isQuantity = rewards.calculationType === "quantity";

  const rewardCartItems = cart.items.filter((item) => item.properties?._hub_reward);
  const rewardDeduction = isQuantity
    ? rewardCartItems.reduce((n, item) => n + item.quantity, 0)
    : rewardCartItems.reduce((n, item) => n + (rewards.usePreDiscount ? item.original_line_price : item.final_line_price), 0) / 100;

  const rawValue = isQuantity
    ? cart.item_count
    : rewards.usePreDiscount
      ? (cart.original_total_price || cart.total_price) / 100
      : cart.total_price / 100;

  const cartValue = rawValue - rewardDeduction;

  // Collect all needed changes first, then apply atomically
  const toAdd = [];    // { id, tierId }
  const toRemove = []; // cart item keys

  for (const tier of rewards.tiers) {
    if (tier.type !== "product" && tier.type !== "shipping") continue;
    if (!tier.products?.length) continue;

    const threshold = isQuantity ? (tier.minQuantity || 0) : (tier.minAmount || 0);
    const reached = cartValue >= threshold;

    // All reward items already in cart for this tier (filter = ALL, not just first)
    const rewardItems = cart.items.filter(
      (item) => String(item.properties?._hub_reward) === String(tier.id)
    );

    if (reached) {
      // Add every available product not yet in cart
      for (const product of tier.products) {
        if (!product.available) continue;
        const numericId = Number(product.id.replace("gid://shopify/ProductVariant/", ""));
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
    // Add each product individually so one failure does not block others
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
}

function getTierIcon(type, color) {
  if (type === "discount") {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
  }
  if (type === "shipping") {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
  }

  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`;
}

function renderRewardsBar(blockId, cart, rewards) {
  const el = document.getElementById(`hub-rewards-${blockId}`);
  if (!el) return;

  if (!rewards?.enabled || !rewards?.tiers?.length) {
    el.style.display = "none";
    return;
  }

  if (!rewards.showOnEmptyCart && cart.items.length === 0) {
    el.style.display = "none";
    return;
  }

  const isQuantity = rewards.calculationType === "quantity";
  const getTierValue = (tier) => isQuantity ? (tier.minQuantity || 0) : (tier.minAmount || 0);

  // Exclude reward items so the bar reflects qualifying spend only
  const rewardCartItems = cart.items.filter((item) => item.properties?._hub_reward);
  const rewardDeduction = isQuantity
    ? rewardCartItems.reduce((n, item) => n + item.quantity, 0)
    : rewardCartItems.reduce((n, item) => n + (rewards.usePreDiscount ? item.original_line_price : item.final_line_price), 0) / 100;

  const rawTotal = isQuantity
    ? cart.item_count
    : rewards.usePreDiscount
      ? (cart.original_total_price || cart.total_price) / 100
      : cart.total_price / 100;

  const cartTotal = rawTotal - rewardDeduction;

  const sorted = [...rewards.tiers].sort((a, b) => getTierValue(a) - getTierValue(b));
  const len = sorted.length;
  const maxAmount = getTierValue(sorted[len - 1]) || 1;

  const trackColor = rewards.backgroundColor || "#c1c1c1";
  const fillColor = rewards.textColor || "#000000";
  const textColor = rewards.textColor || "#000000";

  // Equal step positions (same as React component)
  const getStepPosition = (index) => (100 / len) * (index + 1);

  // Fill interpolated between step positions based on actual values
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
        const progress = (cartTotal - getTierValue(curr)) / (getTierValue(next) - getTierValue(curr));
        return getStepPosition(i) + progress * (getStepPosition(i + 1) - getStepPosition(i));
      }
    }
    return 100;
  };

  const fillPct = getFillPercent().toFixed(2);

  // Active tier = first not yet reached
  const currentTier = sorted.find((t) => cartTotal < getTierValue(t));

  let titleHtml = "";
  if (cartTotal >= maxAmount) {
    titleHtml = `<p class="hub-rewards-title" style="color:${textColor}">${rewards.successText || "All rewards unlocked!"}</p>`;
  } else if (currentTier) {
    const remaining = getTierValue(currentTier) - cartTotal;
    const amountStr = isQuantity ? `${remaining} items` : formatMoney(remaining * 100);
    const raw = currentTier.title || "You're {AMOUNT} away!";
    titleHtml = `<p class="hub-rewards-title" style="color:${textColor}">${raw.replace("{AMOUNT}", `<strong>${amountStr}</strong>`)}</p>`;
  }

  const dotsHtml = sorted
    .map((tier, index) => {
      const pct = getStepPosition(index).toFixed(2);
      const done = cartTotal >= getTierValue(tier);
      const iconColor = done ? (rewards.completeIconColor || "#ffffff") : (rewards.incompleteIconColor || "#000000");
      const dotBg = done ? fillColor : trackColor;

      return `<div class="hub-rewards-milestone" style="left:${pct}%">
        <div class="hub-rewards-dot" style="background:${dotBg};border-color:${dotBg}">
          ${tier.showIcon ? getTierIcon(tier.type, iconColor) : ""}
        </div>
        <span class="hub-rewards-dot-label" style="color:${textColor}">${tier.description || ""}</span>
      </div>`;
    })
    .join("");

  el.style.display = "block";
  el.innerHTML = `
    <div class="hub-rewards-wrap">
      ${titleHtml}
      <div class="hub-rewards-track-wrap">
        <div class="hub-rewards-track" style="background:${trackColor}">
          <div class="hub-rewards-fill" style="width:${fillPct}%;background:${fillColor}"></div>
        </div>
        <div class="hub-rewards-milestones">${dotsHtml}</div>
      </div>
    </div>`;
}

window.hubCartRender = async function (drawer) {
  if (window._hubRenderInProgress) return;
  window._hubRenderInProgress = true;
  try {
    const res = await fetch("/cart.js");
    let cart = await res.json();

    const blockId = window.HUB_CART_BLOCK_ID;
    const rewards = window.__HUB_ACTIVE_CART__?.rewardsSettings;

    /* ── AUTO-ADD / REMOVE REWARD PRODUCTS ── */
    const changed = await maybeUpdateRewardProducts(cart, rewards);
    if (changed) {
      const res2 = await fetch("/cart.js");
      cart = await res2.json();
    }

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    /* ── ANNOUNCEMENT ── */
    const ann = window.__HUB_ACTIVE_CART__?.announcementSettings;
    const annBefore = document.getElementById(`hub-announcement-${blockId}`);
    const annAfter  = document.getElementById(`hub-announcement-after-${blockId}`);

    if (annBefore) annBefore.style.display = "none";
    if (annAfter)  annAfter.style.display  = "none";

    if (!ann?.enabled) {
      const isBefore = ann.position !== "after";
      const target   = isBefore ? annBefore : annAfter;
      if (target) {
        const height    = ann.height === "thick" ? "14px 20px" : "8px 20px";
        const timerText = ann.timer || "10:00";

        target.style.cssText = `
          display: block;
          background-color: ${ann.backgroundColor || "#ffffff"};
          border-bottom: 2px solid ${ann.borderColor || "#e5e5e5"};
          padding: ${height};
          font-size: ${ann.fontSize || 14}px;
          text-align: center;
        `;

        target.innerHTML = ann.text
          ? ann.text.replace("{TIMER}", `<span id="hub-timer-${blockId}">${timerText}</span>`)
          : "";

        if (ann.text?.includes("{TIMER}")) {
          startAnnTimer(blockId, timerText);
        }
      }
    }

    // Update footer total
    const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
    if (totalEl) {
      const currencyCode = window.__SHOPIFY_CURRENCY__?.code || "";
      totalEl.textContent = `${formatMoney(cart.total_price)} ${currencyCode}`;
    }

    /* ── REWARDS BAR ── */
    renderRewardsBar(blockId, cart, rewards);

    /* EMPTY CART */
    if (cart.items.length === 0) {
      container.innerHTML = `
        <div class="hub-cart-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#ccc" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
          </svg>
          <p>Your cart is empty</p>
        </div>`;
      return;
    }

    /* ── ITEMS ── */
    container.innerHTML = cart.items.map((item) => {
      const hasDiscount = item.original_line_price !== item.final_line_price;

      const priceHtml = hasDiscount
        ? `<span class="hub-price-original">${formatMoney(item.original_line_price)}</span>
           <span class="hub-price">${formatMoney(item.final_line_price)}</span>`
        : `<span class="hub-price">${formatMoney(item.final_line_price)}</span>`;

      const variantHtml = item.variant_title && item.variant_title !== "Default Title"
        ? `<p class="hub-item-variant">${item.variant_title}</p>` : "";

      const propertiesHtml = item.properties && Object.keys(item.properties).length > 0
        ? Object.entries(item.properties)
            .filter(([k]) => !k.startsWith("_"))
            .map(([k, v]) => v ? `<p class="hub-item-variant">${k}: ${v}</p>` : "")
            .join("")
        : "";

      const discountHtml = item.line_level_discount_allocations?.length > 0
        ? item.line_level_discount_allocations.map((d) =>
            `<p class="hub-item-discount">- ${d.discount_application.title} (${formatMoney(d.amount)})</p>`
          ).join("") : "";

      const isReward = !!item.properties?._hub_reward;

      return `
        <div class="hub-cart-item">
          <div class="hub-item-img-wrap">
            <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
          </div>
          <div class="hub-item-info">
            <a href="/products/${item.handle}" class="hub-item-title">${item.product_title || item.title}</a>
            ${isReward
              ? `<p class="hub-item-reward-badge">Free gift</p>`
              : `<p class="hub-item-unit-price">${formatMoney(item.price)}</p>`}
            ${variantHtml}
            ${propertiesHtml}
            ${discountHtml}
            ${isReward ? "" : `
            <div class="hub-item-actions">
              <div class="hub-qty-control">
                <button class="hub-qty-btn" onclick="updateQty('${item.key}', ${item.quantity - 1})">−</button>
                <input
                  type="text"
                  value="${item.quantity}"
                  class="hub-qty-input"
                  oninput="handleQtyInput('${item.key}', this.value)"
                />
                <button class="hub-qty-btn" onclick="updateQty('${item.key}', ${item.quantity + 1})">+</button>
              </div>
              <button class="hub-delete-btn" onclick="removeItem('${item.key}')" aria-label="Remove item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>`}
          </div>
          <div class="hub-item-total">${isReward ? `<span class="hub-price hub-price-free">FREE</span>` : priceHtml}</div>
        </div>`;
    }).join("");

    /* SAVINGS */
    if (cart.total_discount > 0) {
      container.insertAdjacentHTML("beforeend",
        `<p class="hub-savings">You saved ${formatMoney(cart.total_discount)}</p>`);
    }

    /* UPDATE FOOTER DISCOUNT STATUS */
    const hasAutoDiscount = cart.items.some((i) => i.line_level_discount_allocations?.length > 0);
    const code = cart.discount_codes?.[0]?.code;
    const hasRealDiscount = cart.total_discount > 0;
    const hasManualDiscount = code && hasRealDiscount;
    const appliedTitle = cart.items[0]?.line_level_discount_allocations?.[0]?.discount_application?.title;

    const discountStatus = document.getElementById(`hub-discount-status-${blockId}`);
    if (discountStatus) {
      discountStatus.innerHTML = hasManualDiscount
        ? `<div class="hub-discount-applied">
             <span>${appliedTitle ? `Applied: ${appliedTitle}` : "Discount applied"}</span>
             <button onclick="removeDiscountCode()" class="hub-discount-remove">Remove</button>
           </div>`
        : hasAutoDiscount
        ? `<div class="hub-discount-auto">Automatic discount applied</div>`
        : "";
    }

  } catch (err) {
    console.error("Cart render error:", err);
  } finally {
    window._hubRenderInProgress = false;
  }
};
