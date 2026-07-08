function getDrawer() {
  const blockId = window.HUB_CART_BLOCK_ID;
  return document.getElementById(`hub-cart-drawer-${blockId}`) || document;
}

const ICONS = {
  plus: `<span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-plus" viewBox="0 0 10 10"><path fill="currentColor" fill-rule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clip-rule="evenodd"></path></svg></span>`,
  minus: `<span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-minus" viewBox="0 0 10 2"><path fill="currentColor" fill-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clip-rule="evenodd"></path></svg></span>`,
};

function _hubDisableQtySiblings(clickedBtn) {
  const control = clickedBtn.closest(".hub-qty-control");
  if (!control) return;

  control.querySelectorAll(".hub-qty-btn, .hub-qty-input").forEach((el) => {
    if (el !== clickedBtn) {
      el.disabled = true;
      el.style.pointerEvents = "auto";
      el.style.opacity = "0.4";
      el.style.cursor = "not-allowed";
    }
  });
}

function _hubHideAllCartSections(blockId) {
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  if (!drawer) return;

  const hide = (el) => {
    if (!el) return;
    el.style.transition = "opacity 0.2s ease";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  };

  const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
  if (cartItemsEl) {
    cartItemsEl.style.transition = "opacity 0.2s ease";
    cartItemsEl.style.opacity = "0";
    cartItemsEl.style.pointerEvents = "none";
  }
  const cartBody = document.getElementById(`hub-upcart-cart-body`);
  if (cartBody) {
    cartBody.style.transition = "opacity 0.2s ease";
    cartBody.style.opacity = "0";
    cartBody.style.pointerEvents = "none";
  }

  hide(drawer.querySelector(".hub-cart-footer"));
  hide(document.getElementById(`hub-addons-${blockId}`));

  const rewards = window.__HUB_ACTIVE_CART__?.rewardsSettings;
  if (!rewards?.showOnEmptyCart) {
    hide(document.getElementById(`hub-rewards-${blockId}`));
    hide(document.getElementById(`hub-rewards-bar-${blockId}`));
  }
  hide(document.getElementById(`hub-upsell-top-${blockId}`));
  hide(document.getElementById(`hub-upsell-bottom-${blockId}`));
  hide(document.getElementById(`hub-trust-badges-top-${blockId}`));
  hide(document.getElementById(`hub-trust-badges-bottom-${blockId}`));

  const annBefore = document.getElementById(`hub-announcement-${blockId}`);
  const annAfter = document.getElementById(`hub-announcement-after-${blockId}`);
  if (annBefore) annBefore.style.display = "none";
  if (annAfter) annAfter.style.display = "none";

  const notesBelow = document.getElementById(`hub-notes-below-${blockId}`);
  const notesFooter = document.getElementById(`hub-notes-footer-${blockId}`);
  if (notesBelow) notesBelow.innerHTML = "";
  if (notesFooter) notesFooter.innerHTML = "";

  const bottomOfCart = drawer.querySelector(".hub-bottom-of-cart");
  if (bottomOfCart) bottomOfCart.style.display = "none";

  const suggestedEl = document.getElementById(
    `hub-suggested-product-${blockId}`,
  );
  if (suggestedEl) {
    suggestedEl.style.display = "none";
    suggestedEl.innerHTML = "";
  }

  const headerEl = document.querySelector(".upcart-header-text");
  if (headerEl) {
    const hs = window.__HUB_ACTIVE_CART__?.headerSettings || {};
    headerEl.innerText = (hs.titleText || "Cart • {{cart_quantity}}").replace(
      "{{cart_quantity}}",
      0,
    );
  }
}

function _hubRestoreAllCartSections(blockId) {
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  if (!drawer) return;

  const restore = (el) => {
    if (!el) return;
    el.style.transition = "";
    el.style.opacity = "";
    el.style.pointerEvents = "";
  };

  const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
  if (cartItemsEl) restore(cartItemsEl);
  const cartBody = document.getElementById(`hub-upcart-cart-body`);
  if (cartBody) restore(cartBody);

  restore(drawer.querySelector(".hub-cart-footer"));
  restore(document.getElementById(`hub-addons-${blockId}`));
  restore(document.getElementById(`hub-rewards-${blockId}`));
  restore(document.getElementById(`hub-rewards-bar-${blockId}`));
  restore(document.getElementById(`hub-upsell-top-${blockId}`));
  restore(document.getElementById(`hub-upsell-bottom-${blockId}`));
  restore(document.getElementById(`hub-trust-badges-top-${blockId}`));
  restore(document.getElementById(`hub-trust-badges-bottom-${blockId}`));
}

async function updateQty(key, qty, btn = null) {
  if (btn && btn.classList.contains("loading")) return;

  if (btn) {
    btn.classList.add("loading");
    btn.innerHTML = `<span class="loader"></span>`;
    btn.disabled = true;
  }

  try {
    if (qty < 1) {
      await removeItem(key);
      return;
    }

    const itemEl = btn?.closest("[data-item-key]");
    const qtyInput = itemEl?.querySelector(".hub-qty-input");
    if (qtyInput) qtyInput.value = qty;

    const minusBtn = itemEl?.querySelector(".hub-qty-btn.minus");
    if (minusBtn) minusBtn.disabled = qty <= 1;

    await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: qty }),
    });

    await window.hubCartRender(getDrawer());
  } catch (err) {
    console.error("Qty update error:", err);
    if (btn) {
      btn.classList.remove("loading");
      btn.disabled = false;
      btn.innerHTML = ICONS[btn.dataset.type];
    }
  }
}

const _hubPendingRemovals = {};
const UNDO_DURATION_MS = 4000;

async function removeItem(key, title) {
  const deleteBehavior =
    window.__HUB_ACTIVE_CART__?.cartSettings?.deleteBehavior || "undo";
  const drawer = getDrawer();
  const el = drawer.querySelector(`[data-item-key="${key}"]`);
  if (!el) return;

  if (_hubPendingRemovals[key]) {
    clearTimeout(_hubPendingRemovals[key].timer);
    _hubPendingRemovals[key].toastEl?.remove();
  }

  const inner = el.querySelector(".hub-cart-item");

  const removedQty = Number(el.querySelector(".hub-qty-input")?.value || 1);
  const badgeText = document.querySelector(
    ".custom-cart-sticky-cart-quantity-icon-text",
  );
  const badgeWrapper = document.querySelector(
    ".custom-cart-sticky-cart-quantity-icon",
  );

  function _applyBadgeCount(count) {
    const n = Math.max(0, count);
    if (badgeText) badgeText.textContent = n > 99 ? "99+" : n;
    if (badgeWrapper) badgeWrapper.style.display = n > 0 ? "flex" : "none";
    document.querySelectorAll(".cart-count-bubble").forEach((bubble) => {
      const numEl = bubble.querySelector('[aria-hidden="true"]');
      const lblEl = bubble.querySelector(".visually-hidden");
      if (numEl) numEl.textContent = n;
      if (lblEl) lblEl.textContent = n === 1 ? "1 item" : `${n} items`;
    });
  }

  const bubbleNumEl = document.querySelector(
    '.cart-count-bubble [aria-hidden="true"]',
  );
  const countBefore =
    parseInt(bubbleNumEl?.textContent || badgeText?.textContent || "0", 10) ||
    0;
  _applyBadgeCount(countBefore - removedQty);

  const willEmpty =
    Array.from(drawer.querySelectorAll("[data-item-key]")).filter((row) => {
      const k = row.getAttribute("data-item-key");
      if (String(k) === String(key) || _hubPendingRemovals[k]) return false;
      if (row.getAttribute("data-is-reward") === "1") return false;
      return true;
    }).length === 0;

  let fadedRewardInners = [];
  if (willEmpty) {
    fadedRewardInners = Array.from(
      drawer.querySelectorAll('[data-item-key][data-is-reward="1"]'),
    )
      .map((row) => row.querySelector(".hub-cart-item"))
      .filter(Boolean);
    fadedRewardInners.forEach((rInner) => {
      rInner.style.transition = "opacity 0.25s ease";
      rInner.style.opacity = "0.4";
      rInner.style.pointerEvents = "none";
    });
  }

  // ── Direct: loader only, no fade, no toast ───────────────────────────────
  if (deleteBehavior === "direct") {
    const deleteBtn = el.querySelector(".hub-delete-btn");
    if (deleteBtn) {
      deleteBtn.innerHTML = `<span class="loader"></span>`;
      deleteBtn.disabled = true;
    }

    _hubPendingRemovals[key] = {
      toastEl: null,
      itemEl: el,
      innerEl: inner,
      fadedRewardInners,
      removedQty,
      timer: null,
      isDirect: true,
    };

    await new Promise((r) => setTimeout(r, 1500));
    await _commitRemoval(key);
    return;
  }

  // ── Undo toast: fade inner, show toast ───────────────────────────────────
  if (inner) {
    inner.style.opacity = "0.4";
    inner.style.transition = "opacity 0.25s ease";
    inner.style.pointerEvents = "none";
  }

  const toastEl = _createUndoToast(key, title || "item");
  el.appendChild(toastEl);

  const fill = toastEl.querySelector(".hub-undo-fill");
  if (fill) {
    fill.style.transition = `width ${UNDO_DURATION_MS}ms linear`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fill.style.width = "0%";
      }),
    );
  }

  _hubPendingRemovals[key] = {
    toastEl,
    itemEl: el,
    innerEl: inner,
    fadedRewardInners,
    removedQty,
    timer: setTimeout(() => _commitRemoval(key), UNDO_DURATION_MS),
  };
}

async function _commitRemoval(key) {
  const p = _hubPendingRemovals[key];
  if (!p) return;

  delete _hubPendingRemovals[key];

  const blockId = window.HUB_CART_BLOCK_ID;
  const drawer = getDrawer();

  const remainingItemEls = Array.from(
    drawer.querySelectorAll("[data-item-key]"),
  ).filter((el) => {
    const k = el.getAttribute("data-item-key");
    if (String(k) === String(key) || _hubPendingRemovals[k]) return false;
    if (el.getAttribute("data-is-reward") === "1") return false;
    return true;
  });
  const cartWillBeEmpty = remainingItemEls.length === 0;

  const updates = { [key]: 0 };

  if (cartWillBeEmpty) {
    drawer
      .querySelectorAll(
        `#hub-sp-toggle-${blockId}, #hub-addon-toggle-${blockId}`,
      )
      .forEach((cb) => {
        const k = cb.dataset.lineKey;
        if (k) updates[k] = 0;
      });

    drawer
      .querySelectorAll('[data-item-key][data-is-reward="1"]')
      .forEach((el) => {
        const k = el.getAttribute("data-item-key");
        if (k) updates[k] = 0;
      });

    _hubHideAllCartSections(blockId);
    const rewardsSettings = window.__HUB_ACTIVE_CART__?.rewardsSettings;
    if (rewardsSettings) {
      hubUtils.renderRewardsBar(
        blockId,
        { items: [], item_count: 0, total_price: 0 },
        rewardsSettings,
      );
    }
  }

  window._hubCommitingRemoval = true;
  try {
    const networkDone = fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (cartWillBeEmpty) {
      // Render empty UI INSTANTLY — items are already faded from removeItem.
      // Skip toast-hide + slide-out animations entirely.
      if (p.toastEl) p.toastEl.remove();

      // _hubHideAllCartSections faded the cart body + items container — restore
      // them immediately so the empty UI we're about to inject is visible.
      const cartBody = document.getElementById("hub-upcart-cart-body");
      if (cartBody) {
        cartBody.style.transition = "";
        cartBody.style.opacity = "";
        cartBody.style.pointerEvents = "";
      }

      // Hide the footer entirely via the empty-footer class (display:none !important)
      const footerEl = drawer.querySelector(".hub-cart-footer");
      if (footerEl) {
        footerEl.classList.add("hub-empty-footer");
        footerEl.style.transition = "";
        footerEl.style.opacity = "";
        footerEl.style.pointerEvents = "";
      }

      const cs = window.__HUB_ACTIVE_CART__?.cartSettings || {};
      const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
      const rec = window.__HUB_ACTIVE_CART__?.recommendationsSettings || {};
      const container = drawer.querySelector(".hub-cart-items");
      const cartItemsEl = document.getElementById(`hub-cart-items-${blockId}`);
      if (cartItemsEl) {
        cartItemsEl.style.transition = "";
        cartItemsEl.style.opacity = "";
        cartItemsEl.style.pointerEvents = "";
        cartItemsEl.classList.add("footer-empty");
      }
      if (container) {
        const btnColor = ds.buttonColor || "#000000";
        const btnHoverColor = ds.buttonHoverColor || "#333333";
        const txtColor = ds.buttonTextColor || "#ffffff";
        const showRecsBlock = !rec.enabled;
        container.innerHTML = `
          <div class="hub-cart-empty">
            <h3 class="hub-empty-title styles_CartPreview__empty__" style="color:${ds.textColor || "#000"}">
              ${cs.emptyCartMessage || "Your cart is empty"}
            </h3>
            ${
              showRecsBlock
                ? `<p class="hub-rec-subtitle hub-public-upsell__header" style="color:${ds.textColor || "#000"};">
                    ${rec.headerText || ""}
                  </p>`
                : ""
            }
            ${
              showRecsBlock && rec.showShopNowButton
                ? `<a href="${rec.buttonUrl || "/collections/all"}" class="hub-rec-btn hub-public-upsell__shop-now-button"
                  style="--btn-bg:${btnColor};--btn-hover:${btnHoverColor};--btn-text:${txtColor};border-radius:${ds.buttonRadius || 0}px;">
                  ${rec.buttonText || "Shop Now"}
                </a>`
                : ""
            }
          </div>`;
      }

      const headerEl = document.querySelector(".upcart-header-text");
      if (headerEl) {
        const hs = window.__HUB_ACTIVE_CART__?.headerSettings || {};
        headerEl.innerText = (
          hs.titleText || "Cart • {{cart_quantity}}"
        ).replace("{{cart_quantity}}", 0);
      }
      window._hubLastCartHadItems = false;

      networkDone
        .then(() => {
          window._hubRenderInProgress = false;
          window._hubRewardUpdating = false;
          return window.hubCartRender(drawer);
        })
        .then(() => {
          _hubRestoreAllCartSections(blockId);
        })
        .catch(() => {});
      return;
    }

    // Non-empty case: keep the original toast-hide + slide-out animations
    if (p.toastEl) {
      p.toastEl.classList.add("hub-toast-hiding");
      await new Promise((r) => setTimeout(r, 220));
      p.toastEl.remove();
    }

    const el = p.itemEl;

    if (el) {
      // ── UPDATE HEADER FIRST ─────────────────────────────
      const headerEl = document.querySelector(".upcart-header-text");

      if (headerEl) {
        const hs = window.__HUB_ACTIVE_CART__?.headerSettings || {};

        const remainingCount = Array.from(
          drawer.querySelectorAll("[data-item-key]"),
        ).reduce((total, row) => {
          const rowKey = row.getAttribute("data-item-key");

          if (String(rowKey) === String(key)) {
            return total;
          }

          if (row.getAttribute("data-is-reward") === "1") {
            return total;
          }

          const qty = Number(row.querySelector(".hub-qty-input")?.value || 0);

          return total + qty;
        }, 0);

        headerEl.innerText = (
          hs.titleText || "Cart • {{cart_quantity}}"
        ).replace("{{cart_quantity}}", Math.max(0, remainingCount));
      }

      // ── UPDATE FOOTER PRICES OPTIMISTICALLY ─────────────
      const removedLinePrice = Number(el.dataset.linePrice) || 0;
      if (removedLinePrice > 0) {
        const currentTotal = Number(window._hubCartFinalTotal) || 0;
        const newTotal = Math.max(0, currentTotal - removedLinePrice);
        window._hubCartFinalTotal = newTotal;
        const newTotalFmt = hubUtils.formatMoney(newTotal);

        const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
        if (totalEl) totalEl.textContent = newTotalFmt;

        const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
        if (grandEl) grandEl.textContent = newTotalFmt;

        const checkoutBtn = document.getElementById(
          `hub-checkout-btn-${blockId}`,
        );
        if (checkoutBtn) {
          const cs = window.__HUB_ACTIVE_CART__?.cartSettings || {};
          const rawText = cs.checkoutButtonText || "Proceed to checkout";
          checkoutBtn.textContent = rawText.replace(
            "{{total_price}}",
            newTotalFmt,
          );
        }
      }

      el.style.overflow = "hidden";
      el.style.maxHeight = el.offsetHeight + "px";
      void el.offsetHeight;
      el.style.transition =
        "transform 0.3s ease, opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease";
      el.style.transform = "translateX(-100%)";
      el.style.opacity = "0";
      el.style.maxHeight = "0px";
      el.style.marginTop = "0px";
      el.style.marginBottom = "0px";
      el.style.paddingTop = "0px";
      el.style.paddingBottom = "0px";

      await new Promise((r) => setTimeout(r, 300));
    }

    await networkDone;

    if (Object.keys(_hubPendingRemovals).length === 0) {
      try {
        if (typeof handleTriggeredRewards === "function") {
          const latestCart = await (await fetch("/cart.js")).json();
          await handleTriggeredRewards(latestCart);
        }
      } catch (e) {}

      window._hubRenderInProgress = false;
      window._hubRewardUpdating = false;
      await window.hubCartRender(drawer);
    }
  } finally {
    window._hubCommitingRemoval = false;
    window._hubRenderInProgress = false;
    window._hubRewardUpdating = false;
  }
}

function _undoRemoval(key) {
  const p = _hubPendingRemovals[key];
  if (!p) return;

  clearTimeout(p.timer);

  if (p.innerEl) {
    p.innerEl.style.opacity = "1";
    p.innerEl.style.pointerEvents = "";
  }

  if (p.fadedRewardInners?.length) {
    p.fadedRewardInners.forEach((rInner) => {
      rInner.style.opacity = "1";
      rInner.style.pointerEvents = "";
    });
  }

  p.toastEl?.classList.add("hub-toast-hiding");
  setTimeout(() => {
    p.toastEl?.remove();
    window._hubRenderInProgress = false;
    document.dispatchEvent(new CustomEvent("cart:updated"));
  }, 220);

  delete _hubPendingRemovals[key];
}

function _createUndoToast(key, title) {
  const el = document.createElement("div");
  el.className = "hub-undo-toast";
  el.innerHTML = `
    <span class="hub-undo-msg" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Removed '${title}'</span>
    <button class="hub-undo-btn" onclick="_undoRemoval('${key}')">Undo</button>
    <div class="hub-undo-progress"><div class="hub-undo-fill" style="width:100%"></div></div>
  `;
  return el;
}

function handleQtyInput(key, value) {
  let qty = value.replace(/\D/g, "");
  qty = parseInt(qty);

  if (isNaN(qty) || qty < 1) {
    qty = 1;
  }

  updateQty(key, qty);
}

function showMessage(el, text, color = "black") {
  el.style.color = color;
  el.innerText = text;

  setTimeout(() => {
    el.innerText = "";
  }, 4000);
}

window.applyDiscountCode = async function (btn) {
  const wrapper = btn.closest(".hub-discount-input-row-items");

  const input = wrapper?.querySelector(".hub-discount-input");
  const message = wrapper?.querySelector(".hub-discount-message");

  const code = input.value.trim();

  if (!code) {
    showMessage(message, "Please enter a discount code", "red");
    return;
  }

  if (btn.classList.contains("loading")) return;

  btn.classList.add("loading");
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="loader"></span>`;
  btn.disabled = true;

  let hasRealDiscount = false;

  try {
    await fetch(`/discount/${code}`, {
      method: "GET",
      credentials: "include",
    });

    await new Promise((r) => setTimeout(r, 500));

    const res = await fetch("/cart.js");
    const cart = await res.json();

    const hasLineDiscount = cart.items.some(
      (item) => item.line_level_discount_allocations?.length > 0,
    );

    const hasCartDiscount = cart.cart_level_discount_applications?.length > 0;

    const hasCodeDiscount = cart.discount_codes?.some(
      (d) => d.code.toLowerCase() === code.toLowerCase() && d.applicable,
    );

    hasRealDiscount = hasLineDiscount || hasCartDiscount || hasCodeDiscount;

    if (!hasRealDiscount) {
      await fetch(`/discount/INVALID_REMOVE`, {
        credentials: "include",
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    await window.hubCartRender(getDrawer());

    const newMessage = document.getElementById("discount-message");

    if (hasRealDiscount) {
      showMessage(newMessage, "Discount applied successfully", "green");

      localStorage.setItem("appliedDiscount", code);
    } else {
      showMessage(newMessage, "Enter a valid discount code", "red");
    }

    if (input) {
      input.value = "";
      input.blur();
    }
  } catch (err) {
    showMessage(message, "Something went wrong", "red");

    btn.innerHTML = btn.dataset.original || "APPLY";
    btn.disabled = false;
  } finally {
    btn.classList.remove("loading");
  }
};

window.removeDiscountCode = async function (btn, blockId) {
  if (!btn || btn.classList.contains("loading")) return;

  btn.classList.add("loading");
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="discount-loader"></span>`;
  btn.disabled = true;

  try {
    await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: "" }),
    });

    await new Promise((r) => setTimeout(r, 400));

    await window.hubCartRender(getDrawer());
  } catch (err) {
    console.error(err);

    btn.innerHTML = btn.dataset.original || "REMOVE";
    btn.disabled = false;
  } finally {
    btn.classList.remove("loading");
  }
};

window.hubCheckoutClick = function (e, blockId, btn) {
  e.preventDefault();

  if (btn.classList.contains("loading")) return;

  btn.classList.add("loading");
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="loader"></span>`;
  btn.style.pointerEvents = "none";

  const url = btn.getAttribute("href");

  // Track checkout initiation — revenue split is tracked by the web pixel
  // on checkout_completed so it only fires on confirmed orders.
  fetch(
    `${window.__HUB_API_URL__ || "http://hubsyntax.online"}/api/track-event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "8f4c2a91d7e3b6f5a8c1d9e2f7b4c6a9e1d3f8b5c2a7d4e9f6b1c8a3d7e5f2",
      },
      body: JSON.stringify({
        shop: window.__SHOPIFY_SHOP__?.domain,
        cartId: window.__HUB_ACTIVE_CART__?.cartId || null,
        sessionId: window._hubGetSessionId?.() || "",
        eventType: "checkout_initiated",
        userAgent: navigator.userAgent,
      }),
    },
  ).catch(() => {});

  setTimeout(() => {
    window.location.href = url;
  }, 500);
};

if (!window._hubNotesClickBound) {
  window._hubNotesClickBound = true;

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".drop-icon, .drop-icon *");
    if (!toggle) return;

    const wrapper = toggle.closest(".hub-additional-notes");
    if (!wrapper) return;

    wrapper.classList.toggle("open");
  });
}

window.hubChangeVariantOption = async function (selectEl) {
  const key = selectEl.dataset.key;
  const handle = selectEl.dataset.handle;

  const itemEl = selectEl.closest("[data-item-key]");
  const allSelects =
    itemEl?.querySelectorAll(".hub-variant-option-select") || [];

  const selectedOptions = Array.from(allSelects).map(
    (s) => s.options[s.selectedIndex]?.value || s.value,
  );

  const productData = window._hubProductDataByHandle?.[handle];
  if (!productData) {
    console.error("No product data for:", handle);
    return;
  }

  const matchedVariant = productData.variants.find((v) => {
    const variantOptions = [v.option1, v.option2, v.option3].filter(Boolean);
    if (variantOptions.length < selectedOptions.length) return false;
    return selectedOptions.every((val, i) => variantOptions[i] === val);
  });

  if (!matchedVariant) {
    console.error("No match for options:", selectedOptions);
    return;
  }

  const oldVariantId = String(key?.split(":")?.[0] || "");
  if (String(matchedVariant.id) === oldVariantId) return;

  allSelects.forEach((s) => (s.disabled = true));
  const currentQty = Number(
    itemEl?.querySelector(".hub-qty-input")?.value || 1,
  );

  window._hubVariantSwapping = true;

  try {
    const addRes = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchedVariant.id, quantity: currentQty }),
    });
    if (!addRes.ok) throw new Error("Add failed");

    await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: 0 }),
    });

    const updatedCart = await fetch("/cart.js").then((r) => r.json());
    const newItem = updatedCart.items.find(
      (i) => String(i.variant_id) === String(matchedVariant.id),
    );

    if (!newItem) throw new Error("New item not found in cart");

    window.hubItemOrder?.replaceVariant(oldVariantId, newItem.variant_id);

    itemEl.dataset.itemKey = newItem.key;
    itemEl.setAttribute("data-item-key", newItem.key);

    allSelects.forEach((s) => {
      s.dataset.key = newItem.key;
      s.disabled = false;
    });

    itemEl.querySelectorAll(".hub-qty-btn").forEach((btn) => {
      const type = btn.dataset.type;
      const newQty =
        type === "minus" ? newItem.quantity - 1 : newItem.quantity + 1;
      btn.setAttribute(
        "onclick",
        `updateQty('${newItem.key}', ${newQty}, this)`,
      );
      if (type === "minus") btn.disabled = newItem.quantity <= 1;
    });

    const qtyInput = itemEl.querySelector(".hub-qty-input");
    if (qtyInput) {
      qtyInput.value = newItem.quantity;
      qtyInput.setAttribute(
        "oninput",
        `handleQtyInput('${newItem.key}', this.value)`,
      );
    }

    const deleteBtn = itemEl.querySelector(".hub-delete-btn");
    if (deleteBtn) {
      deleteBtn.setAttribute(
        "onclick",
        `removeItem('${newItem.key}', '${(newItem.product_title || "").replace(/'/g, "\\'")}')`,
      );
    }

    const imgEl = itemEl.querySelector(".hub-item-img");
    if (imgEl && newItem.image) {
      imgEl.src = newItem.image;
      imgEl.alt = newItem.product_title || "";
    }

    const priceEl = itemEl.querySelector(".hub-item-unit-price");
    if (priceEl)
      priceEl.textContent = hubUtils.formatMoney(newItem.final_line_price);

    const compareEl = itemEl.querySelector(".hub-item-compare-price");
    if (compareEl) {
      const compareAtPrice =
        window._hubCompareCache?.[`${handle}_${matchedVariant.id}`] || 0;
      if (compareAtPrice > 0) {
        compareEl.textContent = hubUtils.formatMoney(
          compareAtPrice * newItem.quantity,
        );
        compareEl.style.display = "";
      } else {
        compareEl.style.display = "none";
      }
    }

    const saveBadgeEl = itemEl.querySelector(".hub-item-save");
    if (saveBadgeEl) {
      const compareAtPrice =
        window._hubCompareCache?.[`${handle}_${matchedVariant.id}`] || 0;
      const effectiveUnitPrice =
        newItem.quantity > 0
          ? Math.round(newItem.final_line_price / newItem.quantity)
          : newItem.price;
      const unitSave =
        compareAtPrice > effectiveUnitPrice
          ? compareAtPrice - effectiveUnitPrice
          : 0;

      if (unitSave > 0) {
        const totalSave = unitSave * newItem.quantity;
        const savingsText =
          window.__HUB_ACTIVE_CART__?.cartSettings?.savingsText || "Save";
        saveBadgeEl.textContent = `${savingsText} ${hubUtils.formatMoney(totalSave)}`;
        saveBadgeEl.style.display = "";
      } else {
        saveBadgeEl.style.display = "none";
      }
    }

    const blockId = window.HUB_CART_BLOCK_ID;

    (function updateFooterTotals(cart) {
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
      if (discMrpRow && discMrpEl) {
        if (lineSaving > 0) {
          discMrpEl.textContent = `-${fmt(lineSaving)}`;
          discMrpRow.style.display = "";
        } else discMrpRow.style.display = "none";
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
        const rawText =
          cartSettings.checkoutButtonText || "Proceed to checkout";
        checkoutBtn.textContent = rawText.replace(
          "{{total_price}}",
          fmt(grandTotal),
        );
      }

      const container = document.querySelector(
        `#hub-cart-drawer-${blockId} .hub-cart-items`,
      );
      if (container && typeof hubUtils.shipping_Charges === "function") {
        hubUtils.shipping_Charges(container, finalTotal);
      }
    })(updatedCart);

    window._hubVariantSwapping = false;
    document.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: { cart: updatedCart, skipItemRerender: true },
      }),
    );
  } catch (err) {
    window._hubVariantSwapping = false;
    console.error("Variant change failed:", err);
    allSelects.forEach((s) => (s.disabled = false));
    const recoveredCart = await fetch("/cart.js")
      .then((r) => r.json())
      .catch(() => null);
    if (recoveredCart) {
      document.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { cart: recoveredCart } }),
      );
    }
  }
};
