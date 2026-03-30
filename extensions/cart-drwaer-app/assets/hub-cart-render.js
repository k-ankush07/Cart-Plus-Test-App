window.hubCartRender = async function (drawer) {
  try {
    const res = await fetch("/cart.js");
    const cart = await res.json();

    const container = drawer.querySelector(".hub-cart-items");
    if (!container) return;

    function formatMoney(cents) {
      const currency = window.__SHOPIFY_CURRENCY__;

      let amount = (cents / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      if (currency?.format?.includes("{{amount}}")) {
        return currency.format.replace("{{amount}}", amount);
      }

      if (currency?.symbol) {
        return `${currency.symbol} ${amount}`;
      }

      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency?.code || "USD",
      }).format(cents / 100);
    }

    /* EMPTY CART */
    if (cart.items.length === 0) {
      container.innerHTML = "<p>Cart is empty</p>";
      return;
    }

    /* ITEMS */
    container.innerHTML = cart.items
      .map(
        (item) => `
      <div style="display:flex; gap:12px; margin-bottom:14px; align-items:center;">
        
        <!-- IMAGE -->
        <div style="width:60px; height:60px;">
          <img 
            src="${item.image}" 
            alt="${item.product_title}" 
            style="width:100%; height:100%; object-fit:cover; border-radius:6px;"
          />
        </div>

        <!-- INFO -->
        <div style="flex:1;">
          
          <!-- TITLE -->
          <a href="/products/${item.handle}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
          <p style="margin:0; font-weight:600;">
            ${item.product_title || item.title}
          </p>
          </a>

          <!-- VARIANT -->
          ${
            item.variant_title && item.variant_title !== "Default Title"
              ? `<p style="margin:0; font-size:12px; color:#777;">
                   ${item.variant_title}
                 </p>`
              : ""
          }

          <!-- QTY -->
          <div style="display:flex; align-items:center; gap:6px; margin:6px 0;">
            <button onclick="updateQty('${item.key}', ${
              item.quantity - 1
            })">−</button>

            <input 
              type="text" 
              value="${item.quantity}" 
              style="width:50px; text-align:center;"
              oninput="handleQtyInput('${item.key}', this.value)"
            />

            <button onclick="updateQty('${item.key}', ${
              item.quantity + 1
            })">+</button>
          </div>

          <!-- PRICE (FIXED) -->
          <p style="margin:0; font-size:14px;">
            ${
              item.original_line_price !== item.final_line_price
                ? `
                  <span style="text-decoration:line-through; color:#999; margin-right:6px;">
                    ${formatMoney(item.original_line_price)}
                  </span>
                  <span style="font-weight:600;">
                    ${formatMoney(item.final_line_price)}
                  </span>
                `
                : formatMoney(item.final_line_price)
            }
          </p>

          <!-- DISCOUNT -->
          ${
            item.line_level_discount_allocations?.length > 0
              ? item.line_level_discount_allocations
                  .map(
                    (d) => `
                  <p style="margin:0; font-size:12px; color:green;">
                    - ${d.discount_application.title}
                    (${formatMoney(d.amount)})
                  </p>
                `,
                  )
                  .join("")
              : ""
          }

          <!-- REMOVE -->
          <button 
            style="margin-top:4px; font-size:12px; color:red;"
            onclick="removeItem('${item.key}')"
          >
            Remove
          </button>

        </div>
      </div>
    `,
      )
      .join("");

    /* TOTAL SAVINGS */
    if (cart.total_discount > 0) {
      container.insertAdjacentHTML(
        "beforeend",
        `<p style="color:green; font-weight:600; margin-top:10px;">
          You saved ${formatMoney(cart.total_discount)}
        </p>`,
      );
    }

    /* DISCOUNT INPUT UI */
    const hasAutoDiscount = cart.items.some(
      (item) => item.line_level_discount_allocations?.length > 0,
    );

    const code = cart.discount_codes?.[0]?.code;
    const hasRealDiscount = cart.total_discount > 0;
    const hasManualDiscount = code && hasRealDiscount;
    const realDiscount =
      cart.items[0]?.line_level_discount_allocations?.[0]?.discount_application
        ?.title;

    container.insertAdjacentHTML(
      "beforeend",
      `
  <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
    
   ${
     hasManualDiscount
       ? `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#e8f5e9; padding:10px; border-radius:6px;">
      
      <span style="font-size:13px; color:#2e7d32;">
      ${hasRealDiscount && realDiscount ? `Applied: ${realDiscount}` : ""}
      </span>

      <button 
        onclick="removeDiscountCode()"
        style="padding:6px 12px; background:#d32f2f; color:white; border:none; border-radius:4px; cursor:pointer;"
      >
        Remove
      </button>

    </div>
    `
       : hasAutoDiscount
         ? `
    <div style="background:#fff3cd; padding:10px; border-radius:6px; font-size:13px;">
      Automatic discount applied
    </div>
    `
         : ""
   }
    <div style="margin-top:10px;">
        <input 
          type="text" 
          id="discount-code-input"
          placeholder="Enter discount code"
          style="width:100%; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:4px;"
        />

        <button 
          onclick="applyDiscountCode()"
          style="width:100%; padding:10px; background:black; color:white; border:none; border-radius:4px; cursor:pointer;"
        >
          Apply Code
        </button>
        </div>
    <p id="discount-message" style="font-size:12px; margin-top:6px;"></p>
  </div>
  `,
    );
  } catch (err) {
    console.error("Cart fetch error:", err);
  }
};
