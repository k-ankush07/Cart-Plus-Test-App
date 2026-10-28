// Custom HTML / CSS rows added from the sidebar, saved in cartSettings.customBlocks as
// [{ id, label, type: "html" | "css", code, enabled }]
export const CUSTOM_BLOCK_MAX_LENGTH = 65535;
export const CUSTOM_BLOCK_PREFIX = "custom-";
export const CUSTOM_BLOCK_LABEL = "Custom HTML / CSS";

export const isCustomBlockKey = (key) =>
  String(key || "").startsWith(CUSTOM_BLOCK_PREFIX);

export const getCustomBlocks = (cartSettings) =>
  Array.isArray(cartSettings?.customBlocks) ? cartSettings.customBlocks : [];

// functional updaters for handleChange("cartSettings", ...)
export const addCustomBlock = (id) => (prev) => ({
  ...prev,
  customBlocks: [
    ...getCustomBlocks(prev),
    { id, label: "", type: "html", code: "", enabled: true },
  ],
});

export const patchCustomBlock = (id, patch) => (prev) => ({
  ...prev,
  customBlocks: getCustomBlocks(prev).map((b) =>
    b.id === id ? { ...b, ...patch } : b,
  ),
});

export const removeCustomBlock = (id) => (prev) => {
  const next = {
    ...prev,
    customBlocks: getCustomBlocks(prev).filter((b) => b.id !== id),
  };
  // drop it from the Header / Body / Footer order too
  if (prev?.sectionOrder) {
    next.sectionOrder = Object.fromEntries(
      Object.entries(prev.sectionOrder).map(([section, keys]) => [
        section,
        (keys || []).filter((k) => k !== id),
      ]),
    );
  }
  return next;
};

// ids of the blocks dragged into a section; every other block shows at the end of the cart
export const placedBlockIds = (cartSettings) =>
  new Set(Object.values(cartSettings?.sectionOrder || {}).flat());

export const toggleCustomBlock = (id) => (prev) => ({
  ...prev,
  customBlocks: getCustomBlocks(prev).map((b) =>
    b.id === id ? { ...b, enabled: !b.enabled } : b,
  ),
});
