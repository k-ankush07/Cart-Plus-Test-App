// Banner image lives in headerSettings.banner (saved with the header settings).
export const BANNER_DEFAULTS = {
  enabled: false,
  image: "",
  width: 100, // % of the cart width
  padding: 0, // legacy: single margin on all sides (used when paddingX/paddingY are unset)
  paddingY: undefined, // px top & bottom
  paddingX: undefined, // px left & right
  radius: 0, // px
  posX: 50, // % focal point (object-position x) set via "Reposition image"
  posY: 50, // % focal point (object-position y)
};

export const getBanner = (headerSettings) => {
  const b = { ...BANNER_DEFAULTS, ...(headerSettings?.banner || {}) };
  return {
    ...b,
    paddingY: b.paddingY ?? b.padding ?? 0,
    paddingX: b.paddingX ?? b.padding ?? 0,
  };
};

// functional updater for handleChange("header", ...)
// When every value is back to its default the `banner` key is dropped, so
// undoing a change leaves the settings identical to the saved ones (no dirty save bar).
export const patchBanner = (patch) => (prev) => {
  const { banner: _old, ...rest } = prev || {};
  const next = { ...BANNER_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = Object.keys(BANNER_DEFAULTS).every(
    (key) => next[key] === BANNER_DEFAULTS[key],
  );
  return isDefault ? rest : { ...rest, banner: next };
};

export const toggleBanner = (prev) =>
  patchBanner({ enabled: !getBanner(prev).enabled })(prev);
