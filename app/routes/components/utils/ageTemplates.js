const plain = (color) => ({ type: "plain", color });

const BASE = {
  background: plain("#ffffff"),
  borderColor: "#e5e5e5",
  borderRadius: 12,
  accent: "#111827",       
  accentText: "#ffffff",
  secondaryBg: "#f1f3f5",  
  secondaryText: "#1a1a1a",
  badgeColor: "#e5383b", 
  yesText: "Yes, I am {{minimumAge}}+",
  noText: "No, I am under {{minimumAge}}+",
  continueText: "Continue",
};

export const AGE_TEMPLATES = {
  inline_yes_no: {
    label: "Inline Yes / No",
    layout: "inline",
    ...BASE,
    checkboxText: "Are you {{minimumAge}} or older?",
    subtitle: "",
    yesText: "Yes",
    noText: "No",
  },
  toggle: {
    label: "Toggle",
    layout: "toggle",
    ...BASE,
    checkboxText: "I am {{minimumAge}} or older",
    subtitle: "",
    accent: "#059669",
    badgeColor: "#111827",
  },
  confirm_continue: {
    label: "Confirm + Continue",
    layout: "confirm",
    ...BASE,
    checkboxText: "I confirm I am {{minimumAge}} years or older.",
    subtitle: "",
    accent: "#111827",
  },
  small_badge: {
    label: "Small badge",
    layout: "badge-row",
    ...BASE,
    checkboxText: "Are you {{minimumAge}} or older?",
    subtitle: "",
    badgeColor: "#111827",
  },
  big_badge: {
    label: "Big badge",
    layout: "badge-stack",
    ...BASE,
    checkboxText: "Are you {{minimumAge}} or older?",
    subtitle: "",
    accent: "#0f172a",
  },
  title_blue: {
    label: "Title + blue",
    layout: "title",
    ...BASE,
    checkboxText: "Are you {{minimumAge}} or older?",
    subtitle: "You must be {{minimumAge}} years or older to enter this site.",
    accent: "#0ea5e9",
  },
};

export const CLASSIC_BASE = {
  checkboxText: "I confirm I am {{minimumAge}} years or older.",
  subtitle: "This cart contains items you must be {{minimumAge}} or older to purchase.",
  background: { type: "plain", color: "#ffffff" },
  borderColor: "#e5e5e5",
  borderRadius: 12,
};