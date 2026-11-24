export const newOffer = () => ({
  id: `offer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  mode: null,
  selected: { type: "products", items: [] },
  discountType: "percentage",
  discountValue: 10,
  showLabel: true,
  label: "Save {{saved_percentage}}",
});

// default offer: fixed id, taaki isDefault comparison sahi chale
const DEFAULT_OFFER = {
  id: "offer-default",
  mode: "auto",
  selected: { type: "products", items: [] },
  discountType: "percentage",
  discountValue: 10,
  showLabel: true,
  label: "Save {{saved_percentage}}",
};

export const ONE_TICK_DEFAULTS = {
  enabled: false,
  title: "You might also like",
  icon: { type: "icon", name: "magic" },
  iconColor: "#000000",
  layout: "list",
  trigger: "button",
  buttonLabel: "Add",
  offers: [DEFAULT_OFFER], // <-- ab ek offer default open rahega
  imageSize: 240,
  radius: 8,
  primaryTextColor: "#000000",
  secondaryTextColor: "#616161",
  buttonRadius: 6,
  buttonFontSize: 14,
  buttonBackground: { type: "plain", color: "#303030" },
  buttonTextColor: "#ffffff",
  cardBackground: null,
  itemSpacing: 5,
};


// Button background: a colour the merchant picked wins; the untouched default
// (#303030) follows the selected template theme colour / gradient.
export const oneTickButtonBg = (oneTick, themeBg) => {
  const bg = oneTick?.buttonBackground;
  const untouched =
    !bg || (bg.type === "plain" && String(bg.color).toLowerCase() === "#303030");
  return untouched && themeBg ? themeBg : bg;
};

export const getOneTick =(cartSettings) => {
  const merged = { ...ONE_TICK_DEFAULTS, ...(cartSettings?.oneTick || {}) };
  if (!merged.offers || merged.offers.length === 0) {
    merged.offers = ONE_TICK_DEFAULTS.offers;
  }
  return merged;
};

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `oneTick` key is dropped, so the save bar goes away.
export const patchOneTick = (patch) => (prev) => {
  const { oneTick: _old, ...rest } = prev || {};
  const next = { ...ONE_TICK_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(ONE_TICK_DEFAULTS);
  return isDefault ? rest : { ...rest, oneTick: next };
};

export const toggleOneTick = (prev) =>
  patchOneTick({ enabled: !getOneTick(prev).enabled })(prev);

// Every offer needs a product source, and a manual one needs a product picked.
// Returns the message to show when the cart can't be saved yet, or null when it's fine.
export const oneTickProblem = (cartSettings) => {
  const t = getOneTick(cartSettings);
  if (!t.enabled) return null;
  for (let i = 0; i < t.offers.length; i++) {
    const offer = t.offers[i];
    if (offer.mode !== "auto" && offer.mode !== "manual")
      return `One Tick Upsell, Offer ${i + 1}: choose "Auto-recommend" or "Manual selection" and select a product first.`;
    const items = offer.selected?.items;
    if (
      offer.mode === "manual" &&
      !(items?.variants?.length || items?.titles?.length)
    )
      return `One Tick Upsell, Offer ${i + 1}: select at least one product first.`;
  }
  return null;
};

// price after the offer's discount, plus what was saved
export const applyDiscount = (offer, price) => {
  const base = Number(price) || 0;
  const value = Number(offer.discountValue) || 0;
  let final = base;
  if (offer.discountType === "percentage") final = base * (1 - Math.min(100, value) / 100);
  if (offer.discountType === "amount") final = base - value;
  final = Math.max(0, final);
  const saved = base - final;
  return {
    final,
    saved,
    percent: base ? Math.round((saved / base) * 100) : 0,
  };
};
