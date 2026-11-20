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

function _hubEnableQtySiblings(clickedBtn, quantity) {
  const control = clickedBtn?.closest(".hub-qty-control");
  if (!control) return;

  control.querySelectorAll(".hub-qty-btn, .hub-qty-input").forEach((el) => {
    el.disabled =
      el.classList.contains("minus") && Number(quantity) <= 1;
    el.style.pointerEvents = "";
    el.style.opacity = "";
    el.style.cursor = "";
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
  const cartBody =
    drawer.querySelector(".hub-cart-items-CartPreview") ||
    document.getElementById("hub-upcart-cart-body");
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

  const discountRow = document.getElementById(`hub-discount-row-${blockId}`);
  if (discountRow) discountRow.style.display = "none";

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

  const headerEl = document.querySelector(".cart-plus-header-text");
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
  const cartBody =
    drawer.querySelector(".hub-cart-items-CartPreview") ||
    document.getElementById("hub-upcart-cart-body");
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

function _hubGetQtyPreview(cart, key, quantity) {
  const item = cart?.items?.find(
    (cartItem) => String(cartItem.key) === String(key),
  );
  if (!item) return null;

  const oldQuantity = Number(item.quantity) || 0;
  if (!oldQuantity) return null;

  const oldLinePrice = Number(item.final_line_price) || 0;
  const newLinePrice = Math.round((oldLinePrice / oldQuantity) * quantity);
  const oldOriginalLinePrice =
    Number(item.original_line_price) ||
    (Number(item.original_price) || 0) * oldQuantity;
  const newOriginalLinePrice =
    (Number(item.original_price) || 0) * quantity;
  const subtotal = Math.max(
    0,
    (Number(cart.items_subtotal_price) || 0) - oldLinePrice + newLinePrice,
  );
  const originalTotal = Math.max(
    0,
    (Number(cart.original_total_price) || 0) -
      oldOriginalLinePrice +
      newOriginalLinePrice,
  );
  // Keep the existing cart-level discount ratio for the brief optimistic preview.
  const oldSubtotal = Number(cart.items_subtotal_price) || 0;
  const total = oldSubtotal
    ? Math.max(
        0,
        Math.round(
          subtotal * ((Number(cart.total_price) || 0) / oldSubtotal),
        ),
      )
    : subtotal;

  const updatedItem = {
    ...item,
    quantity,
    final_line_price: newLinePrice,
    original_line_price: newOriginalLinePrice,
  };
  return {
    item: updatedItem,
    cart: {
      ...cart,
      items: cart.items.map((cartItem) =>
        String(cartItem.key) === String(key) ? updatedItem : cartItem,
      ),
      item_count:
        (Number(cart.item_count) || 0) + quantity - oldQuantity,
      items_subtotal_price: subtotal,
      original_total_price: originalTotal,
      total_price: total,
    },
  };
}

function _hubPaintQtyPreview(itemEl, item, cart) {
  if (itemEl && item) {
    itemEl.dataset.linePrice = String(item.final_line_price || 0);
    const priceEl = itemEl.querySelector(".hub-item-unit-price");
    if (priceEl) {
      const itemOptions = window.cartPlusGetItemOptions?.() || {};
      const price = itemOptions.singleItemPrice
        ? Math.round(
            (Number(item.final_line_price) || 0) /
              Math.max(1, Number(item.quantity) || 1),
          )
        : Number(item.final_line_price) || 0;
      priceEl.textContent = hubUtils.formatMoney(price);
    }
  }

  if (!cart) return;
  const blockId = window.HUB_CART_BLOCK_ID;
  window._hubCartFinalTotal = Number(cart.total_price) || 0;
  window.cartPlusSummaryFromCart?.(blockId, cart);
  const grandTotal =
    window._hubCartFinalTotal + (Number(window._hubShippingPriceCents) || 0);
  const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
  if (totalEl) totalEl.textContent = hubUtils.formatMoney(grandTotal);
  const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
  if (grandEl) grandEl.textContent = hubUtils.formatMoney(grandTotal);
}

async function updateQty(key, qty, btn = null) {
  if (btn && btn.classList.contains("loading")) return;

  const itemEl = btn?.closest("[data-item-key]");
  const qtyInput = itemEl?.querySelector(".hub-qty-input");
  const previousQty = Number(qtyInput?.value || qty);
  const previousCart = window._hubLastRenderedCart;
  const previousItem = previousCart?.items?.find(
    (cartItem) => String(cartItem.key) === String(key),
  );
  itemEl?.querySelector(".hub-qty-error")?.remove();

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

    if (qtyInput) qtyInput.value = qty;

    const minusBtn = itemEl?.querySelector(".hub-qty-btn.minus");
    if (minusBtn) minusBtn.disabled = qty <= 1;
    const preview = _hubGetQtyPreview(previousCart, key, qty);
    if (preview) _hubPaintQtyPreview(itemEl, preview.item, preview.cart);

    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: qty }),
      hubCartSkipItemRerender: true,
    });
    if (!response.ok) {
      const error = new Error(
        `Quantity update failed (status ${response.status})`,
      );
      error.status = response.status;
      throw error;
    }

    const updatedCart = await response.json();
    const blockId = window.HUB_CART_BLOCK_ID;
    window._hubLastRenderedCart = updatedCart;
    const updatedItem = updatedCart.items?.find(
      (cartItem) => String(cartItem.key) === String(key),
    );
    _hubPaintQtyPreview(itemEl, updatedItem, updatedCart);

    const renderPromise = window.hubCartRender(getDrawer(), {
      cart: updatedCart,
    });
    renderPromise.catch((err) =>
      console.error("Cart render after quantity update failed:", err),
    );
    document.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: { cart: updatedCart, skipItemRerender: true },
      }),
    );

    if (btn?.isConnected) {
      btn.classList.remove("loading");
      btn.innerHTML = ICONS[btn.dataset.type];
      _hubEnableQtySiblings(btn, qty);
    }
  } catch (err) {
    console.error("Qty update error:", err);
    if (qtyInput) qtyInput.value = previousQty;
    _hubPaintQtyPreview(itemEl, previousItem, previousCart);
    const minusBtn = itemEl?.querySelector(".hub-qty-btn.minus");
    if (minusBtn) minusBtn.disabled = previousQty <= 1;

    if (err.status === 422 && qty > previousQty) {
      const itemOptions = window.cartPlusGetItemOptions?.() || {};
      if (itemOptions.showQuantityError === true && itemEl) {
        const message = document.createElement("div");
        message.className = "hub-qty-error";
        message.setAttribute("role", "alert");
        message.setAttribute("aria-live", "polite");
        message.style.cssText =
          "color:#d72c0d;font-size:12px;line-height:1.4;margin-top:6px;";
        message.textContent =
          itemOptions.quantityErrorMessage ||
          "Sorry, the available quantity for this product has been reached.";
        itemEl.appendChild(message);
      }
    }

    if (btn) {
      btn.classList.remove("loading");
      btn.innerHTML = ICONS[btn.dataset.type];
      _hubEnableQtySiblings(btn, previousQty);
    }
  }
}

const _hubPendingRemovals = {};
const UNDO_DURATION_MS = 4000;

function _hubRemovalFooterChange(key, itemEl) {
  const item = window._hubLastRenderedCart?.items?.find(
    (cartItem) => String(cartItem.key) === String(key),
  );
  const isAddon = !!(
    item?.properties?._hub_addon || item?.properties?.__upcartAddon
  );
  const compareAt = isAddon
    ? 0
    : window._hubCompareCache?.[`${item?.handle}_${item?.variant_id}`] || 0;
  const unitMrp = Math.max(compareAt, Number(item?.original_price) || 0);
  const itemSubtotal =
    Number(item?.final_line_price) || Number(itemEl.dataset.linePrice) || 0;
  const cartSubtotal = Number(window._hubLastRenderedCart?.items_subtotal_price);
  const cartTotal = Number(window._hubLastRenderedCart?.total_price);
  const linePrice =
    cartSubtotal > 0 && Number.isFinite(cartTotal)
      ? Math.round((itemSubtotal / cartSubtotal) * cartTotal)
      : itemSubtotal;

  return {
    linePrice,
    lineMrp: item
      ? unitMrp * (Number(item.quantity) || 0)
      : Number(itemEl.dataset.linePrice) || 0,
  };
}

function _hubAdjustRemovalFooter(removal, direction) {
  if (!removal?.footerChange) return;

  const blockId = window.HUB_CART_BLOCK_ID;
  const change = removal.footerChange;
  const summary = window._cartPlusSummaryData;
  const currentTotal =
    Number(window._hubCartFinalTotal ?? summary?.finalTotal) || 0;
  const nextTotal = Math.max(0, currentTotal + direction * change.linePrice);
  const shippingPrice =
    Number(summary?.shippingPrice ?? window._hubShippingPriceCents) || 0;
  const grandTotal = nextTotal + shippingPrice;

  window._hubCartFinalTotal = nextTotal;

  const totalEl = document.getElementById(`hub-cart-total-${blockId}`);
  if (totalEl) totalEl.textContent = hubUtils.formatMoney(nextTotal);

  const grandEl = document.getElementById(`hub-grand-total-${blockId}`);
  if (grandEl) grandEl.textContent = hubUtils.formatMoney(grandTotal);

  const checkoutBtn = document.getElementById(
    `hub-checkout-btn-${blockId}`,
  );
  if (checkoutBtn) {
    const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
    checkoutBtn.textContent = hubUtils.getCheckoutButtonText(
      cartSettings,
      hubUtils.formatMoney(nextTotal),
    );
  }

  if (summary) {
    summary.finalTotal = nextTotal;
    summary.grandTotal = grandTotal;
    summary.mrpTotal = Math.max(
      0,
      (Number(summary.mrpTotal) || 0) + direction * change.lineMrp,
    );
    window.cartPlusRenderSummary?.(blockId, summary);
  }
}

function _hubAnimateCartItemRemoval(itemEl) {
  if (!itemEl?.isConnected) return Promise.resolve();

  itemEl.style.maxHeight = `${itemEl.offsetHeight}px`;
  itemEl.style.overflow = "hidden";
  void itemEl.offsetHeight;
  itemEl.classList.add("hub-cart-item-removing");

  return new Promise((resolve) => {
    let timeout;
    const finish = (event) => {
      if (event && event.target !== itemEl) return;
      clearTimeout(timeout);
      itemEl.removeEventListener("animationend", finish);
      resolve();
    };

    itemEl.addEventListener("animationend", finish);
    timeout = window.setTimeout(finish, 260);
  });
}

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

  const removedQty = Number(el.querySelector(".hub-qty-input")?.value || 1);
  const badgeText = document.querySelector(
    ".cart-plus-sticky-cart-quantity-icon-text",
  );
  const badgeWrapper = document.querySelector(
    ".cart-plus-sticky-cart-quantity-icon",
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

  // "Cart • N" in the drawer header changes the moment Remove is clicked (not after the undo window).
  // Undo / the next render put the real count back.
  {
    const headerEl = document.querySelector(
      ".upcart-header-text, .cart-plus-header-text",
    );
    if (headerEl) {
      const hs = window.__HUB_ACTIVE_CART__?.headerSettings || {};
      const remaining = Array.from(
        drawer.querySelectorAll("[data-item-key]"),
      ).reduce((total, row) => {
        const rowKey = row.getAttribute("data-item-key");
        if (String(rowKey) === String(key) || _hubPendingRemovals[rowKey])
          return total;
        if (row.getAttribute("data-is-reward") === "1") return total;
        return total + Number(row.querySelector(".hub-qty-input")?.value || 0);
      }, 0);
      headerEl.innerText = (hs.titleText || "Cart • {{cart_quantity}}").replace(
        "{{cart_quantity}}",
        Math.max(0, remaining),
      );
    }
  }

  // ── Direct: no toast or button animation ─────────────────────────────────
  if (deleteBehavior === "direct") {
    const deleteBtn = el.querySelector(".hub-delete-btn");
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }

    _hubPendingRemovals[key] = {
      toastEl: null,
      itemEl: el,
      removedQty,
      timer: null,
      isDirect: true,
      footerChange: _hubRemovalFooterChange(key, el),
    };

    _hubAdjustRemovalFooter(_hubPendingRemovals[key], -1);
    await _commitRemoval(key);
    return;
  }

  // ── Undo toast ──────────────────────────────────────────────────────────
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
    removedQty,
    footerChange: _hubRemovalFooterChange(key, el),
    timer: setTimeout(() => _commitRemoval(key), UNDO_DURATION_MS),
  };
  _hubAdjustRemovalFooter(_hubPendingRemovals[key], -1);
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
    window._hubRenderGen = (window._hubRenderGen || 0) + 1;
    window._hubPendingRender = null;
    if (window.cartPlusSetEmptyHeaderVisibility) {
      window.cartPlusSetEmptyHeaderVisibility(drawer, true);
    } else {
      drawer.classList.add("hub-cart-is-empty");
    }

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

    Object.keys(_hubPendingRemovals).forEach((otherKey) => {
      const otherP = _hubPendingRemovals[otherKey];
      if (otherP.timer) clearTimeout(otherP.timer);
      otherP.toastEl?.remove();
      updates[otherKey] = 0;
      delete _hubPendingRemovals[otherKey];
    });
  }

  window._hubRemovalCommitCount = (window._hubRemovalCommitCount || 0) + 1;
  window._hubCommitingRemoval = true;
  try {
    const networkDone = fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (cartWillBeEmpty) {
      if (p.toastEl) p.toastEl.remove();

      p.itemEl?.remove();

      _hubHideAllCartSections(blockId);
      window.cartPlusSetBodyUpsellVisibility?.(blockId, true);
      const rewardsSettings = window.__HUB_ACTIVE_CART__?.rewardsSettings;
      if (rewardsSettings) {
        hubUtils.renderRewardsBar(
          blockId,
          { items: [], item_count: 0, total_price: 0 },
          rewardsSettings,
        );
      }

      const cartBody =
        drawer.querySelector(".hub-cart-items-CartPreview") ||
        document.getElementById("hub-upcart-cart-body");
      if (cartBody) {
        cartBody.style.transition = "";
        cartBody.style.opacity = "";
        cartBody.style.pointerEvents = "";
      }

      window.cartPlusHideOneTick?.(blockId);

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
        const body = cartItemsEl.closest(".hub-cart-items-CartPreview");
        body?.classList.add("hub-cart-empty-layout");
        if (cartItemsEl.parentElement && cartItemsEl.parentElement !== body) {
          cartItemsEl.parentElement.classList.add("hub-cart-empty-section");
        }
      }
      if (container) {
        container.innerHTML = window.cartPlusEmptyCartHTML
          ? container.querySelector(".cart-plus-empty-cart")?.outerHTML || window.cartPlusEmptyCartHTML(blockId)
          : `<div class="hub-cart-empty"><h3 class="hub-empty-title">${cs.emptyCartMessage || "Your cart is empty"}</h3></div>`;
        window.cartPlusRenderEmptyUpsell?.(blockId);
      }

      const headerEl = document.querySelector(".upcart-header-text");
      if (headerEl) {
        const hs = window.__HUB_ACTIVE_CART__?.headerSettings || {};
        headerEl.innerText = (
          hs.titleText || "Cart • {{cart_quantity}}"
        ).replace("{{cart_quantity}}", 0);
      }
      window._hubLastCartHadItems = false;

      try {
        await networkDone;
        window._hubRenderInProgress = false;
        window._hubRewardUpdating = false;
        window._hubPendingRender = null;
        await window.hubCartRender(drawer);
      } catch (error) {
        console.error(
          "[CartPlus] Failed to refresh the empty cart after removal:",
          error,
        );
      } finally {
        _hubRestoreAllCartSections(blockId);
      }
      return;
    }

    // Hide the undo toast, then animate the item out.
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

      await _hubAnimateCartItemRemoval(el);
      el.remove();
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
      await window.hubCartRender(drawer, {
        awaitOneTick: true,
        preserveCartItemNodes: true,
      });
    } else {
      await window.cartPlusOneTickQuickRefresh?.();
    }
  } finally {
    window._hubRemovalCommitCount = Math.max(
      0,
      (window._hubRemovalCommitCount || 1) - 1,
    );
    window._hubCommitingRemoval = window._hubRemovalCommitCount > 0;
    window._hubRenderInProgress = false;
    window._hubRewardUpdating = false;
  }
}

function _undoRemoval(key) {
  const p = _hubPendingRemovals[key];
  if (!p) return;

  clearTimeout(p.timer);
  _hubAdjustRemovalFooter(p, 1);
  const drawer = getDrawer();
  if (window.cartPlusSetEmptyHeaderVisibility) {
    window.cartPlusSetEmptyHeaderVisibility(drawer, false);
  } else {
    drawer.classList.remove("hub-cart-is-empty");
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

window.hubShowCouponSuccess = function (
  blockId,
  { code = "", headline = "Coupon applied!", desc = "" } = {},
) {
  const overlay = document.getElementById(`hub-coupon-success-${blockId}`);
  if (!overlay) return;

  const appliedEl = document.getElementById(
    `hub-coupon-success-applied-${blockId}`,
  );
  const headlineEl = document.getElementById(
    `hub-coupon-success-headline-${blockId}`,
  );
  const descEl = document.getElementById(`hub-coupon-success-desc-${blockId}`);

  if (appliedEl) appliedEl.textContent = code ? `Code "${code}" applied` : "";
  if (headlineEl) headlineEl.textContent = headline;
  if (descEl) descEl.textContent = desc;

  overlay.style.display = "flex";
};

window.hubCloseCouponSuccess = function (blockId) {
  const overlay = document.getElementById(`hub-coupon-success-${blockId}`);
  if (overlay) overlay.style.display = "none";
};

window.applyDiscountCode = async function (btn) {
  const wrapper = btn.closest(".hub-discount-input-row-items");

  const input = wrapper?.querySelector(".hub-discount-input");
  const message = wrapper?.querySelector(".hub-discount-message");

  const code = input.value.trim();

  if (!code) {
    // same error style (colour/size) as the editor's "Error message" settings
    // text comes from the saved cart settings (editor: Error message > Empty code message)
    const emptyMsg =
      window.__HUB_ACTIVE_CART__?.discountCodesSettings?.emptyCodeMessage ??
      "Please enter a discount code";
    if (window.cartPlusShowDiscountError)
      window.cartPlusShowDiscountError(message, emptyMsg);
    else showMessage(message, emptyMsg, "red");
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

    const hasCodeDiscount = cart.discount_codes?.some(
      (d) =>
        d.code?.toLowerCase() === code.toLowerCase() &&
        d.applicable === true,
    );

    hasRealDiscount = hasCodeDiscount;

    if (!hasRealDiscount) {
      await fetch(`/discount/INVALID_REMOVE`, {
        credentials: "include",
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    await window.hubCartRender(getDrawer());

    const newMessage = document.getElementById("discount-message");

    if (hasRealDiscount) {
      if (newMessage) newMessage.textContent = "";
      const offersMessage = document.getElementById(
        `hub-offers-msg-${window.HUB_CART_BLOCK_ID}`,
      );
      if (offersMessage) offersMessage.textContent = "";
      showMessage(newMessage, "Discount applied successfully", "green");

      localStorage.setItem("appliedDiscount", code);
      const blockId = window.HUB_CART_BLOCK_ID;
      window.hubShowCouponSuccess(blockId, {
        code,
        headline: "You saved on your order!",
        desc: "Your discount has been applied to the cart total.",
      });
    } else {
      window.cartPlusShowDiscountError?.(newMessage);
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

  // Age verification (editor: Footer > Age Verification) must be ticked first
  if (window.cartPlusAgeAllowsCheckout && !window.cartPlusAgeAllowsCheckout(blockId)) return;

  btn.classList.add("loading");
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="loader"></span>`;
  btn.style.pointerEvents = "none";

  const url = btn.getAttribute("href");


  fetch(
    `${window.__HUB_API_URL__ || "https://textapp.cartplus.io"}/api/track-event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":
          "8f4c2a91d7e3b6f5a8c1d9e2f7b4c6a9e1d3f8b5c2a7d4e9f6b1c8a3d7e5f2",
      },
      body: JSON.stringify({
        shop:
          window.__SHOPIFY_SHOP__?.myshopify_domain ||
          window.__SHOPIFY_SHOP__?.permanent_domain ||
          window.__SHOPIFY_SHOP__?.domain,
        cartId: window.__HUB_ACTIVE_CART__?.cartId || null,
        sessionId: window._hubGetSessionId?.() || "",
        eventType: "checkout_initiated",
        userAgent: navigator.userAgent,
      }),
    },
  ).catch(() => {});

  setTimeout(() => {
    window.location.href = url;
  },100);
};

if (!window._hubCheckoutPageShowBound) {
  window._hubCheckoutPageShowBound = true;
  window.addEventListener("pageshow", () => {
    document
      .querySelectorAll(".hub-cart-checkout-btn.loading")
      .forEach((btn) => {
        if (btn.dataset.original !== undefined) {
          btn.innerHTML = btn.dataset.original;
          delete btn.dataset.original;
        }
        btn.classList.remove("loading");
        btn.style.pointerEvents = "";
        btn.removeAttribute("aria-busy");
      });
  });
}

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
        saveBadgeEl.textContent = window.cartPlusSaveText(savingsText, hubUtils.formatMoney(totalSave));
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
      window.cartPlusSummaryFromCart?.(blockId, cart);

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

      const checkoutBtn = document.getElementById(
        `hub-checkout-btn-${blockId}`,
      );
      if (checkoutBtn) {
        const cs = window.__HUB_ACTIVE_CART__?.cartSettings || {};
        const goToCartPageOnCheckout =
          cs.goToCartPageOnCheckout === true ||
          cs.goToCartPageOnCheckout === "true";

        const rawText = goToCartPageOnCheckout
          ? cs.viewCartName || "View cart"
          : cs.checkoutButtonText || "Proceed to checkout";

        checkoutBtn.textContent = goToCartPageOnCheckout
          ? rawText
          : rawText.replace("{{total_price}}", newTotalFmt);
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
