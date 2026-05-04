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
  const map = { small: 14, medium: 22, large: 30, xlarge: 36 };
  return map[size] || 20;
}

function getBorderWidth(border) {
  const map = { none: "0px", thin: "1px", normal: "2px", thick: "3px" };
  return map[border] || "0px";
}

window.hubToggleTotalBreakdown = function (el, blockId) {
  var b = document.getElementById("hub-total-breakdown-" + blockId);
  var open = b.classList.toggle("hub-breakdown-open");
  el.querySelector(".hub-total-arrow").style.transform = open
    ? "rotate(180deg)"
    : "rotate(0deg)";
  el.parentElement.classList.toggle("hub-total-summary--open", open);
  document
    .getElementById("hub-cart-drawer-" + blockId)
    .classList.toggle("hub-cart-total-open", open);
};

window.injectCartHTML = function (blockId, root) {
  if (!blockId) return;

  const cartSettings = window.__HUB_ACTIVE_CART__?.cartSettings || {};
  const headerSettings = window.__HUB_ACTIVE_CART__?.headerSettings || {};
  const designSettings = window.__HUB_ACTIVE_CART__?.designSettings || {};

  const cartCount =
    window.__HUB_ACTIVE_CART__?.cart?.item_count ??
    window.__HUB_CART_COUNT__ ??
    0;
  // ── Derived header values ──────────────────────────────────────────────────
  const headerPadding =
    headerSettings.height === "slim" ? "15px 25px" : "30px 30px";
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
    `--border-radius:${designSettings.buttonRadius}px`,
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

    const wrapperStyle = `flex:1;text-align:${textAlign}; line-height:1;`;

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
          style="margin:0;color:${designSettings.textColor};font-weight:${getFontWeight(headerSettings.fontWeight)};font-size:${getHeadingSize(headerSettings.heading)};"
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
  const checkoutButtonText =
    cartSettings.checkoutButtonText || "Proceed to checkout";
  const continueShoppingText =
    cartSettings.continueShoppingText || "Or continue shopping";

  const btnColor = designSettings.buttonColor || "#000000";
  const btnHoverColor = designSettings.buttonHoverColor || "#333333";
  const textColor = designSettings.buttonTextColor || "#000";

  // Inject button color + hover style for this drawer
  const btnStyleId = `hub-btn-style-${blockId}`;
  if (!document.getElementById(btnStyleId)) {
    const bs = document.createElement("style");
    bs.id = btnStyleId;

    bs.textContent = `
      #hub-cart-drawer-${blockId} .hub-cart-checkout-btn {
        background: ${btnColor} !important;
      }
      #hub-cart-drawer-${blockId} .hub-cart-checkout-btn:hover {
        color: ${btnHoverColor} !important;
      }
      #hub-cart-drawer-${blockId} .hub-cart-checkout-btn {
        color: ${textColor} !important;
      }
    `;
    document.head.appendChild(bs);
  }

  // Inject mobile-width style for this drawer
  const mobileStyleId = `hub-mobile-width-${blockId}`;
  if (!document.getElementById(mobileStyleId)) {
    const ms = document.createElement("style");
    ms.id = mobileStyleId;
    const mobileWidth =
      designSettings.mobileWidth === "full" ? "100vw" : "90vw";
    ms.textContent = `
      @media (max-width: 480px) {
        #hub-cart-drawer-${blockId} {
          width: ${mobileWidth} !important;
          max-width: 100vw !important;
        }
      }
    `;
    document.head.appendChild(ms);
  }

  // Inject a style tag once to hide the theme's native cart drawers
  if (!document.getElementById("hub-hide-theme-cart")) {
    const s = document.createElement("style");
    s.id = "hub-hide-theme-cart";
    s.textContent = `
      cart-drawer,
      #CartDrawer,
      .cart-drawer,
      .drawer,
      ajax-cart,
      cart-notification {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(s);
  }

  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg"></div>

    <div id="hub-cart-drawer-${blockId}" class="hub-cart-drawer cart-app upcart-cart 
    ${positionClass} ${designSettings.inheritFonts ? "" : "cart-app--customFont"}"
     style="background-color:${designSettings.backgroundColor || ""};
     width:${designSettings.desktopWidth === "wide" ? "500px" : "440px"};">

      <!-- HEADER -->
      <div
        class="cart-app__header-top upcart-header hub-cart-header"
        style="padding:${headerPadding}; background:${headerSettings.backgroundColor};"
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

      <!-- ITEMS (scrollable) -->
      <div id="hub-upcart-cart-body" class="hub-cart-items-CartPreview">
        <!-- ANNOUNCEMENT (position: before) -->
        <div>${renderCustomHTML(customHtmlBlocks.above_announcements)}</div>
        <div id="hub-announcement-${blockId}" class="hub-announcement" style="display:none;"></div>

        <!-- TRUST BADGES (position: top of cart) -->
        <div id="hub-trust-badges-top-${blockId}" class="hub-trust-badges" style="display:none;"></div>

        <!-- REWARDS -->
        <div id="hub-rewards-${blockId}" style="display:none;flex-shrink:0;"></div>

        <!-- UPSELLS (position: top of cart) -->
        <div id="hub-upsell-top-${blockId}" class="hub-upsell"></div>

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
        <!-- NOTES (position: before) -->
        <div id="hub-notes-below-${blockId}"></div>

        <!-- SUGGESTED PRODUCT -->
        <div id="hub-suggested-product-${blockId}" class="hub-suggested-product" style="display:none;"></div>

        <!-- UPSELLS (position: bottom of cart) -->
        <div id="hub-upsell-bottom-${blockId}" class="hub-upsell"></div>

        <!-- ANNOUNCEMENT (position: after) -->
        <div id="hub-announcement-after-${blockId}" class="hub-announcement" style="display:none;"></div>

        <div>${renderCustomHTML(customHtmlBlocks.above_footer)}</div>
      </div>

      <!-- FOOTER (fixed bottom) -->
      <div id="hub-footer-rec-${blockId}"></div>

      <div class="hub-cart-footer" style="background-color:${designSettings.accentColor || ""};">

        <!-- ADD-ONS -->
        <div id="hub-addons-${blockId}" class="hub-addons" style="display:none;"></div>

        <!-- NOTES (position: top of footer) -->
        <div id="hub-notes-footer-${blockId}"></div>

        <!-- DISCOUNT -->
        
        <div class="hub-discount-input-row-items"id="hub-discount-row-${blockId}">
         <div class="hub-discount-heading">Coupon Code</div>
        <div class="hub-discount-input-row">
        <div id="hub-discount-status-${blockId}" class="hub-discount-status-code"></div>
         <div class="hub-discount-input-btn" id="hub-discount-input-wrap-${blockId}">
           <img 
            src="https://hubsyntax.com/cart-images/Group%20(1).svg" 
            alt="discount-code" 
            class="discount-code-img"
            />
            
          <input type="text" id="discount-code-input-${blockId}" placeholder="Discount code" class="hub-discount-input" />
          <button onclick="applyDiscountCode(this)" class="hub-discount-apply-btn">Apply</button>
          </div>
          <div class="error-discount"> <p id="discount-message" class="hub-discount-message"></p></div>
           <div class="discount-offer-btn" onclick="hubOpenOffersPanel('${blockId}')">
          <button class="hub-view-offers-btn">View all offers</button>
          <img 
            src="https://hubsyntax.com/cart-images/Vector%20(4).svg" 
            alt="discount-code" 
            class="discount-code-img"
            />
          </div>
        </div>
        </div>

        <!-- TOTAL SUMMARY -->
        <div class="hub-total-summary">
          <div class="hub-total-header"
           onclick="hubToggleTotalBreakdown(this, '${blockId}')">
            <div class="hub-total-header-left">
              <span class="hub-total-label">Estimated Total</span>
              <span class="hub-total-arrow">
             <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </span>
            </div>
            <div class="hub-total-header-right">
              <span class="hub-total-original" id="hub-total-original-${blockId}"></span>
              <span class="hub-total-final" id="hub-cart-total-${blockId}"></span>
            </div>
          </div>
          <p class="hub-total-saved" id="hub-total-saved-${blockId}"></p>

          <div class="hub-total-breakdown" id="hub-total-breakdown-${blockId}">
            <div class="hub-breakdown-row">
              <span>Total MRP</span>
              <span id="hub-mrp-${blockId}"></span>
            </div>
            <div class="hub-breakdown-row hub-breakdown-discount" id="hub-discount-mrp-row-${blockId}" style="display:none;">
              <span>${cartSettings.discountsSavingsText}</span>
              <span id="hub-discount-mrp-${blockId}"></span>
            </div>
            <div class="hub-breakdown-row hub-breakdown-discount" id="hub-coupon-row-${blockId}" style="display:none;">
              <span>Coupon Discount</span>
              <span id="hub-coupon-${blockId}"></span>
            </div>
            <div class="hub-breakdown-row" id="hub-shipping-row-${blockId}" style="display:none;">
              <span>Shipping</span>
              <span id="hub-shipping-cost-${blockId}" class="hub-shipping-cost-show"></span>
            </div>
            <div class="hub-breakdown-row hub-breakdown-grand">
              <span>Grand Total</span>
              <span id="hub-grand-total-${blockId}"></span>
            </div>
          </div>
        </div>

        <div id="hub-express-payments-${blockId}" class="hub-express-payments"></div>

        <!-- CHECKOUT -->
        <div>${renderCustomHTML(customHtmlBlocks.above_checkout)}</div>
        <a id="hub-checkout-btn-${blockId}" href="${goToCartPageOnCheckout ? "/cart" : "/checkout"}" onclick="hubCheckoutClick(event, '${blockId}', this)" class="hub-cart-checkout-btn" style="border-radius:${designSettings.buttonRadius}px;">
          ${checkoutButtonText}
        </a>
        <div>${renderCustomHTML(customHtmlBlocks.below_checkout)}</div>
        ${
          designSettings.continueshopping
            ? `<a id="hub-continue-shopping-${blockId}" href="#" class="hub-continue-shopping" style="color:${designSettings.textColor}"
           onclick="(function(e){e.preventDefault();document.getElementById('hub-close-${blockId}').click();})(event)">
          ${continueShoppingText}
        </a>`
            : ""
        }

        <!-- TRUST BADGES (position: top of footer) -->
        <div id="hub-trust-badges-bottom-${blockId}" class="hub-trust-badges" style="display:none;"></div>
      </div>

      <div>${renderCustomHTML(customHtmlBlocks.bottom_of_cart)}</div>

      <!-- COUPON SUCCESS MODAL -->
      <div id="hub-coupon-success-${blockId}" class="hub-coupon-success-overlay" style="display:none;">
        <div class="hub-coupon-success-card">
          <button class="hub-coupon-success-close" onclick="hubCloseCouponSuccess('${blockId}')">
            <img 
            src="https://www.hubsyntax.com/cart-images/Vector%20(6).svg" 
            alt="discount-code" 
            class="discount-code-img"
            />
          </button>
          <div class="hub-coupon-success-icon">
         <img 
            src="https://www.hubsyntax.com/cart-images/Group%201707479978.svg" 
            alt="discount-code" 
            class="discount-code-img"
            />
          </div>
          <p class="hub-coupon-success-applied" id="hub-coupon-success-applied-${blockId}"></p>
          <p class="hub-coupon-success-headline" id="hub-coupon-success-headline-${blockId}" style="color:${designSettings.textColor}"></p>
          <p class="hub-coupon-success-desc" id="hub-coupon-success-desc-${blockId}"></p>
          <button class="hub-coupon-success-yay" onclick="hubCloseCouponSuccess('${blockId}')"
          style="
          --btn-bg:${btnColor};
          --btn-hover:${btnHoverColor};
          --btn-text:${textColor};
          border-radius:${designSettings.buttonRadius}px;
        "
          >YAY!</button>
        </div>
      </div>

      <!-- OFFERS PANEL OVERLAY -->
      <div id="hub-offers-backdrop-${blockId}" class="hub-offers-backdrop" onclick="hubCloseOffersPanel('${blockId}')"></div>
      <button id="hub-offers-close-${blockId}" class="hub-offers-close" onclick="hubCloseOffersPanel('${blockId}')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div id="hub-offers-panel-${blockId}" class="hub-offers-panel">
        <div class="hub-offers-header">
          <div class="hub-offers-title-group">
           <button class="hub-offers-back" onclick="hubCloseOffersPanel('${blockId}')">
          <img 
            src=" https://www.hubsyntax.com/cart-images/Vector%20(1)%20(1).svg" 
            alt="right-arrow" 
            class="right-img"
            />
          </button>
           <div class="hub-offers-title-subtitle">
            <span class="hub-offers-title">Apply Coupon</span>
            <span class="hub-offers-cart-total" id="hub-offers-cart-total-${blockId}"></span>
           </div>
          </div>
        </div>
        <div class="hub-offers-code">
         <div class="hub-offers-input-row">
          <div class="hub-offers-input-wrap">
           <div class="hub-offers-input">
           <img 
            src="https://hubsyntax.com/cart-images/Group%20(1).svg" 
            alt="discount-code" 
            class="discount-code-img"
            />
            <input type="text" id="hub-offers-input-${blockId}" placeholder="Enter Coupon Code" class="hub-offers-code-input" />
          </div>
           <button onclick="hubApplyOfferCode('${blockId}', this)" class="hub-offers-apply-btn">APPLY</button>
           </div>
        </div>
         <div id="hub-offers-msg-${blockId}" class="hub-discount-message"></div>
        </div>
        <div id="hub-offers-list-${blockId}" class="hub-offers-list"></div>
      </div>
    </div>
    `,
  );
};
