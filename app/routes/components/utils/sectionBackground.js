// "Background color" per sidebar section, saved in cartSettings.sectionBackgrounds as
// { [sectionKey]: { type, color, color2, angle } }.
// Sections that already have their own background card (Header, Announcement, Timer,
// Products in cart) are not listed here.
export const SECTION_BG_KEYS = [
  "Banner Image",
  "Progress Bar",
  "One Tick Upsell",
  "Upsells",
  "Recommended Products",
  "Add Notes",
  "Add ons",
  "Discount code",
  "Security Badges",
];

// sidebar row name -> the id the preview wraps the section with
export const sectionBgId = (tab) => (tab === "Order notes" ? "Add Notes" : tab);

export const getSectionBackground =(cartSettings, key) =>
  cartSettings?.sectionBackgrounds?.[key] || null;

// functional updater for handleChange("cartSettings", ...); null removes the colour.
// The `sectionBackgrounds` key is dropped once empty, so the save bar goes away.
export const patchSectionBackground = (key, background) => (prev) => {
  const { sectionBackgrounds: _old, ...rest } = prev || {};
  const next = { ...(_old || {}) };
  if (background) next[key] = background;
  else delete next[key];
  return Object.keys(next).length ? { ...rest, sectionBackgrounds: next } : rest;
};
