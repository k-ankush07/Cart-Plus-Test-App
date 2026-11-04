// Fonts selectable under Appearance → Fonts → "Custom font" (loaded from Google Fonts).
// Keep this list in sync with CART_PLUS_FONTS in extensions/cart-drawer-app/assets/hub-cart-html.js
export const CUSTOM_FONTS = [
  "Poppins",
  "Inter",
  "Roboto",
  "Montserrat",
  "Playfair Display",
  "Open Sans",
  "Lato",
  "Nunito",
  "Raleway",
  "Merriweather",
];

export const DEFAULT_CUSTOM_FONT = CUSTOM_FONTS[0];

export const resolveCustomFont = (name) =>
  CUSTOM_FONTS.includes(name) ? name : DEFAULT_CUSTOM_FONT;

// value for the --cart-custom-font CSS variable
export const customFontCssVar = (name) => `'${resolveCustomFont(name)}'`;
