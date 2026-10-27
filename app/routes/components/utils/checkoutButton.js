// Checkout button options live in cartSettings.checkoutButton (saved with the cart settings).
// Anything left null falls back to the cart's own look (design settings / Preferences).
export const CHECKOUT_DEFAULTS = {
  label: null, // rich text, supports {{Price}}; null = the Preferences button text
  radius: null, // px; null = design settings radius
  background: null, // BackgroundInput value; null = design settings button colour
  borderColor: null,
  sectionBackground: null, // BackgroundInput value behind the button
};

export const getCheckoutButton = (cartSettings) => ({
  ...CHECKOUT_DEFAULTS,
  ...(cartSettings?.checkoutButton || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `checkoutButton` key is dropped, so the save bar goes away.
export const patchCheckoutButton = (patch) => (prev) => {
  const { checkoutButton: _old, ...rest } = prev || {};
  const next = { ...CHECKOUT_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(CHECKOUT_DEFAULTS);
  return isDefault ? rest : { ...rest, checkoutButton: next };
};

// {{Price}} (and the older {{total_price}}) -> the formatted total
export const fillPrice = (html, price) =>
  String(html ?? "").replace(/\{\{\s*(?:Price|total_price)\s*\}\}/gi, price);
