const ic = (name) => ({ type: "icon", name });

/**
 * Every customizable part lives here with its default.
 * "" means "inherit" (e.g. headingColor "" -> follows text/accent colour).
 * A saved value in discountCodesSettings always wins over these defaults.
 */
export const TOKEN_DEFAULTS = {
  // container
  bg: "#ffffff",
  textColor: "#1a1a1a",
  accent: "#16803c",
  radius: 16,
  padding: 16,
  shadow: true,

  // savings banner
  showBanner: true,
  heading: "You're Saving",
  headingColor: "",
  amountColor: "",
  amountSize: 18,
  bannerBg: "", // "" = soft gradient from accent
  bannerRadius: 12,
  badgeBg: "",
  badgeColor: "#ffffff",
  badgeRadius: 22,
  badgeText: "%",

  // pill (compact: "N Discounts Applied", chip: "Remove All")
  appliedLabel: "{n} Discounts Applied",
  clearAllText: "Remove All",
  pillBg: "#ffffff",
  pillColor: "",
  pillBorder: "",

  // applied list (compact rows)
  showList: true,
  rowColor: "",
  rowIconColor: "",
  rowAmountColor: "",
  rowDivider: "#eceef0",
  removeColor: "",

  // applied chips (chip badges)
  chipBg: "",
  chipColor: "",
  chipRadius: 10,

  // links
  showMoreOffers: true,
  moreOffersText: "more offers",
  moreOffersColor: "",
  showEnterLink: true,
  linkText: "Enter a coupon code",
  linkColor: "",
  icon: ic("gift"),
  iconColor: "",

  // input + button
  inputBg: "#ffffff",
  inputColor: "",
  inputBorder: "#dcdcdc",
  inputRadius: 8,
  buttonBg: "",
  buttonColor: "#ffffff",
  buttonRadius: 8,
  showDashedBox: false,
  dashedColor: "",
  dashedRadius: 12,

  // misc
  invalidColor: "#D72C0D",
};

// Classic uses the storefront CSS classes; these stay empty so nothing is
// overridden until the merchant sets a value.
export const CLASSIC_DEFAULTS = {
  inputBg: "",
  inputBorder: "",
  inputRadius: "",
  inputColor: "",
  buttonBg: "",
  buttonColor: "",
  buttonRadius: "",
  iconColor: "",
};

// Only the two non-classic templates. Classic = template "".
export const DISCOUNT_TEMPLATES = {
  compact_card: {
    label: "Compact card",
    layout: "compact",
    heading: "You're Saving",
    textColor: "#1a1a1a",
    accent: "#16803c",
    badgeRadius: 22,
    showDashedBox: false,
    showMoreOffers: true,
    icon: ic("gift"),
  },
  chip_badges: {
    label: "Chip badges",
    layout: "chipbadges",
    heading: "Total Savings",
    textColor: "#2b1a5c",
    accent: "#6d4bc3",
    badgeRadius: 12,
    showDashedBox: true,
    showMoreOffers: false,
    icon: ic("discount"),
  },
};

/** Keys cleared when a template is (re)selected, so defaults apply again. */
export const TOKEN_KEYS = Object.keys(TOKEN_DEFAULTS);

export const getLayout = (template) =>
  template ? DISCOUNT_TEMPLATES[template]?.layout : undefined;

/** Saved settings + template defaults -> final values (with colour fallbacks). */
export const resolveDiscountStyle = (s = {}) => {
  const tpl = s.template || "";
  const d = {
    ...TOKEN_DEFAULTS,
    ...(tpl ? DISCOUNT_TEMPLATES[tpl] || {} : CLASSIC_DEFAULTS),
  };
  const t = { layout: d.layout };

  Object.keys(d).forEach((k) => {
    if (k === "layout" || k === "label") return;
    t[k] = s[k] !== undefined && s[k] !== null && s[k] !== "" ? s[k] : d[k];
  });

  if (!t.layout) return t; // classic: raw values only

  const chip = t.layout === "chipbadges";
  t.headingColor ||= chip ? t.accent : t.textColor;
  t.amountColor ||= chip ? t.accent : t.textColor;
  t.badgeBg ||= t.accent;
  t.pillColor ||= t.accent;
  t.pillBorder ||= `${t.accent}55`;
  t.rowColor ||= t.textColor;
  t.rowIconColor ||= t.textColor;
  t.rowAmountColor ||= t.textColor;
  t.removeColor ||= t.textColor;
  t.chipBg ||= `${t.accent}1a`;
  t.chipColor ||= t.accent;
  t.moreOffersColor ||= t.accent;
  t.linkColor ||= t.textColor;
  t.iconColor ||= t.accent;
  t.inputColor ||= t.textColor;
  t.buttonBg ||= t.accent;
  t.dashedColor ||= `${t.accent}55`;
  t.bannerBg ||= `linear-gradient(90deg, ${t.accent}1f, ${t.accent}0d)`;
  return t;
};