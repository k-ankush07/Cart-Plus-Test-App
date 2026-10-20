import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
  * @typedef {import("../generated/api").DeliveryInput} RunInput
  * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
  */

export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    return { operations: [] };
  }

  const hasShippingClass = input.discount.discountClasses.includes(DiscountClass.Shipping);
  if (!hasShippingClass) {
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

  const enabledShippingRewards = rewards.filter(
    r => r.enabled && r.reward?.type === 'free_shipping'
  );
  if (!enabledShippingRewards.length) {
    return { operations: [] };
  }

  // ── Cart context ──────────────────────────────────────────────
  const cartLines = input.cart.lines;
  const cartTotal = cartLines.reduce((sum, l) => sum + Number(l.cost.subtotalAmount.amount), 0);
  const cartQty = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const isLoggedIn = !!input.cart.buyerIdentity?.isAuthenticated;
  const hasSubscription = input.cart.attribute?.value === 'true';

  const cartProductIds = new Set(
    cartLines.map(l => l.merchandise?.product?.id).filter(Boolean)
  );

  const ctx = { cartTotal, cartQty, isLoggedIn, hasSubscription, cartProductIds };

  const matchingReward = enabledShippingRewards.find(r => triggersPass(r.triggers, ctx));
  if (!matchingReward) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: matchingReward.title || 'Free Shipping',
              targets: [{ deliveryGroup: { id: firstDeliveryGroup.id } }],
              value: { percentage: { value: 100 } },
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
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

    case 'specific_collections':
      return true;

    default:
      return true;
  }
}
