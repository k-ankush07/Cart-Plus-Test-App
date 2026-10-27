// Order of the sidebar rows, saved in cartSettings.sectionOrder as
// { Header: [...keys], Body: [...], Footer: [...] }.
// Keys missing from a saved order (older carts, new rows) are appended in their default place.
export const DEFAULT_HEADER_ORDER = [
  "Banner Image",
  "Announcement",
  "Timer",
  "Progress Bar",
];

// footer rows, in the order they were first shown
export const DEFAULT_FOOTER_ORDER = [
  "Order notes",
  "Shipping Protection & Add-ons",
  "Summary",
  "Discount code",
  "Age Verification",
  "Login",
  "Checkout Button",
  "Payment Badges",
];

export const resolveOrder = (saved, fallback) => {
  const known = (saved || []).filter((k) => fallback.includes(k));
  return [...known, ...fallback.filter((k) => !known.includes(k))];
};
