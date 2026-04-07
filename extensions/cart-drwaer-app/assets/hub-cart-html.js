window.injectCartHTML = function (blockId, root) {
  if (!blockId) return;
  if (document.getElementById(`hub-cart-drawer-${blockId}`)) return;

  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg"></div>

    <div id="hub-cart-drawer-${blockId}" class="hub-cart-drawer">

      <!-- HEADER -->
      <div class="hub-cart-header">
        <span class="hub-cart-title">Your cart</span>
        <button id="hub-close-${blockId}" class="hub-cart-close" aria-label="Close cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- COLUMN HEADERS -->
      <div class="hub-cart-col-headers">
        <span>PRODUCT</span>
        <span>TOTAL</span>
      </div>

      <!-- ANNOUNCEMENT (position: before) -->
      <div id="hub-announcement-${blockId}" class="hub-announcement" style="display:none;"></div>

      <!-- REWARDS -->
      <div id="hub-rewards-${blockId}" style="display:none;flex-shrink:0;"></div>

      <!-- ITEMS (scrollable) -->
      <div class="hub-cart-items"></div>

      <!-- ANNOUNCEMENT (position: after) -->
      <div id="hub-announcement-after-${blockId}" class="hub-announcement" style="display:none;"></div>

      <!-- FOOTER (fixed bottom) -->
      <div class="hub-cart-footer">

        <!-- DISCOUNT -->
        <div id="hub-discount-status-${blockId}"></div>
        <div class="hub-discount-input-row">
          <input type="text" id="discount-code-input" placeholder="Discount code" class="hub-discount-input" />
          <button onclick="applyDiscountCode()" class="hub-discount-apply-btn">Apply</button>
        </div>
        <p id="discount-message" class="hub-discount-message"></p>

        <!-- TOTAL -->
        <div class="hub-cart-total-row">
          <span class="hub-cart-total-label">Estimated total</span>
          <span class="hub-cart-total-price" id="hub-cart-total-${blockId}"></span>
        </div>
        <p class="hub-cart-tax-note">Taxes, discounts and shipping calculated at checkout.</p>

        <!-- CHECKOUT -->
        <a href="/checkout" class="hub-cart-checkout-btn">Check out</a>
      </div>

    </div>
    `
  );
};
