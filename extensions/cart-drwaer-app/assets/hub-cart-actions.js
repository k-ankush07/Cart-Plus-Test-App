function getDrawer() {
  const blockId = window.HUB_CART_BLOCK_ID;
  return document.getElementById(`hub-cart-drawer-${blockId}`) || document;
}

async function updateQty(key, qty) {
  if (qty < 1) {
    return removeItem(key);
  }

  await fetch("/cart/change.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: key,
      quantity: qty,
    }),
  });
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
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = "0%";
    }));
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

  p.toastEl?.classList.add("hub-toast-hiding");
  setTimeout(() => p.toastEl?.remove(), 220);
  delete _hubPendingRemovals[key];

  await fetch("/cart/change.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: key, quantity: 0 }),
  });

  if (Object.keys(_hubPendingRemovals).length === 0) {
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

window.applyDiscountCode = async function () {
  const input = document.getElementById("discount-code-input");
  const message = document.getElementById("discount-message");

  const code = input.value.trim();

  if (!code) {
    showMessage(message, "Please enter a discount code", "red");
    return;
  }

  try {
    await fetch(`/discount/${code}`, {
      method: "GET",
      credentials: "include",
    });

    await new Promise(r => setTimeout(r, 500));

    const res = await fetch("/cart.js");
    const cart = await res.json();

    // Check both line-level and cart-level discounts
    const hasLineDiscount = cart.items.some(
      (item) => item.line_level_discount_allocations?.length > 0
    );
    const hasCartDiscount = cart.cart_level_discount_applications?.length > 0;
    const hasCodeDiscount = cart.discount_codes?.some(
      (d) => d.code.toLowerCase() === code.toLowerCase() && d.applicable
    );

    const hasRealDiscount = hasLineDiscount || hasCartDiscount || hasCodeDiscount;

    if (!hasRealDiscount) {
      await fetch(`/discount/INVALID_REMOVE`, {
        credentials: "include",
      });

      await new Promise(r => setTimeout(r, 300));
    }

    await window.hubCartRender(getDrawer());

    const newMessage = document.getElementById("discount-message");

    if (hasRealDiscount) {
      showMessage(newMessage, "Discount applied successfully", "green");
    } else {
      showMessage(newMessage, "Enter a valid discount code", "red");
    }

  } catch (err) {
    showMessage(message, "Something went wrong", "red");
  }
};

window.removeDiscountCode = async function () {
  const message = document.getElementById("discount-message");

  try {
    await fetch("/cart/update.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        discount: "",
      }),
    });

    await window.hubCartRender(getDrawer());

    const newMessage = document.getElementById("discount-message");
    showMessage(newMessage, "Discount removed", "green");
  } catch (err) {
    showMessage(message, "Failed to remove discount", "red");
  }
};
