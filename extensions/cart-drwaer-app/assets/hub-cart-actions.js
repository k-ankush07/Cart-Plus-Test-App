window.updateQty = async function (key, qty) {
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

  const drawer = document.querySelector("#hub-cart-drawer");
  window.hubCartRender(drawer || document);

  window.updateCartCount();
};

window.removeItem = async function (key) {
  await fetch("/cart/change.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: key,
      quantity: 0,
    }),
  });

  const drawer = document.querySelector("#hub-cart-drawer");
  window.hubCartRender(drawer || document);

  window.updateCartCount();
};

window.handleQtyInput = function (key, value) {
  let qty = value.replace(/\D/g, "");
  qty = parseInt(qty);

  if (isNaN(qty) || qty < 1) {
    qty = 1;
  }

  updateQty(key, qty);
};

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

    const hasRealDiscount = cart.items.some(
      (item) => item.line_level_discount_allocations?.length > 0
    );

    if (!hasRealDiscount) {
      await fetch(`/discount/INVALID_REMOVE`, {
        credentials: "include",
      });

      await new Promise(r => setTimeout(r, 300));
    }

    const drawer = document.querySelector("#hub-cart-drawer");
    await window.hubCartRender(drawer || document);

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

    localStorage.removeItem("applied_discount_code");

    const drawer = document.querySelector("#hub-cart-drawer");
    await window.hubCartRender(drawer || document);

    const newMessage = document.getElementById("discount-message");
    showMessage(newMessage, "Discount removed", "green");
  } catch (err) {
    showMessage(message, "Failed to remove discount", "red");
  }
};
