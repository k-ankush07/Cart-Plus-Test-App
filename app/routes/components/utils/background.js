import { createContext, useContext } from "react";
import { TEMPLATE_DEFAULTS } from "./templateTheme";

// Shape used by the reusable <BackgroundInput />:
//   { type: "plain" | "gradient", color, color2, angle }

export const DEFAULT_BACKGROUND = {
  type: "plain",
  color: "#ffffff",
  color2: "#e2e2e2",
  angle: 135,
};

// The colour/gradient picked in the Template tab. Every BackgroundInput starts
// from it (and previews fall back to it) until its own value is set.
export const TemplateBackgroundContext = createContext(undefined);
export const useTemplateBackground = () => useContext(TemplateBackgroundContext);

// Template design settings -> background object (undefined for carts that never
// touched the Template options, so their existing look is kept)
export const templateBackground = (ds) => {
  if (!ds?.colorMode) return undefined;
  const t = { ...TEMPLATE_DEFAULTS, ...ds };
  return t.colorMode === "gradient"
    ? {
        type: "gradient",
        color: t.gradientStart,
        color2: t.gradientEnd,
        angle: Number(t.gradientAngle) || 0,
      }
    : { type: "plain", color: t.themeColor };
};

// CSS `background` value for a background object (undefined when not set)
export const backgroundToCss = (bg) => {
  if (!bg) return undefined;
  if (bg.type === "gradient") {
    const angle = Number(bg.angle) || 0;
    return `linear-gradient(${angle}deg, ${bg.color || DEFAULT_BACKGROUND.color}, ${bg.color2 || DEFAULT_BACKGROUND.color2})`;
  }
  return bg.color || undefined;
};
