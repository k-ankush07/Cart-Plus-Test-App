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
  design: "classic", // summary layout template
  showIcons: false, // icons on the rows (fixed icons, show / hide only)
  showTitleIcon: undefined, // heading icon (changeable); falls back to showIcons for older saves
  titleIcon: { type: "icon", name: "receipt" }, // IconLibrary value, shown before the title
  textColor: "#303030",
  background: null,
  showSavingsBanner: true,
  savingsBannerText: "You're saving {amount} on this order",
  savingsBannerBg: "#b6eb98",
  savingsBannerTextColor: "#1d2b1a",
};

export const SUMMARY_DESIGNS = [
  { label: "Classic", value: "classic" },
  { label: "Card", value: "card" },
  { label: "Striped", value: "striped" },
  { label: "Bill details", value: "bill-details" },
  { label: "Bill Summary", value: "bill-summary" },
  { label: "Price Details", value: "price-details" },
];

export const COMPARE_AT_OPTIONS = [
  { label: "Original compare-at price", value: "original" },
  { label: "Savings percentage", value: "percentage" },
];

export const getSummary = (cartSettings) => {
  const s = { ...SUMMARY_DEFAULTS, ...(cartSettings?.summary || {}) };
  return { ...s, showTitleIcon: s.showTitleIcon ?? s.showIcons ?? false };
};

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
