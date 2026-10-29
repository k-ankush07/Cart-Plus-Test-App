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

// ── Custom HTML / CSS blocks added in the editor sidebar (cartSettings.customBlocks) ──
// A block is a row like any other: its id sits in cartSettings.sectionOrder (Header / Body /
// Footer) where it was dragged, and blocks never dragged into a section go to the end of the cart.
const customBlockHTML = (b) =>
  `<div class="cart-custom-html" data-cart-plus-block="${b.id}">${b.code}</div>`;

function getActiveCustomBlocks(cartSettings) {
  return (Array.isArray(cartSettings.customBlocks) ? cartSettings.customBlocks : [])
    .filter((b) => b && b.enabled && b.code);
}

// <script> tags added through innerHTML do not run, so recreate them
function activateCustomBlockScripts(blockId) {
  document
    .querySelectorAll(`#hub-cart-drawer-${blockId} [data-cart-plus-block] script`)
    .forEach((old) => {
      const fresh = document.createElement("script");
      [...old.attributes].forEach((a) => fresh.setAttribute(a.name, a.value));
      fresh.textContent = old.textContent;
      old.replaceWith(fresh);
    });
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
    `--icon-color:${headerSettings.iconColor || "#000000"}`,
    `--icon-bg:${headerSettings.iconBgColor || "transparent"}`,
    `--icon-hover-bg:${headerSettings.iconbgHoverColor || "#f0f0f0"}`,
    `--icon-hover-color:${headerSettings.iconHoverColor || "#000000"}`,
    `--icon-border-hover:${headerSettings.borderHoverColor || "transparent"}`,
    `--border-color:${headerSettings.iconBorderColor || "transparent"}`,
    `--border-width:${getBorderWidth(headerSettings.iconBorder)}`,
    `--border-radius:${designSettings.buttonRadius || 0}px`,
  ].join(";");

  // Close button HTML (reusable)
  const closeButtonHTML = `
    <button
      id="hub-close-${blockId}"
      class="hub-cart-close cart-app__close cart-plus-close-btn cart-plus-header-close-button cart-plus-cart-public-header__close-button cart-plus-cart-header-close-button"
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
  const placedBlockIds = new Set(
    Object.values(cartSettings.sectionOrder || {}).flat(),
  );
  const endCustomBlocksHTML = getActiveCustomBlocks(cartSettings)
    .filter((b) => b.type !== "css" && !placedBlockIds.has(b.id))
    .map(customBlockHTML)
    .join("");
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
  const itemOpts = window.cartPlusGetItemOptions(cartSettings);
  const cardBgCss = window.cartPlusBgCss(itemOpts.cardBackground);
  const itemStyleCss = [
    itemOpts.imageSize
      ? `#hub-cart-drawer-${blockId} .hub-item-img-wrap { width: ${itemOpts.imageSize}px !important; height: ${itemOpts.imageSize}px !important; }`
      : "",
    itemOpts.radius !== null && itemOpts.radius !== undefined
      ? `#hub-cart-drawer-${blockId} .hub-item-img-wrap, #hub-cart-drawer-${blockId} .hub-item-img { border-radius: ${itemOpts.radius}px !important; overflow: hidden; }`
      : "",
    itemOpts.secondaryTextColor
      ? `#hub-cart-drawer-${blockId} .hub-item-variant, #hub-cart-drawer-${blockId} .hub-item-variant-name, #hub-cart-drawer-${blockId} .hub-item-variant-value, #hub-cart-drawer-${blockId} .hub-item-compare-price { color: ${itemOpts.secondaryTextColor} !important; }`
      : "",
  ].join("\n");
  bs.textContent = `
  ${cardBgCss ? `#hub-cart-drawer-${blockId} .hub-cart-item { background: ${cardBgCss} !important; }` : ""}
  ${itemStyleCss}
  #hub-cart-drawer-${blockId} .hub-cart-checkout-btn {
    background: ${window.cartPlusBgCss(window.cartPlusGetCheckoutButton(cartSettings).background) || btnColor} !important;
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

  const expressPaymentsSettings =
    window.__HUB_ACTIVE_CART__?.expressPaymentsSettings || {};

    const expressAlignment = expressPaymentsSettings.alignment || "stretch";

const expressAlignItems =
  expressAlignment === "center" ? "center"
  : expressAlignment === "left" ? "flex-start"
  : expressAlignment === "right" ? "flex-end"
  : "stretch";

const expressMaxWidth =
  expressAlignment === "stretch" ? "100%" : (expressPaymentsSettings.buttonWidth || "300px");

bs.textContent += `
  #hub-express-payments-${blockId} .dynamic-checkout__content,
  #hub-express-payments-${blockId} shopify-accelerated-checkout-cart,
  #hub-express-payments-${blockId} shopify-accelerated-checkout,
  #hub-express-payments-${blockId} shopify-paypal-button,
  #hub-express-payments-${blockId} shopify-apple-pay-button,
  #hub-express-payments-${blockId} shopify-shop-pay-button,
  #hub-express-payments-${blockId} [slot^="shadow-slot"],
  #hub-express-payments-${blockId} .paypal-button-container,
  #hub-express-payments-${blockId} .paypal-button-row {
    display: block !important;
    width: 100% !important;
    max-width: ${expressMaxWidth}!important;
  }

  #hub-express-payments-${blockId} shopify-accelerated-checkout-cart,
  #hub-express-payments-${blockId} shopify-accelerated-checkout {
    --shopify-accelerated-checkout-button-block-size: ${expressPaymentsSettings.defaultButtonHeight ?? 42}px;
    --shopify-accelerated-checkout-button-border-radius: ${designSettings.buttonRadius || 0}px;
  }

  @media (max-width: 480px) {
    #hub-express-payments-${blockId} shopify-accelerated-checkout-cart,
    #hub-express-payments-${blockId} shopify-accelerated-checkout {
      --shopify-accelerated-checkout-button-block-size: ${expressPaymentsSettings.mobileButtonHeight ?? 42}px;
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

  window.hubMoveExpressPayments(blockId);

  // ── Editor sections, built per row so they follow cartSettings.sectionOrder ──
  const activeCart = window.__HUB_ACTIVE_CART__ || {};
  const sectionBg = (key, html) => window.cartPlusSectionBg(cartSettings, key, html);
  const sectionOrder = cartSettings.sectionOrder || {};
  const upsellsOnTop = activeCart.upsellsSettings?.position === "top";
  const defaultOrder = window.cartPlusDefaultOrder;
  const bodyDefault = upsellsOnTop
    ? ["Cross-sell", "One Tick Upsell", "Products in cart"]
    : defaultOrder.Body;
  const headerOrder = window.cartPlusResolveOrder(sectionOrder.Header, defaultOrder.Header);
  const bodyOrder = sectionOrder.Body
    ? window.cartPlusResolveOrder(sectionOrder.Body, bodyDefault)
    : bodyDefault;
  const footerOrder = window.cartPlusResolveOrder(sectionOrder.Footer, defaultOrder.Footer);

  // custom HTML blocks are rows too (their ids sit in the saved order)
  const blockRows = Object.fromEntries(
    getActiveCustomBlocks(cartSettings)
      .filter((b) => b.type !== "css")
      .map((b) => [b.id, customBlockHTML(b)]),
  );
  const on = (settings) => settings?.enabled === false; // inverted flag: false = section is ON
  const slot = (content) => (content ? `<div>${content}</div>` : "");
  const annSettings = activeCart.announcementSettings;
  const upsellOn = on(activeCart.upsellsSettings);
  const upsellPos = activeCart.upsellsSettings?.position === "top" ? "top" : "bottom";
  const trustPos = activeCart.trustBadgesSettings?.position === "top" ? "top" : "bottom";
  const trustHtml = (pos) =>
    on(activeCart.trustBadgesSettings) && trustPos === pos
      ? sectionBg(
          "Security Badges",
          `<div id="hub-trust-badges-${pos}-${blockId}" class="hub-trust-badges cart-plus-trust-badge upcart-trust-badge cart-plus-public-trust-badges" style="display:none;"></div>`,
        )
      : "";
  const renderRows = (order, rows) =>
    order.map((key) => (key in rows ? rows[key] : blockRows[key] || "")).join("");

  const itemsSkeleton = `
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
  `;
  const footerSkeleton = `
        <div id="hub-footer-skeleton-${blockId}" class="hub-footer-skeleton" style="display:none;">
          <div class="hub-skeleton hub-skeleton-line" style="width:40%;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:100%;height:40px;border-radius:6px;margin-top:6px;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:60%;height:18px;border-radius:4px;margin-top:6px;">&nbsp;</div>
          <div class="hub-skeleton hub-skeleton-line" style="width:100%;height:44px;border-radius:6px;margin-top:6px;">&nbsp;</div>
        </div>
  `;
  const discountRowHTML = `
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
  `;
  // The old "Estimated Total" box is gone; the Summary row replaces it. A hidden shipping row stays
  // so the shipping-rate lookup keeps running for the Summary.
  const summaryOpts = window.cartPlusGetSummary?.(cartSettings) || {};
  const needsShippingLookup =
    enableShipping || (summaryOpts.enabled && summaryOpts.showShipping);
  const legacySummaryHTML = needsShippingLookup
    ? `<div class="hub-total-summary" style="display:none;"><div id="hub-shipping-row-${blockId}" style="display:none;"><span id="hub-shipping-cost-${blockId}"></span></div></div>`
    : "";
  const expressHTML = `
      <div id="hub-express-payments-${blockId}" class="hub-express-payments"
  style="
    display:${expressPaymentsSettings.enabled === false ? "flex" : "none"};
    flex-direction:column;
    align-items:${expressAlignItems};
    width:100%;
    margin-bottom: 20px;
    row-gap:${expressPaymentsSettings.rowGap ?? 8}px;
    --hub-express-btn-height:${expressPaymentsSettings.defaultButtonHeight ?? 42}px;
  "
></div>
  `;
  const continueHTML = `
        ${
          designSettings.continueshopping
            ? `<a id="hub-continue-shopping-${blockId}" href="#" class="hub-continue-shopping" style="color:${designSettings.textColor}"
           onclick="(function(e){e.preventDefault();document.getElementById('hub-close-${blockId}').click();})(event)">
          ${continueShoppingText}
        </a>`
            : ""
        }
  `;
  const modalsHTML = `
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
  `;

  const checkoutOpts = window.cartPlusGetCheckoutButton(cartSettings);
  const checkoutBgCss = window.cartPlusBgCss(checkoutOpts.sectionBackground);

  const headerRows = {
    "Banner Image": sectionBg("Banner Image", window.cartPlusBannerHTML(headerSettings)),
    Announcement:
      on(annSettings) && annSettings.position !== "after"
        ? `<div id="hub-announcement-${blockId}" class="hub-announcement" style="display:none;"></div>`
        : "",
    Timer: window.cartPlusTimerContainerHTML(blockId, headerSettings),
    "Progress Bar": !on(activeCart.rewardsSettings)
      ? ""
      : sectionBg(
      "Progress Bar",
      `<div id="hub-rewards-${blockId}" style="display:none;flex-shrink:0;" class="cart-plus-internal-rewards cart-plus-public-rewards tier-card upcart-rewards"></div>`,
    ),
  };

  const bodyRows = {
    "One Tick Upsell": sectionBg("One Tick Upsell", window.cartPlusOneTickContainerHTML?.(blockId, cartSettings) || ""),
    "Products in cart": `
      <div id="hub-cart-items-${blockId}" class="hub-cart-items ${disableFixedFooter ? "no-fixed-footer" : ""}">
        ${itemsSkeleton}
      </div>
      ${activeCart.upsellsSettings?.showSuggestedProduct ? `<div id="hub-suggested-product-${blockId}" class="hub-suggested-product" style="display:none;"></div>` : ""}`,
    "Cross-sell": upsellOn
      ? sectionBg(
          "Upsells",
          `<div id="hub-upsell-${upsellPos}-${blockId}" class="hub-upsell"></div>`,
        )
      : "",
  };

  const footerRows = {
    "Order notes": on(activeCart.additionalNotesSettings)
      ? sectionBg("Add Notes", `<div id="hub-notes-footer-${blockId}"></div>`)
      : "",
    "Shipping Protection & Add-ons": on(activeCart.addonsSettings)
      ? sectionBg(
          "Add ons",
          `<div id="hub-addons-${blockId}" class="hub-addons" style="display:none;"></div>`,
        )
      : "",
    Summary: `${window.cartPlusSummaryContainerHTML?.(blockId, cartSettings) || ""}${legacySummaryHTML}`,
    "Discount code": sectionBg("Discount code", discountRowHTML),
    "Age Verification": window.cartPlusAgeHTML(blockId, cartSettings),
    Login: window.cartPlusLoginHTML(cartSettings),
    "Checkout Button": `
      ${slot(renderCustomHTML(customHtmlBlocks.above_checkout))}
      <div style="${checkoutBgCss ? "background:" + checkoutBgCss + ";" : ""}">
        <a id="hub-checkout-btn-${blockId}" href="${goToCartPageOnCheckout ? "/cart" : "/checkout"}" onclick="hubCheckoutClick(event, '${blockId}', this)" class="hub-cart-checkout-btn" style="border-radius:${checkoutOpts.radius ?? designSettings.buttonRadius}px;${checkoutOpts.borderColor ? "border:1px solid " + checkoutOpts.borderColor + ";" : ""}">
          ${checkoutOpts.label != null ? window.cartPlusFillPrice(checkoutOpts.label, "") : checkoutButtonText}
        </a>
      </div>
      ${slot(renderCustomHTML(customHtmlBlocks.below_checkout))}
      ${expressHTML}
      ${continueHTML}`,
    "Payment Badges": window.cartPlusPaymentBadgesHTML(cartSettings),
  };

  const bodyBackground =
    window.cartPlusBgCss(cartSettings.cartItem?.sectionBackground) ||
    designSettings.bodyBackground ||
    "";
  const headerBackground = designSettings.headerBackground || headerSettings.backgroundColor;
  const footerBackground = designSettings.footerBackground || designSettings.accentColor || "";
  const floating = !!designSettings.floating;
  const drawerWidth = (designSettings.desktopWidth === "wide" ? 500 : 440) - (floating ? 32 : 0);
  const themedVars = designSettings.themed
    ? `color:${designSettings.textColor};${floating ? "border-radius:" + designSettings.drawerRadius + "px;" : ""}--cp-surface:${designSettings.backgroundColor};--cp-text:${designSettings.textColor};--cp-card-radius:${designSettings.cardRadius}px;--cp-field-radius:${designSettings.fieldRadius}px;--cp-image-radius:${designSettings.imageRadius}px;${designSettings.accentBorder ? "--cp-accent-border:" + designSettings.accentBorder + ";" : ""}`
    : "";

  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="hub-cart-bg-${blockId}" class="hub-cart-bg cart-plus-drawer"></div>
    <div id="hub-cart-drawer-${blockId}"
      class="hub-cart-drawer cart-app cart-plus ${positionClass} ${designSettings.inheritFonts ? "" : "cart-app--customFont"} ${designSettings.themed ? "cart-app--themed" : ""} ${designSettings.dark ? "cart-app--dark" : ""} ${floating ? "hub-cart-floating" : ""}"
      style="background-color:${designSettings.backgroundColor || ""};
      ${designSettings.bodyBackground ? "background:" + designSettings.bodyBackground + ";" : ""}
      ${themedVars}
      width:${drawerWidth}px;
      overflow-y:${disableFixedFooter ? "auto" : floating ? "hidden" : "unset"};
      scrollbar-width:none;
      -ms-overflow-style:none;">

      <!-- HEADER -->
      <div
        class="cart-app__header-top hub-cart-header cart-plus-public-header cart-plus-header"
        style="padding:${headerPadding}; background:${headerBackground};"
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

      <!-- Header section rows, in the order set in the editor -->
      ${renderRows(headerOrder, headerRows)}
      ${slot(renderCustomHTML(customHtmlBlocks.below_header))}

      <!-- BODY (scrollable) -->
      <div id="hub-upcart-cart-body" class="hub-cart-items-CartPreview ${disableFixedFooter ? "scroll-auto" : "scroll-unset"} cart-plus-body" style="${bodyBackground ? "background:" + bodyBackground + ";" : ""}">
        ${slot(renderCustomHTML(customHtmlBlocks.above_announcements))}
        ${trustHtml("top")}

        ${renderRows(bodyOrder, bodyRows)}

        ${on(annSettings) && annSettings.position === "after" ? `<div id="hub-announcement-after-${blockId}" class="hub-announcement" style="display:none;"></div>` : ""}
        ${slot(renderCustomHTML(customHtmlBlocks.above_footer))}
      </div>

      <!-- FOOTER (fixed bottom) -->
      <div class="hub-cart-footer cart-app__footer cart-plus-footer" style="background:${footerBackground};">
        ${footerSkeleton}

        <!-- Footer section rows, in the order set in the editor -->
        ${renderRows(footerOrder, footerRows)}

        ${trustHtml("bottom")}
      </div>

      ${customHtmlBlocks.bottom_of_cart ? `<div class="hub-bottom-of-cart">${renderCustomHTML(customHtmlBlocks.bottom_of_cart)}</div>` : ""}

      <!-- Custom HTML blocks not placed in a section: end of the cart -->
      ${endCustomBlocksHTML ? `<div id="hub-custom-end-${blockId}">${endCustomBlocksHTML}</div>` : ""}

      ${modalsHTML}
    </div>
    `,
  );

  window.cartPlusStartTimer?.(blockId);
  activateCustomBlockScripts(blockId);
};

window.hubMoveExpressPayments = function (blockId) {
  const source = document.getElementById("cart-plus-checkout-buttons-source");
  const target = document.getElementById(`hub-express-payments-${blockId}`);
  if (!source || !target) return;

  const expressPaymentsSettings =
    window.__HUB_ACTIVE_CART__?.expressPaymentsSettings || {};

  if (expressPaymentsSettings.enabled !== false) {
    target.style.display = "none";
    target.innerHTML = "";
    return;
  }

  if (!source.firstChild) return;

  target.innerHTML = "";
  while (source.firstChild) {
    target.appendChild(source.firstChild);
  }
  target.style.display = "flex";
};

(function () {
  const source = document.getElementById("cart-plus-checkout-buttons-source");
  if (!source || window._hubExpressObserverAttached) return;
  window._hubExpressObserverAttached = true;

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const blockId = window.HUB_CART_BLOCK_ID;
      if (blockId) window.hubMoveExpressPayments(blockId);
    }, 100);
  });

  observer.observe(source, { childList: true, subtree: true });
})();