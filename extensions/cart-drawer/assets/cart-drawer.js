async function fetchCartItems({
  drawerContent,
  drawer,
  blockId,
  formatPrice,
  generateProductHTML,
  updateCartQuantity,
  removeCartItem,
  updateCartBubble,
  products,
  isUpSellVisible,
  upSellTemplate,
  announcementHTML,
  announcementPosition,
  btnborderRadius,
  checkoutStyle,
  discount,
  cartItem,
  trustBages,
  checkoutSection,
  generateShipping,
  products1,
  cart,
  shippingProduct,
  showShippingProduct,
  progressBar,
  additionalNote,
  confirmationBox,
}) {
  const drawerWrapp = document.getElementById(`drawer-${blockId}`);
  const customCartDrawer = document.getElementById(`drawer-${blockId}`);
  const drawerHeader = drawerWrapp?.querySelector(".drawer-header");
  const drawerContentElem = drawerWrapp?.querySelector(".drawer-content");
  drawerContent = drawerContentElem || drawerContent;

  const headingColor = checkoutStyle?.headingColor || "#0000";
  const variantColor = checkoutStyle.variantColor || "#616161";
  const discountBadgeColor = checkoutStyle.discountBadgeColor || "#000000";
  const priceColor = checkoutStyle.priceColor || "#000000";
  const quantityColor = checkoutStyle.quantityColor || "#000000";
  const originalPriceColor = checkoutStyle.originalPriceColor || "#CCCCCC";
  const savingPriceColor = checkoutStyle.savingPriceColor || "#29845A";
  const buttonColor = checkoutStyle?.buttonColor || "#000000";
  const buttonTextColor = checkoutStyle?.buttonTextColor || "#FFFFFF";
  const checkoutButtonColor = checkoutStyle?.checkoutButtonColor || "#303030";
  const checkoutButtonTextColor =
    checkoutStyle?.checkoutButtonTextColor || "#000000ff";
  const iconColor = checkoutStyle?.iconColor || "#000000ff";
  const btnLinkColor = checkoutStyle?.btnLinkColor || "#000000ff";

  const discountCode = discount?.discountCode || "";
  const buttonText = discount?.buttonText || "";
  const isDiscountVisible = discount?.isDiscountVisible || "";

  const productNameSize = cartItem?.productNameSize || 14;
  const variantSize = cartItem?.variantSize || 14;
  const productPriceSize = cartItem?.productPriceSize || 14;
  const comparePriceSize = cartItem?.comparePriceSize || 14;
  const savingPriceSize = cartItem?.savingPriceSize || 14;

  const isTrustVisible = trustBages.isTrustVisible === "true";

  const discountText = checkoutSection.discountText || "Discount";
  const discountSize = checkoutSection.discountSize || "14";
  const checkoutSize = checkoutSection.checkoutSize || "14";
  const viewCartText = checkoutSection.viewCartText || "View Cart";
  const viewCartSize = checkoutSection.viewCartSize || "14";
  const showViewCart = checkoutSection.showViewCart || true;

  const showNote = additionalNote.showNote || true;
  const noteTitle = additionalNote.noteTitle || "";
  const noteSize = additionalNote.noteSize || 13;
  const notePlaceholder = additionalNote.notePlaceholder || "";
  const placeholderSize = additionalNote.notePlaceholderSize || 13;

  const showBox = confirmationBox.showBox || "";

  const textAfter =
    progressBar.textAfter || "Congratulations! You have achieved Free gift(s)";
  const showProgressBar = String(progressBar.showProgressBar) === "true";
  const selectedProducts = progressBar.selectedProgressProducts || [];

  try {
    const res = await fetch("/cart.js", { cache: "no-store" });
    const cart = await res.json();

    if (!cart.items.length) {
      drawerContent.innerHTML = `<p>Your cart is empty.</p>`;
      updateCartBubble(0);
      return;
    }
    updateCartBubble(cart.item_count);

    const itemsHTML = cart.items
      .map((item) => {
        const originalPrice = item.original_price / 100;
        const finalPrice = item.final_price / 100;
        const hasDiscount = item.original_price > item.final_price;
        const size = item.options_with_values?.[0]?.value || "";
        const discountTitle = item.discounts?.[0]?.title || "";
        const discountAmount = item.discounts?.[0]?.amount
          ? item.discounts[0].amount / 100
          : null;
        const savedAmount = hasDiscount ? originalPrice - finalPrice : 0;
        const extraClass =
          showShippingProduct === "true" &&
            shippingProduct.includes(String(item.product_id))
            ? "shipping-product"
            : "";

        const disableClass =
          showProgressBar &&
            selectedProducts.some((id) => Number(id) === Number(item.product_id))
            ? "disable-icons"
            : "";

        return `
      <div class="cart-drawer-content">
          <li class="cart-item-custom ${extraClass}">
            <div class="cart-line-item_image-custom">
              <img src="${item.image}" alt="${item.title}" />
            </div>
            <div class="cart-item-details">
              <a href="/products/${item.handle}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: ${headingColor};">
                  <p class="cart-item-title" style="color:${headingColor}; font-size:${productNameSize}px">
              ${item.product_title}
              </p>
              </a>
              ${size
            ? `<p class="cart-item-size" style="color: ${variantColor}; font-size:${variantSize}px">
              Size: ${size}</p>`
            : ""
          }
              <div class="cart-item-qty-control ${disableClass}">
                <button class="qty-btn decrease" data-key="${item.key}" style="color:${headingColor};">−</button>
                <input type="number" min="1" value="${item.quantity}" style="color: ${quantityColor};"
                 class="qty-input" data-key="${item.key}" />
                <button class="qty-btn increase" data-key="${item.key}" style="color:${headingColor};">+</button>
              </div>
              ${cart.cart_level_discount_applications?.length
            ? ""
            : discountTitle
              ? `
               <div class="cart-item-discount">
               <div style="color: ${iconColor};">
               <i class="fa fa-tag" aria-hidden="true" style="margin-right:5px;"></i></div>
               <span style="color:${discountBadgeColor}">${discountTitle}</span>
              </div>
              `
              : ""
          }

            </div>
            <div class="quantity_wrapper_main-custom">
             <button class="remove-item-btn" data-key="${item.key}" style="color: ${iconColor};">
              <i class="fa fa-trash-o" aria-hidden="true"></i></button>
              <div class="cart-item__discounted-prices">
                ${hasDiscount
            ? `
                      <s class="cart-item__old-price price price--end" style="color: ${originalPriceColor}; font-size:${comparePriceSize}px">
                      ${formatPrice(originalPrice * item.quantity)}</s>
                      <p class="price price--end" style="color: ${priceColor}; font-size:${productPriceSize}px;">${formatPrice(finalPrice * item.quantity)}</p>
                    `
            : `<p class="price price--end" style="color: ${priceColor}; font-size:${productPriceSize}px;">${formatPrice(finalPrice * item.quantity)}</p>`
          }
              </div>
              ${hasDiscount
            ? `<div class="save-price" style="color: ${savingPriceColor}; font-size:${savingPriceSize}px">
                  <p>Save ${formatPrice(savedAmount)}</p></div>`
            : ""
          }
            </div>
          </li>
          </div>
        `;
      })
      .join("");

    const subtotal = cart.items_subtotal_price / 100;
    const originalTotal = cart.original_total_price / 100;
    const finalTotal = cart.total_price / 100;
    const hasCartDiscount = cart.original_total_price > cart.total_price;

    let productsHTML = "";
    let allProductsSectionHTML = "";

    //upSell product
    if (isUpSellVisible === "true") {
      productsHTML = generateProductHTML(products);
      allProductsSectionHTML = `
        <div class="all-products-section ${upSellTemplate}-layout">
          <div class="products-grid">${productsHTML}</div>
        </div>`;
    }

    //trust Badges
    let trustBagesHTML = "";
    if (isTrustVisible && trustBages.selectedImages.length > 0) {
      trustBagesHTML = `<div class="cart-trustBages">
    ${trustBages.selectedImages
          .map(
            (img) =>
              `<img src="${img.src}" alt="Trust Badge" class="trust-badge-img custom-class" />`,
          )
          .join("")}
  </div>`;
    }

    //confirmationBox Badges
    let confirmation = "";
    if (showBox === "true") {
      const label = confirmationBox.checkboxLabel || "";
      const link = confirmationBox.link || "";
      const isChecked = confirmationBox.isChecked === "true";

      const match = label.match(/{{(.*?)}}/);
      const linkText = match ? match[1] : "";

      const cleanLabel = label.replace(/{{.*?}}/, "").trim();

      confirmation = `
    <div class="confirmation-box">
      <input type="checkbox" id="confirmationCheckbox" ${isChecked ? "checked" : ""} />

      <span style="font-size:14px;">
        ${cleanLabel}
        ${linkText
          ? `<a 
                 href="${link}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="text-decoration:underline; color:black;"
                 onclick="event.stopPropagation();"
               >
                 ${linkText}
               </a>`
          : ""
        }
      </span>
    </div>
  `;
    }

    setTimeout(() => {
      const checkbox = document.getElementById("confirmationCheckbox");
      const checkoutBtn = document.getElementById("checkoutBtn");
      if (!checkbox || !checkoutBtn) return;
      checkoutBtn.style.opacity = checkbox.checked ? "1" : "0.5";
      checkoutBtn.style.cursor = checkbox.checked ? "pointer" : "not-allowed";
      checkbox.addEventListener("change", (e) => {
        const checked = e.target.checked;

        checkoutBtn.style.opacity = checked ? "1" : "0.5";
        checkoutBtn.style.cursor = checked ? "pointer" : "not-allowed";
      });
    }, 50);

    // additional note
    let additionalPoint = "";
    if (showNote === "true") {
      additionalPoint = `
    <div class="additional-cart-note">
      <div class="additional-title" id="noteToggle">
        <span style="font-size: ${noteSize}px;">${noteTitle}</span>
        <i class="fa fa-caret-down" aria-hidden="true" id="noteIcon"></i>
      </div>

      <div id="noteTextareaWrapper">
        <textarea 
          placeholder="${notePlaceholder}" 
          style="
            font-size: ${placeholderSize}px; 
            width: 100%; 
            height: 60px; 
            resize: none;
          "
        ></textarea>
      </div>
    </div>
  `;
    }

    setTimeout(() => {
      const toggle = document.getElementById("noteToggle");
      const icon = document.getElementById("noteIcon");
      const wrapper = document.getElementById("noteTextareaWrapper");

      if (!toggle || !icon || !wrapper) return;

      toggle.addEventListener("click", () => {
        const isHidden = wrapper.style.display === "none";

        wrapper.style.display = isHidden ? "block" : "none";
        icon.style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
      });

      // Initially hidden
      wrapper.style.display = "none";
      icon.style.transform = "rotate(0)";
    }, 50);


    // view cart
    let viewCartHTML = "";
    if (showViewCart === "true") {
      viewCartHTML = `
    <a href="/cart" class="view-cart-btn" style="color:${btnLinkColor}; font-size:${viewCartSize}px;">
      ${viewCartText}
    </a>
  `;
    }

    let buttonRadius = btnborderRadius.toString().includes("px")
      ? btnborderRadius
      : `${btnborderRadius}px`;

    let checkoutText = checkoutSection.checkoutText || "Checkout";
    if (checkoutText.includes("{{total_price}}")) {
      if (finalTotal > 0) {
        checkoutText = checkoutText.replace(
          "{{total_price}}",
          formatPrice(finalTotal),
        );
      } else {
        checkoutText = checkoutText.replace("{{total_price}}", "");
      }
    }

    const discountVisible = isDiscountVisible === "true";

    let discountSectionHTML = "";
    if (discountVisible) {
      discountSectionHTML = `
    <div class="discount-section">
      <input 
        type="text" 
        id="discount-code-input-${blockId}" 
        class="discount-input" 
        placeholder="${discountCode}" 
      />
      <button 
        id="apply-discount-btn-${blockId}" 
        class="apply-discount-btn"
        style="border-radius: ${buttonRadius}; background-color: ${buttonColor}; color:${buttonTextColor};"
      >
        ${buttonText}
      </button>
    </div>
    <p id="discount-message-${blockId}" class="discount-message"></p>
  `;
    }

    // Progress bar  ----
    const unlockedProducts = selectedProducts
      .map((id) => products1.find((p) => Number(p.id) === Number(id)))
      .filter(Boolean)
      .filter(
        (p) =>
          !(cart.items || []).some(
            (item) => Number(item.product_id) === Number(p.id),
          ),
      );

    const subtotalBeforeDiscount = (cart.items_subtotal_price || 0) / 100;
    let progressBarHTML = "";

    if (showProgressBar) {
      let globalMessage = "";

      const tiers = progressBar.tiers || [];
      if (tiers.length > 0) {
        const sortedTiers = [...tiers].sort(
          (a, b) => a.minAmount - b.minAmount,
        );
        const lastTier = sortedTiers[sortedTiers.length - 1];

        if (subtotalBeforeDiscount >= lastTier.minAmount) {
          globalMessage =
            textAfter || "Congratulations! You have unlocked the reward!";
        } else {
          const nextTier = sortedTiers.find(
            (t) => subtotalBeforeDiscount < t.minAmount,
          );
          if (nextTier) {
            const remaining = nextTier.minAmount - subtotalBeforeDiscount;
            const amountText = `₹${remaining.toFixed(2)}`;
            globalMessage = nextTier.textBefore.replace(
              "{{min_amount}}",
              amountText,
            );
          }
        }
      }

      let productHTML = "";
      unlockedProducts.forEach((p) => {
        const tier = tiers.find(
          (t) =>
            t.rewardType === "Product" && subtotalBeforeDiscount >= t.minAmount,
        );

        if (tier) {
          console.log(
            "Unlocked product reward (will display):",
            tier.rewardDescription,
            "Product:",
            p.title,
          );

          productHTML += `
      <div class="unlocked-product-full">
        <div class="unlocked-img">
          <img id="gift-image-${p.id}" src="${p.images?.[0]?.src || ""}" class="gift-image" />
        </div>
        <div class="unlocked-item">
          <a href="/products/${p.handle}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: ${headingColor};">
            <p class="gift-title" style="color:${headingColor}; font-size:${productNameSize}px">${p.title}</p>
          </a>
          <p id="gift-price-${p.id}" class="gift-price" style="color: ${priceColor}; font-size:${productPriceSize}px;">
            ${formatPrice(Number(p.variants?.[0]?.price || 0))}
          </p>
          ${p.variants?.length
              ? `<select id="gift-variant-select-${p.id}" class="gift-select">
                   ${(p.variants || [])
                .map(
                  (v) =>
                    `<option value="${v.id}" data-price="${v.price}" data-image="${v.featured_image?.src || p.images?.[0]?.src}">${v.title}</option>`,
                )
                .join("")}
                 </select>`
              : ""
            }
          <div class="gift-add-button" data-product-id="${p.id}" style="cursor:pointer; padding:5px 10px; background:#0a74da; color:white; display:inline-block; margin-top:5px;">
            Add
          </div>
        </div>
      </div>
    `;
        }
      });

      setTimeout(() => {
        unlockedProducts.forEach((p) => {
          const select = document.getElementById(`gift-variant-select-${p.id}`);
          const priceEl = document.getElementById(`gift-price-${p.id}`);
          const imgEl = document.getElementById(`gift-image-${p.id}`);
          const addBtn = document.querySelector(
            `.gift-add-button[data-product-id="${p.id}"]`,
          );
          if (select) {
            select.addEventListener("change", function () {
              const selectedOption = this.options[this.selectedIndex];
              const newPrice = selectedOption.getAttribute("data-price");
              const newImage = selectedOption.getAttribute("data-image");
              if (priceEl) priceEl.textContent = formatPrice(Number(newPrice));
              if (imgEl && newImage) imgEl.src = newImage;
            });
          }

          if (addBtn) {
            addBtn.addEventListener("click", function () {
              const variantId = select
                ? Number(select.value)
                : p.variants?.[0]?.id;
              if (!variantId) return;

              fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: variantId, quantity: 1 }),
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log("Product added to cart:", data);
                  addBtn.textContent = "Added";
                })
                .catch((err) => console.error("Error adding product:", err));
            });
          }
        });
      }, 0);

      progressBarHTML = `
    <div class="multi-tier-progress-container">
      <p class="progress-text "style= "color:${progressBar.tierRewardTitle};font-size:${progressBar.rewardFontsize}px">
      ${globalMessage}</p>
      <div class="progress-bar-wrapper">
        ${tiers
          .map((tier, index) => {
            const minAmount = tier.minAmount || 0;
            const rewardDescription = tier.rewardDescription || "";
            const prevMin = index === 0 ? 0 : tiers[index - 1].minAmount;
            let progressPercent = 0;
            if (subtotalBeforeDiscount >= minAmount) progressPercent = 100;
            else if (subtotalBeforeDiscount > prevMin)
              progressPercent =
                ((subtotalBeforeDiscount - prevMin) / (minAmount - prevMin)) *
                100;

            const isUnlocked = subtotalBeforeDiscount >= minAmount;
            let iconClass = "fa-truck";
            if (tier.rewardType === "Product") iconClass = "fa-gift";
            else if (tier.rewardType === "Discount") iconClass = "fa-percent";

            if (isUnlocked && tier.rewardType === "Product") {
              console.log("Unlocked product reward:", rewardDescription);
            }
            const fillBg = progressBar.afterIcon;
            const segmentBg = progressBar.beforeBar;
            const iconColor = isUnlocked
              ? progressBar.afterColor
              : progressBar.beforeColor;
            const iconBg = isUnlocked
              ? progressBar.afterIcon
              : progressBar.beforeBar;

            return `
              <div class="tier-wrapper">
                <div class="progress-segment" style="background-color:${segmentBg};">
                  <div class="progress-fill" style="width: ${progressPercent}%; background-color:${fillBg};"></div>
                </div>
                <div class="progress-icon ${isUnlocked ? "active" : ""}" style=color:${iconColor};background-color:${iconBg};>
                  <i class="fa ${iconClass}" aria-hidden="true"></i>
                </div>
                <div class="tier-label" style= "color:${progressBar.tierTitle};
                font-size:${progressBar.tierFontsize}px">${rewardDescription}</div>
              </div>
            `;
          })
          .join("")}
      </div>
      ${productHTML}
    </div>
  `;
    }

    const cartContentHTML = `
      <div class="cart-drawer-content">
           ${progressBarHTML} 
        <ul class="cart-items-custom">${itemsHTML}</ul>
       <div id="matched-product-view">
        ${generateShipping(products1, cart)}
       </div>

        ${upSellTemplate === "center" ? allProductsSectionHTML : ""}
     
        <div class="cart-footer">
          ${hasCartDiscount
        ? `
                <div class="cart-item__discounted-prices">
                  <s class="cart-item__old-price price price--end">${formatPrice(originalTotal)}</s>
                  <span class="price price--end">${formatPrice(finalTotal)}</span>
                </div>
              `
        : `<p class="price price--end"><strong>Total:</strong> ${formatPrice(finalTotal)}</p>`
      }
        <div class="custom-discount-section">
       ${cart.cart_level_discount_applications?.length
        ? `
      <div class="discount-header" style="color:${headingColor}; font-size:${discountSize}px;">${discountText}</div>
      ${cart.cart_level_discount_applications
          .map(
            (discount) => `
            <div class="discount-row">
              <div class="discount-info">
                <div style="color: ${iconColor};"> <i class="fa fa-tag" aria-hidden="true" style="margin-right:5px;"></i></div>
                <span class="discount-title" style="color:${discountBadgeColor}">
                  ${discount.title}
                </span>
                <button class="remove-discount-btn" title="Remove Discount" style="color: ${iconColor};">
                  <i class="fa fa-trash-o" aria-hidden="true"></i>
                </button>
              </div>
              <div class="discount-amount" style="color: ${priceColor};">
                ${discount.total_allocated_amount
                ? `${formatPrice(discount.total_allocated_amount / 100)}`
                : ""
              }
              </div>
            </div>`,
          )
          .join("")}
       `
        : ""
      }

      </div>
          ${discountSectionHTML}
          <a id="checkoutBtn" href="/checkout" class="checkout-btn"
           style="border-radius: ${buttonRadius};color:${checkoutButtonTextColor}; font-size:${checkoutSize}px; 
           background-color: ${checkoutButtonColor};">${checkoutText}</a>
        </div>
         <div class="cart-wrapper-trustBages">
        ${trustBagesHTML} 
         </div>
         <div class="cart-wrapper-confirmationBox">
        ${confirmation}
         </div>
      <div class="cart-wrapper-additional-note">
           ${additionalPoint}
      </div>
        <div class="cart-wrapper-viewCart">
       ${viewCartHTML} 
      </div>
      </div>`;

    if (!drawerContent.dataset.shippingListenerBound) {
      drawerContent.dataset.shippingListenerBound = "true";

      drawerContent.addEventListener("change", async (e) => {
        if (!e.target.classList.contains("shipping-toggle")) return;
        const variantId = e.target.dataset.variantId;
        if (!variantId) return;

        try {
          if (e.target.checked) {
            const cart = await fetch("/cart.js").then((r) => r.json());
            const existingItem = cart.items.find(
              (i) => i.variant_id == variantId,
            );
            if (existingItem) {
              await fetch("/cart/change.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: existingItem.key, quantity: 0 }),
              });
            }

            await fetch("/cart/add.js", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: variantId, quantity: 1 }),
            });
          } else {
            const cart = await fetch("/cart.js").then((r) => r.json());
            const item = cart.items.find((i) => i.variant_id == variantId);
            if (item) {
              await fetch("/cart/change.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.key, quantity: 0 }),
              });
              console.log("Shipping product removed from cart");
            } else {
              console.log("Shipping product not in cart");
            }
          }

          if (typeof fetchCartItems === "function") {
            fetchCartItems({
              drawerContent,
              drawer,
              blockId,
              formatPrice,
              generateProductHTML,
              updateCartQuantity,
              removeCartItem,
              updateCartBubble,
              products,
              isUpSellVisible,
              upSellTemplate,
              announcementHTML,
              announcementPosition,
              btnborderRadius,
              checkoutStyle,
              discount,
              cartItem,
              trustBages,
              checkoutSection,
              generateShipping,
              products1,
              shippingProduct,
              progressBar,
              additionalNote,
              confirmationBox,
            });
          }
        } catch (err) {
          console.error("Error toggling shipping product:", err);
        }
      });
    }

    const parseTimer = (timerStr) => {
      const [minutes, seconds] = timerStr.split(":").map(Number);
      return (minutes || 0) * 60 + (seconds || 0);
    };

    const formatTime = (totalSeconds) => {
      const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (totalSeconds % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    };

    let finalCartHTML = "";
    if (announcementPosition === "Before products") {
      finalCartHTML = `
    ${announcementHTML}  
    ${cartContentHTML}
  `;
    } else if (announcementPosition === "After products") {
      const cartItemsStart = cartContentHTML.indexOf(
        '<ul class="cart-items-custom">',
      );
      const cartItemsEnd = cartContentHTML.indexOf("</ul>", cartItemsStart) + 5;

      finalCartHTML =
        cartContentHTML.slice(0, cartItemsEnd) +
        announcementHTML +
        cartContentHTML.slice(cartItemsEnd);
    } else {
      finalCartHTML = `
    ${announcementHTML}  
    ${cartContentHTML}
  `;
    }

    customCartDrawer.style.maxWidth =
      upSellTemplate === "left" || upSellTemplate === "right"
        ? "640px"
        : "440px";

    if (upSellTemplate === "left" || upSellTemplate === "right") {
      drawerContent.innerHTML = `
    <div class="drawer-flex-layout">
      ${upSellTemplate === "left" ? allProductsSectionHTML : ""}
      <div class="drawer-content-inner">${finalCartHTML}</div>
      ${upSellTemplate === "right" ? allProductsSectionHTML : ""}
    </div>
  `;
      const drawerContentInner = drawerContent.querySelector(
        ".drawer-content-inner",
      );
      if (drawerHeader && drawerContentInner) {
        drawerContentInner.prepend(drawerHeader);
      }
    } else {
      drawerContent.innerHTML = finalCartHTML;
      if (announcementHTML) {
        const timerSpan = drawerContent.querySelector(".announcement-timer");
        if (timerSpan) {
          if (timerSpan.dataset.intervalId) {
            clearInterval(timerSpan.dataset.intervalId);
          }

          let secondsLeft = parseTimer(timerSpan.textContent);
          const interval = setInterval(() => {
            if (secondsLeft <= 0) {
              clearInterval(interval);
              timerSpan.textContent = "00:00";
              return;
            }
            secondsLeft--;
            timerSpan.textContent = formatTime(secondsLeft);
          }, 1000);

          timerSpan.dataset.intervalId = interval;
        }
      }
      const drawerParent = drawerWrapp.querySelector(".cart-drawer-wrapp");
      if (
        drawerHeader &&
        drawerParent &&
        !drawerParent.querySelector(".drawer-header")
      ) {
        drawerParent.insertBefore(drawerHeader, drawerContent);
      }
    }

    // Reselect updated content and rebind all events
    const updatedDrawerContent = drawerWrapp.querySelector(".drawer-content");
    bindCartEvents(updatedDrawerContent, {
      updateCartQuantity,
      removeCartItem,
      products,
      formatPrice,
      fetchCartItems,
      drawer,
      blockId,
      generateProductHTML,
      updateCartBubble,
      isUpSellVisible,
      upSellTemplate,
      announcementHTML,
      announcementPosition,
      btnborderRadius,
      checkoutStyle,
      cartItem,
      discount,
      trustBages,
      checkoutSection,
      generateShipping,
      products1,
      shippingProduct,
      progressBar,
      additionalNote,
      confirmationBox,
    });
  } catch (err) {
    console.error("Error loading cart:", err);
    drawerContent.innerHTML = `<p>Error loading cart. Please try again.</p>`;
  }
}

/* EVENT HANDLER BINDING FUNCTION */
function bindCartEvents(drawerContent, context) {
  const {
    updateCartQuantity,
    removeCartItem,
    products,
    formatPrice,
    fetchCartItems,
    drawer,
    blockId,
    generateProductHTML,
    updateCartBubble,
    isUpSellVisible,
    upSellTemplate,
    announcementHTML,
    announcementPosition,
    btnborderRadius,
    checkoutStyle,
    cartItem,
    discount,
    trustBages,
    checkoutSection,
    generateShipping,
    products1,
    shippingProduct,
    progressBar,
    additionalNote,
    confirmationBox,
  } = context;

  // Quantity update buttons
  drawerContent.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const key = e.currentTarget.dataset.key;
      const input = drawerContent.querySelector(
        `.qty-input[data-key="${key}"]`,
      );
      let newQty = parseInt(input.value);
      if (e.currentTarget.classList.contains("increase")) newQty++;
      if (e.currentTarget.classList.contains("decrease"))
        newQty = Math.max(1, newQty - 1);
      input.value = newQty;
      updateCartQuantity(key, newQty);
    });
  });

  // Quantity manual input update
  drawerContent.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const key = e.currentTarget.dataset.key;
      const newQty = Math.max(1, parseInt(e.currentTarget.value) || 1);
      e.currentTarget.value = newQty;
      updateCartQuantity(key, newQty);
    });
  });

  // Remove item buttons
  drawerContent.querySelectorAll(".remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const key = e.currentTarget.dataset.key;
      removeCartItem(key);
      fetchCartItems({
        drawerContent,
        drawer,
        blockId,
        formatPrice,
        generateProductHTML,
        updateCartQuantity,
        removeCartItem,
        updateCartBubble,
        products,
        isUpSellVisible,
        upSellTemplate,
        announcementHTML,
        announcementPosition,
        btnborderRadius,
        checkoutStyle,
        cartItem,
        discount,
        trustBages,
        checkoutSection,
        generateShipping,
        products1,
        shippingProduct,
        progressBar,
        additionalNote,
        confirmationBox,
      });
    });
  });

  drawerContent.querySelectorAll(".remove-discount-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const cartRes = await fetch("/cart.js");
        const cart = await cartRes.json();
        const items = cart.items.map(({ id, quantity }) => ({ id, quantity }));

        const removeRes = await fetch("/cart/update.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discount: "" }),
        });

        if (!removeRes.ok)
          throw new Error(
            `Failed to remove discount (HTTP ${removeRes.status})`,
          );

        console.log(" Discount removed successfully");

        const updatedCartRes = await fetch("/cart.js");
        const updatedCart = await updatedCartRes.json();
        console.log(" Discount removed — new cart:", updatedCart);

        fetchCartItems({
          drawerContent,
          drawer,
          blockId,
          formatPrice,
          generateProductHTML,
          updateCartQuantity,
          removeCartItem,
          updateCartBubble,
          products,
          isUpSellVisible,
          upSellTemplate,
          announcementHTML,
          announcementPosition,
          btnborderRadius,
          checkoutStyle,
          cartItem,
          discount,
          trustBages,
          checkoutSection,
          generateShipping,
          products1,
          shippingProduct,
          progressBar,
          additionalNote,
          confirmationBox,
        });
      } catch (err) {
        console.error("❌ Error removing discount:", err);
      }
    });
  });

  const discountInput = document.getElementById(
    `discount-code-input-${blockId}`,
  );
  const applyDiscountBtn = document.getElementById(
    `apply-discount-btn-${blockId}`,
  );
  const discountMsg = document.getElementById(`discount-message-${blockId}`);

  if (applyDiscountBtn && !applyDiscountBtn.dataset.bound) {
    applyDiscountBtn.dataset.bound = "true";

    applyDiscountBtn.addEventListener("click", async () => {
      const code = discountInput.value.trim();
      if (!code) {
        discountMsg.textContent = "Please enter a discount code.";
        discountMsg.style.color = "red";
        return;
      }
      try {
        const beforeCartRes = await fetch("/cart.js");
        const beforeCart = await beforeCartRes.json();
        const beforeDiscount = beforeCart.total_discount;

        await fetch(`/discount/${encodeURIComponent(code)}?redirect=/cart.js`);
        const afterCartRes = await fetch("/cart.js");
        const afterCart = await afterCartRes.json();
        const afterDiscount = afterCart.total_discount;

        if (afterDiscount > beforeDiscount) {
          discountMsg.textContent = "Discount applied successfully!";
          discountMsg.style.color = "green";

          fetchCartItems({
            drawerContent,
            drawer,
            blockId,
            formatPrice,
            generateProductHTML,
            updateCartQuantity,
            removeCartItem,
            updateCartBubble,
            products,
            isUpSellVisible,
            upSellTemplate,
            announcementHTML,
            announcementPosition,
            btnborderRadius,
            checkoutStyle,
            cartItem,
            discount,
            trustBages,
            checkoutSection,
            generateShipping,
            products1,
            shippingProduct,
            progressBar,
            additionalNote,
            confirmationBox,
          });
        } else {
          discountMsg.textContent = "Invalid or expired discount code.";
          discountMsg.style.color = "red";
        }
      } catch (err) {
        console.error("Error applying discount:", err);
        discountMsg.textContent = "Error applying discount. Please try again.";
        discountMsg.style.color = "red";
      }
    });
  }
}
