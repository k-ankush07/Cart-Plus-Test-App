// Cart summary lives in cartSettings.summary (saved with the cart settings).
export const SUMMARY_DEFAULTS = {
  enabled: false,
  title: "Summary",
  expandable: false,
  collapsedByDefault: true,
  showSubtotal: true,
  subtotalLabel: "Subtotal",
  showDiscountsRow: true,
  discountsRowLabel: "Savings",
  compareAtSavings: true,
  compareAtMode: "original", // "original" | "percentage"
  showShipping: true,
  shippingLabel: "Shipping",
  showShippingFree: true,
  shippingFreeLabel: "Free",
  showAppliedDiscounts: true,
  appliedDiscountsLabel: "Discounts",
  design: "classic", // "classic" | "card" | "striped"
  showIcons: false,
  titleIcon: { type: "icon", name: "receipt" }, // IconLibrary value, shown before the title
  textColor: "#303030",
  background: null, // BackgroundInput value, null = cart default
};

export const SUMMARY_DESIGNS = [
  { label: "Classic", value: "classic" },
  { label: "Card", value: "card" },
  { label: "Striped", value: "striped" },
];

export const COMPARE_AT_OPTIONS = [
  { label: "Original compare-at price", value: "original" },
  { label: "Savings percentage", value: "percentage" },
];

export const getSummary = (cartSettings) => ({
  ...SUMMARY_DEFAULTS,
  ...(cartSettings?.summary || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `summary` key is dropped, so the save bar goes away.
export const patchSummary = (patch) => (prev) => {
  const { summary: _old, ...rest } = prev || {};
  const next = { ...SUMMARY_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(SUMMARY_DEFAULTS);
  return isDefault ? rest : { ...rest, summary: next };
};

export const toggleSummary = (prev) =>
  patchSummary({ enabled: !getSummary(prev).enabled })(prev);
