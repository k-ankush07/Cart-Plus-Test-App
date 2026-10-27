// Login message lives in cartSettings.login (saved with the cart settings).
export const LOGIN_DEFAULTS = {
  enabled: false,
  beforeLink: "Have an account?",
  linkText: "Log in",
  afterLink: "to check out faster.",
  alignment: "center", // "left" | "center" | "right"
  top: 8,
  bottom: 8,
};

export const ALIGNMENT_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export const getLogin = (cartSettings) => ({
  ...LOGIN_DEFAULTS,
  ...(cartSettings?.login || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `login` key is dropped, so the save bar goes away.
export const patchLogin = (patch) => (prev) => {
  const { login: _old, ...rest } = prev || {};
  const next = { ...LOGIN_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(LOGIN_DEFAULTS);
  return isDefault ? rest : { ...rest, login: next };
};

export const toggleLogin = (prev) =>
  patchLogin({ enabled: !getLogin(prev).enabled })(prev);
