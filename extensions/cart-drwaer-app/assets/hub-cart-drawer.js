(function () {
  let isEventBound = false;

  function initCart() {
    const blockId = window.HUB_CART_BLOCK_ID;
    if (!blockId) return;

    document
      .querySelectorAll(
        `
      cart-drawer,
      #CartDrawer,
      .cart-drawer,
      ajax-cart,
      cart-notification
    `,
      )
      .forEach((el) => el.remove());

    let root =
      document.getElementById(`cart-drawer-App-${blockId}`) || document.body;

    if (!window.injectCartHTML) {
      console.error("injectCartHTML NOT FOUND");
      return;
    }

    window.injectCartHTML(blockId, root);

    const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
    const bg = document.getElementById(`hub-cart-bg-${blockId}`);

    if (!drawer || !bg) {
      console.error("Drawer not found");
      return;
    }

    window.updateCartCount = async function () {
      try {
        const res = await fetch("/cart.js");
        const cart = await res.json();

        const cartIcon = document.getElementById("cart-icon-bubble");
        if (!cartIcon) return;

        let bubble = cartIcon.querySelector(".cart-count-bubble");

        if (!bubble) {
          bubble = document.createElement("div");
          bubble.className = "cart-count-bubble";
          cartIcon.appendChild(bubble);
        }

        bubble.innerHTML = `
      <span aria-hidden="true">${cart.item_count}</span>
      <span class="visually-hidden">${cart.item_count} items</span>
    `;
      } catch (err) {
        console.error(err);
      }
    };

    function openDrawer() {
      drawer.classList.add(`hub-visible-${blockId}`);
      bg.classList.add(`hub-visible-${blockId}`);

      document.body.classList.add("no-scroll", "overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");

      document.body.style.overflow = "hidden";

      if (window.hubCartRender) {
        window.hubCartRender(drawer);
      }

      updateCartCount();
    }

    function closeDrawer() {
      drawer.classList.remove(`hub-visible-${blockId}`);
      bg.classList.remove(`hub-visible-${blockId}`);

      document.body.classList.remove("no-scroll", "overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      setTimeout(() => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }, 50);
    }

    if (!isEventBound) {
      isEventBound = true;

      document.addEventListener(
        "click",
        function (e) {
          const cartLink = e.target.closest(
            "#cart-icon-bubble, .header__icon--cart, .cart-icon, [data-cart]",
          );

          if (cartLink) {
            e.preventDefault();
            openDrawer();
            return;
          }

          const closeBtn = e.target.closest(`#hub-close-${blockId}`);
          const bgClick = e.target.closest(`#hub-cart-bg-${blockId}`);

          if (closeBtn || bgClick) {
            closeDrawer();
            return;
          }
        },
        true,
      );

      document.addEventListener("submit", function (e) {
        const form = e.target.closest('form[action="/cart/add"]');
        if (!form) return;

        let previousCount = 0;

        fetch("/cart.js")
          .then((res) => res.json())
          .then((cart) => {
            previousCount = cart.item_count;

            const interval = setInterval(async () => {
              const res = await fetch("/cart.js");
              const newCart = await res.json();

              if (newCart.item_count > previousCount) {
                clearInterval(interval);
                openDrawer();
              }
            }, 300);
          });
      });
    }
  }

  window.addEventListener("load", initCart);
})();
