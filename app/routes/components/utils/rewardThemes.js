export const THEMES = {
  card: { bg: "#ffffff", accent: "#1a1a1a", track: "#e5e5e5" },
  gift: { bg: "#e6f6ec", accent: "#1a9a4a", track: "#c4e8d1" },
  ring: { bg: "#efeaff", accent: "#4b2fc0", track: "#d8cfff" },
  unlock: { bg: "#fff8ea", accent: "#f59e0b", track: "#f6e3b8" },
  striped: { bg: "#eef4ff", accent: "#2563eb", track: "#d6e2fb" },
  almost: { bg: "#fff0f2", accent: "#e11d48", track: "#f9cdd5" },
};

const COMMON = {
  textColor: "#1a1a1a",
  iconBg: "#ffffff",
  iconColor: "",      
  radius: 14,
  padding: 14,
  fontSize: 14,
  barHeight: 6,
  showIcon: true,
  showLabels: true,
  dotSize: 18,
  iconSize: 20,
};

const ic = (name) => ({ type: "icon", name });

const EXTRA = {
  card: { icon: ic("delivery") },
  gift: { icon: ic("gift") },
  ring: { ringSize: 44, subText: "Only {remaining} more to go", showNext: true, nextBg: "#ffffff" },
  unlock: { titleWidth: 34 },
  striped: { icon: ic("product"), showNext: true, nextBg: "#ffffff" },
  almost: {
    icon: ic("star"),
    buttonText: "Shop more →",
    buttonBg: "",
    buttonColor: "#ffffff",
    showButton: true,
    showCounter: true,
  },
};

// Default colours follow the selected template theme colour (like the other
// bar styles do); explicit per-style overrides still win.
export const mixWithWhite =(hex, pct) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.replace(/./g, (x) => x + x);
  const n = parseInt(h, 16);
  const ch = (v) =>
    Math.round(v * (pct / 100) + 255 * (1 - pct / 100))
      .toString(16)
      .padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

const followTheme = (style, themeColor) => {
  if (!themeColor || !THEMES[style]) return {};
  const mix = (pct) => mixWithWhite(themeColor, pct);
  return { accent: themeColor, bg: mix(12), track: mix(28) };
};

export const getTheme = (style, overrides = {}, themeColor) => {
  const clean = Object.fromEntries(
    Object.entries(overrides || {}).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return {
    ...COMMON,
    ...THEMES[style],
    ...EXTRA[style],
    ...followTheme(style, themeColor),
    ...clean,
  };
};