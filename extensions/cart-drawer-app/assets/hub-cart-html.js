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
  const discountCodesSettings =
    window.__HUB_ACTIVE_CART__?.discountCodesSettings || {};
  const showOfferBox = discountCodesSettings.showOfferBox ?? false;
  const couponHeadingColor =
    discountCodesSettings.couponHeadingColor ?? "#000000";
  const couponHeadingText = discountCodesSettings.title ?? "Coupon Code";
  const showTitle = discountCodesSettings.showTitle ?? false;
  const iconsColor = designSettings?.iconColor || "#000000";

  const viewAllOffersBgColor =
    discountCodesSettings.viewAllOffersBgColor ?? "#000000";
  const viewAllOffersColor =
    discountCodesSettings.viewAllOffersColor ?? "#ffff";

  const enableSubtotal = designSettings.enableSubtotal ?? false;
  const subtotalColor = designSettings.subtotalColor || "";
  const enableShipping = designSettings.enableShipping ?? false;

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
      class="hub-cart-close cart-app__close cart-plus-close-btn cart-plus-header-close-button  cart-plus-cart-public-header__close-button cart-plus-cart-header-close-button"
      aria-label="Close cart"
      style="flex-shrink:0;${closeBtnVars};"
    >
      <svg
        class="cart-plus-header-close-button-icon cart-plus-cart-public-header__close-button-icon cart-plus-cart-header-close-button-icon" 
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
        "https://cartplus.io/cartplus-img/Group%201707479942%20(1).png";
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
        <div style="${wrapperStyle}" class="cart-plus-header-logo">
          <div style="max-width:${headerSettings.logoSize || 120}px;display:block;${marginStyle}">
            <img
              class="cart-plus-header-logo"
              src="${src}"
              alt="Logo"
              style="width:100%;"
              onerror="this.src='${fallback}'"
            />
          </div>
        </div>`;
    }

    if (titleType === "custom") {
      return `
        <div style="${wrapperStyle}">
          <span
            class="cart-app__title cart-plus-header-text"
            style="color:${headerSettings.textColor};font-weight:${getFontWeight(headerSettings.fontWeight)};font-size:${headerSettings.fontSize}px;display:block;margin:0;"
          >${titleDisplayText}</span>
        </div>`;
    }

    // "inherit" (or any other value) → heading tag
    const HeadingTag = headerSettings.heading || "h3";
    return `
      <div style="${wrapperStyle}">
        <${HeadingTag}
          class="cart-app__title cart-plus-header-text"
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
  const goToCartPageOnCheckout =
    cartSettings.goToCartPageOnCheckout === true ||
    cartSettings.goToCartPageOnCheckout === "true";

  const customHtmlBlocks = cartSettings.customHtmlBlocks || {};
  const checkoutButtonText = goToCartPageOnCheckout
    ? cartSettings.viewCartName || "View cart"
    : cartSettings.checkoutButtonText || "Proceed to checkout";

  const continueShoppingText =
    cartSettings.continueShoppingText || "Or continue shopping";

  const btnColor = designSettings.buttonColor || "#000000";
  const btnHoverColor = designSettings.buttonHoverColor || "#333333";
  const textColor = designSettings.buttonTextColor || "#000";

  const textColorAll = designSettings.textColor || "#000";

  // Inject button color + hover style for this drawer
  const btnStyleId = `hub-btn-style-${blockId}`;
  let bs = document.getElementById(btnStyleId);
  if (!bs) {
    bs = document.createElement("style");
    bs.id = btnStyleId;
    document.head.appendChild(bs);
  }
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
  // Inject mobile-width style for this drawer
  const mobileStyleId = `hub-mobile-width-${blockId}`;
  let ms = document.getElementById(mobileStyleId);
  if (!ms) {
    ms = document.createElement("style");
    ms.id = mobileStyleId;
    document.head.appendChild(ms);
  }
  const mobileWidth = designSettings.mobileWidth === "full" ? "100vw" : "90vw";
  ms.textContent = `
  @media (max-width: 480px) {
    #hub-cart-drawer-${blockId} {
      width: ${mobileWidth} !important;
      max-width: 100vw !important;
    }
  }
`;
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
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg cart-plus-drawer"></div>
   <div id="hub-cart-drawer-${blockId}" 
  class="hub-cart-drawer cart-app cart-plus ${positionClass} ${designSettings.inheritFonts ? "" : "cart-app--customFont"}"
  style="background-color:${designSettings.backgroundColor || ""};
  width:${designSettings.desktopWidth === "wide" ? "500px" : "440px"};
  overflow-y:${disableFixedFooter ? "auto" : "unset"};
  scrollbar-width:none;
  -ms-overflow-style:none;">

      <!-- HEADER -->
      <div
        class="cart-app__header-top upcart-header hub-cart-header cart-plus-public-header cart-plus-header"
        style="padding:${headerPadding}; background:${headerSettings.backgroundColor};"
      >
        <div
          class="cart-app__row-between cart-plus-header-text"
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
      <div id="hub-upcart-cart-body" class="hub-cart-items-CartPreview ${disableFixedFooter ? "scroll-auto" : "scroll-unset"} cart-plus-body">
        <!-- ANNOUNCEMENT (position: before) -->
        <div>${renderCustomHTML(customHtmlBlocks.above_announcements)}</div>
        <div id="hub-announcement-${blockId}" class="hub-announcement" style="display:none;"></div>

        <!-- TRUST BADGES (position: top of cart) -->
        <div id="hub-trust-badges-top-${blockId}" class="hub-trust-badges cart-plus-trust-badge upcart-trust-badge cart-plus-public-trust-badges" style="display:none;"></div>

        <!-- REWARDS -->
        <div id="hub-rewards-${blockId}" style="display:none;flex-shrink:0;" class="cart-plus-internal-rewards cart-plus-public-rewards tier-card upcart-rewards"></div>

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
        <!-- SUGGESTED PRODUCT -->
        <div id="hub-suggested-product-${blockId}" class="hub-suggested-product" style="display:none;"></div>

        <!-- UPSELLS (position: bottom of cart) -->
        <div id="hub-upsell-bottom-${blockId}" class="hub-upsell"></div>

         <!-- NOTES (position: before) -->
        <div id="hub-notes-below-${blockId}"></div>

        <!-- ANNOUNCEMENT (position: after) -->
        <div id="hub-announcement-after-${blockId}" class="hub-announcement" style="display:none;"></div>

        <div>${renderCustomHTML(customHtmlBlocks.above_footer)}</div>
      </div>

      <!-- FOOTER (fixed bottom) -->
      <div id="hub-footer-rec-${blockId}"></div>

      <div class="hub-cart-footer cart-app__footer cart-plus-footer" style="background-color:${designSettings.accentColor || ""};">

        <!-- skeleton shown while cart data loads -->
        <div id="hub-footer-skeleton-${blockId}" class="hub-footer-skeleton" style="display:none;">
          <div class="hub-skeleton hub-skeleton-line" style="width:40%;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:100%;height:40px;border-radius:6px;margin-top:6px;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:60%;height:18px;border-radius:4px;margin-top:6px;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:100%;height:44px;border-radius:6px;margin-top:6px;">&nbsp;</div>
        </div>

         <!-- NOTES (position: top of footer) -->
        <div id="hub-notes-footer-${blockId}"></div>

        <!-- ADD-ONS -->
        <div id="hub-addons-${blockId}" class="hub-addons" style="display:none;"></div>
        <!-- DISCOUNT -->
        
        <div class="hub-discount-input-row-items cart-plus-discount-code-row cart-plus-public-discount-code cart-plus-discount-code-input-wrapper cart-plus-discount-code-module cart-plus-public-discount-code__input-wrapper" 
         id="hub-discount-row-${blockId}">
         ${
           showTitle
             ? `<div class="hub-discount-heading" style="color:${couponHeadingColor}">${couponHeadingText}</div>`
             : ""
         }
        <div class="hub-discount-input-row">
        <div id="hub-discount-status-${blockId}" class="hub-discount-status-code"></div>
         <div class="hub-discount-input-btn" id="hub-discount-input-wrap-${blockId}">
            <svg viewBox="0 0 20 20" style="fill: ${iconsColor}">
          <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/>
         <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
         <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
         <path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/>
         </svg>
            
          <input type="text" id="discount-code-input-${blockId}" placeholder="Discount code" class="hub-discount-input cart-plus-discount-code-text cart-plus-discount-code-input" />
          <button onclick="applyDiscountCode(this)" class="hub-discount-apply-btn cart-plus-public-discount-code__button cart-plus-discount-code-button">Apply</button>
          </div>
          <div class="error-discount"> <p id="discount-message" class="hub-discount-message"></p></div>
         ${
           showOfferBox
             ? ` <div class="discount-offer-btn" style="background:${viewAllOffersBgColor}; color:${viewAllOffersColor}" onclick="hubOpenOffersPanel('${blockId}')">
          <button class="hub-view-offers-btn" style="color:${viewAllOffersColor}">View all offers</button>
          <svg viewBox="0 0 20 20" style="width: 20px; height: 20px; fill: ${viewAllOffersColor}">
                   <path fill-rule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"/>
          </svg>
          </div>   `
             : ""
         }
        </div>
        </div>

        <!-- TOTAL SUMMARY -->
       ${
         enableSubtotal
           ? ` <div class="hub-total-summary">
          <div class="hub-total-header"
           onclick="hubToggleTotalBreakdown(this, '${blockId}')">
            <div class="hub-total-header-left">
              <span class="hub-total-label" style="color:${subtotalColor}">Estimated Total</span>
              <span class="hub-total-arrow">
             <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke=${iconsColor} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </span>
            </div>
            <div class="hub-total-header-right">
              <span class="hub-total-original" id="hub-total-original-${blockId}"></span>
              <span class="hub-total-final" id="hub-cart-total-${blockId}" style="color:${subtotalColor}"></span>
            </div>
          </div>
          <p class="hub-total-saved" id="hub-total-saved-${blockId}"></p>

          <div class="hub-total-breakdown" id="hub-total-breakdown-${blockId}">
            <div class="hub-breakdown-row">
              <span style="color:${textColorAll}">Total MRP</span>
              <span id="hub-mrp-${blockId}" style="color:${textColorAll}"></span>
            </div>
            <div class="hub-breakdown-row hub-breakdown-discount" id="hub-discount-mrp-row-${blockId}" style="display:none;">
            <span id="hub-discount-mrp-label-${blockId}" style="color:${textColorAll}">${cartSettings.discountsSavingsText}</span>
             <span id="hub-discount-mrp-${blockId}"></span>
            </div>
            <div class="hub-breakdown-row hub-breakdown-discount" id="hub-coupon-row-${blockId}" style="display:none;">
              <span style="color:${textColorAll}">Coupon Discount</span>
              <span id="hub-coupon-${blockId}"></span>
            </div>
            ${
              enableShipping
                ? `<div class="hub-breakdown-row" id="hub-shipping-row-${blockId}" style="display:none;">
        <span style="color:${textColorAll}">Shipping</span>
        <span id="hub-shipping-cost-${blockId}" class="hub-shipping-cost-show"></span>
      </div>`
                : ""
            }
            <div class="hub-breakdown-row hub-breakdown-grand">
              <span style="color:${textColorAll}">Grand Total</span>
              <span id="hub-grand-total-${blockId}" style="color:${textColorAll}"></span>
            </div>
          </div>
        </div> `
           : ""
       }

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
        <div id="hub-trust-badges-bottom-${blockId}" class="hub-trust-badges cart-plus-trust-badge upcart-trust-badge cart-plus-public-trust-badges" style="display:none;"></div>
      </div>

     <div class="hub-bottom-of-cart">${renderCustomHTML(customHtmlBlocks.bottom_of_cart)}</div>

      <!-- COUPON SUCCESS MODAL -->
      <div id="hub-coupon-success-${blockId}" class="hub-coupon-success-overlay" style="display:none;">
        <div class="hub-coupon-success-card">
          <button class="hub-coupon-success-close" onclick="hubCloseCouponSuccess('${blockId}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="hub-coupon-success-icon">
          <svg viewBox="0 0 20 20" style="fill: ${iconsColor}">
          <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/>
         <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
         <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
         <path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/>
         </svg>
          </div>
          <p class="hub-coupon-success-applied" id="hub-coupon-success-applied-${blockId}"></p>
          <p class="hub-coupon-success-headline" id="hub-coupon-success-headline-${blockId}"></p>
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
           <svg viewBox="0 0 20 20" class="Icon_Icon__uZZKy" style="width: 20px; height: 20px;"><path fill-rule="evenodd" d="M16.5 10a.75.75 0 0 1-.75.75h-9.69l2.72 2.72a.75.75 0 0 1-1.06 1.06l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 1 1 1.06 1.06l-2.72 2.72h9.69a.75.75 0 0 1 .75.75Z"></path></svg>
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
             <svg viewBox="0 0 20 20" style="fill: ${iconsColor}">
          <path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/>
         <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
         <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
         <path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/>
         </svg>
            <input type="text" id="hub-offers-input-${blockId}" placeholder="Enter Coupon Code" class="hub-offers-code-input cart-plus-discount-code-text cart-plus-discount-code-input" />
          </div>
           <button onclick="hubApplyOfferCode('${blockId}', this)" class="hub-offers-apply-btn cart-plus-public-discount-code__button cart-plus-discount-code-button">APPLY</button>
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
