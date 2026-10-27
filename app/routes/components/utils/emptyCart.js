// Empty cart options live in cartSettings.emptyCart (saved with the cart settings).
// Anything left null falls back to the cart's own look / the Preferences message.
export const EMPTY_DEFAULTS = {
  message: null, // rich text; null = Preferences "Empty cart message"
  icon: { type: "icon", name: "product" }, // { type: "icon", name } | { type: "image", url }
  iconColor: "#1553d8",
  showButton: true,
  buttonText: "Continue Shopping",
  buttonUrl: "/",
  buttonRadius: 8,
  buttonFontSize: 16,
  buttonBackground: null, // BackgroundInput value, null = design settings button colour
  buttonTextColor: null, // null = design settings button text colour
  background: null, // BackgroundInput value, null = cart default
};

export const getEmptyCart = (cartSettings) => ({
  ...EMPTY_DEFAULTS,
  ...(cartSettings?.emptyCart || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `emptyCart` key is dropped, so the save bar goes away.
export const patchEmptyCart = (patch) => (prev) => {
  const { emptyCart: _old, ...rest } = prev || {};
  const next = { ...EMPTY_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(EMPTY_DEFAULTS);
  return isDefault ? rest : { ...rest, emptyCart: next };
};
