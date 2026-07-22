// ─────────────────────────────────────────────────────────────────────────────
// HUB CART RENDER
window.hubCartRender = async function (drawer, opts = {}) {
  if (window._hubRenderInProgress) {
    window._hubPendingRender = { drawer, opts };
    return;
  }
  window._subscriptionOpen = {};
  window._upsellCache = window._upsellCache || {};
  window._hubRenderInProgress = true;

  const blockId = window.HUB_CART_BLOCK_ID;

  if (drawer && !drawer.classList.contains(`hub-cart-block-${blockId}`)) {
    drawer.classList.add(`hub-cart-block-${blockId}`);
  }

  const trustBadgesSettings = window.__HUB_ACTIVE_CART__?.trustBadgesSettings;
  hubUtils.renderTrustBadges(blockId, trustBadgesSettings);

  const discountCodesSettings =
    window.__HUB_ACTIVE_CART__?.discountCodesSettings;
  const discountRow = document.getElementById(`hub-discount-row-${blockId}`);

  if (discountRow) {
    discountRow.style.display =
      discountCodesSettings?.enabled === false ? "flex" : "none";
  }

  const _itemsContainer = drawer?.querySelector(`#hub-cart-items-${blockId}`);
  const _hasRenderedItems = !!_itemsContainer?.querySelector(".hub-cart-item");
  const _hasEmptyUI = !!_itemsContainer?.querySelector(".hub-cart-empty");

  if (window._hubLastCartHadItems === true && _itemsContainer && _hasEmptyUI) {
    _itemsContainer.innerHTML = "";
    const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
    if (footerRec) footerRec.innerHTML = "";
  }

  if (
    opts.showSkeleton &&
    window._hubLastCartHadItems !== false &&
    !_hasRenderedItems
  ) {
    hubUtils.showCartSkeleton(blockId);
  }

  const _footer = drawer?.querySelector(".hub-cart-footer");
  if (_footer && window._hubLastCartHadItems === false) {
    _footer.classList.add("hub-empty-footer");
  }

  if (window._hubLastCartHadItems === false) {
    const _trustTop = document.getElementById(
      `hub-trust-badges-top-${blockId}`,
    );
    const _trustBottom = document.getElementById(
      `hub-trust-badges-bottom-${blockId}`,
    );
    if (_trustTop) _trustTop.style.display = "none";
    if (_trustBottom) _trustBottom.style.display = "none";
  }

  try {
    // ── FETCH 1: cart (the only guaranteed fetch) ─────────────────────────
    const res = await fetch("/cart.js");
    let cart = await res.json();

    // Auto-remove orphan addons/rewards: if the only items left are
    // addons or gift/reward items (no paying products), drop them all.
    const _isAddonOrReward = (i) =>
      !!(
        i.properties?._hub_addon ||
        i.properties?.__upcartAddon ||
        i.properties?._hub_reward ||
        i.properties?._triggered_reward
      );
    const _orphanItems = cart.items.filter(_isAddonOrReward);
    const _payingItems = cart.items.filter((i) => !_isAddonOrReward(i));
    if (_orphanItems.length > 0 && _payingItems.length === 0) {
      const updates = {};
      _orphanItems.forEach((i) => {
        updates[i.key] = 0;
      });
      await fetch("/cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const refreshed = await fetch("/cart.js");
      cart = await refreshed.json();
    }

    hubUtils.updateDiscountUI(blockId, cart);

    window._hubCartProductIds = new Set(
      cart.items.map((i) => String(i.product_id)),
    );

    const headerEl = document.querySelector(".upcart-header-text");
    if (headerEl) {
      const headerSettings = window.__HUB_ACTIVE_CART__?.headerSettings || {};
      const includeAddonsInCount =
        window.__HUB_ACTIVE_CART__?.addonsSettings?.includeInItemCount === true;

      const nonGiftQty = cart.items
        .filter(
          (i) =>
            !i.properties?._triggered_reward &&
            (includeAddonsInCount ||
              (!i.properties?._hub_addon && !i.properties?.__upcartAddon)),
        )
        .reduce((sum, i) => sum + i.quantity, 0);
      headerEl.innerText = (
        headerSettings.titleText || "Cart • {{cart_quantity}}"
      ).replace("{{cart_quantity}}", nonGiftQty);
    }

    const notesSettings = window.__HUB_ACTIVE_CART__?.additionalNotesSettings;
    const belowEl = document.getElementById(`hub-notes-below-${blockId}`);
    const footerEl = document.getElementById(`hub-notes-footer-${blockId}`);
    const _shouldShowBelow =
      notesSettings?.enabled === false &&
      notesSettings.placement === "below_items" &&
      cart.items.length > 0;
    const _shouldShowFooter =
      notesSettings?.enabled === false &&
      notesSettings.placement === "top_of_footer" &&
      cart.items.length > 0;

    if (!_shouldShowBelow && belowEl) belowEl.innerHTML = "";
    if (!_shouldShowFooter && footerEl) footerEl.innerHTML = "";

    drawer.querySelectorAll(".hub-additional-notes").forEach((el) => {
      const inBelow = belowEl?.contains(el);
      const inFooter = footerEl?.contains(el);
      if (!inBelow && !inFooter) el.remove();
    });

    const footer = drawer.querySelector(".hub-cart-footer");
    if (footer) {
      if (cart.items.length === 0) {
        footer.classList.add("hub-empty-footer");
        window._hubLastCartHadItems = false;
      } else {
        footer.classList.remove("hub-empty-footer");
        window._hubLastCartHadItems = true;
      }
    }

    const rewards = window.__HUB_ACTIVE_CART__?.rewardsSettings;

    // ── REWARD UPDATES ────────────────────────────────────────────────────
    // FIX: ensure flag is always cleared even if an error is thrown inside helpers
    let isCartChanged = false;
    try {
      const changed = await hubUtils.maybeUpdateRewardProducts(cart, rewards);
      if (changed) {
        const res2 = await fetch("/cart.js");
        cart = await res2.json();
        isCartChanged = true;
      }
    } finally {
      window._hubRewardUpdating = false; // FIX: guarantee flag reset
    }

    try {
      const triggeredChanged = await window.handleTriggeredRewards(cart);
      if (triggeredChanged) {
        const res3 = await fetch("/cart.js");
        cart = await res3.json();
        isCartChanged = true;
      }
    } finally {
      window._hubRewardUpdating = false; // FIX: guarantee flag reset
    }

    if (isCartChanged) document.dispatchEvent(new CustomEvent("cart:updated"));

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
    if (cartItemsEl) {
      cartItemsEl.classList.toggle("footer-empty", cart.items.length === 0);
    }

    // ── ANNOUNCEMENT ──────────────────────────────────────────────────────
    const ann = window.__HUB_ACTIVE_CART__?.announcementSettings;
    const annBefore = document.getElementById(`hub-announcement-${blockId}`);
    const annAfter = document.getElementById(
      `hub-announcement-after-${blockId}`,
    );
    if (annBefore) annBefore.style.display = "none";
    if (annAfter) annAfter.style.display = "none";

    if (ann?.enabled === false && cart.items.length > 0) {
      const isBefore = ann.position !== "after";
      const target = isBefore ? annBefore : annAfter;
      if (target) {
        const paddingMap = {
          slim: "4px 33px",
          normal: "10px 33px",
          thick: "18px 33px",
        };
        const height = paddingMap[ann.height] || "10px 33px";
        const timerText = ann.timer || "10:00";
        const isAfter = ann.position === "after";
        target.className =
          "custom-cart-public-announcement custom-cart-announcement upcart-announcement";
        target.style.cssText = `
          display: block;
          background-color: ${ann.backgroundColor || "#ffffff"};
          border-top: 1px solid ${ann.borderColor || "#e5e5e5"};
          border-bottom: 1px solid ${ann.borderColor || "#e5e5e5"};
          padding: ${height};
          font-size: ${ann.fontSize || 14}px;
          text-align: center;
          color:#000000;
          ${isAfter ? "margin-top: 0;" : ""}
        `;
        target.innerHTML = ann.text
          ? ann.text.replace(
              "{TIMER}",
              `<strong><span id="hub-timer-${blockId}">${timerText}</span></strong>`,
            )
          : "";
        if (ann.text?.includes("{TIMER}")) startAnnTimer(blockId, timerText);
      }
    }

    // ── PRICE TOTALS ──────────────────────────────────────────────────────
    (function () {
      const fmt = hubUtils.formatMoney;
      const originalTotal = cart.original_total_price || 0;
      const subtotal = cart.items_subtotal_price || 0;
      const finalTotal = cart.total_price || 0;
      const shippingPrice = window._hubShippingPriceCents || 0;
      const grandTotal = finalTotal + shippingPrice;
      const lineSaving = originalTotal - subtotal;
      const couponSaving = subtotal - finalTotal;
      const totalSaved = originalTotal - finalTotal;

      window._hubCartFinalTotal = finalTotal;

      const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
      if (totalEl) totalEl.textContent = fmt(finalTotal);

      const origEl = document.getElementById(`hub-total-original-${blockId}`);
      if (origEl) {
        if (totalSaved > 0) {
          origEl.textContent = fmt(originalTotal);
          origEl.style.display = "";
        } else origEl.style.display = "none";
      }

      const savedEl = document.getElementById(`hub-total-saved-${blockId}`);
      if (savedEl) {
        if (totalSaved > 0) {
          savedEl.textContent = `You Saved ${fmt(totalSaved)}!`;
          savedEl.style.display = "";
        } else savedEl.style.display = "none";
      }

      const mrpEl = document.getElementById(`hub-mrp-${blockId}`);
      if (mrpEl) mrpEl.textContent = fmt(originalTotal);

      const discMrpRow = document.getElementById(
        `hub-discount-mrp-row-${blockId}`,
      );
      const discMrpEl = document.getElementById(`hub-discount-mrp-${blockId}`);
      const discMrpLabelEl = document.getElementById(
        `hub-discount-mrp-label-${blockId}`,
      );

      if (discMrpRow && discMrpEl) {
        if (lineSaving > 0) {
          discMrpEl.textContent = `-${fmt(lineSaving)}`;
          discMrpRow.style.display = "";

          if (discMrpLabelEl) {
            const lineDiscountTitles = [
              ...new Set(
                cart.items.flatMap((item) =>
                  (item.line_level_discount_allocations || [])
                    .map((d) => d.discount_application?.title)
                    .filter(Boolean),
                ),
              ),
            ];

            const baseLabel =
              window.__HUB_ACTIVE_CART__?.cartSettings?.discountsSavingsText ||
              "Discount";
            discMrpLabelEl.textContent = lineDiscountTitles.length
              ? `${baseLabel} (${lineDiscountTitles.join(", ")})`
              : baseLabel;
          }
        } else {
          discMrpRow.style.display = "none";
        }
      }

      const couponRow = document.getElementById(`hub-coupon-row-${blockId}`);
      const couponEl = document.getElementById(`hub-coupon-${blockId}`);
      if (couponRow && couponEl) {
        if (couponSaving > 0) {
          couponEl.textContent = `-${fmt(couponSaving)}`;
          couponRow.style.display = "";
        } else couponRow.style.display = "none";
      }

      const shippingRow = document.getElementById(
        `hub-shipping-row-${blockId}`,
      );
      const shippingCostEl = document.getElementById(
        `hub-shipping-cost-${blockId}`,
      );
      if (shippingRow && shippingCostEl) {
        if (shippingPrice > 0) {
          shippingCostEl.textContent = fmt(shippingPrice);
          shippingRow.style.display = "";
        } else shippingRow.style.display = "none";
      }

      const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
      if (grandEl) grandEl.textContent = fmt(grandTotal);

      const checkoutBtn = document.getElementById(
        `hub-checkout-btn-${blockId}`,
      );

      if (checkoutBtn) {
        const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
        const goToCartPageOnCheckout =
          cartSettings.goToCartPageOnCheckout === true ||
          cartSettings.goToCartPageOnCheckout === "true";

        const rawText = goToCartPageOnCheckout
          ? cartSettings.viewCartName || "View cart"
          : cartSettings.checkoutButtonText || "Proceed to checkout";

        checkoutBtn.textContent = goToCartPageOnCheckout
          ? rawText
          : rawText.replace("{{total_price}}", fmt(grandTotal));
      }
    })();

    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
    const customHtmlBlocks = cartSettings.customHtmlBlocks || {};
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};

    const discountCodesSettings =
      window.__HUB_ACTIVE_CART__?.discountCodesSettings;

    const showOfferBgColor =
      discountCodesSettings?.showOfferBgColor || "#6C4DFF";

    hubUtils.applyCustomCSS(blockId, cartSettings.customCss);
    hubUtils.executeBeforeLoadScripts(
      customHtmlBlocks.scripts_before_load,
      drawer,
    );
    hubUtils.shipping_Charges(container, cart.total_price);
    hubUtils.renderRewardsBar(blockId, cart, rewards);

    hubUtils
      .getDiscounts()
      .then(({ allDiscountCodes, activeDiscountCodes }) => {
        hubRenderOffersPanel(
          blockId,
          allDiscountCodes,
          activeDiscountCodes,
          cart,
          showOfferBgColor
        );
      });

    const discountRowEl = document.getElementById(
      `hub-discount-row-${blockId}`,
    );
    if (discountRowEl) {
      discountRowEl.style.display =
        discountCodesSettings?.enabled === false ? "flex" : "none";
      const discountInput = discountRowEl.querySelector(
        `#discount-code-input-${blockId}`,
      );
      const discountApplyBtn = discountRowEl.querySelector(
        ".hub-discount-apply-btn",
      );
      if (discountInput && discountCodesSettings?.placeholder)
        discountInput.placeholder = discountCodesSettings.placeholder;
      if (discountApplyBtn && discountCodesSettings?.buttonText)
        discountApplyBtn.textContent = discountCodesSettings.buttonText;
    }

    const offersRow = document.querySelector(`.hub-offers-input-row`);
    if (offersRow) {
      offersRow.style.display =
        discountCodesSettings?.enabled === false ? "flex" : "none";
      const offersInput = offersRow.querySelector(
        `#hub-offers-input-${blockId}`,
      );
      const offersBtn = offersRow.querySelector(".hub-offers-apply-btn");
      if (offersInput && discountCodesSettings?.placeholder)
        offersInput.placeholder = discountCodesSettings.placeholder;
      if (offersBtn && discountCodesSettings?.buttonText)
        offersBtn.textContent = discountCodesSettings.buttonText;
    }

    // ── SWIPER LOADER ─────────────────────────────────────────────────────
    function loadSwiper() {
      return new Promise((resolve) => {
        if (window.Swiper) return resolve();
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href =
          "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
        document.head.appendChild(css);
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    // ── RENDER PRODUCTS (unchanged) ───────────────────────────────────────
    window.renderProducts = async function (
      container,
      products,
      settings = {},
    ) {
      const layout = settings.layout || "block";
      let swiperInstance = null;

      const rendered = products
        .map((p) => ({
          p,
          html: hubUtils.getProductCardHTML(p, {
            ...settings,
            showIfAlreadyInCart: true,
          }),
        }))
        .filter(({ html }) => html !== "");

      if (rendered.length === 0) {
        container.innerHTML = "";
        container.style.display = "none";
        return;
      }

      const html = rendered.map(({ html }) => html).join("");

      if (layout === "carousel") {
        await loadSwiper();
        const indicator = settings.carouselIndicator || "progressBar";
        const btnColor = designSettings.buttonColor || "#000000";
        const iconColor = designSettings.iconColor || "#000000";

        const slidesHTML = rendered
          .map(({ html }) => `<div class="swiper-slide">${html}</div>`)
          .join("");
        container.style.display = "";
        container.innerHTML = `
          <div class="hub-swiper-wrapper">
            ${indicator === "buttons" ? `<div class="hub-swiper-prev" style = "background-color:${btnColor}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></div>` : ""}
            <div class="hub-swiper swiper"><div class="swiper-wrapper">${slidesHTML}</div></div>
            ${indicator === "buttons" ? `<div class="hub-swiper-next" style = "background-color:${btnColor}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>` : ""}
            ${indicator === "progressBar" ? `<div class="hub-progress-bar"><div class="hub-progress-bar-fill" style = "background-color:${btnColor}"></div></div>` : ""}
          </div>`;
      } else {
        container.style.display = "";
        container.innerHTML = `<div class="upcart-internal-upsell__vertical-layout-wrapper">${html}</div>`;
      }

      hubUtils.applyRatings(container);

      container.querySelectorAll(".hub-rec-product").forEach((card) => {
        const select = card.querySelector(".hub-variant-select");
        const priceEl = card.querySelector(".sale-price");
        const imgEl = card.querySelector(".hub-product-img");
        if (select) {
          select.addEventListener("change", function () {
            const selected = this.options[this.selectedIndex];
            if (priceEl)
              priceEl.textContent = hubUtils.formatMoney(
                Number(selected.dataset.price),
              );
            if (imgEl && selected.dataset.image)
              imgEl.src = selected.dataset.image;
          });
        }
      });

      // FIX: use container-scoped listener (not document) to prevent leaking on every render
      container.addEventListener("click", async (e) => {
        const btn = e.target.closest(".hub-add-btn");
        if (!btn || btn.disabled) return;

        const parent = btn.closest(".hub-rec-product");
        const swipeSlide = parent.closest(".swiper-slide");
        const select = parent.querySelector(".hub-variant-select");
        const variantId = select?.value || btn.dataset.variant;

        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = `<span class="loader"></span>`;

        try {
          const addRes = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: variantId,
              quantity: 1,
              properties: { __upcartRecommendation: String(variantId) },
            }),
          });
          if (!addRes.ok && addRes.status !== 409)
            throw new Error("Add failed");

          if (!settings.showIfAlreadyInCart) {
            if (layout === "carousel") {
              (swipeSlide || parent).remove();
              const remaining =
                container.querySelectorAll(".swiper-slide").length;
              if (remaining === 0) container.style.display = "none";
              else if (swiperInstance) {
                swiperInstance.params.slidesPerView = remaining === 1 ? 1 : 1.2;
                swiperInstance.update();
              }
            } else {
              parent.remove();
              if (container.querySelectorAll(".hub-rec-product").length === 0)
                container.style.display = "none";
            }
          }
          document.dispatchEvent(new CustomEvent("cart:updated"));
        } catch (err) {
          console.error(err);
          btn.innerHTML = btn.dataset.original || "Add";
          btn.disabled = false;
        }

        if (settings.showIfAlreadyInCart) {
          btn.innerHTML = btn.dataset.original || "Add";
          btn.disabled = false;
        }
      });

      if (layout === "carousel") {
        const indicator = settings.carouselIndicator || "progressBar";
        const swiperEl = container.querySelector(".hub-swiper");
        const fillEl = container.querySelector(".hub-progress-bar-fill");
        const prevEl = container.querySelector(".hub-swiper-prev");
        const nextEl = container.querySelector(".hub-swiper-next");

        function updateProgress(swiper) {
          if (!fillEl) return;
          const total = swiper.slides.length;
          if (!total) return;
          const perView = swiper.params.slidesPerView || 1;
          const visibleRatio = perView / total;
          const fill =
            (visibleRatio + swiper.progress * (1 - visibleRatio)) * 100;
          fillEl.style.width = Math.min(100, fill) + "%";
        }

        function updateArrows(swiper) {
          if (!prevEl || !nextEl) return;
          prevEl.style.opacity = swiper.isBeginning ? "0.6" : "1";
          prevEl.style.pointerEvents = swiper.isBeginning ? "none" : "auto";
          nextEl.style.opacity = swiper.isEnd ? "0.6" : "1";
          nextEl.style.pointerEvents = swiper.isEnd ? "none" : "auto";
        }

        const swiper = new Swiper(swiperEl, {
          slidesPerView: rendered.length === 1 ? 1 : 1.2,
          spaceBetween: 12,
          on: {
            init(swiper) {
              updateProgress(swiper);
              updateArrows(swiper);
            },
            slideChange(swiper) {
              updateProgress(swiper);
              updateArrows(swiper);
            },
          },
        });
        swiperInstance = swiper;

        if (indicator === "buttons" && prevEl && nextEl) {
          prevEl.addEventListener("click", () => swiper.slidePrev());
          nextEl.addEventListener("click", () => swiper.slideNext());
        }
      }
    };

    // ── EMPTY CART ────────────────────────────────────────────────────────
    if (cart.items.length === 0) {
      const _suggestedEl = document.getElementById(
        `hub-suggested-product-${blockId}`,
      );
      if (_suggestedEl) {
        _suggestedEl.style.display = "none";
        _suggestedEl.innerHTML = "";
      }

      const trustTop = document.getElementById(
        `hub-trust-badges-top-${blockId}`,
      );
      const trustBottom = document.getElementById(
        `hub-trust-badges-bottom-${blockId}`,
      );
      if (trustTop) trustTop.style.display = "none";
      if (trustBottom) trustBottom.style.display = "none";

      const recommendations =
        window.__HUB_ACTIVE_CART__?.recommendationsSettings;
      const emptyCartMessage = cartSettings.emptyCartMessage;
      const btnColor = designSettings.buttonColor || "#000000";
      const btnHoverColor = designSettings.buttonHoverColor || "#333333";
      const textColor = designSettings.buttonTextColor || "#ffffff";

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
            <h3 class="hub-rec-title hub-public-upsell__title custom-cart-internal-style__title-large" style="color:${designSettings.textColor};">
              ${recommendations.productHeaderText || "You may also like"}
            </h3>
            <div id="hub-rec-products"></div>
          </div>`;
      }

      container.innerHTML = `
        <div class="hub-cart-empty cart_CartPreview__empty__body custom-cart-recommendation-module">
          <div>${hubUtils.renderCustomHTML(customHtmlBlocks.empty_cart)}</div>
          <h3 class="hub-empty-title styles_CartPreview__empty__ custom-cart-recommendations-title">${emptyCartMessage}</h3>
          ${
            !recommendations?.enabled
              ? `
            <p class="hub-rec-subtitle hub-public-upsell__header custom-cart-internal-upsell__header" style="color:${designSettings.textColor};">
              ${recommendations?.headerText || ""}
            </p>
            ${
              recommendations?.showShopNowButton
                ? `
              <a href="${recommendations.buttonUrl}" class="hub-rec-btn hub-public-upsell__shop-now-button custom-cart-internal-style__title-large_button custom-cart-recommendations-shop-now-button"
                style="--btn-bg:${btnColor};--btn-hover:${btnHoverColor};--btn-text:${textColor};border-radius:${designSettings.buttonRadius}px;">
                ${recommendations.buttonText || "Shop Now"}
              </a>`
                : ""
            }`
              : ""
          }
        </div>`;

      const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
      if (footerRec && !footerRec.innerHTML.trim())
        footerRec.innerHTML = recHTML;
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
      hubUtils.hideCartSkeleton(blockId);
      hubUtils.revealCartItems(blockId);
      const bottomOfCartEl = drawer.querySelector(".hub-bottom-of-cart");
      if (bottomOfCartEl) bottomOfCartEl.style.display = "none";
      return;
    }

    const bottomOfCartEl = drawer.querySelector(".hub-bottom-of-cart");
    if (bottomOfCartEl) bottomOfCartEl.style.display = "";

    const trustTop = document.getElementById(`hub-trust-badges-top-${blockId}`);
    const trustBottom = document.getElementById(
      `hub-trust-badges-bottom-${blockId}`,
    );
    if (trustTop) trustTop.style.display = "block";
    if (trustBottom) trustBottom.style.display = "block";

    const footerRec = document.getElementById(`hub-footer-rec-${blockId}`);
    if (footerRec) footerRec.innerHTML = "";

    window._hubCompareCache = window._hubCompareCache || {};

    window.hubItemOrder?.syncWithCart(cart);
    const stablySorted = window.hubItemOrder
      ? window.hubItemOrder.sortItems(cart.items)
      : [...cart.items];

    const sortedItems = stablySorted.sort((a, b) => {
      const aIsGift = !!a.properties?._triggered_reward;
      const bIsGift = !!b.properties?._triggered_reward;
      return aIsGift - bIsGift;
    });

    // ── FIX: BATCH ALL PRODUCT FETCHES BEFORE THE ITEM LOOP ──────────────

    const uniqueHandles = [
      ...new Set(
        sortedItems
          .filter((i) => !i.properties?._hub_addon)
          .map((i) => i.handle)
          .filter(Boolean),
      ),
    ];

    // Populate cache for any handle not already cached
    const uncachedHandles = uniqueHandles.filter(
      (h) =>
        !Object.keys(window._hubCompareCache).some((k) =>
          k.startsWith(h + "_"),
        ),
    );

    async function safeFetchJson(url, options) {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`Non-JSON response from ${url}:`, text.slice(0, 300));
        throw new Error(`Failed to parse JSON from ${url}`);
      }
    }

    // Store full product data keyed by handle for selling plans lookup too
    const _productDataByHandle = {};

    // REPLACE your uncachedHandles fetch block with this:
    if (uncachedHandles.length > 0) {
      await Promise.all(
        uncachedHandles.map(async (handle) => {
          try {
            const data = await safeFetchJson(`/products/${handle}.js`);
            _productDataByHandle[handle] = data;
            (data.variants || []).forEach((v) => {
              window._hubCompareCache[`${handle}_${v.id}`] =
                v.compare_at_price || 0;
            });
          } catch (e) {
            _productDataByHandle[handle] = null;
          }
        }),
      );
    }

    uniqueHandles.forEach((handle) => {
      if (
        !_productDataByHandle[handle] &&
        window._hubProductDataByHandle?.[handle]
      ) {
        _productDataByHandle[handle] = window._hubProductDataByHandle[handle];
      }
    });

    window._hubProductDataByHandle = {
      ...(window._hubProductDataByHandle || {}),
      ..._productDataByHandle,
    };

    const _sellingPlansByHandle = {};
    const subscriptionSettings =
      window.__HUB_ACTIVE_CART__?.subscriptionUpgradesSettings;

    if (!subscriptionSettings?.enabled) {
      await Promise.all(
        uniqueHandles.map(async (handle) => {
          try {
            _sellingPlansByHandle[handle] =
              await hubUtils.getSellingPlans(handle);
          } catch (e) {
            _sellingPlansByHandle[handle] = [];
          }
        }),
      );
    }

    // ── UPGRADE BUTTON HANDLER (attach once, not inside item loop) ────────
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".hub-upgrade-btn");
      if (!btn) return;
      const wrapper = btn.closest(".hub-selling-plan-wrapper");
      if (!wrapper) return;
      const text = btn.querySelector(".btn-text");
      let loader = btn.querySelector(".loader");
      if (!loader) {
        loader = document.createElement("span");
        loader.className = "loader";
        loader.innerText = "";
        btn.appendChild(loader);
      }
      wrapper.classList.remove("show-subscription");
      if (text) text.style.display = "none";
      loader.style.display = "inline-block";
      setTimeout(() => {
        loader.style.display = "none";
        if (text) text.style.display = "inline-block";
        wrapper.classList.add("show-subscription");
      }, 3000);
    });

    if (!window._hubSellingPlanListenerAttached) {
      window._hubSellingPlanListenerAttached = true;
      document.addEventListener("change", async (e) => {
        const select = e.target.closest(".hub-selling-plan-select");
        if (!select) return;

        const sellingPlanId = select.value;
        if (!sellingPlanId) return;

        const variantId = select.dataset.variantId;
        const currentPlanId = select.dataset.currentPlan || "";

        const wrapper = select.closest(".hub-selling-plan-wrapper");
        const itemEl = select.closest(".hub-cart-item") || wrapper;

        select.disabled = true;
        if (itemEl) {
          itemEl.style.opacity = "0.6";
          itemEl.style.pointerEvents = "none";
        }

        let spinner = wrapper?.querySelector(".hub-plan-loading-indicator");
        if (wrapper && !spinner) {
          spinner = document.createElement("span");
          spinner.className = "hub-plan-loading-indicator";
          spinner.innerHTML = ``;
          spinner.style.cssText =
            "display:flex;align-items:center;gap:6px;font-size:12px;opacity:0.8;margin-top:4px;";
          wrapper.appendChild(spinner);
        }

        try {
          if (!variantId) {
            throw new Error("Selling plan select is missing data-variant-id");
          }

          const currentCart = await (await fetch("/cart.js")).json();
          const currentItem = currentCart.items.find((i) => {
            if (String(i.variant_id) !== String(variantId)) return false;
            const itemPlanId = i.selling_plan_allocation
              ? String(i.selling_plan_allocation.selling_plan.id)
              : "";
            return itemPlanId === currentPlanId;
          });

          if (!currentItem) {
            throw new Error(
              `No matching cart line for variant ${variantId} / plan "${currentPlanId}" — cart changed`,
            );
          }

          const res = await fetch("/cart/change.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: currentItem.key,
              quantity: currentItem.quantity,
              selling_plan: Number(sellingPlanId),
            }),
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => null);
            throw new Error(
              errBody?.message ||
                errBody?.description ||
                `Failed (status ${res.status})`,
            );
          }

          document.dispatchEvent(new CustomEvent("cart:updated"));
          const drawer = select.closest(
            `.hub-cart-block-${window.HUB_CART_BLOCK_ID}`,
          );
          if (drawer) await window.hubCartRender(drawer);
        } catch (err) {
          console.error("Selling plan apply error:", err);
          select.disabled = false;
          if (itemEl) {
            itemEl.style.opacity = "";
            itemEl.style.pointerEvents = "";
          }
          spinner?.remove();
        }
      });
    }

    // ── ITEM RENDERING LOOP (no fetches inside — uses pre-built cache) ────
    const itemsHTML = await Promise.all(
      sortedItems.map(async (item) => {
        if (item.properties?._hub_addon) return "";

        const showSavingsBelowPrices =
          cartSettings.showSavingsBelowPrices || false;
        const colorItems = designSettings.textColor || "#000";
        const discountColor = designSettings.discountBageColor || "#1e7e34";
        const showStrikethrough = designSettings.showStrikethrough || false;
        const savingsColor = designSettings.savingsColor || "#16a34a";
        const iconColor = designSettings.iconColor || "#000000";

        // FIX: read from pre-built cache — zero fetches here
        const cacheKey = `${item.handle}_${item.variant_id}`;
        let compareAtPrice = window._hubCompareCache[cacheKey] ?? 0;

        const btnColor = designSettings.buttonColor || "#000000";
        const btnHoverColor = designSettings.buttonHoverColor || "#333333";
        const textColor = designSettings.buttonTextColor || "#ffffff";

        const sellingPlan = item.selling_plan_allocation;
        let sellingPlanHtml = "";
        const planOptionsText =
          subscriptionSettings?.planOptionsText ||
          "{{selling_plan_group_name}} / {{selling_plan_name}}";

        // FIX: read from pre-built map — zero fetches here
        const groups = _sellingPlansByHandle[item.handle] || [];

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
                </option>`;
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
                <button class="hub-upgrade-btn"
                  style="border-radius:${designSettings.buttonRadius}px;--btn-bg:${btnColor};--btn-hover:${btnHoverColor};--btn-text:${textColor};">
                  <span class="btn-text">${buttonText}</span>
                </button>
              </div>
              <div class="hub-subscription-view">
               <select class="hub-selling-plan-select"
                     data-variant-id="${item.variant_id}" data-current-plan="${sellingPlan ? sellingPlan.selling_plan.id : ""}">
                  <option value="" disabled ${!sellingPlan ? "selected" : ""}>${planHeadingText}</option>
                  ${options}
                </select>
              </div>
            </div>`;
        }

        const effectiveUnitPrice =
          item.quantity > 0
            ? Math.round(item.final_line_price / item.quantity)
            : item.price;
        const subCompare =
          sellingPlan && item.original_price > effectiveUnitPrice
            ? item.original_price
            : 0;
        const priceCompare = item.price > effectiveUnitPrice ? item.price : 0;
        const effectiveCompare =
          compareAtPrice && compareAtPrice > effectiveUnitPrice
            ? compareAtPrice
            : priceCompare || subCompare;

        const hasDiscount = effectiveCompare > effectiveUnitPrice;
        const unitSave = hasDiscount
          ? effectiveCompare - effectiveUnitPrice
          : 0;
        const layoutName = cartSettings.cartItemLayout || "classic";
        const savingsText = cartSettings.savingsText || "Save";

        const saveHtml =
          hasDiscount && showSavingsBelowPrices && layoutName !== "subscription"
            ? `<p class="hub-item-save" style="color:${savingsColor};background:${hubUtils.hexToRGBA(designSettings.savingsColor, 0.1)};">${savingsText} ${hubUtils.formatMoney(unitSave * item.quantity)}</p>`
            : "";

        const priceHtml = hasDiscount
          ? `<span class="hub-price-original">${hubUtils.formatMoney(effectiveCompare)}</span>
             <span class="hub-price">${hubUtils.formatMoney(effectiveUnitPrice)}</span>`
          : `<span class="hub-price">${hubUtils.formatMoney(effectiveUnitPrice)}</span>`;

        const hasCompare = effectiveCompare > 0;

        const variantHtml =
          item.options_with_values &&
          item.options_with_values.length > 0 &&
          !item.product_has_only_default_variant
            ? item.options_with_values
                .map(
                  (opt) =>
                    `<p class="hub-item-variant custom-cart-public-component-product-tile__variant" style="color:${colorItems}"><span class="hub-item-variant-name">${opt.name}:</span> <span class="hub-item-variant-value">${opt.value}</span></p>`,
                )
                .join("")
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
            ? item.line_level_discount_allocations.map(() => "").join("")
            : "";

        const isReward =
          !!item.properties?._hub_reward ||
          !!item.properties?._triggered_reward;
        const isTriggeredReward = !!item.properties?._triggered_reward;

        const layoutCtx = {
          item,
          colorItems,
          showStrikethrough,
          savingsColor,
          savingsText,
          isReward,
          isTriggeredReward,
          effectiveUnitPrice,
          effectiveCompare,
          hasCompare,
          unitSave,
          saveHtml,
          priceHtml,
          variantHtml,
          propertiesHtml,
          discountHtml,
          sellingPlan,
          sellingPlanHtml,
          customHtmlBlocks,
          showSavingsBelowPrices,
          discountColor,
          iconColor,
        };

        const layoutFn =
          window.hubItemLayouts?.[layoutName] || window.hubItemLayouts?.classic;
        return layoutFn(layoutCtx);
      }),
    );

    container.innerHTML = itemsHTML.join("");
    hubUtils.hideCartSkeleton(blockId);
    hubUtils.revealCartItems(blockId);

    if (_shouldShowBelow) {
      const alreadyRendered = belowEl?.querySelector(".hub-additional-notes");
      if (belowEl && !alreadyRendered) {
        belowEl.innerHTML = hubUtils.getAdditionalNotesHTML(
          blockId,
          notesSettings,
          cart.note,
        );
        hubUtils.initNoteListener(blockId);
      } else if (belowEl) {
        const ta = belowEl.querySelector(".hub-notes-textarea");
        if (
          ta &&
          document.activeElement !== ta &&
          ta.value !== (cart.note || "")
        ) {
          ta.value = cart.note || "";
        }
      }
    }

    if (_shouldShowFooter) {
      const alreadyRendered = footerEl?.querySelector(".hub-additional-notes");
      if (footerEl && !alreadyRendered) {
        footerEl.innerHTML = hubUtils.getAdditionalNotesHTML(
          blockId,
          notesSettings,
          cart.note,
        );
        hubUtils.initNoteListener(blockId);
      } else if (footerEl) {
        const ta = footerEl.querySelector(".hub-notes-textarea");
        if (
          ta &&
          document.activeElement !== ta &&
          ta.value !== (cart.note || "")
        ) {
          ta.value = cart.note || "";
        }
      }
    }
    // ── ADDONS ────────────────────────────────────────────────────────────
    const addonsSettings = window.__HUB_ACTIVE_CART__?.addonsSettings;
    const addonsEl = document.getElementById(`hub-addons-${blockId}`);

    const _prevSpChecked =
      document.getElementById(`hub-sp-toggle-${blockId}`)?.checked ?? null;
    const _prevAddonChecked =
      document.getElementById(`hub-addon-toggle-${blockId}`)?.checked ?? null;

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
        const matchedAddonItem = cart.items.find(
          (i) =>
            String(i.variant_id) === String(variantId) &&
            (i.properties?._hub_addon ||
              i.properties?.__upcartAddon === String(variantId)),
        );
        const isInCart = !!matchedAddonItem;
        const addonLineKey = matchedAddonItem?.key || "";
        const addonPriceCents = matchedAddonItem
          ? matchedAddonItem.price
          : Math.round(
              Number(
                isShipping
                  ? addonsSettings.price
                  : addonsSettings.selectedProduct?.price,
              ) * 100,
            );

        const price = hubUtils.formatMoney(addonPriceCents);
        addonsEl.style.display = "block";

        const shouldBeChecked = isInCart;

        const truncateText = (text, limit = 50) => {
          if (!text) return "";
          return text.length > limit
            ? text.slice(0, limit).trim() + "..."
            : text;
        };

        if (isShipping) {
          const spTitle = truncateText(
            addonsSettings.title || "Shipping Protection",
            50,
          );
          const spDesc = truncateText(addonsSettings.description || "", 60);

          addonsEl.innerHTML = `
            <div class="hub-addon-shipping-protection">
              <div class="upcart-internal-addons__image-wrapper">
                <img src="https://cdn.shopify.com/s/files/1/0733/2531/4260/files/shipping-protection.png" alt="Shipping Protection" class="hub-addon-sp-img"/>
              </div>
              <div class="hub-addon-sp-info">
        <p class="hub-addon-sp-title">${spTitle}</p>
        <p class="hub-addon-sp-desc">${spDesc}</p>
      </div>
              <div class="hub-addon-sp-right">
                <span class="hub-addon-sp-price">${price}</span>
                <label class="hub-addon-sp-toggle">
              <input type="checkbox" id="hub-sp-toggle-${blockId}" class="hub-sp-checkbox" data-variant="${variantId}" data-line-key="${addonLineKey}" data-price-cents="${addonPriceCents}" ${shouldBeChecked ? "checked" : ""}/>
              <span class="hub-addon-sp-slider"></span>
            </label>
              </div>
            </div>`;
        } else {
          const selected = addonsSettings.selectedProduct;
          const productTitle = truncateText(selected.title || "", 50);

          addonsEl.innerHTML = `
    <div class="hub-addon-product custom-cart-public-addons custom-cart-addons">
     ${selected.image ? `<div class="hub-addon-product-img-wrapper custom-cart-addons-image-wrapper custom-cart-public-addons__image-wrapper"><img src="${selected.image}" alt="${selected.title}" class="hub-addon-product-img"/></div>` : ""}
      <div class="hub-addon-product-info custom-cart-public-addons__content-wrapper">
        <p class="hub-addon-product-title custom-cart-public-addons__content-title-wrapper custom-cart-addons-title">${productTitle}</p>
        <span class="hub-addon-product-price custom-cart-public-addons__content-price">${price}</span>
      </div>
      <label class="hub-addon-sp-toggle custom-cart-addons-toggle upcart-public-addons__toggle-wrapper custom-cart-public-addons__toggle-wrapper">
        <input type="checkbox" id="hub-addon-toggle-${blockId}" class="hub-addon-checkbox" data-variant="${variantId}" data-line-key="${addonLineKey}" data-price-cents="${addonPriceCents}" ${shouldBeChecked ? "checked" : ""}/>
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
            const lineKey = this.dataset.lineKey;
            const priceCents = Number(this.dataset.priceCents) || 0;
            const checked = this.checked;

            this.disabled = true;
            const slider = this.closest("label")?.querySelector(
              ".hub-addon-sp-slider",
            );
            if (slider) {
              slider.style.pointerEvents = "none";
              slider.style.opacity = "0.6";
            }

            try {
              if (checked) {
                const trackingProps = addonsSettings.includeTracking
                  ? {
                      beamAddonDesiredState: "active",
                      "Add-on Type": isShipping
                        ? "Shipping Protection"
                        : "Product Add-on",
                    }
                  : {};

                const fulfillProps =
                  isShipping && addonsSettings.autoFulfill
                    ? { _hub_auto_fulfill: "true" }
                    : {};
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
                      __upcartAddon: String(vid),
                      ...fulfillProps,
                      ...trackingProps,
                    },
                  }),
                });
              } else if (lineKey) {
                await fetch("/cart/change.js", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: lineKey, quantity: 0 }),
                });
              } else {
                const latestCart = await (await fetch("/cart.js")).json();
                const match = latestCart.items.find(
                  (i) =>
                    String(i.variant_id) === String(vid) &&
                    (i.properties?._hub_addon ||
                      i.properties?.__upcartAddon === String(vid)),
                );
                if (match) {
                  await fetch("/cart/change.js", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: match.key, quantity: 0 }),
                  });
                }
              }
            } finally {
              this.disabled = false;
              if (slider) {
                slider.style.pointerEvents = "";
                slider.style.opacity = "";
              }
              document.dispatchEvent(new CustomEvent("cart:updated"));
            }
          });
        }
      }
    }

    // ── UPSELLS ───────────────────────────────────────────────────────────
    const upsellSettings = window.__HUB_ACTIVE_CART__?.upsellsSettings;
    let _hubUpsellHasProducts = false;
    if (!upsellSettings?.enabled && cart.items.length > 0) {
      const productId = cart.items[0].product_id;

      const position = upsellSettings.position || "bottom";
      const upsellContainer =
        position === "top"
          ? document.getElementById(`hub-upsell-top-${blockId}`)
          : document.getElementById(`hub-upsell-bottom-${blockId}`);

      const _hasRenderedProducts =
        !!upsellContainer?.querySelector(".hub-rec-product") &&
        !upsellContainer?.querySelector(".hub-rec-skeleton-card");
      const _hasCachedUpsell =
        !!window._upsellCache[productId] || _hasRenderedProducts;

      if (upsellContainer && !_hasCachedUpsell) {
        upsellContainer.classList.add("upsell-container");
        upsellContainer.classList.add(
          position === "bottom" ? "upsell-bottom" : "upsell-top",
        );
        upsellContainer.innerHTML = `
      <div class="upsell-inner">
        <div class="hub-rec-product hub-rec-skeleton-card" style="display:flex;gap:12px;align-items:flex-start;padding:20px;border:1px solid #e5e5e5;border-radius:8px;">
          <div class="hub-skeleton hub-skeleton-img" style="width:60px;height:60px;flex-shrink:0;border-radius:8px;">&nbsp;</div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div class="hub-skeleton hub-skeleton-line" style="width:85%;height:14px;">&nbsp;</div>
            <div class="hub-skeleton hub-skeleton-line" style="width:40%;height:12px;">&nbsp;</div>
            <div class="hub-skeleton hub-skeleton-line" style="width:70px;height:28px;border-radius:4px;margin-top:4px;">&nbsp;</div>
          </div>
        </div>
      </div>`;
        upsellContainer.style.display = "";

        delete upsellContainer.dataset.renderedHandles;
      }

      let upsellProducts;

      if (window._upsellCache[productId]) {
        upsellProducts = window._upsellCache[productId];
      } else if (window._hubUpsellPrefetch) {
        const pre = await window._hubUpsellPrefetch;
        window._hubUpsellPrefetch = null;
        if (pre && String(pre.productId) === String(productId)) {
          upsellProducts = pre.products;
        } else {
          upsellProducts = await window.getUpsellProducts(
            upsellSettings,
            productId,
          );
        }
      } else {
        upsellProducts = await window.getUpsellProducts(
          upsellSettings,
          productId,
        );
      }

      window._upsellCache[productId] = upsellProducts;
      _hubUpsellHasProducts = upsellProducts.length > 0;
      const headingUpsell = upsellSettings.title;
      const textColor = designSettings?.textColor || "#000";

      if (upsellContainer) {
        const newHandles = upsellProducts
          .map((p) => p.handle)
          .sort()
          .join(",");
        const prevHandles = upsellContainer.dataset.renderedHandles || "";
        const _alreadyShowingRealCards =
          !!upsellContainer.querySelector(".hub-rec-product") &&
          !upsellContainer.querySelector(".hub-rec-skeleton-card");

        if (
          newHandles === prevHandles &&
          upsellContainer.children.length > 0 &&
          _alreadyShowingRealCards
        ) {
          // genuinely already rendered with real cards — skip re-render
        } else {
          upsellContainer.classList.add("upsell-container");
          upsellContainer.classList.add(
            position === "bottom" ? "upsell-bottom" : "upsell-top",
          );
          upsellContainer.innerHTML = "";

          if (upsellProducts.length > 0) {
            const wrapper = document.createElement("div");
            wrapper.className = "upsell-inner";
            const heading = document.createElement("h3");
            heading.className = "upsell-heading";
            heading.innerHTML = headingUpsell;
            heading.style.color = textColor;
            const productsDiv = document.createElement("div");
            productsDiv.className = "upsell-products";
            wrapper.appendChild(heading);
            wrapper.appendChild(productsDiv);
            upsellContainer.appendChild(wrapper);
            window.renderProducts(productsDiv, upsellProducts, {
              layout: upsellSettings.direction,
              showReviews: upsellSettings.showReviews,
              carouselIndicator: upsellSettings.carouselIndicator,
              showIfAlreadyInCart: upsellSettings.showIfAlreadyInCart,
            });
          } else {
            upsellContainer.style.display = "none";
          }
          upsellContainer.dataset.renderedHandles = newHandles;
        }
      }
    }
    // ── SUGGESTED PRODUCT ─────────────────────────────────────────────────
    const suggestedEl = document.getElementById(
      `hub-suggested-product-${blockId}`,
    );
    if (suggestedEl) {
      if (cart.items.length === 0) {
        suggestedEl.style.display = "none";
        suggestedEl.innerHTML = "";
      } else {
        const sp = upsellSettings?.suggestedProduct;

        const showSuggested =
          upsellSettings?.showSuggestedProduct && !upsellSettings?.enabled;
        if (
          showSuggested &&
          sp?.items?.variants?.[0] &&
          sp?.items?.titles?.[0]
        ) {
          const rawVariantId = sp.items.variants[0].replace(
            "gid://shopify/ProductVariant/",
            "",
          );
          const title = sp.items.titles[0];
          suggestedEl.style.display = "block";
          suggestedEl.innerHTML = `
            <div class="upsell-suggestion">
              <label class="upsell-checkbox-wrapper">
                <input type="checkbox" id="hub-suggested-cb-${blockId}" data-variant="${rawVariantId}"/>
                <span class="custom-checkbox"></span>
                <span class="upsell-text suggestion-product">Add ${title}</span>
              </label>
            </div>`;
          const cb = suggestedEl.querySelector(`#hub-suggested-cb-${blockId}`);
          if (cb) {
            const alreadyInCart = cart.items.some(
              (i) => String(i.variant_id) === String(rawVariantId),
            );
            cb.checked = alreadyInCart;
            if (alreadyInCart) suggestedEl.style.display = "none";
            cb.addEventListener("change", async function () {
              const vid = this.dataset.variant;
              if (this.checked) {
                await fetch("/cart/add.js", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: Number(vid), quantity: 1 }),
                });
                suggestedEl.style.display = "none";
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
        } else {
          suggestedEl.style.display = "none";
          suggestedEl.innerHTML = "";
        }
      }
    }

    if (cart.total_discount > 0) container.insertAdjacentHTML("beforeend", ``);

    const manualCodes = new Set(
      (cart.discount_codes || []).map((d) => d.code.toLowerCase()),
    );
    const seenTitles = new Set();
    const allDiscounts = [];
    (cart.cart_level_discount_applications || []).forEach((app) => {
      const key = app.title.toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        allDiscounts.push(app);
      }
    });
    (cart.items || []).forEach((item) => {
      (item.line_level_discount_allocations || []).forEach((alloc) => {
        const app = alloc.discount_application;
        if (!app) return;
        const key = app.title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allDiscounts.push(app);
        }
      });
    });
  } catch (err) {
    console.error("Cart render error:", err);
    hubUtils.hideCartSkeleton(blockId);
    hubUtils.revealCartItems(blockId);
  } finally {
    window._hubRenderInProgress = false;
    window._hubRewardUpdating = false;

    if (window._hubPendingRender) {
      const pending = window._hubPendingRender;
      window._hubPendingRender = null;
      window.hubCartRender(pending.drawer, pending.opts);
    }
  }
};
