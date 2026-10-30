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

export const getTheme = (style, overrides = {}) => {
  const clean = Object.fromEntries(
    Object.entries(overrides || {}).filter(([, v]) => v !== undefined && v !== null),
  );
  return { ...COMMON, ...THEMES[style], ...EXTRA[style], ...clean };
};