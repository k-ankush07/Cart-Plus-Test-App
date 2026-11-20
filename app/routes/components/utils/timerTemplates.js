import { mixWithWhite } from "./rewardThemes";
import { backgroundToCss } from "./background";

const ic = (name) => ({ type: "icon", name });

const NEUTRAL = ["#303030", "#ffffff", "#f1f1f1", "#161616", "#1a1a1a"];

// Colours of a template re-based on the selected template theme colour.
// Neutral / dark parts (white, black, grey) keep their look.
export const themeTimerSettings = (key, themeBg) => {
  const base = TIMER_TEMPLATES[key];
  const color = themeBg?.color;
  if (!base || !color) return {};
  const out = {};
  const isNeutral = (v) => !v || NEUTRAL.includes(String(v).toLowerCase());
  const isTint = (v) => v && !isNeutral(v) && !String(v).includes("gradient");

  // the icon always follows the theme colour (also for the neutral templates)
  if (base.iconColor) out.iconColor = color;
  if (base.iconBg && !isNeutral(base.iconBg)) out.iconBg = mixWithWhite(color, 28);
  if (base.barColor) out.barColor = color;
  if (base.barBackground && key !== "hurry_up")
    out.barBackground = mixWithWhite(color, 28);
  if (base.digitsColor && base.digitsColor === base.iconColor)
    out.digitsColor = color;
  if (isTint(base.background)) out.background = mixWithWhite(color, 12);
  // dark gradient style takes the theme colour / gradient itself
  if (String(base.background).includes("gradient"))
    out.background = backgroundToCss(themeBg) || color;
  return out;
};

export const TIMER_TEMPLATES = {
  price_expires: {
    label: "Price expires",
    style: "text",
    eyebrow: "",
    message: "This price expires in {{timer}}",
    maxLength: 40,
    subText: "",
    icon: ic("clock"),
    iconColor: "#303030",
    textColor: "#303030",
    background: "#f1f1f1",
    alignment: "center",
    minutes: 10,
  },
  limited_offer: {
    label: "Limited offer",
    style: "boxes",
    eyebrow: "Limited time offer",
    message: "Offer ends in",
    maxLength: 25,
    subText: "",
    icon: ic("bolt"),
    iconBg: "#f9c9d2",
    iconColor: "#e0314b",
    textColor: "#7a1030",
    background: "#fde8ec",
    digitsColor: "#d6283f",
    boxColor: "#ffffff",
    labelsColor: "#7a1030",
    alignment: "left",
    minutes: 60,
  },
  hurry_up: {
    label: "Hurry up",
    style: "clock",
    eyebrow: "",
    message: "Hurry up!",
    maxLength: 20,
    subText: "Offer ends in {{minutes}} minutes",
     icon: ic("clock"),
    textColor: "#ffffff",
    background: "#161616",
    barColor: "#ff3b5c",
    barBackground: "#3a3a3a",
    digitsColor: "#ffffff",
    alignment: "left",
    minutes: 15,
  },
  same_day: {
    label: "Same-day shipping",
    style: "inline",
    eyebrow: "",
    message: "Order within",
    maxLength: 30,
    subText: "for same-day shipping",
     icon: ic("clock"),
    iconBg: "#cfeedb",
    iconColor: "#1a9a4a",
    textColor: "#14351f",
    background: "#e6f6ec",
    digitsColor: "#1a9a4a",
    alignment: "left",
    minutes: 134,
  },
  special_discount: {
    label: "Special discount",
    style: "rings",
    eyebrow: "Special discount",
    message: "Ends in",
    maxLength: 20,
    subText: "",
    icon: ic("discount"),
    iconBg: "#d8cfff",
    iconColor: "#5b2fd0",
    textColor: "#2d1b69",
    background: "#ebe6ff",
    digitsColor: "#2d1b69",
    labelsColor: "#2d1b69",
    barColor: "#4b2fc0",
    barBackground: "#d8cfff",
    alignment: "left",
    minutes: 120,
  },
  flash_sale: {
    label: "Flash sale",
    style: "boxes",
    eyebrow: "Flash sale",
    message: "Ends in",
    maxLength: 20,
    subText: "",
   icon: ic("bolt"),  
    iconBg: "#ffffff",
    iconColor: "#ff4d1f",
    textColor: "#ffffff",
    background: "linear-gradient(90deg, #ff5a1f, #e8310f)",
    digitsColor: "#ffffff",
    boxColor: "#5c1608",
    labelsColor: "#ffffff",
    alignment: "left",
    minutes: 180,
  },
  deal_bar: {
    label: "Deal bar",
    style: "bar",
    eyebrow: "",
    message: "Deal ends in",
    maxLength: 20,
    subText: "",
     icon: ic("hourglass"), 
    iconBg: "#efe8ff",
    iconColor: "#6b3fd4",
    textColor: "#1a1a1a",
    background: "#ffffff",
    digitsColor: "#1a1a1a",
    barColor: "#5b2fd0",
    barBackground: "#ddd0ff",
    alignment: "left",
    minutes: 15,
  },
  offer_progress: {
    label: "Offer progress",
    style: "progress",
    eyebrow: "",
    message: "Offer expires soon",
    maxLength: 30,
    subText: "",
    icon: ic("clock"),
    iconColor: "#303030",
    textColor: "#303030",
    background: "#ffffff",
    digitsColor: "#303030",
    barColor: "#888888",
    barBackground: "#dddddd",
    alignment: "left",
    minutes: 10,
  },
};
