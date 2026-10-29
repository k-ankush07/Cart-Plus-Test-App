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
   mode: null,
  selected: { type: "products", items: [] },
  discountType: "percentage",
  discountValue: 10,
  showLabel: true,
  label: "Save {{saved_percentage}}",
};

export const ONE_TICK_DEFAULTS = {
  enabled: false,
  title: "You might also like",
  icon: { type: "icon", name: "star" },
  iconColor: "#000000",
  layout: "list",
  trigger: "button",
  buttonLabel: "Add",
  offers: [DEFAULT_OFFER], // <-- ab ek offer default open rahega
  imageSize: 120,
  radius: 8,
  primaryTextColor: "#000000",
  secondaryTextColor: "#616161",
  buttonRadius: 6,
  buttonFontSize: 14,
  buttonBackground: { type: "plain", color: "#303030" },
  buttonTextColor: "#ffffff",
  cardBackground: null,
};


export const getOneTick = (cartSettings) => {
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
