// "Template" settings (layout, colors, surface tint, corner radii) and the
// helper that turns them into the values the cart preview renders with.

export const PLAIN_COLORS = [
  "#FF2D2D", "#FF7A00", "#FFCC4D", "#A020F0", "#FF7B7B", "#A8938F", "#BFE02B",
  "#6B1A0F", "#0B1B5C", "#2A0A0A", "#5B1A8C", "#2E5E0A", "#2A8FA0",
];

export const GRADIENTS = [
  { start: "#1A56DB", end: "#7DB3F8" },
  { start: "#A855F7", end: "#D8B4FE" },
  { start: "#E11D6B", end: "#F472A8" },
  { start: "#F97316", end: "#FDBA74" },
  { start: "#16A34A", end: "#4ADE80" },
  { start: "#06B6D4", end: "#67E8F9" },
  { start: "#4338CA", end: "#818CF8" },
  { start: "#F43F5E", end: "#FB923C" },
  { start: "#C026D3", end: "#F59E0B" },
  { start: "#65A30D", end: "#FACC15" },
  { start: "#0F172A", end: "#1E293B" },
  { start: "#3F2305", end: "#7C4A1D" },
];

export const TEMPLATE_DEFAULTS = {
  layout: "sidebar", // "sidebar" | "floating"
  colorMode: "gradient", // "plain" | "gradient"
  themeColor: PLAIN_COLORS[0],
  gradientStart: GRADIENTS[0].start,
  gradientEnd: GRADIENTS[0].end,
  gradientAngle: 135,
  appearance: "light", // "light" | "dark"
  tintHeader: 5,
  tintBody: 10,
  tintFooter: 5,
  radiusButtons: 6,
  radiusCards: 12,
  radiusFields: 10,
  radiusImages: 5,
  radiusDrawer: 14,
};

const mix = (color, pct, surface) =>
  `color-mix(in srgb, ${color} ${pct}%, ${surface})`;

/**
 * Returns the design settings the preview should render with.
 * Carts that never touched the Template options (no `colorMode`) are returned
 * unchanged, so their existing look is kept.
 */
export function applyTemplateTheme(ds) {
  if (!ds || !ds.colorMode) return ds;
  const t = { ...TEMPLATE_DEFAULTS, ...ds };

  const dark = t.appearance === "dark";
  const surface = dark ? "#1c1c1e" : "#ffffff";
  const text = dark ? "#f3f3f3" : "#121212";
  const gradient = t.colorMode === "gradient";
  const angle = Number(t.gradientAngle) || 0;

  const accent = gradient
    ? `linear-gradient(${angle}deg, ${t.gradientStart}, ${t.gradientEnd})`
    : t.themeColor;

  const tinted = (pct) =>
    gradient
      ? `linear-gradient(${angle}deg, ${mix(t.gradientStart, pct, surface)}, ${mix(t.gradientEnd, pct, surface)})`
      : mix(t.themeColor, pct, surface);

  const solidFooter = mix(
    gradient ? t.gradientStart : t.themeColor,
    t.tintFooter,
    surface,
  );

  return {
    ...ds,
    themed: true,
    dark, // Appearance: Dark -> sections pick dark defaults (see .cart-app--dark in index.css)
    backgroundColor: surface,
    textColor: text,
    subtotalColor: text,
    accentColor: solidFooter,
    buttonColor: accent,
    buttonTextColor: "#ffffff",
    buttonRadius: String(t.radiusButtons),
    headerBackground: tinted(t.tintHeader),
    bodyBackground: tinted(t.tintBody),
    footerBackground: tinted(t.tintFooter),
    cardRadius: Number(t.radiusCards),
    fieldRadius: Number(t.radiusFields),
    imageRadius: Number(t.radiusImages),
    drawerRadius: Number(t.radiusDrawer),
    floating: t.layout === "floating",
  };
}
