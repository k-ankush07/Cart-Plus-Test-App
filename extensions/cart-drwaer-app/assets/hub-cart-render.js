// ─────────────────────────────────────────────────────────────────────────────
window.hubCartRender = async function (drawer) {
  if (window._hubRenderInProgress) return;
  window._subscriptionOpen = {};
  window._upsellCache = window._upsellCache || {};
  window._hubRenderInProgress = true;

  // Move blockId up so skeleton helpers can use it immediately
  const blockId = window.HUB_CART_BLOCK_ID;

  if (drawer && !drawer.classList.contains(`hub-cart-block-${blockId}`)) {
    drawer.classList.add(`hub-cart-block-${blockId}`);
  }
  const trustBadgesSettings = window.__HUB_ACTIVE_CART__?.trustBadgesSettings;

  window.__HUB_ACTIVE_CART__?.trustBadgesSettings;

  const rustBadgesSettings = window.__HUB_ACTIVE_CART__?.rustBadgesSettings;

  hubUtils.renderTrustBadges(
    blockId,
    trustBadgesSettings || rustBadgesSettings,
  );

  const discountCodesSettings =
    window.__HUB_ACTIVE_CART__?.discountCodesSettings;
  const discountRow = document.getElementById(`hub-discount-row-${blockId}`);

  if (discountRow) {
    discountRow.style.display =
      discountCodesSettings?.enabled === false ? "flex" : "none";
  }

  // Show skeleton right away — before any async work
  hubUtils.showCartSkeleton(blockId);

  try {
    const res = await fetch("/cart.js");
    let cart = await res.json();

    const headerEl = document.querySelector(".upcart-header-text");

    if (headerEl) {
      const headerSettings = window.__HUB_ACTIVE_CART__?.headerSettings || {};

      headerEl.innerText = (
        headerSettings.titleText || "Cart • {{cart_quantity}}"
      ).replace("{{cart_quantity}}", cart.item_count || 0);
    }

    const footer = drawer.querySelector(".hub-cart-footer");
    if (footer) {
      if (cart.items.length === 0) {
        footer.classList.add("hub-empty-footer");
      } else {
        footer.classList.remove("hub-empty-footer");
      }
    }

    const rewards = window.__HUB_ACTIVE_CART__?.rewardsSettings;

    /* ── AUTO-ADD / REMOVE REWARD PRODUCTS ── */
    const changed = await hubUtils.maybeUpdateRewardProducts(cart, rewards);
    if (changed) {
      const res2 = await fetch("/cart.js");
      cart = await res2.json();
    }

    /* ── TRIGGERED REWARDS: auto-add / remove free gift ── */
    const triggeredChanged = await handleTriggeredRewards(cart);
    if (triggeredChanged) {
      const res3 = await fetch("/cart.js");
      cart = await res3.json();
    }

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    /* ── ANNOUNCEMENT ── */
    const ann = window.__HUB_ACTIVE_CART__?.announcementSettings;
    const annBefore = document.getElementById(`hub-announcement-${blockId}`);
    const annAfter = document.getElementById(
      `hub-announcement-after-${blockId}`,
    );

    if (annBefore) annBefore.style.display = "none";
    if (annAfter) annAfter.style.display = "none";

    // FIX: was `!ann?.enabled` — should be `ann?.enabled === false`
    if (ann?.enabled === false && cart.items.length > 0) {
      const isBefore = ann.position !== "after";
      const target = isBefore ? annBefore : annAfter;
      if (target) {
        const height = ann.height === "thick" ? "14px 20px" : "8px 20px";
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
          ? ann.text.replace(
              "{TIMER}",
              `<span id="hub-timer-${blockId}">${timerText}</span>`,
            )
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
      totalEl.textContent = `${hubUtils.formatMoney(cart.total_price)} ${currencyCode}`;
    }

    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
    const customHtmlBlocks = cartSettings.customHtmlBlocks || {};

    hubUtils.applyCustomCSS(blockId, cartSettings.customCss);
    hubUtils.executeBeforeLoadScripts(
      customHtmlBlocks.scripts_before_load,
      drawer,
    );
    /* ── REWARDS BAR ── */
    hubUtils.renderRewardsBar(blockId, cart, rewards);

    /* ── DISCOUNT CODES ── */
    const discountCodesSettings =
      window.__HUB_ACTIVE_CART__?.discountCodesSettings;
    const discountRow = document.getElementById(`hub-discount-row-${blockId}`);
    if (discountRow) {
      if (discountCodesSettings?.enabled === false) {
        discountRow.style.display = "flex";
      } else {
        discountRow.style.display = "none";
      }

      const discountInput = discountRow.querySelector("#discount-code-input");
      const discountApplyBtn = discountRow.querySelector(
        ".hub-discount-apply-btn",
      );

      if (discountInput && discountCodesSettings?.placeholder) {
        discountInput.placeholder = discountCodesSettings.placeholder;
      }

      if (discountApplyBtn && discountCodesSettings?.buttonText) {
        discountApplyBtn.textContent = discountCodesSettings.buttonText;
      }
    }

    window.renderProducts = function (container, products, settings = {}) {
      const layout = settings.layout || "block";
      const html = products.map((p) => hubUtils.getProductCardHTML(p)).join("");

      if (layout === "carousel") {
        container.innerHTML = `
          <div class="hub-slider">
            <button class="hub-prev">‹</button>
            <div class="hub-slider-track">${html}</div>
            <button class="hub-next">›</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="upcart-internal-upsell__vertical-layout-wrapper">${html}</div>
        `;
      }

      container.querySelectorAll(".hub-rec-product").forEach((card) => {
        const select = card.querySelector(".hub-variant-select");
        const priceEl = card.querySelector(".sale-price");
        const imgEl = card.querySelector(".hub-product-img");
        select.addEventListener("change", function () {
          const selected = this.options[this.selectedIndex];
          priceEl.textContent = hubUtils.formatMoney(
            Number(selected.dataset.price),
          );
          if (selected.dataset.image) imgEl.src = selected.dataset.image;
        });
      });

      // FIX: was `document.addEventListener` — leaked a new listener on every render
      container.addEventListener("click", async (e) => {
        const btn = e.target.closest(".hub-add-btn");
        if (!btn) return;
        const parent = btn.closest(".hub-rec-product");
        const select = parent.querySelector(".hub-variant-select");
        const variantId = select?.value || btn.dataset.variant;
        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: variantId, quantity: 1 }),
        });
        document.dispatchEvent(new CustomEvent("cart:updated"));
      });

      if (layout === "carousel") {
        const track = container.querySelector(".hub-slider-track");
        const prev = container.querySelector(".hub-prev");
        const next = container.querySelector(".hub-next");
        let index = 0;
        const items = track.children;
        function updateSlider() {
          track.style.transform = `translateX(-${index * 100}%)`;
        }
        next.addEventListener("click", () => {
          if (index < items.length - 1) {
            index++;
            updateSlider();
          }
        });
        prev.addEventListener("click", () => {
          if (index > 0) {
            index--;
            updateSlider();
          }
        });
      }
    };

    if (cart.items.length === 0) {
      const recommendations =
        window.__HUB_ACTIVE_CART__?.recommendationsSettings;

      drawer
        .querySelectorAll(".hub-additional-notes")
        .forEach((el) => el.remove());

      const upsellTop = document.getElementById(`hub-upsell-top-${blockId}`);
      const upsellBottom = document.getElementById(
        `hub-upsell-bottom-${blockId}`,
      );
      if (upsellTop) upsellTop.innerHTML = "";
      if (upsellBottom) upsellBottom.innerHTML = "";

      let recHTML = "";
      if (!recommendations?.enabled) {
        recHTML = `
          <div class="hub-cart-recommendations">
            <p class="hub-rec-subtitle">${recommendations.headerText || ""}</p>
            <h3 class="hub-rec-title">${recommendations.productHeaderText || "You may also like"}</h3>
            ${
              recommendations.showShopNowButton
                ? `<a href="${recommendations.buttonUrl}" class="hub-rec-btn">${recommendations.buttonText || "Shop Now"}</a>`
                : ""
            }
            <div id="hub-rec-products"></div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="hub-cart-empty">
         <div>${hubUtils.renderCustomHTML(customHtmlBlocks.empty_cart)}</div>
          <p class="hub-empty-title">Your cart is empty</p>
        </div>
      `;

      const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
      if (footerRec && !footerRec.innerHTML.trim()) {
        footerRec.innerHTML = recHTML;
      }

      if (footer) footer.classList.add("hub-empty-footer");

      if (!recommendations?.enabled) {
        const recContainer = document.getElementById("hub-rec-products");
        if (
          recContainer &&
          recContainer.children.length === 0 &&
          !window._hubRecInitialized
        ) {
          loadCartRecommendations(recommendations);
        }
      }
      return;
    }

    const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
    if (footerRec) footerRec.innerHTML = "";

    const itemsHTML = await Promise.all(
      cart.items.map(async (item) => {
        if (item.properties?._hub_addon) return "";

        const showSavingsBelowPrices =
          cartSettings.showSavingsBelowPrices || false;

        const hasDiscount = item.original_line_price !== item.final_line_price;

        const savedAmount = hasDiscount
          ? item.original_line_price - item.final_line_price
          : 0;
        const saveHtml =
          hasDiscount && showSavingsBelowPrices
            ? `<p class="hub-item-save">Save ${hubUtils.formatMoney(savedAmount)}</p>`
            : "";
        const priceHtml = hasDiscount
          ? `<span class="hub-price-original">${hubUtils.formatMoney(item.original_line_price)}</span>
             <span class="hub-price">${hubUtils.formatMoney(item.final_line_price)}</span>`
          : `<span class="hub-price">${hubUtils.formatMoney(item.final_line_price)}</span>`;

        const variantHtml =
          item.variant_title && item.variant_title !== "Default Title"
            ? `<p class="hub-item-variant">${item.variant_title}</p>`
            : "";

        const propertiesHtml =
          item.properties && Object.keys(item.properties).length > 0
            ? Object.entries(item.properties)
                .filter(([k]) => !k.startsWith("_"))
                .map(([k, v]) =>
                  v ? `<p class="hub-item-variant">${k}: ${v}</p>` : "",
                )
                .join("")
            : "";

        const discountHtml =
          item.line_level_discount_allocations?.length > 0
            ? item.line_level_discount_allocations
                .map(
                  (d) =>
                    `<p class="hub-item-discount">- ${d.discount_application.title} (${hubUtils.formatMoney(d.amount)})</p>`,
                )
                .join("")
            : "";

        const isReward = !!item.properties?._hub_reward;
        const subscriptionSettings =
          window.__HUB_ACTIVE_CART__?.subscriptionUpgradesSettings;
        const sellingPlan = item.selling_plan_allocation;
        let sellingPlanHtml = "";
        const planOptionsText =
          subscriptionSettings?.planOptionsText ||
          "{{selling_plan_group_name}} / {{selling_plan_name}}";
        const groups = await hubUtils.getSellingPlans(item.handle);

        if (groups.length > 0 && !subscriptionSettings?.enabled) {
          let options = "";
          groups.forEach((group) => {
            group.selling_plans.forEach((plan) => {
              const optionText = planOptionsText
                .replace("{{selling_plan_group_name}}", group.name)
                .replace("{{selling_plan_name}}", plan.name);
              options += `
                <option value="${plan.id}" 
                  ${sellingPlan && plan.id === sellingPlan.selling_plan.id ? "selected" : ""}>
                  ${optionText}
                </option>
              `;
            });
          });

          const selectedPlanName = sellingPlan
            ? sellingPlan.selling_plan.name
            : "Select subscription";
          const groupName = groups?.[0]?.name || "Subscribe and save";
          const buttonText = subscriptionSettings?.buttonText?.replace(
            "{{selling_plan_group_name}}",
            groupName,
          );
          const planHeadingText =
            subscriptionSettings?.planHeadingText || "Subscription plans";

          sellingPlanHtml = `
            <div class="hub-selling-plan-wrapper ${
              window._subscriptionOpen?.[item.key] || sellingPlan
                ? "show-subscription"
                : ""
            }">
              <div class="hub-one-time-view">
                <button class="hub-upgrade-btn">${buttonText}</button>
              </div>
              <div class="hub-subscription-view">
                <div class="hub-selected-plan">Subscribe and save / ${selectedPlanName}</div>
                <select class="hub-selling-plan-select" data-key="${item.key}">
                  <option value="" disabled ${!sellingPlan ? "selected" : ""}>${planHeadingText}</option>
                  ${options}
                </select>
              </div>
            </div>
          `;
        }

        return `
          <div class="hub-cart-for-item" data-item-key="${item.key}" style="position:relative">
            <div class="hub-cart-item">
              <div class="hub-item-img-wrap">
                <img src="${item.image}" alt="${item.product_title}" class="hub-item-img" />
              </div>
              <div class="hub-item-info">
                <a href="/products/${item.handle}" class="hub-item-title">${item.product_title || item.title}</a>
                ${
                  isReward
                    ? `
      <p class="hub-item-reward-badge">Free gift</p>
      <p class="hub-item-unit-price">${hubUtils.formatMoney(item.price)}</p>
    `
                    : `
      <p class="hub-item-unit-price">${hubUtils.formatMoney(item.price)}</p>
      ${saveHtml}
    `
                }
                ${variantHtml}
                ${propertiesHtml}
                ${discountHtml}
                ${
                  isReward
                    ? ""
                    : `
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
                    <button class="hub-delete-btn" onclick="removeItem('${item.key}', '${item.product_title?.replace(/'/g, "\\'")}')" aria-label="Remove item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>`
                }
              </div>
              <div class="hub-item-total">
                ${isReward ? `<span class="hub-price hub-price-free">FREE</span>` : priceHtml}
              </div>
            </div>
            <div class="hub-selling-plan-container">${sellingPlanHtml}</div>
            <div>${hubUtils.renderCustomHTML(customHtmlBlocks.between_line_items)}</div>
          </div>
          <div>${hubUtils.renderCustomHTML(customHtmlBlocks.below_cart_items)}</div>
          `;
      }),
    );

    container.innerHTML = itemsHTML.join("");

    const addonsSettings = window.__HUB_ACTIVE_CART__?.addonsSettings;
    const addonsEl = document.getElementById(`hub-addons-${blockId}`);

    if (!addonsEl || addonsSettings?.enabled || cart.items.length === 0) {
      if (addonsEl) addonsEl.style.display = "none";
    } else {
      const type = addonsSettings.type;
      const isShipping = type === "shipping_protection";
      const isProduct = type === "product_addon";
      const rawVariantId = isShipping
        ? addonsSettings.customShippingProduct?.variantId
        : isProduct
          ? addonsSettings.selectedProduct?.id
          : null;
      const variantId = rawVariantId?.replace(
        "gid://shopify/ProductVariant/",
        "",
      );

      if (!variantId || (!isShipping && !isProduct)) {
        addonsEl.style.display = "none";
      } else {
        const isInCart = cart.items.some(
          (i) => String(i.variant_id) === String(variantId),
        );
        const price = hubUtils.formatMoney(
          Math.round(
            Number(
              isShipping
                ? addonsSettings.price
                : addonsSettings.selectedProduct?.price,
            ) * 100,
          ),
        );

        addonsEl.style.display = "block";
        if (isShipping) {
          addonsEl.innerHTML = `
            <div class="hub-addon-shipping-protection">
              <div class="hub-addon-sp-info">
                <p class="hub-addon-sp-title">${addonsSettings.title || "Shipping Protection"}</p>
                <p class="hub-addon-sp-desc">${addonsSettings.description || ""}</p>
              </div>
              <div class="hub-addon-sp-right">
                <span class="hub-addon-sp-price">${price}</span>
                <label class="hub-addon-sp-toggle">
                  <input type="checkbox" id="hub-sp-toggle-${blockId}" class="hub-sp-checkbox"
                    data-variant="${variantId}" ${isInCart ? "checked" : ""} />
                  <span class="hub-addon-sp-slider"></span>
                </label>
              </div>
            </div>`;
        } else {
          const selected = addonsSettings.selectedProduct;
          addonsEl.innerHTML = `
            <div class="hub-addon-product">
              ${selected.image ? `<img src="${selected.image}" alt="${selected.title}" class="hub-addon-product-img" />` : ""}
              <div class="hub-addon-product-info">
                <p class="hub-addon-product-title">${selected.title || ""}</p>
                <span class="hub-addon-product-price">${price}</span>
              </div>
              <label class="hub-addon-sp-toggle">
                <input type="checkbox" id="hub-addon-toggle-${blockId}" class="hub-addon-checkbox"
                  data-variant="${variantId}" ${isInCart ? "checked" : ""} />
                <span class="hub-addon-sp-slider"></span>
              </label>
            </div>`;
        }

        const checkboxId = isShipping
          ? `hub-sp-toggle-${blockId}`
          : `hub-addon-toggle-${blockId}`;
        const checkbox = addonsEl.querySelector(`#${checkboxId}`);
        if (checkbox) {
          checkbox.addEventListener("change", async function () {
            const vid = this.dataset.variant;
            if (this.checked) {
              await fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: Number(vid),
                  quantity: 1,
                  properties: {
                    _hub_addon: isShipping
                      ? "shipping_protection"
                      : "product_addon",
                  },
                }),
              });
            } else {
              const latestCart = await (await fetch("/cart.js")).json();
              const match = latestCart.items.find(
                (i) => String(i.variant_id) === String(vid),
              );
              if (match) {
                await fetch("/cart/change.js", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: match.key, quantity: 0 }),
                });
              }
            }
            document.dispatchEvent(new CustomEvent("cart:updated"));
          });
        }
      }
    }

    const upsellSettings = window.__HUB_ACTIVE_CART__?.upsellsSettings;
    if (!upsellSettings?.enabled && cart.items.length > 0) {
      const productId = cart.items[0].product_id;
      const upsellProducts = await window.getUpsellProducts(
        upsellSettings,
        productId,
      );
      const position = upsellSettings.position || "bottom";
      const upsellContainer =
        position === "top"
          ? document.getElementById(`hub-upsell-top-${blockId}`)
          : document.getElementById(`hub-upsell-bottom-${blockId}`);

      if (upsellContainer) {
        upsellContainer.innerHTML = "";
        if (upsellProducts.length > 0) {
          window.renderProducts(upsellContainer, upsellProducts, {
            layout: upsellSettings.direction,
          });
        }
      }
    }

    const notesSettings = window.__HUB_ACTIVE_CART__?.additionalNotesSettings;
    const belowEl = document.getElementById(`hub-notes-below-${blockId}`);
    const footerEl = document.getElementById(`hub-notes-footer-${blockId}`);

    if (belowEl) belowEl.innerHTML = "";
    if (footerEl) footerEl.innerHTML = "";
    drawer
      .querySelectorAll(".hub-additional-notes")
      .forEach((el) => el.remove());

    if (
      notesSettings?.enabled === false &&
      notesSettings.placement === "below_items" &&
      cart.items.length > 0
    ) {
      if (belowEl)
        belowEl.innerHTML = getAdditionalNotesHTML(
          blockId,
          notesSettings,
          cart.note,
        );
    }

    if (
      notesSettings?.enabled === false &&
      notesSettings.placement === "top_of_footer" &&
      cart.items.length > 0
    ) {
      if (footerEl)
        footerEl.innerHTML = getAdditionalNotesHTML(
          blockId,
          notesSettings,
          cart.note,
        );
    }

    if (cart.total_discount > 0) {
      container.insertAdjacentHTML(
        "beforeend",
        `<p class="hub-savings">You saved ${hubUtils.formatMoney(cart.total_discount)}</p>`,
      );
    }

    const hasAutoDiscount = cart.items.some(
      (i) => i.line_level_discount_allocations?.length > 0,
    );
    const code = cart.discount_codes?.[0]?.code;
    const hasRealDiscount = cart.total_discount > 0;
    const hasManualDiscount = code && hasRealDiscount;
    const appliedTitle =
      cart.items[0]?.line_level_discount_allocations?.[0]?.discount_application
        ?.title;

    const discountStatus = document.getElementById(
      `hub-discount-status-${blockId}`,
    );
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
    window._hubRewardUpdating = false;
    hubUtils.hideCartSkeleton(blockId);
    hubUtils.revealCartItems(blockId);
  }
};

// ── Triggered Rewards: auto-add / remove free gift products ──────────────────

async function handleTriggeredRewards(cart) {
  if (window._hubRewardUpdating) return false;

  const triggeredSettings = window.__HUB_ACTIVE_CART__?.triggeredRewardsSettings;
  const rewards = triggeredSettings?.rewards || [];
  const enabledRewards = rewards.filter(r => r.enabled && r.reward?.type === "free_gift");

  // Collect all active reward IDs so we can detect orphans
  const activeRewardIds = new Set(enabledRewards.map(r => String(r.id)));

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
        console.log("[triggered-reward] Removed orphaned gift item:", item.variant_id);
      } catch (e) {
        console.error("[triggered-reward] Failed to remove orphan:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  if (!enabledRewards.length) return changed;

  const cartTotal = cart.total_price / 100;
  const cartProductIds = new Set(cart.items.map(i => `gid://shopify/Product/${i.product_id}`));
  const cartVariantIds = new Set(cart.items.map(i => `gid://shopify/ProductVariant/${i.variant_id}`));

  for (const reward of enabledRewards) {
    const qualifies = checkTriggers(reward.triggers, { cartTotal, cartProductIds, cartVariantIds, cart });
    const giftItems = reward.reward?.items || {};
    const giftVariantIds = giftItems.variants || [];
    const giftProductIds = new Set(giftItems.products || []);

    const giftInCart = cart.items.find(i =>
      giftVariantIds.includes(`gid://shopify/ProductVariant/${i.variant_id}`) ||
      giftProductIds.has(`gid://shopify/Product/${i.product_id}`)
    );

    console.log("[triggered-reward] reward:", reward.id, "qualifies:", qualifies, "giftInCart:", !!giftInCart, "giftVariantIds:", giftVariantIds, "triggers:", JSON.stringify(reward.triggers), "cartTotal:", cartTotal, "cartQty:", cart.items.reduce((s,i)=>s+i.quantity,0));

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
            items: [{ id: Number(variantId), quantity: 1, properties: { _triggered_reward: reward.id } }],
          }),
        });
        if (!addRes.ok) {
          const errBody = await addRes.text();
          console.error("[triggered-reward] /cart/add.js failed:", addRes.status, errBody);
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
        console.log("[triggered-reward] Removed free gift (trigger failed):", giftInCart.variant_id);
      } catch (e) {
        console.error("[triggered-reward] Failed to remove gift:", e);
      } finally {
        window._hubRewardUpdating = false;
      }
    }
  }

  return changed;
}

function checkTriggers(triggers, { cartTotal, cartProductIds, cartVariantIds, cart }) {
  if (!triggers || triggers.length === 0) return true;
  return triggers.every(t => checkTrigger(t, { cartTotal, cartProductIds, cartVariantIds, cart }));
}

function checkTrigger(trigger, { cartTotal, cartProductIds, cartVariantIds, cart }) {
  switch (trigger.type) {
    case "cart_total":
      return cartTotal >= Number(trigger.minAmount || 0);

    case "cart_quantity": {
      const qty = cart.items.reduce((s, i) => s + i.quantity, 0);
      return qty >= Number(trigger.minQuantity || 0);
    }

    case "specific_products": {
      const pids = (trigger.items?.products || []);
      const vids = (trigger.items?.variants || []);
      return pids.some(id => cartProductIds.has(id)) || vids.some(id => cartVariantIds.has(id));
    }

    case "specific_collections":
      return true; 

    case "customer_logged_in":
      return false;

    case "subscription":
      return false; 

    default:
      return true;
  }
}
