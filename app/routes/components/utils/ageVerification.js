import { AGE_TEMPLATES } from "./ageTemplates";

// Age verification lives in cartSettings.ageVerification (saved with the cart settings).
export const AGE_DEFAULTS = {
  enabled: false,
  applyTo: "all", // "all" | "products" | "collections"
  selected: null, // { type, items } from the product / collection picker
  minimumAge: 21,
  checkboxText: "I confirm I am {{minimumAge}} years of age or older.",
  subtitle:
    "This cart contains items you must be {{minimumAge}} or older to purchase.",
  errorText: "Confirm your age to continue to checkout.",
  background: null, // BackgroundInput value, null = cart default
  borderRadius: 8,
  errorBorderRadius: 8,
  borderColor: "#dbe4f5",
  toggleColor: "#1553d8",
  errorBackground: "#fff1f1",
  errorBorderColor: "#f7b8b8",
};

export const APPLY_TO_OPTIONS = [
  { value: "all", label: "All products" },
  { value: "products", label: "Specific products" },
  { value: "collections", label: "Specific collections" },
];

// The Classic checkbox template is no longer offered, so a cart with no template
// picked falls back to the first template (Inline Yes / No).
const { label: _label, ...DEFAULT_TEMPLATE } = AGE_TEMPLATES.inline_yes_no;

// Classic wording that older saves carry; it must not override the template's text.
const CLASSIC_TEXTS = [
  "I confirm I am {{minimumAge}} years of age or older.",
  "I confirm I am {{minimumAge}} years or older.",
  "This cart contains items you must be {{minimumAge}} or older to purchase.",
];

export const getAgeVerification = (cartSettings) => {
  let saved = cartSettings?.ageVerification || {};
  if (!saved.template) {
    saved = { ...saved };
    for (const key of ["checkboxText", "subtitle"]) {
      if (CLASSIC_TEXTS.includes(saved[key])) delete saved[key];
    }
  }
  return {
    ...AGE_DEFAULTS,
    ...(saved.template ? {} : { template: "inline_yes_no", ...DEFAULT_TEMPLATE }),
    ...saved,
    ...(saved.template ? {} : { template: "inline_yes_no" }),
  };
};

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `ageVerification` key is dropped, so the save bar goes away.
export const patchAgeVerification = (patch) => (prev) => {
  const { ageVerification: _old, ...rest } = prev || {};
  const next = { ...AGE_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(AGE_DEFAULTS);
  return isDefault ? rest : { ...rest, ageVerification: next };
};

export const toggleAgeVerification = (prev) =>
  patchAgeVerification({ enabled: !getAgeVerification(prev).enabled })(prev);

// "{{minimumAge}}" -> the configured age
export const fillAge = (html, age) =>
  String(html ?? "").replace(/\{\{\s*minimumAge\s*\}\}/g, String(age));
