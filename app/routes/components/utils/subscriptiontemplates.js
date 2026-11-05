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
    accent: "#111827",
    accentText: "#ffffff",
    trackBg: "#eef0f3",
    trackText: "#374151",
    radius: 10,
  },
  // (the plain "Radio" and "Toggle blue" templates were dropped from the picker)
  radio_dark: {
    label: "Radio dark",
    layout: "radio",
    accent: "#111827",
    accentText: "#ffffff",
    trackBg: "#ffffff",
    trackText: "#1f2937",
    radius: 10,
  },
};

export const DEFAULT_SUBSCRIBE_LABEL = "{{selling_plan_group_name}}";