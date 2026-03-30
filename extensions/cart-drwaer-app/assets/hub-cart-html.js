window.injectCartHTML = function (blockId, root) {
  if (!blockId) return;

  if (document.getElementById(`hub-cart-drawer-${blockId}`)) return;

  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg"></div>

    <div id="hub-cart-drawer-${blockId}" class="hub-cart-drawer">
      <div style="padding:20px">
        <h2>My Custom Cart</h2>
        <button id="hub-close-${blockId}">Close</button>

        <div class="hub-cart-items"></div>
      </div>
    </div>
  `
  );
};