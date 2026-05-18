function getDrawer() {
  const blockId = window.HUB_CART_BLOCK_ID;
  return document.getElementById(`hub-cart-drawer-${blockId}`) || document;
}

const ICONS = {
  plus: `<span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-plus" viewBox="0 0 10 10"><path fill="currentColor" fill-rule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clip-rule="evenodd"></path></svg></span>`,
  minus: `<span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-minus" viewBox="0 0 10 2"><path fill="currentColor" fill-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clip-rule="evenodd"></path></svg></span>`,
};

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
  const drawer = getDrawer();
  const el = drawer.querySelector(`[data-item-key="${key}"]`);
  if (!el) return;

  if (_hubPendingRemovals[key]) {
    clearTimeout(_hubPendingRemovals[key].timer);
    _hubPendingRemovals[key].toastEl?.remove();
  }

  const inner = el.querySelector(".hub-cart-item");
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
    timer: setTimeout(() => _commitRemoval(key), UNDO_DURATION_MS),
  };
}

async function _commitRemoval(key) {
  const p = _hubPendingRemovals[key];
  if (!p) return;

  delete _hubPendingRemovals[key];

  // Step 1: remove from cart
  await fetch("/cart/change.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: key, quantity: 0 }),
  });

  // Step 2: close the toast
  if (p.toastEl) {
    p.toastEl.classList.add("hub-toast-hiding");
    await new Promise((r) => setTimeout(r, 220));
    p.toastEl.remove();
  }

  // Step 3: slide item row out to the left
  const el = p.itemEl;
  if (el) {
    el.style.overflow = "hidden";
    el.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    el.style.transform = "translateX(-100%)";
    el.style.opacity = "0";
    await new Promise((r) => setTimeout(r, 300));

    // Collapse height so the list closes up
    el.style.transition =
      "height 0.2s ease, margin 0.2s ease, padding 0.2s ease";
    el.style.height = el.offsetHeight + "px";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.height = "0";
        el.style.marginTop = "0";
        el.style.marginBottom = "0";
        el.style.paddingTop = "0";
        el.style.paddingBottom = "0";
      }),
    );
    await new Promise((r) => setTimeout(r, 220));
  }

  if (Object.keys(_hubPendingRemovals).length === 0) {
    // Remove any triggered gift items that no longer qualify,
    // so they disappear in the same render as the removed triggering item.
    try {
      if (typeof handleTriggeredRewards === "function") {
        const cartRes = await fetch("/cart.js");
        const latestCart = await cartRes.json();
        await handleTriggeredRewards(latestCart);
      }
    } catch (e) {
      // silent — cart:updated will still re-render correctly
    }
    document.dispatchEvent(new CustomEvent("cart:updated"));
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
  btn.innerHTML = `<span class="loader"></span>`;
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
    `${window.__HUB_API_URL__ || "http://localhost:9002"}/api/track-event`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
