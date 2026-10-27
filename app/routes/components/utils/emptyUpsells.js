import { defaultUpsellsSettings } from "../constants/cartDefaults";

// The Empty cart's Cross-sell: same settings page and preview as "Item in cart",
// but its own data, kept in cartSettings.emptyUpsells. Off by default
// (upsellsSettings.enabled === true means switched off).
export const EMPTY_UPSELLS_DEFAULTS = { ...defaultUpsellsSettings, enabled: true };

export const getEmptyUpsells = (cartSettings) => ({
  ...EMPTY_UPSELLS_DEFAULTS,
  ...(cartSettings?.emptyUpsells || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the key is dropped, so the save bar goes away.
export const patchEmptyUpsells = (updater) => (prev) => {
  const { emptyUpsells: _old, ...rest } = prev || {};
  const current = { ...EMPTY_UPSELLS_DEFAULTS, ...(_old || {}) };
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  const isDefault = JSON.stringify(next) === JSON.stringify(EMPTY_UPSELLS_DEFAULTS);
  return isDefault ? rest : { ...rest, emptyUpsells: next };
};

export const toggleEmptyUpsells = (prev) =>
  patchEmptyUpsells((cur) => ({ ...cur, enabled: !cur.enabled }))(prev);

// handleChange for <UpsellsSettings />: its "upsellsSettings" updates land in cartSettings.emptyUpsells
export const emptyUpsellsHandleChange = (handleChange) => (type, updater) => {
  if (type === "upsellsSettings") handleChange("cartSettings", patchEmptyUpsells(updater));
  else handleChange(type, updater);
};
