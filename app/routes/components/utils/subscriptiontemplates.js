import { mixWithWhite } from "./rewardThemes";
import { backgroundToCss } from "./background";

// Templates for the "Upgrade subscription" block.
// layout: "button" (upgrade button) | "toggle" (segmented Subscribe | One-time) | "radio" (two option rows)
// null = use the cart's design (theme) value, so `default` keeps today's look.
export const SUBSCRIPTION_TEMPLATES = {
  default: {
    label: "Default",
    layout: "button",
    accent: null, // theme button colour / gradient
    accentText: null, // theme button text colour
    trackBg: "#f5f5f5",
    trackText: "#374151",
    radius: null, // theme button radius
  },
//   toggle: {
//     label: "Toggle",
//     layout: "toggle",
//     accent: "#008a3e",
//     accentText: "#ffffff",
//     trackBg: "#f5f5f5",
//     trackText: "#374151",
//     radius: 999,
//   },
  toggle_dark: {
    label: "Toggle dark",
    layout: "toggle",
    accent: null, // follows the theme colour
    accentText: "#ffffff",
    trackBg: null, // theme tint
    // fallbacks used by the picker preview / when no theme colour is set
    previewAccent: "#111827",
    previewTrackBg: "#eef0f3",
    trackText: "#374151",
    radius: 10,
  },
  // (the plain "Radio" and "Toggle blue" templates were dropped from the picker)
  radio_dark: {
    label: "Radio dark",
    layout: "radio",
    accent: null, // follows the theme colour
    accentText: "#ffffff",
    trackBg: null, // theme tint
    previewAccent: "#111827",
    previewTrackBg: "#ffffff",
    trackText: "#1f2937",
    radius: 10,
  },
};

// Theme-based colours for the toggle / radio templates: the chosen Template
// colour gives the active colour, a light tint for the background and border.
export const subscriptionThemeColors = (themeBg) => {
  const color = themeBg?.color;
  if (!color) return {};
  return {
    accent: backgroundToCss(themeBg), // may be a gradient: backgrounds only
    solid: color, // plain colour for borders / dots
    trackBg: mixWithWhite(color, 10),
    border: mixWithWhite(color, 30),
  };
};

export const DEFAULT_SUBSCRIBE_LABEL = "{{selling_plan_group_name}}";