// "Products in cart" options live in cartSettings.cartItem (saved with the cart settings).
export const CART_ITEM_DEFAULTS = {
  showVariants: true,
  showQuantity: true,
  showQuantityError: false,
  quantityErrorMessage:
    "Sorry, the available quantity for this product has been reached.",
  showtextLimit:false,
  textLimit:40,
  showCompareAt: true,
  showDiscountTag: true,
  showSavings: null, // null = follow cartSettings.showSavingsBelowPrices
  singleItemPrice: false, // unit price instead of the line total
  imageSize: null, // px, null = layout default
  radius: null, // px, null = template radius
  primaryTextColor: null, // null = cart text colour
  secondaryTextColor: null,
  labelTextColor: null, // discount code tag, null = design setting
  labelBackground: null,
  deleteIcon: "trash", // "trash" | "bin" | "lid" | "x" | "x-circle"
  deleteColor: null, // null = icon colour of the design
  cardBackground: null, // BackgroundInput value
  sectionBackground: null, // BackgroundInput value
  itemGap: null, // px between products, null = 15 (the default)
  showCardBackground: true, // false = cards have no background
  showCardBorder: true, // false = cards have no border
};

export const DEFAULT_ITEM_GAP = 15;

export const getCartItemOptions = (cartSettings) => ({
  ...CART_ITEM_DEFAULTS,
  ...(cartSettings?.cartItem || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `cartItem` key is dropped, so the save bar goes away.
export const patchCartItem = (patch) => (prev) => {
  const { cartItem: _old, ...rest } = prev || {};
  const next = { ...CART_ITEM_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(CART_ITEM_DEFAULTS);
  return isDefault ? rest : { ...rest, cartItem: next };
};
