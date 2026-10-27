// Payment badges live in cartSettings.paymentBadges (saved with the cart settings).
// `badges` is the ordered list of ids shown in the cart; `custom` holds uploaded images.
export const SHOW_OPTIONS = [
  { value: "payment", label: "Payment icons" },
  { value: "trust", label: "Trust badges" },
  { value: "both", label: "Both" },
];

export const newTrustBadge = () => ({
  id: `trust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  icon: "star",
  text: "",
});

export const PAYMENT_DEFAULTS = {
  enabled: false,
  show: "payment", // "payment" | "trust" | "both"
  trustBadges: [
    { id: "trust-1", icon: "lock", text: "Secure checkout" },
    { id: "trust-2", icon: "truck", text: "Fast shipping" },
    { id: "trust-3", icon: "return", text: "Free returns" },
  ],
  badges: ["visa", "mastercard", "amex", "paypal", "applepay", "googlepay", "shoppay"],
  custom: [], // [{ id, label, image }]
  size: 28, // badge height in px
  alignment: "center", // "left" | "center" | "right"
  background: null, // BackgroundInput value, null = cart default
};

// label = text drawn on the badge, bg / fg = brand colours
export const BADGE_LIBRARY = [
  { id: "visa", name: "Visa", label: "VISA", bg: "#ffffff", fg: "#1a1f71", italic: true },
  { id: "mastercard", name: "Mastercard", mastercard: true, bg: "#ffffff" },
  { id: "amex", name: "American Express", label: "AMEX", bg: "#1f72cd", fg: "#ffffff" },
  { id: "discover", name: "Discover", label: "DISCOVER", bg: "#ffffff", fg: "#e55c20" },
  { id: "unionpay", name: "UnionPay", label: "UnionPay", bg: "#ffffff", fg: "#00447c" },
  { id: "jcb", name: "JCB", label: "JCB", bg: "#0e4c96", fg: "#ffffff" },
  { id: "maestro", name: "Maestro", label: "maestro", bg: "#ffffff", fg: "#0099df" },
  { id: "paypal", name: "PayPal", label: "PayPal", bg: "#ffffff", fg: "#003087", italic: true },
  { id: "applepay", name: "Apple Pay", label: "\uF8FF Pay", bg: "#000000", fg: "#ffffff" },
  { id: "googlepay", name: "Google Pay", label: "G Pay", bg: "#ffffff", fg: "#3c4043" },
  { id: "shoppay", name: "Shop Pay", label: "shop Pay", bg: "#5a31f4", fg: "#ffffff" },
  { id: "amazon", name: "Amazon Pay", label: "amazon", bg: "#ffffff", fg: "#232f3e" },
  { id: "klarna", name: "Klarna", label: "Klarna.", bg: "#ffb3c7", fg: "#17120f" },
  { id: "afterpay", name: "Afterpay", label: "afterpay", bg: "#b2fce4", fg: "#000000" },
  { id: "affirm", name: "Affirm", label: "affirm", bg: "#ffffff", fg: "#0fa0ea" },
  { id: "sezzle", name: "Sezzle", label: "Sezzle", bg: "#ffffff", fg: "#392558" },
  { id: "bancontact", name: "Bancontact", label: "Bancontact", bg: "#ffffff", fg: "#005498" },
  { id: "ideal", name: "iDEAL", label: "iDEAL", bg: "#ffffff", fg: "#cc0066" },
  { id: "sepa", name: "SEPA", label: "SEPA", bg: "#10298e", fg: "#ffffff" },
  { id: "alipay", name: "Alipay", label: "Alipay", bg: "#1677ff", fg: "#ffffff" },
  { id: "poli", name: "POLi", label: "POLi", bg: "#ffffff", fg: "#444444" },
  { id: "bitpay", name: "BitPay", label: "bitpay", bg: "#ffffff", fg: "#1a3b8b" },
  { id: "stripe", name: "Stripe", label: "stripe", bg: "#ffffff", fg: "#635bff", italic: true },
  { id: "interac", name: "Interac", label: "Interac", bg: "#fdd10d", fg: "#000000" },
  { id: "sofort", name: "Sofort", label: "Sofort.", bg: "#ef809f", fg: "#ffffff" },
  { id: "skrill", name: "Skrill", label: "Skrill", bg: "#ffffff", fg: "#862165" },
  { id: "payoneer", name: "Payoneer", label: "Payoneer", bg: "#ffffff", fg: "#ff4800" },
  { id: "venmo", name: "Venmo", label: "venmo", bg: "#3d95ce", fg: "#ffffff" },
  { id: "cashapp", name: "Cash App", label: "Cash App", bg: "#00d632", fg: "#ffffff" },
  { id: "diners", name: "Diners Club", label: "Diners", bg: "#ffffff", fg: "#0079be" },
];

export const getPaymentBadges = (cartSettings) => ({
  ...PAYMENT_DEFAULTS,
  ...(cartSettings?.paymentBadges || {}),
});

// id -> badge definition (library or uploaded)
export const resolveBadge = (settings, id) =>
  BADGE_LIBRARY.find((b) => b.id === id) ||
  (settings.custom || []).find((b) => b.id === id) ||
  null;

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `paymentBadges` key is dropped, so the save bar goes away.
export const patchPaymentBadges = (patch) => (prev) => {
  const { paymentBadges: _old, ...rest } = prev || {};
  const next = { ...PAYMENT_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(PAYMENT_DEFAULTS);
  return isDefault ? rest : { ...rest, paymentBadges: next };
};

export const togglePaymentBadges = (prev) =>
  patchPaymentBadges({ enabled: !getPaymentBadges(prev).enabled })(prev);
