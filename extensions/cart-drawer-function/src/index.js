// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const config = JSON.parse(
    input.discountNode.metafield?.value ?? "{}"
  );

  if (!config.rewardType) {
    return {
      discounts: [],
      discountApplicationStrategy: "FIRST",
    };
  }

  // Minimum subtotal check
  if (config.minimumSubtotal && Number(config.minimumSubtotal) > 0) {
    const cartTotal = parseFloat(input.cart.cost.subtotalAmount.amount);
    if (cartTotal < Number(config.minimumSubtotal)) {
      return {
        discounts: [],
        discountApplicationStrategy: "FIRST",
      };
    }
  }

  let value;

  if (config.rewardType === "free_gift") {
    value = { percentage: { value: 100.0 } };
  } else if (config.type === "percentage") {
    value = { percentage: { value: parseFloat(config.value) * 100 } };
  } else {
    value = {
      fixedAmount: {
        amount: String(config.value),
        appliesToEachItem: false,
      },
    };
  }

  return {
    discounts: [
      {
        value,
        targets: [{ orderSubtotal: { excludedVariantIds: [] } }],
        message: "Cart Drawer Discount",
      },
    ],
    discountApplicationStrategy: "FIRST",
  };
}