// ─────────────────────────────────────────────────────────────────────────────
// HUB CART RENDER
window.hubRefreshEstimatedTotal = function (blockId) {
  const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
  if (!totalEl) return;
  const total =
    (window._hubCartFinalTotal || 0) + (window._hubShippingPriceCents || 0);
  totalEl.textContent = hubUtils.formatMoney(total);
};

window.hubSetSellingPlan = async function ({
  itemKey,
  variantId,
  currentPlanId,
  sellingPlanId,
  qty,
}) {
  const change = (id, quantity) =>
    fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        quantity,
        selling_plan: sellingPlanId || null,
      }),
    });

  const quantity = Number(qty) || 0;
  if (itemKey && quantity > 0) {
    const res = await change(itemKey, quantity);
    if (res.ok) return res.json();
  }

  // fallback: find the line in the cart
  const cart = await (await fetch("/cart.js")).json();
  const line = cart.items.find((i) =>
    itemKey
      ? i.key === itemKey
      : String(i.variant_id) === String(variantId) &&
        String(i.selling_plan_allocation?.selling_plan?.id || "") ===
          String(currentPlanId || ""),
  );
  if (!line) throw new Error("Cart line not found for the selling plan change");
  const res = await change(line.key, line.quantity);
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(
      errBody?.message || errBody?.description || `Failed (status ${res.status})`,
    );
  }
  return res.json();
};

function _hubAnimateReturningUpsells(container, handles) {
  const enteringHandles = new Set(handles || []);
  if (!enteringHandles.size) return;

  container
    .querySelectorAll(".hub-rec-product[data-product-handle]")
    .forEach((card) => {
      if (!enteringHandles.has(card.dataset.productHandle)) return;
      card.classList.add("hub-rec-product-entering");
      card.addEventListener(
        "animationend",
        () => card.classList.remove("hub-rec-product-entering"),
        { once: true },
      );
    });
}

window.hubCartRender = async function (drawer, opts = {}) {
  if (window._hubRenderInProgress) {
    window._hubPendingRender = { drawer, opts };
    return;
  }
  window._subscriptionOpen = {};
  window._upsellCache = window._upsellCache || {};
  window._hubRenderInProgress = true;
  // newest render wins: an older render that is still loading upsells must not block or overwrite it
  const _gen = (window._hubRenderGen = (window._hubRenderGen || 0) + 1);
  let oneTickRender;
  let earlyUpsellLoad;

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
      discountCodesSettings?.enabled === false &&
      window._hubLastCartHadItems !== false
        ? "flex"
        : "none";
  }

  const _renderedItemKeys = new Set(window._hubRenderedCartItemKeys || []);
  const _itemsContainer = drawer?.querySelector(`#hub-cart-items-${blockId}`);
  _itemsContainer
    ?.querySelectorAll(".hub-cart-for-item[data-item-key]")
    .forEach((itemEl) =>
      _renderedItemKeys.add(itemEl.getAttribute("data-item-key")),
    );
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
    let cart = opts.cart?.items ? opts.cart : null;
    if (!cart) {
      const res = await fetch("/cart.js");
      cart = await res.json();
    }
    cart._hubAt = Date.now();
    if (window._hubRenderGen !== _gen) return;

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
    if (window._hubRenderGen !== _gen) return;
    window._hubLastRenderedCart = cart;

    // Load One Tick offers before the drawer's other product and reward requests.
    oneTickRender = window.cartPlusRenderOneTick?.(blockId, cart);

    const earlyUpsellSettings = window.__HUB_ACTIVE_CART__?.upsellsSettings;
    if (!earlyUpsellSettings?.enabled && cart.items.length > 0) {
      const productId = cart.items[0].product_id;
      const cartSig = cart.items
        .map((item) => item.product_id)
        .sort()
        .join(",");
      const cachedProducts = window._upsellCache[productId];
      const cachedSig = window._upsellCacheSig?.[productId];

      if (!(cachedProducts && cachedSig === cartSig)) {
        const promise = window.getUpsellProducts(
          earlyUpsellSettings,
          productId,
          cart,
        );
        earlyUpsellLoad = { productId, cartSig, promise };
      }
    }

    // ── PRE-FILL COMPARE-AT CACHE (needed for MRP) ───────────────────────
    window._hubCompareCache = window._hubCompareCache || {};
    const _mrpHandles = [
      ...new Set(
        cart.items
          .filter((i) => !i.properties?._hub_addon)
          .map((i) => i.handle)
          .filter(Boolean),
      ),
    ];
    const _mrpUncached = _mrpHandles.filter(
      (h) =>
        !Object.keys(window._hubCompareCache).some((k) =>
          k.startsWith(h + "_"),
        ),
    );
    await Promise.all(
      _mrpUncached.map(async (handle) => {
        try {
          const r = await fetch(`/products/${handle}.js`);
          const data = await r.json();
          // keep the whole product too: the selling plans are read from it later in this
          // render, which would otherwise download the same /products/<handle>.js again
          window._hubProductDataByHandle = window._hubProductDataByHandle || {};
          window._hubProductDataByHandle[handle] = data;
          (data.variants || []).forEach((v) => {
            window._hubCompareCache[`${handle}_${v.id}`] =
              v.compare_at_price || 0;
          });
        } catch (e) {}
      }),
    );

    if (window._hubRenderGen !== _gen) return;

    hubUtils.updateDiscountUI(blockId, cart);

    window._hubCartProductIds = new Set(
      cart.items.map((i) => String(i.product_id)),
    );

    const headerEl = document.querySelector(".cart-plus-header-text");
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
    // Order notes are a Footer row (the editor's Footer > Order notes), whatever the old placement was
    const _shouldShowBelow = false;
    const _shouldShowFooter =
      notesSettings?.enabled === false && cart.items.length > 0;

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
        window.cartPlusHideOneTick?.(blockId);
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

    if (window._hubRenderGen !== _gen) return;

    // Rewards changed the cart in the background (e.g. while the page is loading).
    // Only refresh an already-open drawer; never pop it open by itself.
    if (isCartChanged)
      document.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { onlyIfOpen: true } }),
      );

    if (window.cartPlusSetEmptyHeaderVisibility) {
      window.cartPlusSetEmptyHeaderVisibility(drawer, cart.items.length === 0);
    } else {
      drawer.classList.toggle("hub-cart-is-empty", cart.items.length === 0);
    }

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
    if (cartItemsEl) {
      const isEmpty = cart.items.length === 0;
      const body = cartItemsEl.closest(".hub-cart-items-CartPreview");
      window.cartPlusSetBodyUpsellVisibility?.(blockId, isEmpty);
      cartItemsEl.classList.toggle("footer-empty", isEmpty);
      body?.classList.toggle("hub-cart-empty-layout", isEmpty);
      if (cartItemsEl.parentElement && cartItemsEl.parentElement !== body) {
        cartItemsEl.parentElement.classList.toggle(
          "hub-cart-empty-section",
          isEmpty,
        );
      }
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
          "cart-plus-public-announcement cart-plus-announcement upcart-announcement" +
          (isAfter ? " announcement-after" : "");

        const annTpl = window.cartPlusAnnouncementTemplate?.(ann, cart);
        if (annTpl) {
          // a picked template draws its own bar (see hub-cart-sections.js)
          const previousFill = target.querySelector(".cp-ann-progress-fill");
          const previousWidth = previousFill?.style.width;
          target.style.cssText = annTpl.css + (isAfter ? 'margin-top:0;' : '');
          target.innerHTML = annTpl.html;
          const nextFill = target.querySelector(".cp-ann-progress-fill");
          if (previousWidth && nextFill) {
            const targetWidth = nextFill.style.width;
            nextFill.style.transition = "none";
            nextFill.style.width = previousWidth;
            nextFill.offsetWidth;
            nextFill.style.transition = "width 450ms ease";
            requestAnimationFrame(() => {
              nextFill.style.width = targetWidth;
            });
          }
          window.cartPlusAnnouncementBind?.(target);
        } else {
        // same look as the editor: own background, else the Template colour / gradient (text goes white)
        const templateBg = window.cartPlusTemplateBackground?.(
          window.__HUB_ACTIVE_CART__?.designSettings,
        );
        const annBg = window.cartPlusBgCss(
          ann.background ||
            templateBg || { type: "plain", color: ann.backgroundColor || "#ffffff" },
        );
        const whiteText = !ann.background && templateBg;
        target.style.cssText = `
          display: block;
          background: ${annBg};
          padding: ${height};
          font-size: ${ann.fontSize || 14}px;
          line-height: 30px;
          text-align: center;
          color: ${whiteText ? "#fff" : "#000000"};
          ${isAfter ? "margin-top: 0;" : ""}
        `;
        const annIcon = ann.icon
          ? `<span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${window.hubLibraryIconHTML?.(ann.icon, 20, ann.iconColor) || ""}</span>`
          : "";
        // the retired {TIMER} placeholder is dropped, like in the editor
        target.innerHTML = annIcon + (ann.text || "").replace(/\s*\{timer\}/gi, "");
        }
      }
    }

    // ── PRICE TOTALS ──────────────────────────────────────────────────────
    await (async function () {
      const fmt = hubUtils.formatMoney;
      const originalTotal = cart.original_total_price || 0;
      const mrpTotal = cart.items.reduce((sum, i) => {
        const isAddon = !!(
          i.properties?._hub_addon || i.properties?.__upcartAddon
        );
        const compareAt = isAddon
          ? 0
          : window._hubCompareCache[`${i.handle}_${i.variant_id}`] || 0;
        const unitMrp =
          compareAt > i.original_price ? compareAt : i.original_price;
        return sum + unitMrp * i.quantity;
      }, 0);

      const subtotal = cart.items_subtotal_price || 0;
      const finalTotal = cart.total_price || 0;
      const shippingPrice = window._hubShippingPriceCents || 0;
      const grandTotal = finalTotal + shippingPrice;
      const lineSaving = originalTotal - subtotal;
      const couponSaving = subtotal - finalTotal;
      const totalSaved = mrpTotal - finalTotal;

      window._hubCartFinalTotal = finalTotal;

      const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
      if (totalEl) totalEl.textContent = fmt(grandTotal);

      const origEl = document.getElementById(`hub-total-original-${blockId}`);
      if (origEl) {
        if (totalSaved > 0) {
          origEl.textContent = fmt(mrpTotal);
          origEl.style.display = "";
        } else origEl.style.display = "none";
      }

     const savedEl = document.getElementById(`hub-total-saved-${blockId}`);

if (savedEl) {
  if (Number(totalSaved) > 0) {
    savedEl.textContent = `You Saved ${fmt(totalSaved)} !`;
    savedEl.style.setProperty("display", "block", "important");
  } else {
    savedEl.textContent = "";
    savedEl.style.setProperty("display", "none", "important");
  }
}

      const mrpEl = document.getElementById(`hub-mrp-${blockId}`);
      if (mrpEl) mrpEl.textContent = fmt(mrpTotal);

      const mrpSaving = mrpTotal - originalTotal;
      const onMrpRow = document.getElementById(
        `hub-discount-on-mrp-${blockId}`,
      );
      const onMrpVal = document.getElementById(
        `hub-discount-on-mrp-value-${blockId}`,
      );
      if (onMrpRow && onMrpVal) {
        if (mrpSaving > 0) {
          onMrpVal.textContent = `-${fmt(mrpSaving)}`;
          onMrpRow.style.display = "";
        } else {
          onMrpRow.style.display = "none";
        }
      }

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
              ? `${baseLabel}`
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
          const pctApp = (cart.cart_level_discount_applications || []).find(
            (a) => a.value_type === "percentage",
          );
          couponEl.textContent = pctApp
            ? `-${parseFloat(pctApp.value)}%`
            : `-${fmt(couponSaving)}`;
          couponRow.style.display = "";
        } else {
          couponRow.style.display = "none";
        }
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

      // Summary from the editor (cartSettings.summary)
      window.cartPlusSummaryFromCart?.(blockId, cart);
      window.cartPlusAgeUpdate?.(blockId, cart);

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

        // a label set on the editor's Checkout Button page (rich text, {{Price}}) wins
        const btnOpts = window.cartPlusGetCheckoutButton?.(cartSettings) || {};
        if (btnOpts.label != null) {
          checkoutBtn.innerHTML = window.cartPlusFillPrice(btnOpts.label, fmt(grandTotal));
        } else {
          checkoutBtn.textContent = goToCartPageOnCheckout
            ? rawText
            : rawText.replace("{{total_price}}", fmt(grandTotal));
        }
      }
    })();

    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
    const customHtmlBlocks = cartSettings.customHtmlBlocks || {};
    const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};

    const discountCodesSettings =
      window.__HUB_ACTIVE_CART__?.discountCodesSettings;

    const showOfferBgColor =
      discountCodesSettings?.showOfferBgColor || "#6C4DFF";

    // Custom CSS from Settings plus the enabled CSS blocks added in the editor sidebar
    hubUtils.applyCustomCSS(
      blockId,
      [
        cartSettings.customCss,
        ...(Array.isArray(cartSettings.customBlocks)
          ? cartSettings.customBlocks
              .filter((b) => b && b.enabled && b.type === "css" && b.code)
              .map((b) => b.code)
          : []),
      ]
        .filter(Boolean)
        .join("\n"),
    );
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
          showOfferBgColor,
        );
      });

    const discountRowEl = document.getElementById(
      `hub-discount-row-${blockId}`,
    );
    if (discountRowEl) {
      discountRowEl.style.display =
        discountCodesSettings?.enabled === false && cart.items.length > 0
          ? "flex"
          : "none";
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
        _hubAnimateReturningUpsells(
          container,
          settings.enteringProductHandles,
        );
      } else {
        container.style.display = "";
        container.innerHTML = `<div class="upcart-internal-upsell__vertical-layout-wrapper">${html}</div>`;
        _hubAnimateReturningUpsells(
          container,
          settings.enteringProductHandles,
        );
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
        const select = parent?.querySelector(".hub-variant-select");
        const variantId = select?.value || btn.dataset.variant;
        if (!variantId) return;

        parent?.classList.add("hub-rec-product--adding");
        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.setAttribute("aria-busy", "true");
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
            hubCartSkipItemRerender: true,
            hubCartSkipOneTickRefresh: true,
            hubCartSkipCartCountUpdate: true,
          });
          if (!addRes.ok && addRes.status !== 409)
            throw new Error(`Upsell add failed (status ${addRes.status})`);

          const cartRes = await fetch("/cart.js");
          if (!cartRes.ok) {
            throw new Error(`Upsell cart refresh failed (status ${cartRes.status})`);
          }
          const cart = await cartRes.json();
          window.updateCartCount?.(cart);

          const blockId = window.HUB_CART_BLOCK_ID;
          const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
          if (drawer && window.hubCartRender) {
            await window.hubCartRender(drawer, {
              showSkeleton: false,
              cart,
              awaitOneTick: true,
            });
          } else {
            document.dispatchEvent(
              new CustomEvent("cart:updated", { detail: { cart } }),
            );
          }
        } catch (err) {
          console.error("[CartPlus] Upsell add failed:", err);
        } finally {
          if (parent?.isConnected) {
            parent.classList.remove("hub-rec-product--adding");
          }
          if (btn.isConnected) {
            btn.innerHTML = btn.dataset.original || "Add";
            btn.disabled = false;
            btn.removeAttribute("aria-busy");
          }
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

    const upsellSettings =
      window.__HUB_ACTIVE_CART__?.upsellsSettings || {};
    const upsellPosition = upsellSettings?.position || "bottom";
    const upsellContainer =
      upsellPosition === "top"
        ? document.getElementById(`hub-upsell-top-${blockId}`)
        : document.getElementById(`hub-upsell-bottom-${blockId}`);
    const paintUpsellProducts = (products) => {
      if (!upsellContainer) return;
      if (!products.length) {
        upsellContainer.style.display = "none";
        upsellContainer.innerHTML = "";
        upsellContainer.dataset.renderedHandles = "";
        delete upsellContainer.dataset.renderingHandles;
        return;
      }

      const layout = window.cartPlusUpsellLayout(upsellSettings);
      const handles = products
        .map((product) => product.handle)
        .sort()
        .join(",");
      const alreadyShowingRealCards =
        !!upsellContainer.querySelector(".hub-rec-product") &&
        !upsellContainer.querySelector(".hub-rec-skeleton-card");
      if (
        upsellContainer.dataset.renderedHandles === handles &&
        (alreadyShowingRealCards ||
          upsellContainer.dataset.renderingHandles === handles)
      ) {
        return;
      }

      upsellContainer.classList.add("upsell-container");
      upsellContainer.classList.add(
        upsellPosition === "bottom" ? "upsell-bottom" : "upsell-top",
      );
      if (layout === "side") {
        upsellContainer.style.display = "none";
        window.cartPlusRenderSidePanel?.(blockId, products, upsellSettings);
        upsellContainer.dataset.renderedHandles = handles;
        delete upsellContainer.dataset.renderingHandles;
        return;
      }

      window.cartPlusRemoveSidePanel?.(blockId);
      upsellContainer.style.display = "";
      upsellContainer.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "upsell-inner";
      const heading = document.createElement("h3");
      heading.className = "upsell-heading";
      const titleIcon =
        upsellSettings.icon === undefined
          ? { type: "icon", name: "star" }
          : upsellSettings.icon;
      const iconHtml = titleIcon
        ? `<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${window.hubLibraryIconHTML?.(titleIcon, 18, upsellSettings.iconColor || undefined) || ""}</span>`
        : "";
      if (layout === "compact") {
        heading.style.display = "flex";
        heading.style.alignItems = "center";
        heading.style.justifyContent = "space-between";
        heading.style.gap = "8px";
        heading.innerHTML = `<div>${iconHtml}${upsellSettings.title}</div>${window.cartPlusCompactArrowsHTML?.() || ""}`;
      } else {
        heading.innerHTML = iconHtml + upsellSettings.title;
      }
      heading.style.color =
        upsellSettings.primaryTextColor || designSettings?.textColor || "#000";
      const productsEl = document.createElement("div");
      productsEl.className = "upsell-products";
      wrapper.appendChild(heading);
      wrapper.appendChild(productsEl);
      upsellContainer.appendChild(wrapper);

      if (layout === "compact") {
        window._cartPlusUpsellOverride = upsellSettings;
        productsEl.innerHTML = window.cartPlusCompactHTML(products);
        hubUtils.applyRatings(productsEl);
        window._cartPlusUpsellOverride = null;
        const track = productsEl.querySelector(".hub-compact-track");
        if (track) setTimeout(() => window.cartPlusCompactEdges(track), 0);
        delete upsellContainer.dataset.renderingHandles;
      } else {
        upsellContainer.dataset.renderingHandles = handles;
        window.renderProducts(productsEl, products, {
          layout: layout === "carousel" ? "carousel" : "block",
          upsellLayout: layout,
          showReviews: upsellSettings.showReviews,
          carouselIndicator: upsellSettings.carouselIndicator,
          showIfAlreadyInCart: upsellSettings.showIfAlreadyInCart,
        }).then(
          () => {
            if (upsellContainer.dataset.renderingHandles === handles) {
              delete upsellContainer.dataset.renderingHandles;
            }
          },
          (error) => {
            delete upsellContainer.dataset.renderingHandles;
            console.error("[CartPlus] Upsell cards failed to render:", error);
          },
        );
      }
      upsellContainer.dataset.renderedHandles = handles;
    };

    if (!upsellSettings?.enabled && cart.items.length > 0) {
      const productId = cart.items[0].product_id;
      const cartSig = cart.items
        .map((item) => item.product_id)
        .sort()
        .join(",");
      const cachedProducts = window._upsellCache[productId];
      if (
        cachedProducts &&
        window._upsellCacheSig?.[productId] === cartSig
      ) {
        paintUpsellProducts(cachedProducts);
      } else if (earlyUpsellLoad) {
        earlyUpsellLoad.promise
          .then((products) => {
            if (window._hubRenderGen !== _gen) return;
            window._upsellCache[productId] = products;
            window._upsellCacheSig = window._upsellCacheSig || {};
            window._upsellCacheSig[productId] = cartSig;
            paintUpsellProducts(products);
          })
          .catch((error) =>
            console.error("[CartPlus] Upsell rendering failed:", error),
          );
      }
    }

    if (window._hubRenderGen !== _gen) return;

    // ── EMPTY CART ────────────────────────────────────────────────────────
    if (cart.items.length === 0) {
      window._hubRenderedCartItemKeys = new Set();
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

      // Empty cart from the editor's Empty view (Settings, Login, Cross-sell)
      if (!container.querySelector(".cart-plus-empty-cart")) {
        container.innerHTML = window.cartPlusEmptyCartHTML(blockId);
      }
      window.cartPlusRenderEmptyUpsell?.(blockId);

      if (footer) footer.classList.add("hub-empty-footer");
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

    // Same templates as the editor's SUBSCRIPTION_TEMPLATES (null = follow the theme)
    const SP_TEMPLATES = {
      default: { layout: "button", accent: null, accentText: null, trackBg: "#f5f5f5", trackText: "#374151", radius: null },
      toggle: { layout: "toggle", accent: "#008a3e", accentText: "#ffffff", trackBg: "#f5f5f5", trackText: "#374151", radius: 999 },
      toggle_dark: { layout: "toggle", accent: "#111827", accentText: "#ffffff", trackBg: "#eef0f3", trackText: "#374151", radius: 10 },
      radio_dark: { layout: "radio", accent: "#111827", accentText: "#ffffff", trackBg: "#ffffff", trackText: "#1f2937", radius: 10 },
    };
    const spTpl =
      SP_TEMPLATES[subscriptionSettings?.template] ||
      Object.values(SP_TEMPLATES).find(
        (x) => x.layout === subscriptionSettings?.layout,
      ) ||
      SP_TEMPLATES.default;
    const spPick = (k) => subscriptionSettings?.[k] ?? spTpl[k];
    const spLayout = spPick("layout");

    // The toggle / radio switch handlers (attached once)
    if (!window._hubSpOptListenerAttached) {
      window._hubSpOptListenerAttached = true;
      document.addEventListener("click", async (e) => {
        const opt = e.target.closest(".hub-sp-opt");
        if (!opt) return;
        const wrapper = opt.closest(".hub-selling-plan-wrapper");
        if (!wrapper) return;
        window._subscriptionOpen = window._subscriptionOpen || {};
        const itemKey = wrapper.dataset.itemKey;

        if (opt.dataset.mode === "subscribe") {
          wrapper.classList.add("show-subscription");
          if (itemKey) window._subscriptionOpen[itemKey] = true;
          return;
        }

        // One-time: drop the selling plan if the line already has one
        wrapper.classList.remove("show-subscription");
        if (itemKey) window._subscriptionOpen[itemKey] = false;
        const select = wrapper.querySelector(".hub-selling-plan-select");
        const currentPlanId = select?.dataset.currentPlan || "";
        if (!currentPlanId) return;
        wrapper.style.opacity = "0.6";
        wrapper.style.pointerEvents = "none";
        // spinner on the clicked option while the plan is removed
        const optSpinner = document.createElement("span");
        optSpinner.className = "loader hub-sp-opt-loader";
        optSpinner.style.cssText =
          "width:12px;height:12px;margin-left:6px;vertical-align:middle;";
        opt.appendChild(optSpinner);
        try {
          const updatedCart = await window.hubSetSellingPlan({
            itemKey: itemKey,
            variantId: select.dataset.variantId,
            currentPlanId,
            sellingPlanId: null,
            qty: wrapper.closest(".hub-cart-item")?.querySelector(".hub-qty-input")
              ?.value,
          });
          const drawer = wrapper.closest(
            `.hub-cart-block-${window.HUB_CART_BLOCK_ID}`,
          );
          if (drawer) await window.hubCartRender(drawer, { cart: updatedCart });
          document.dispatchEvent(
            new CustomEvent("cart:updated", {
              detail: { cart: updatedCart, skipItemRerender: true },
            }),
          );
        } catch (err) {
          console.error("Remove selling plan error:", err);
          optSpinner.remove();
          wrapper.style.opacity = "";
          wrapper.style.pointerEvents = "";
        }
      });
    }

    if (!subscriptionSettings?.enabled) {
      const uniqueHandleVariantPairs = [
        ...new Set(
          sortedItems
            .filter((i) => !i.properties?._hub_addon)
            .map((i) => `${i.handle}::${i.variant_id}`)
            .filter(Boolean),
        ),
      ];

      await Promise.all(
        uniqueHandleVariantPairs.map(async (pairKey) => {
          const [handle, variantId] = pairKey.split("::");
          try {
            _sellingPlansByHandle[pairKey] = await hubUtils.getSellingPlans(
              handle,
              variantId,
            );
          } catch (e) {
            _sellingPlansByHandle[pairKey] = [];
          }
        }),
      );
    }

    // ── UPGRADE BUTTON HANDLER (attach once, not inside item loop) ────────
    // (the old handler here only faked a 3 second wait on the upgrade button; the real work
    // and its spinner now live in the .hub-upgrade-btn click handler in hub-cart-drawer.js)

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
          spinner.innerHTML = `<span class="loader"></span>`;
          spinner.style.cssText =
            "display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;opacity:0.8;margin-top:4px;";
          wrapper.appendChild(spinner);
        }

        try {
          if (!variantId) {
            throw new Error("Selling plan select is missing data-variant-id");
          }

          const updatedCart = await window.hubSetSellingPlan({
            itemKey: wrapper?.dataset.itemKey,
            variantId,
            currentPlanId,
            sellingPlanId: Number(sellingPlanId),
            qty: itemEl?.querySelector(".hub-qty-input")?.value,
          });

          const drawer = select.closest(
            `.hub-cart-block-${window.HUB_CART_BLOCK_ID}`,
          );
          // the cart returned by change.js is rendered directly (no extra /cart.js round trip)
          if (drawer) await window.hubCartRender(drawer, { cart: updatedCart });
          document.dispatchEvent(
            new CustomEvent("cart:updated", {
              detail: { cart: updatedCart, skipItemRerender: true },
            }),
          );
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
        // "Products in cart" options from the editor
        const itemOpts = window.cartPlusGetItemOptions(cartSettings);
        const colorItems =
          itemOpts.primaryTextColor || designSettings.textColor || "#000";
        const discountColor = designSettings.discountBageColor || "#1e7e34";
        const showStrikethrough =
          (designSettings.showStrikethrough || false) && itemOpts.showCompareAt;
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
        const groups =
          _sellingPlansByHandle[`${item.handle}::${item.variant_id}`] || [];

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

          const spAccent = spPick("accent") ?? btnColor;
          const spAccentText = spPick("accentText") ?? textColor;
          const spRadius = spPick("radius") ?? designSettings.buttonRadius ?? 8;
          const spSubLabel = (
            subscriptionSettings?.subscribeLabel ?? "{{selling_plan_group_name}}"
          ).replace(/\{\{selling_plan_group_name\}\}/g, groupName);
          const spOneLabel =
            subscriptionSettings?.planOptionsOneTimePurchaseText || "One-time";
          const spVars = `--sp-accent:${spAccent};--sp-accent-text:${spAccentText};--sp-track-bg:${spPick("trackBg")};--sp-track-text:${spPick("trackText")};--sp-radius:${spRadius}px;`;
          const spOpts =
            spLayout === "toggle"
              ? `<div class="hub-sp-toggle"><button type="button" class="hub-sp-opt" data-mode="subscribe">${spSubLabel}</button><button type="button" class="hub-sp-opt" data-mode="onetime">${spOneLabel}</button></div>`
              : spLayout === "radio"
                ? `<div class="hub-sp-radio"><button type="button" class="hub-sp-opt" data-mode="subscribe"><span class="hub-sp-dot"></span>${spSubLabel}</button><button type="button" class="hub-sp-opt" data-mode="onetime"><span class="hub-sp-dot"></span>${spOneLabel}</button></div>`
                : "";

          sellingPlanHtml = `
            <div class="hub-selling-plan-wrapper hub-sp-layout-${spLayout} ${
              window._subscriptionOpen?.[item.key] || sellingPlan
                ? "show-subscription"
                : ""
            }" data-item-key="${item.key}" style="${spVars}">
              ${
                spLayout === "button"
                  ? `<div class="hub-one-time-view">
                <button class="hub-upgrade-btn"
                  style="border-radius:${spRadius}px;--btn-bg:${spAccent};--btn-hover:${btnHoverColor};--btn-text:${spAccentText};">
                  <span class="btn-text">${buttonText}</span>
                </button>
              </div>`
                  : spOpts
              }
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

        // "Show Savings" overrides the Preferences setting once it has been touched
        const showSavings = itemOpts.showSavings ?? showSavingsBelowPrices;
        const priceQty = itemOpts.singleItemPrice ? 1 : item.quantity;
        const saveHtml =
          hasDiscount && showSavings && layoutName !== "subscription"
            ? `<p class="hub-item-save" style="color:${savingsColor};background:${hubUtils.hexToRGBA(designSettings.savingsColor, 0.1)};">${window.cartPlusSaveHtml(savingsText, hubUtils.formatMoney(unitSave * priceQty))}</p>`
            : "";

        const priceHtml = hasDiscount
          ? `<span class="hub-price-original">${hubUtils.formatMoney(effectiveCompare)}</span>
             <span class="hub-price">${hubUtils.formatMoney(effectiveUnitPrice)}</span>`
          : `<span class="hub-price">${hubUtils.formatMoney(effectiveUnitPrice)}</span>`;

        const hasCompare = effectiveCompare > 0;

        const variantHtml =
          itemOpts.showVariants &&
          item.options_with_values &&
          item.options_with_values.length > 0 &&
          !item.product_has_only_default_variant
            ? item.options_with_values
                .map(
                  (opt) =>
                    `<p class="hub-item-variant cart-plus-public-component-product-tile__variant" style="color:${colorItems}"><span class="hub-item-variant-name">${opt.name}:</span> <span class="hub-item-variant-value">${opt.value}</span></p>`,
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
          showSavings,
          discountColor,
          iconColor,
          singleItemPrice: itemOpts.singleItemPrice,
        };

        const layoutFn =
          window.hubItemLayouts?.[layoutName] || window.hubItemLayouts?.classic;
        return layoutFn(layoutCtx);
      }),
    );

    if (window._hubRenderGen !== _gen) return;

    const previousItems = Array.from(
      container.querySelectorAll(".hub-cart-for-item[data-item-key]"),
    ).filter((itemEl) => itemEl.parentElement === container);
    const previousItemKeys = new Set([
      ..._renderedItemKeys,
      ...previousItems.map((itemEl) => itemEl.getAttribute("data-item-key")),
    ]);
    const preserveCartItemNodes =
      window._hubCommitingRemoval || opts.preserveCartItemNodes === true;

    if (preserveCartItemNodes) {
      const existingItems = new Map(
        previousItems.map((itemEl) => [
          itemEl.getAttribute("data-item-key"),
          itemEl,
        ]),
      );
      const renderedItems = document.createElement("div");
      renderedItems.innerHTML = itemsHTML.join("");
      const fragment = document.createDocumentFragment();

      Array.from(renderedItems.childNodes).forEach((node) => {
        const key =
          node.nodeType === 1 &&
          node.matches(".hub-cart-for-item[data-item-key]")
            ? node.getAttribute("data-item-key")
            : null;
        const existingItem = key && existingItems.get(key);
        if (existingItem) {
          existingItems.delete(key);
          existingItem.dataset.linePrice = node.dataset.linePrice;
          if (node.hasAttribute("data-is-reward")) {
            existingItem.setAttribute("data-is-reward", "1");
          } else {
            existingItem.removeAttribute("data-is-reward");
          }
          fragment.appendChild(existingItem);
        } else {
          fragment.appendChild(node);
        }
      });

      container.innerHTML = "";
      container.appendChild(fragment);
    } else {
      container.innerHTML = itemsHTML.join("");
    }

    container
      .querySelectorAll(".hub-cart-for-item[data-item-key]")
      .forEach((itemEl) => {
        if (preserveCartItemNodes) {
          itemEl.classList.remove("hub-cart-item-entering");
        } else if (
          !previousItemKeys.has(itemEl.getAttribute("data-item-key"))
        ) {
          itemEl.classList.add("hub-cart-item-entering");
        }
      });

    window._hubRenderedCartItemKeys = new Set(
      Array.from(
        container.querySelectorAll(".hub-cart-for-item[data-item-key]"),
        (itemEl) => itemEl.getAttribute("data-item-key"),
      ),
    );
    hubUtils.hideCartSkeleton(blockId);
    hubUtils.revealCartItems(blockId);
    if (opts.awaitOneTick) {
      await oneTickRender;
    }

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
        window.cartPlusNotesSync?.(blockId, cart.note || "");
      }
    }
    window.cartPlusNotesSync?.(blockId, cart.note || "");
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

        // Text / Price colour from the editor (only valid hex is used; unset = cart defaults)
        const hexOnly = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || "") ? c : "");
        const addonTextStyle = hexOnly(addonsSettings.textColor)
          ? ` style="color:${hexOnly(addonsSettings.textColor)};"`
          : "";
        const addonPriceStyle = hexOnly(addonsSettings.priceColor)
          ? ` style="color:${hexOnly(addonsSettings.priceColor)};"`
          : "";

        // Card colour + toggle colour from the editor (same fields the preview uses).
        // A black toggle is the untouched default, so the theme colour keeps winning there.
        const addonCardBg = window.cartPlusBgCss?.(addonsSettings.cardBackground) || "";
        const addonToggle = hexOnly(addonsSettings.toggleColor);
        const addonCardStyle =
          (addonCardBg ? `background:${addonCardBg};` : "") +
          (addonToggle && addonToggle.toLowerCase() !== "#000000"
            ? `--cp-accent-bg:${addonToggle};`
            : "");
        const addonCardAttr = addonCardStyle ? ` style="${addonCardStyle}"` : "";

        if (isShipping) {
          const spTitle = truncateText(
            addonsSettings.title || "Shipping Protection",
            50,
          );
          const spDesc = truncateText(addonsSettings.description || "", 60);

          addonsEl.innerHTML = `
            <div class="hub-addon-shipping-protection"${addonCardAttr}>
              <div class="upcart-internal-addons__image-wrapper">
                <img src="https://cdn.shopify.com/s/files/1/0733/2531/4260/files/shipping-protection.png" alt="Shipping Protection" class="hub-addon-sp-img"/>
              </div>
              <div class="hub-addon-sp-info">
        <p class="hub-addon-sp-title"${addonTextStyle}>${spTitle}</p>
        <p class="hub-addon-sp-desc"${addonTextStyle}>${spDesc}</p>
      </div>
              <div class="hub-addon-sp-right">
                <span class="hub-addon-sp-price"${addonPriceStyle}>${price}</span>
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
    <div class="hub-addon-product cart-plus-public-addons cart-plus-addons"${addonCardAttr}>
     ${selected.image ? `<div class="hub-addon-product-img-wrapper cart-plus-addons-image-wrapper cart-plus-public-addons__image-wrapper"><img src="${selected.image}" alt="${selected.title}" class="hub-addon-product-img"/></div>` : ""}
      <div class="hub-addon-product-info cart-plus-public-addons__content-wrapper">
        <p class="hub-addon-product-title cart-plus-public-addons__content-title-wrapper cart-plus-addons-title"${addonTextStyle}>${productTitle}</p>
        <span class="hub-addon-product-price cart-plus-public-addons__content-price"${addonPriceStyle}>${price}</span>
      </div>
      <label class="hub-addon-sp-toggle cart-plus-addons-toggle upcart-public-addons__toggle-wrapper cart-plus-public-addons__toggle-wrapper">
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

    // Items, header, summary and totals are drawn. The upsell list below can take a while to load,
    // so let a waiting render (the next add / remove) start now instead of queueing behind it.
    if (window._hubRenderGen === _gen) {
      window._hubRenderInProgress = false;
      if (window._hubPendingRender) {
        const _next = window._hubPendingRender;
        window._hubPendingRender = null;
        window.hubCartRender(_next.drawer, _next.opts);
      }
    }

    // ── UPSELLS ───────────────────────────────────────────────────────────
    let _hubUpsellHasProducts = false;
    if (!upsellSettings?.enabled && cart.items.length > 0) {
      const productId = cart.items[0].product_id;

      const position = upsellSettings.position || "bottom";

      const _hasRenderedProducts =
        !!upsellContainer?.querySelector(".hub-rec-product") &&
        !upsellContainer?.querySelector(".hub-rec-skeleton-card");
      const _hasCachedUpsell =
        !!window._upsellCache[productId] || _hasRenderedProducts;

      // Side panel layout: the cards live beside the cart, never show an inline skeleton for them
      const _isSideLayout =
        window.cartPlusUpsellLayout?.(upsellSettings) === "side";

      if (upsellContainer && !_hasCachedUpsell && !_isSideLayout) {
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

      // The cached list was filtered against the cart it was built for. If the set of products in
      // the cart changed (something added or removed), rebuild it, otherwise a product that just
      // left the cart would not come back into the upsell list. (The slow part is cached separately.)
      const _cartSig = cart.items
        .map((i) => i.product_id)
        .sort()
        .join(",");
      window._upsellCacheSig = window._upsellCacheSig || {};
      if (
        window._upsellCache[productId] &&
        window._upsellCacheSig[productId] === _cartSig
      ) {
        upsellProducts = window._upsellCache[productId];
      } else if (
        earlyUpsellLoad &&
        String(earlyUpsellLoad.productId) === String(productId) &&
        earlyUpsellLoad.cartSig === _cartSig
      ) {
        upsellProducts = await earlyUpsellLoad.promise;
      } else if (window._hubUpsellPrefetch) {
        const pre = await window._hubUpsellPrefetch;
        window._hubUpsellPrefetch = null;
        if (
          pre &&
          String(pre.productId) === String(productId) &&
          pre.cartSig === _cartSig
        ) {
          upsellProducts = pre.products;
        } else {
          upsellProducts = await window.getUpsellProducts(
            upsellSettings,
            productId,
            cart,
          );
        }
      } else {
        upsellProducts = await window.getUpsellProducts(
          upsellSettings,
          productId,
          cart,
        );
      }

      window._upsellCache[productId] = upsellProducts;
      window._upsellCacheSig[productId] = _cartSig;
      // a newer render started while the upsells were loading: it draws them itself
      if (window._hubRenderGen !== _gen) return;
      _hubUpsellHasProducts = upsellProducts.length > 0;
      const headingUpsell = upsellSettings.title;
      const textColor = designSettings?.textColor || "#000";

      if (upsellContainer) {
        const newHandles = upsellProducts
          .map((p) => p.handle)
          .sort()
          .join(",");
        const prevHandles = upsellContainer.dataset.renderedHandles || "";
        const previousHandleSet = new Set(
          prevHandles.split(",").filter(Boolean),
        );
        const returningHandles = newHandles
          .split(",")
          .filter((handle) => handle && !previousHandleSet.has(handle));
        const _alreadyShowingRealCards =
          !!upsellContainer.querySelector(".hub-rec-product") &&
          !upsellContainer.querySelector(".hub-rec-skeleton-card");
        const _alreadyRenderingCards =
          upsellContainer.dataset.renderingHandles === newHandles;

        if (
          newHandles === prevHandles &&
          upsellContainer.children.length > 0 &&
          (_alreadyShowingRealCards || _alreadyRenderingCards)
        ) {
          // genuinely already rendered with real cards — skip re-render
        } else {
          upsellContainer.classList.add("upsell-container");
          upsellContainer.classList.add(
            position === "bottom" ? "upsell-bottom" : "upsell-top",
          );
          upsellContainer.innerHTML = "";

         const upLayout = window.cartPlusUpsellLayout(upsellSettings);
          if (upLayout === "side" && upsellProducts.length > 0) {
            // Side panel: nothing inside the cart, the strip sits beside it (left / right as set in the editor)
            upsellContainer.style.display = "none";
            window.cartPlusRenderSidePanel?.(blockId, upsellProducts, upsellSettings);
          } else if (upsellProducts.length > 0) {
            window.cartPlusRemoveSidePanel?.(blockId);
            upsellContainer.style.display = ""; 
            const wrapper = document.createElement("div");
            wrapper.className = "upsell-inner";
            const heading = document.createElement("h3");
            heading.className = "upsell-heading";
            // title icon from the icon library (star until one is picked, cleared = none)
            const titleIcon =
              upsellSettings.icon === undefined
                ? { type: "icon", name: "star" }
                : upsellSettings.icon;
            const iconHtml = titleIcon
              ? `<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${window.hubLibraryIconHTML?.(titleIcon, 18, upsellSettings.iconColor || undefined) || ""}</span>`
              : "";
            if (upLayout === "compact") {
              heading.style.display = "flex";
              heading.style.alignItems = "center";
              heading.style.justifyContent = "space-between";
              heading.style.gap = "8px";
              heading.innerHTML = `<div>${iconHtml}${headingUpsell}</div>${window.cartPlusCompactArrowsHTML?.() || ""}`;
            } else {
              heading.innerHTML = iconHtml + headingUpsell;
            }
            heading.style.color =
              upsellSettings.primaryTextColor || textColor;
            const productsDiv = document.createElement("div");
            productsDiv.className = "upsell-products";
            wrapper.appendChild(heading);
            wrapper.appendChild(productsDiv);
            upsellContainer.appendChild(wrapper);
            if (upLayout === "compact") {
              window._cartPlusUpsellOverride = upsellSettings;
              productsDiv.innerHTML = window.cartPlusCompactHTML(upsellProducts);
              _hubAnimateReturningUpsells(productsDiv, returningHandles);
              hubUtils.applyRatings(productsDiv); 
              window._cartPlusUpsellOverride = null;
              const track = productsDiv.querySelector(".hub-compact-track");
              if (track) setTimeout(() => window.cartPlusCompactEdges(track), 0);
            } else {
              window.renderProducts(productsDiv, upsellProducts, {
                layout: upLayout === "carousel" ? "carousel" : "block",
                upsellLayout: upLayout,
                showReviews: upsellSettings.showReviews,
                carouselIndicator: upsellSettings.carouselIndicator,
                showIfAlreadyInCart: upsellSettings.showIfAlreadyInCart,
                enteringProductHandles: returningHandles,
              });
            }
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
    // only the newest render owns the lock (an older one may finish after a newer one has started)
    if (window._hubRenderGen === _gen) {
      window._hubRenderInProgress = false;
      window._hubRewardUpdating = false;

      if (window._hubPendingRender) {
        const pending = window._hubPendingRender;
        window._hubPendingRender = null;
        window.hubCartRender(pending.drawer, pending.opts);
      }
    }
  }

  window.hubCloseTotalBreakdown = function (blockId) {
    const drawer = document.getElementById("hub-cart-drawer-" + blockId);
    const breakdown = document.getElementById("hub-total-breakdown-" + blockId);
    if (!drawer || !breakdown) return;

    // Only act if it is actually open
    if (!breakdown.classList.contains("hub-breakdown-open")) return;

    breakdown.classList.remove("hub-breakdown-open");
    drawer.classList.remove("hub-cart-total-open");

    const summary = drawer.querySelector(".hub-total-summary");
    if (summary) {
      summary.classList.remove("hub-total-summary--open");
      const arrow = summary.querySelector(".hub-total-arrow");
      if (arrow) arrow.style.transform = "rotate(0deg)";
    }
  };

  document.addEventListener("click", function (e) {
    const body = e.target.closest("#hub-upcart-cart-body");

    if (!body || e.target !== body) return;

    const drawer = body.closest(".hub-cart-drawer");
    if (!drawer) return;

    const blockId = drawer.id.replace("hub-cart-drawer-", "");

    if (drawer.classList.contains("hub-cart-total-open")) {
      window.hubCloseTotalBreakdown(blockId);
    }

    if (document.body.classList.contains("hub-offers-open-body")) {
      window.hubCloseOffersPanel(blockId);
    }
  });
};
