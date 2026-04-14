import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
  * @typedef {import("../generated/api").CartInput} RunInput
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartLinesDiscountsGenerateRunResult}
  */

export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  // ── Parse metafield config ────────────────────────────────────
  let rewards = [];
  try {
    const raw = input.discount.metafield?.value;
    if (raw) {
      const config = JSON.parse(raw);
      rewards = config.rewards || [];
    }
  } catch (e) {
    return { operations: [] };
  }

  const enabledRewards = rewards.filter(r => r.enabled);
  if (!enabledRewards.length) {
    return { operations: [] };
  }

  const hasOrderClass = input.discount.discountClasses.includes(DiscountClass.Order);
  const hasProductClass = input.discount.discountClasses.includes(DiscountClass.Product);

  // ── Cart context ──────────────────────────────────────────────
  const cartLines = input.cart.lines;
  const cartTotal = cartLines.reduce((sum, l) => sum + Number(l.cost.subtotalAmount.amount), 0);
  const cartQty = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const isLoggedIn = !!input.cart.buyerIdentity?.isAuthenticated;
  const hasSubscription = input.cart.attribute?.value === 'true';

  const cartProductIds = new Set(
    cartLines.map(l => l.merchandise?.product?.id).filter(Boolean)
  );

  const operations = [];

  for (const reward of enabledRewards) {
    if (!reward.reward) continue;
    const rewardType = reward.reward.type;

    // Shipping rewards are handled by the delivery function
    if (rewardType === 'free_shipping') continue;

    // ── Check all triggers ──────────────────────────────────────
    if (!triggersPass(reward.triggers, { cartTotal, cartQty, isLoggedIn, hasSubscription, cartProductIds })) {
      continue;
    }

    const discountType = reward.reward.discountType || 'percentage';
    const rawValue = Number(reward.reward.value || 0);
    // Normalize: stored as fraction (≤1) → convert to percentage points
    const discountValue = discountType === 'percentage' && rawValue <= 1 ? rawValue * 100 : rawValue;

    const discountValueObj = discountType === 'percentage'
      ? { percentage: { value: discountValue } }
      : { fixedAmount: { amount: discountValue } };

    if (rewardType === 'cart_discount' && hasOrderClass) {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message: reward.title || reward.discountCode || 'Cart Discount',
              targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
              value: discountValueObj,
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    }

    if (rewardType === 'free_gift' && hasProductClass) {
      const giftLine = findGiftLine(cartLines, reward.reward.items);
      if (giftLine) {
        operations.push({
          productDiscountsAdd: {
            candidates: [
              {
                message: reward.title || 'Free Gift',
                targets: [{ cartLine: { id: giftLine.id } }],
                value: { percentage: { value: 100 } },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        });
      }
    }
  }

  return { operations };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggersPass(triggers, ctx) {
  if (!triggers || triggers.length === 0) return true;
  for (const trigger of triggers) {
    if (!triggerPass(trigger, ctx)) return false;
  }
  return true;
}

function triggerPass(trigger, { cartTotal, cartQty, isLoggedIn, hasSubscription, cartProductIds }) {
  switch (trigger.type) {
    case 'cart_total':
      return cartTotal >= Number(trigger.minAmount || 0);

    case 'cart_quantity':
      return cartQty >= Number(trigger.minQuantity || 0);

    case 'customer_logged_in':
      return isLoggedIn;

    case 'subscription':
      return hasSubscription;

    case 'specific_products': {
      const productGids = (trigger.items?.products || []).filter(Boolean);
      if (!productGids.length) return true;
      return productGids.some(gid => cartProductIds.has(gid));
    }

    // Collection triggers: not evaluable in function (no collections query available)
    // Treat as passing — enforce collection logic on the storefront side if needed
    case 'specific_collections':
      return true;

    default:
      return true;
  }
}

function findGiftLine(cartLines, items) {
  if (!items || !cartLines.length) return null;

  const productIds = new Set((items.products?.productsToAdd || items.products || []).filter(Boolean));
  const variantIds = new Set((items.variants || []).filter(Boolean));

  // Only discount the gift item if it is already in the cart
  return cartLines.find(l =>
    variantIds.has(l.merchandise?.id) ||
    productIds.has(l.merchandise?.product?.id)
  ) || null;
}
