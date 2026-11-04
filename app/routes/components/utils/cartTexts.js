// Editable cart texts ("Edit translations"). Overrides live in designSettings.texts
// as { [key]: string } and only hold values that differ from the default, so an
// untouched cart has no `texts` key at all.
//
// Keep the defaults for the keys marked `storefront` in sync with the
// CART_PLUS_TEXT_DEFAULTS object in extensions/cart-drawer-app/assets/hub-utils.js
export const CART_TEXTS = [
  { key: "youSave", label: "You save {{amount_saved}}", vars: true, setting: "savingsText" },
  { key: "addToCart", label: "Add to cart" },
  { key: "outOfStock", label: "Out of stock" },
  { key: "cannotAddMore", label: "Cannot add more of this item to the cart" },
  { key: "cartLoadError", label: "There was an error loading your cart." },
  { key: "canStillCheckout", label: "You can still checkout" },
  {
    key: "invalidDiscount",
    label: "The discount code you entered is invalid or cannot be applied to this cart",
  },
  { key: "free", label: "Free", storefront: true },
  { key: "hideItems", label: "Hide {{total_components}} items", vars: true },
  { key: "showItems", label: "Show {{total_components}} items", vars: true },
  { key: "daysUnit", label: "day/s" },
  { key: "weeksUnit", label: "week/s" },
  { key: "monthsUnit", label: "month/s" },
  { key: "yearsUnit", label: "year/s" },
];

export const CART_TEXT_DEFAULTS = Object.fromEntries(
  CART_TEXTS.map((t) => [t.key, t.label]),
);

export const getCartText = (designSettings, key) => {
  const v = designSettings?.texts?.[key];
  return typeof v === "string" && v.trim() ? v : CART_TEXT_DEFAULTS[key] ?? "";
};

// functional updater for handleChange("design", ...). Empty / default values are
// dropped; when nothing is left the `texts` key goes too (no false "unsaved changes").
export const patchCartText = (key, value) => (prev) => {
  const { texts: old, ...rest } = prev || {};
  const next = { ...(old || {}) };
  if (!value || !value.trim() || value === CART_TEXT_DEFAULTS[key]) delete next[key];
  else next[key] = value;
  return Object.keys(next).length ? { ...rest, texts: next } : rest;
};

// Item savings badge in the editor preview. `prefix` is cartSettings.savingsText:
// with a {{amount_saved}} placeholder the amount goes there, otherwise "<prefix> <amount>"
// (same as the storefront badge).
export const savingsLabel = (prefix, amount) => {
  const placeholder = /\{+\s*amount_saved\s*\}+/gi;
  const text = String(prefix ?? "");
  if (placeholder.test(text)) {
    placeholder.lastIndex = 0;
    return text.replace(placeholder, () => amount);
  }
  return `${text} ${amount}`;
};
