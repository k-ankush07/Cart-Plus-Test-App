export const ANNOUNCEMENT_TEMPLATES = {
  default: {
    label: "Default",
    text: "Free shipping on $50 | Free gift on $60",
    background: "transparent",
    previewBackground: "#2864df",
    previewGradient: {
      color: "#2864df",
      color2: "#75a7f7",
      angle: 90,
    },
    color: "#ffffff",
    iconColor: "#ffffff",
  },
  free_shipping: {
    label: "Free shipping",
    text: "<b>Free shipping</b> on orders over $50",
    background: "transparent",
    previewBackground: "#111111",
    color: "#ffffff",
    iconColor: "#ffffff",
  },
  coupon: {
    label: "10% OFF coupon",
    text: "<b>10% OFF</b> your first order",
    background: "transparent",
    previewBackground: "#fde8ec",
    color: "#7a1030",
    iconColor: "#7a1030",
    code: "WELCOME",
    accentBg: "#8a1538",
    accentText: "#ffffff",
  },
  vip: {
    label: "VIP members",
    text: "<b>VIP members</b> get exclusive perks",
    background: "transparent",
    previewBackground: "#fff6e5",
    color: "#3b2a00",
    iconColor: "#e5a100",
    linkText: "Learn more",
  },
  flash_sale: {
    label: "Flash Sale",
    text: "<b>Flash Sale!</b> &nbsp;|&nbsp; Extra <b>15% OFF</b> ends today",
    background: "transparent",
    previewBackground: "#ff4d5e",
    color: "#ffffff",
    iconColor: "#ffffff",
    buttonText: "Shop now →",
    accentBg: "#ffffff",
    accentText: "#ff4d5e",
  },
  free_gift: {
    label: "Free gift",
    text: "<b>Free gift</b> on orders over $60",
    background: "transparent",
    previewBackground: "#ffc93c",
    color: "#2b2100",
    iconColor: "#2b2100",
    buttonText: "View gift →",
    accentBg: "#ffffff",
    accentText: "#2b2100",
  },
};
// Theme-based parts of a template: the bar background (for "transparent"
// templates) and the button colours. The button is white with the theme colour
// as its text, so it stays readable on the themed bar.
export const themeAnnouncementSettings = (key, themeBg) => {
  const t = ANNOUNCEMENT_TEMPLATES[key];
  const color = themeBg?.color;
  if (!t || key === "default" || !color) return {};
  const out = {};
  if (t.background === "transparent") out.background = themeBg;
  if (t.accentBg) {
    out.accentBg = "#ffffff";
    out.accentText = color;
  }
  return out;
};
