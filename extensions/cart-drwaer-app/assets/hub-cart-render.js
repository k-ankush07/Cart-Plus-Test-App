// ─────────────────────────────────────────────────────────────────────────────
window.hubCartRender = async function (drawer, opts = {}) {
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

  if (opts.showSkeleton) {
    hubUtils.showCartSkeleton(blockId);
  }

  // Pre-hide footer only if we last saw an empty cart (avoids blink when items exist,
  // avoids flash when cart is empty on first open or after last item removed).
  const _footer = drawer?.querySelector(".hub-cart-footer");
  if (_footer && !window._hubLastCartHadItems) {
    _footer.classList.add("hub-empty-footer");
  }

  try {
    const res = await fetch("/cart.js");
    let cart = await res.json();

    hubUtils.updateDiscountUI(blockId, cart);

    window._hubCartProductIds = new Set(
      cart.items.map((i) => String(i.product_id)),
    );

    const headerEl = document.querySelector(".upcart-header-text");

    if (headerEl) {
      const headerSettings = window.__HUB_ACTIVE_CART__?.headerSettings || {};

      headerEl.innerText = (
        headerSettings.titleText || "Cart • {{cart_quantity}}"
      ).replace("{{cart_quantity}}", cart.item_count || 0);
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
        belowEl.innerHTML = hubUtils.getAdditionalNotesHTML(
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
        footerEl.innerHTML = hubUtils.getAdditionalNotesHTML(
          blockId,
          notesSettings,
          cart.note,
        );
    }

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

    /* ── AUTO-ADD / REMOVE REWARD PRODUCTS ── */
    const changed = await hubUtils.maybeUpdateRewardProducts(cart, rewards);
    if (changed) {
      const res2 = await fetch("/cart.js");
      cart = await res2.json();
      window._hubCartProductIds = new Set(
        cart.items.map((i) => String(i.product_id)),
      );
    }

    /* ── TRIGGERED REWARDS: auto-add / remove free gift ── */
    const triggeredChanged = await window.handleTriggeredRewards(cart);
    if (triggeredChanged) {
      const res3 = await fetch("/cart.js");
      cart = await res3.json();
      window._hubCartProductIds = new Set(
        cart.items.map((i) => String(i.product_id)),
      );
    }

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
    if (cartItemsEl) {
      cartItemsEl.classList.toggle("footer-empty", cart.items.length === 0);
    }

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
        const paddingMap = {
          slim: "4px 33px",
          normal: "10px 33px",
          thick: "18px 33px",
        };

        const height = paddingMap[ann.height] || "10px 33px";
        const timerText = ann.timer || "10:00";
        const isAfter = ann.position === "after";

        target.style.cssText = `
          display: block;
          background-color: ${ann.backgroundColor || "#ffffff"};
          border-top: 1px solid ${ann.borderColor || "#e5e5e5"};
          border-bottom: 1px solid ${ann.borderColor || "#e5e5e5"};
          padding: ${height};
          font-size: ${ann.fontSize || 14}px;
          text-align: center;
          ${isAfter ? "margin-top: auto;" : ""}
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

    (function () {
      const fmt = hubUtils.formatMoney;

      const originalTotal = cart.original_total_price || 0; // Total MRP
      const subtotal = cart.items_subtotal_price || 0; // after line discounts
      const finalTotal = cart.total_price || 0; // Cart total before shipping
      const shippingPrice = window._hubShippingPriceCents || 0; // Shipping (cents, from async fetch)
      const grandTotal = finalTotal + shippingPrice; // Grand Total with shipping
      const lineSaving = originalTotal - subtotal; // Discount On MRP
      const couponSaving = subtotal - finalTotal; // Coupon / cart-level discount
      const totalSaved = originalTotal - finalTotal; // You Saved (excl. shipping)

      window._hubCartFinalTotal = finalTotal; // stored so async shipping update can patch grand total

      // Subtotal (before shipping)
      const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
      if (totalEl) totalEl.textContent = fmt(finalTotal);

      // Strikethrough original (only show if there's a saving)
      const origEl = document.getElementById(`hub-total-original-${blockId}`);
      if (origEl) {
        if (totalSaved > 0) {
          origEl.textContent = fmt(originalTotal);
          origEl.style.display = "";
        } else {
          origEl.style.display = "none";
        }
      }

      // "You Saved" line (savings on items only, not shipping)
      const savedEl = document.getElementById(`hub-total-saved-${blockId}`);
      if (savedEl) {
        if (totalSaved > 0) {
          savedEl.textContent = `You Saved ${fmt(totalSaved)}!`;
          savedEl.style.display = "";
        } else {
          savedEl.style.display = "none";
        }
      }

      // Total MRP
      const mrpEl = document.getElementById(`hub-mrp-${blockId}`);
      if (mrpEl) mrpEl.textContent = fmt(originalTotal);

      // Discount On MRP
      const discMrpRow = document.getElementById(
        `hub-discount-mrp-row-${blockId}`,
      );
      const discMrpEl = document.getElementById(`hub-discount-mrp-${blockId}`);
      if (discMrpRow && discMrpEl) {
        if (lineSaving > 0) {
          discMrpEl.textContent = `-${fmt(lineSaving)}`;
          discMrpRow.style.display = "";
        } else {
          discMrpRow.style.display = "none";
        }
      }

      // Coupon Discount
      const couponRow = document.getElementById(`hub-coupon-row-${blockId}`);
      const couponEl = document.getElementById(`hub-coupon-${blockId}`);
      if (couponRow && couponEl) {
        if (couponSaving > 0) {
          couponEl.textContent = `-${fmt(couponSaving)}`;
          couponRow.style.display = "";
        } else {
          couponRow.style.display = "none";
        }
      }

      // Shipping row (uses cached value; async fetch will patch if not yet resolved)
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
        } else {
          shippingRow.style.display = "none";
        }
      }

      // Grand Total (cart total + shipping)
      const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
      if (grandEl) grandEl.textContent = fmt(grandTotal);

      // Checkout button text (update {{total_price}} placeholder)
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
    })();

    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
    const customHtmlBlocks = cartSettings.customHtmlBlocks || {};
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};

    hubUtils.applyCustomCSS(blockId, cartSettings.customCss);
    hubUtils.executeBeforeLoadScripts(
      customHtmlBlocks.scripts_before_load,
      drawer,
    );
    /* ── SHIPPING CHARGES ── */
    hubUtils.shipping_Charges(container, cart.total_price);

    /* ── REWARDS BAR ── */
    hubUtils.renderRewardsBar(blockId, cart, rewards);

    /* ── DISCOUNT CODES ── */
    hubUtils
      .getDiscounts()
      .then(({ allDiscountCodes, activeDiscountCodes }) => {
        hubRenderOffersPanel(
          blockId,
          allDiscountCodes,
          activeDiscountCodes,
          cart,
        );
      });

    const discountRow = document.getElementById(`hub-discount-row-${blockId}`);
    if (discountRow) {
      if (discountCodesSettings?.enabled === false) {
        discountRow.style.display = "flex";
      } else {
        discountRow.style.display = "none";
      }

      const discountInput = discountRow.querySelector(
        `#discount-code-input-${blockId}`,
      );
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

    const offersRow = document.querySelector(`.hub-offers-input-row`);
    if (offersRow) {
      if (discountCodesSettings?.enabled === false) {
        offersRow.style.display = "flex";
      } else {
        offersRow.style.display = "none";
      }

      const offersInput = offersRow.querySelector(
        `#hub-offers-input-${blockId}`,
      );

      const offersBtn = offersRow.querySelector(".hub-offers-apply-btn");

      if (offersInput && discountCodesSettings?.placeholder) {
        offersInput.placeholder = discountCodesSettings.placeholder;
      }

      if (offersBtn && discountCodesSettings?.buttonText) {
        offersBtn.textContent = discountCodesSettings.buttonText;
      }
    }

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

    window.renderProducts = async function (
      container,
      products,
      settings = {},
    ) {
      const layout = settings.layout || "block";
      let swiperInstance = null;

      // Pre-render, filtering out any product already in cart
      const rendered = products
        .map((p) => ({ p, html: hubUtils.getProductCardHTML(p, settings) }))
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
        const slidesHTML = rendered
          .map(({ html }) => `<div class="swiper-slide">${html}</div>`)
          .join("");
        container.style.display = "";
        container.innerHTML = `
          <div class="hub-swiper-wrapper">
            ${
              indicator === "buttons"
                ? `<div class="hub-swiper-prev">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M15 18l-6-6 6-6"/>
              </svg>
              </div>`
                : ""
            }
            <div class="hub-swiper swiper">
              <div class="swiper-wrapper">
                ${slidesHTML}
              </div>
            </div>
            ${
              indicator === "buttons"
                ? `<div class="hub-swiper-next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 6l6 6-6 6"/>
            </svg>
              </div>`
                : ""
            }
            ${indicator === "progressBar" ? `<div class="hub-progress-bar"><div class="hub-progress-bar-fill"></div></div>` : ""}
          </div>
        `;
      } else {
        container.style.display = "";
        container.innerHTML = `
          <div class="upcart-internal-upsell__vertical-layout-wrapper">${html}</div>
        `;
      }

      // Fetch ratings from Storefront API (via Remix proxy) and fill placeholders
      hubUtils.applyRatings(container);

      container.querySelectorAll(".hub-rec-product").forEach((card) => {
        const select = card.querySelector(".hub-variant-select");
        const priceEl = card.querySelector(".sale-price");
        const imgEl = card.querySelector(".hub-product-img");

        if (select) {
          select.addEventListener("change", function () {
            const selected = this.options[this.selectedIndex];

            if (priceEl) {
              priceEl.textContent = hubUtils.formatMoney(
                Number(selected.dataset.price),
              );
            }

            if (imgEl && selected.dataset.image) {
              imgEl.src = selected.dataset.image;
            }
          });
        }
      });

      // FIX: was `document.addEventListener` — leaked a new listener on every render
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
            body: JSON.stringify({ id: variantId, quantity: 1 }),
          });

          if (!addRes.ok && addRes.status !== 409) {
            throw new Error("Add failed");
          }

          if (!settings.showIfAlreadyInCart) {
            (swipeSlide || parent).remove();

            const remaining =
              container.querySelectorAll(".swiper-slide").length;

            if (remaining === 0) {
              container.style.display = "none";
            } else if (swiperInstance) {
              swiperInstance.params.slidesPerView = remaining === 1 ? 1 : 1.5;
              swiperInstance.update();
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

          if (swiper.isBeginning) {
            prevEl.style.opacity = "0.6";
            prevEl.style.pointerEvents = "none";
          } else {
            prevEl.style.opacity = "1";
            prevEl.style.pointerEvents = "auto";
          }

          if (swiper.isEnd) {
            nextEl.style.opacity = "0.6";
            nextEl.style.pointerEvents = "none";
          } else {
            nextEl.style.opacity = "1";
            nextEl.style.pointerEvents = "auto";
          }
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

    if (cart.items.length === 0) {
      const _suggestedEl = document.getElementById(
        `hub-suggested-product-${blockId}`,
      );
      if (_suggestedEl) {
        _suggestedEl.style.display = "none";
        _suggestedEl.innerHTML = "";
      }

      const recommendations =
        window.__HUB_ACTIVE_CART__?.recommendationsSettings;
      const emptyCartMessage = cartSettings.emptyCartMessage;

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
            <h3 class="hub-rec-title hub-public-upsell__title">${recommendations.productHeaderText || "You may also like"}</h3>
            <div id="hub-rec-products"></div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="hub-cart-empty">
         <div>${hubUtils.renderCustomHTML(customHtmlBlocks.empty_cart)}</div>
          <h3 class="hub-empty-title styles_CartPreview__empty__">${emptyCartMessage}</h3>
          ${
            !recommendations?.enabled
              ? `<p class="hub-rec-subtitle hub-public-upsell__header">
         ${recommendations?.headerText || ""}
       </p>`
              : ""
          }
           ${
             recommendations.showShopNowButton
               ? `<a href="${recommendations.buttonUrl}" class="hub-rec-btn hub-public-upsell__shop-now-button">${recommendations.buttonText || "Shop Now"}</a>`
               : ""
           }
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

    // Cache for product variant compare_at_price lookups
    window._hubCompareCache = window._hubCompareCache || {};

    // Sort: triggered-reward (free gift) items always appear at the bottom
    const sortedItems = [...cart.items].sort((a, b) => {
      const aIsGift = !!a.properties?._triggered_reward;
      const bIsGift = !!b.properties?._triggered_reward;
      return aIsGift - bIsGift;
    });

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

    const itemsHTML = await Promise.all(
      sortedItems.map(async (item) => {
        if (item.properties?._hub_addon) return "";

        const showSavingsBelowPrices =
          cartSettings.showSavingsBelowPrices || false;

        const colorItems = designSettings.textColor || "#000";
        const showStrikethrough = designSettings.showStrikethrough || false;
        const savingsColor = designSettings.savingsColor || "#16a34a";

        // Fetch compare_at_price from product API (cart.js doesn't include it)
        let compareAtPrice = 0;
        try {
          const cacheKey = `${item.handle}_${item.variant_id}`;
          if (window._hubCompareCache[cacheKey] !== undefined) {
            compareAtPrice = window._hubCompareCache[cacheKey];
          } else {
            const prodRes = await fetch(`/products/${item.handle}.js`);
            const prodData = await prodRes.json();
            const variant = prodData.variants.find(
              (v) => v.id === item.variant_id,
            );
            compareAtPrice = variant?.compare_at_price || 0;
            window._hubCompareCache[cacheKey] = compareAtPrice;
          }
        } catch (e) {
          compareAtPrice = 0;
        }

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
                <button class="hub-upgrade-btn">
                <span class="btn-text">${buttonText}</span>
                </button>
              </div>
              <div class="hub-subscription-view">
                <select class="hub-selling-plan-select" data-key="${item.key}">
                  <option value="" disabled ${!sellingPlan ? "selected" : ""}>${planHeadingText}</option>
                  ${options}
                </select>
              </div>
            </div>
          `;
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

        const saveHtml =
          hasDiscount && showSavingsBelowPrices && layoutName !== "subscription"
            ? `<p class="hub-item-save" style="color:${savingsColor}; 
            background:${hubUtils.hexToRGBA(designSettings.savingsColor, 0.1)};">Save ${hubUtils.formatMoney(unitSave)}</p>`
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
                    `<p class="hub-item-variant" style="color:${colorItems}"><span class="hub-item-variant-name">${opt.name}:</span> <span class="hub-item-variant-value">${opt.value}</span></p>`,
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
            ? item.line_level_discount_allocations.map((d) => ``).join("")
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
        };

        const layoutFn =
          window.hubItemLayouts?.[layoutName] || window.hubItemLayouts?.classic;
        return layoutFn(layoutCtx);
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
            <div class="upcart-internal-addons__image-wrapper">
            <img 
            src="https://cdn.shopify.com/s/files/1/0733/2531/4260/files/shipping-protection.png" 
            alt="Shipping Protection" 
            class="hub-addon-sp-img"
            />
            </div>
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
      const headingUpsell = upsellSettings.title;

      const position = upsellSettings.position || "bottom";
      const upsellContainer =
        position === "top"
          ? document.getElementById(`hub-upsell-top-${blockId}`)
          : document.getElementById(`hub-upsell-bottom-${blockId}`);

      if (upsellContainer) {
        upsellContainer.classList.add("upsell-container");

        if (position === "bottom") {
          upsellContainer.classList.add("upsell-bottom");
        } else {
          upsellContainer.classList.add("upsell-top");
        }

        upsellContainer.innerHTML = "";

        if (upsellProducts.length > 0) {
          const wrapper = document.createElement("div");
          wrapper.className = "upsell-inner";

          const heading = document.createElement("h3");
          heading.className = "upsell-heading";
          heading.innerHTML = headingUpsell;

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
        }
      }
    }

    /* ── SUGGESTED PRODUCT ── */
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
          const image = sp.items.images?.[0] || "";
          suggestedEl.style.display = "block";
          suggestedEl.innerHTML = `
            <div class="upsell-suggestion">
              <label class="upsell-checkbox-wrapper">
                <input type="checkbox" id="hub-suggested-cb-${blockId}" data-variant="${rawVariantId}" />
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

    if (cart.total_discount > 0) {
      container.insertAdjacentHTML("beforeend", ``);
    }

    // Build a set of manually entered code titles (lowercase) for quick lookup
    const manualCodes = new Set(
      (cart.discount_codes || []).map((d) => d.code.toLowerCase()),
    );

    // Collect ALL unique discount applications from both sources:
    // 1. cart_level_discount_applications (automatic / cart-wide)
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
  } finally {
    window._hubRenderInProgress = false;
    window._hubRewardUpdating = false;
    hubUtils.hideCartSkeleton(blockId);
    hubUtils.revealCartItems(blockId);
  }
};
