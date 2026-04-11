function getFontWeight(weight) {
  const map = {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };
  return map[weight] || weight || 400;
}

function getHeadingSize(tag) {
  const map = {
    h1: "30px",
    h2: "24px",
    h3: "20px",
    h4: "16px",
    h5: "12px",
    h6: "10px",
  };
  return map[tag] || "1.25rem";
}

function getIconSize(size) {
  const map = { small: 14, medium: 18, large: 22, xlarge: 26 };
  return map[size] || 20;
}

function getBorderWidth(border) {
  const map = { none: "0px", thin: "1px", normal: "2px", thick: "3px" };
  return map[border] || "0px";
}

window.injectCartHTML = function (blockId, root) {
  if (!blockId) return;

  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const headerSettings = window.__HUB_ACTIVE_CART__?.headerSettings || {};

  const cartCount =
    window.__HUB_ACTIVE_CART__?.cart?.item_count ??
    window.__HUB_CART_COUNT__ ??
    0;
  // ── Derived header values ──────────────────────────────────────────────────
  const headerPadding =
    headerSettings.height === "slim" ? "16px 30px" : "30px 30px";
  const iconSizePx = getIconSize(headerSettings.iconSize);
  const iconStrokeWidth = headerSettings.iconThickNess === "thick" ? 3 : 2;
  const titleDisplayText = (
    headerSettings.titleText || "Cart • {{cart_quantity}}"
  ).replace("{{cart_quantity}}", cartCount);

  // CSS custom-property string for the close button
  const closeBtnVars = [
    `--icon-color:${headerSettings.iconColor}`,
    `--icon-bg:${headerSettings.iconBgColor}`,
    `--icon-hover-bg:${headerSettings.iconbgHoverColor}`,
    `--icon-hover-color:${headerSettings.iconHoverColor}`,
    `--icon-border-hover:${headerSettings.borderHoverColor}`,
    `--border-color:${headerSettings.iconBorderColor}`,
    `--border-width:${getBorderWidth(headerSettings.iconBorder)}`,
  ].join(";");

  // Close button HTML (reusable)
  const closeButtonHTML = `
    <button
      id="hub-close-${blockId}"
      class="hub-cart-close cart-app__close custom-close-btn upcart-header-close-button"
      aria-label="Close cart"
      style="flex-shrink:0;${closeBtnVars};"
    >
      <svg
        class="upcart-header-close-button-icon"
        width="${iconSizePx}" height="${iconSizePx}"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="${iconStrokeWidth}"
        stroke-linecap="round" stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>`;

  // Title / logo HTML
  function buildTitleHTML() {
    const titleType = headerSettings.titleType;
    const alignment = headerSettings.alignment;
    const closePos = headerSettings.closePosition;

    const textAlign =
      alignment === "center"
        ? "center"
        : closePos === "left"
          ? "right"
          : "left";

    const wrapperStyle = `flex:1;text-align:${textAlign};`;

    if (titleType === "logo") {
      const fallback =
        "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/upcart_header_logo_1775234624267.png";
      const src =
        headerSettings.logo && headerSettings.logo !== ""
          ? headerSettings.logo
          : fallback;
      const marginStyle =
        alignment === "center"
          ? "margin:0 auto;"
          : closePos === "left"
            ? "margin:0 0 0 auto;"
            : "margin:0;";
      return `
        <div style="${wrapperStyle}">
          <img
            class="upcart-header-logo"
            src="${src}"
            alt="Logo"
            style="max-width:${headerSettings.logoSize || 120}px;display:block;${marginStyle}"
            onerror="this.src='${fallback}'"
          />
        </div>`;
    }

    if (titleType === "custom") {
      return `
        <div style="${wrapperStyle}">
          <span
            class="cart-app__title upcart-header-text"
            style="color:${headerSettings.textColor};font-weight:${getFontWeight(headerSettings.fontWeight)};font-size:${headerSettings.fontSize}px;display:block;margin:0;"
          >${titleDisplayText}</span>
        </div>`;
    }

    // "inherit" (or any other value) → heading tag
    const HeadingTag = headerSettings.heading || "h3";
    return `
      <div style="${wrapperStyle}">
        <${HeadingTag}
          class="cart-app__title upcart-header-text"
          style="margin:0;color:${headerSettings.textColor};font-weight:${getFontWeight(headerSettings.fontWeight)};font-size:${getHeadingSize(headerSettings.heading)};"
        >${titleDisplayText}</${HeadingTag}>
      </div>`;
  }

  // Assemble header inner row (close button position-aware)
  const closePos = headerSettings.closePosition;
  const headerInner =
    closePos === "left"
      ? `${closeButtonHTML}${buildTitleHTML()}`
      : `${buildTitleHTML()}${closeButtonHTML}`;

  // ── Rest of cart settings ─────────────────────────────────────────────────
  function renderCustomHTML(content) {
    return content || "";
  }

  const positionMap = {
    slide_from_left: "hub-cart-left",
    slide_from_right: "hub-cart-right",
  };

  const positionClass =
    positionMap[cartSettings.cartPosition] || "hub-cart-right";
  const disableFixedFooter = cartSettings.disableFixedFooter || false;
  const goToCartPageOnCheckout = cartSettings.goToCartPageOnCheckout || false;
  const customHtmlBlocks = cartSettings.customHtmlBlocks || {};

  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg"></div>

    <div id="hub-cart-drawer-${blockId}" class="hub-cart-drawer ${positionClass}">

      <!-- HEADER -->
      <div
        class="cart-app__header-top upcart-header hub-cart-header"
        style="padding:${headerPadding};background:${headerSettings.backgroundColor};"
      >
        <div
          class="cart-app__row-between"
          style="display:flex;align-items:center;justify-content:space-between;"
        >
          ${headerInner}
        </div>
      </div>
     ${
       headerSettings.border === "thin"
         ? `<div class="cart-app__divider"><p style="display:none;">&nbsp;</p></div>`
         : ""
     }
      <!-- header (position: below_header) -->
      <div>${renderCustomHTML(customHtmlBlocks.below_header)}</div>

      <!-- ANNOUNCEMENT (position: before) -->
      <div>${renderCustomHTML(customHtmlBlocks.above_announcements)}</div>
      <div id="hub-announcement-${blockId}" class="hub-announcement" style="display:none;"></div>

      <!-- TRUST BADGES (position: top of cart) -->
      <div id="hub-trust-badges-top-${blockId}" class="hub-trust-badges" style="display:none;"></div>

      <!-- UPSELLS (position: top of cart) -->
      <div id="hub-upsell-top-${blockId}" class="hub-upsell"></div>

      <!-- REWARDS -->
      <div id="hub-rewards-${blockId}" style="display:none;flex-shrink:0;"></div>

      <!-- ITEMS (scrollable) -->
      <div id="hub-upcart-cart-body" class="hub-cart-items-CartPreview">
        <div id="hub-cart-items-${blockId}" class="hub-cart-items ${disableFixedFooter ? "no-fixed-footer" : ""}">
          <!-- skeleton shown while cart data loads -->
          <div id="hub-skeleton-${blockId}" style="display:none;">
            <div class="hub-skeleton-lines">
              <div class="hub-skeleton hub-skeleton-line" style="width:65%;">&nbsp;</div>
              <div class="hub-skeleton hub-skeleton-line" style="width:100%;height:4px;">&nbsp;</div>
            </div>
            <div class="hub-skeleton-item">
              <div class="hub-skeleton hub-skeleton-img">&nbsp;</div>
              <div class="hub-skeleton-info">
                <div class="hub-skeleton hub-skeleton-line" style="width:90%;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:55%;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:45%;">&nbsp;</div>
                <div class="hub-skeleton hub-skeleton-line" style="width:60%;height:28px;border-radius:4px;margin-top:4px;">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>

        <div>${renderCustomHTML(customHtmlBlocks.above_footer)}</div>

        <!-- NOTES (position: before) -->
        <div id="hub-notes-below-${blockId}"></div>

        <!-- ANNOUNCEMENT (position: after) -->
        <div id="hub-announcement-after-${blockId}" class="hub-announcement" style="display:none;"></div>

        <!-- UPSELLS (position: bottom of cart) -->
        <div id="hub-upsell-bottom-${blockId}" class="hub-upsell"></div>
      </div>

      <!-- FOOTER (fixed bottom) -->
      <div id="hub-footer-rec-${blockId}"></div>

      <div class="hub-cart-footer">

        <!-- TRUST BADGES (position: top of footer) -->
        <div id="hub-trust-badges-bottom-${blockId}" class="hub-trust-badges" style="display:none;"></div>

        <!-- ADD-ONS -->
        <div id="hub-addons-${blockId}" class="hub-addons" style="display:none;"></div>

        <!-- NOTES (position: top of footer) -->
        <div id="hub-notes-footer-${blockId}"></div>

        <!-- DISCOUNT -->
        <div id="hub-discount-status-${blockId}"></div>
        <div class="hub-discount-input-row" id="hub-discount-row-${blockId}">
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

        <div id="hub-express-payments-${blockId}" class="hub-express-payments"></div>
       
        <!-- CHECKOUT -->
        <div>${renderCustomHTML(customHtmlBlocks.above_checkout)}</div>
        <a href="${goToCartPageOnCheckout ? "/cart" : "/checkout"}" class="hub-cart-checkout-btn">
          Check out
        </a>
        <div>${renderCustomHTML(customHtmlBlocks.below_checkout)}</div>
        <a id="hub-continue-shopping-${blockId}" href="#" class="hub-continue-shopping"
           onclick="(function(e){e.preventDefault();document.getElementById('hub-close-${blockId}').click();})(event)">
          Or continue shopping
        </a>
      </div>

      <div>${renderCustomHTML(customHtmlBlocks.bottom_of_cart)}</div>
    </div>
    `,
  );
};
