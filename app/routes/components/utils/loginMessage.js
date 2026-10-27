// Login message lives in cartSettings.login (saved with the cart settings).
// The Empty cart has its own copy under cartSettings.emptyLogin, so the two never share data.
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

export const EMPTY_LOGIN_KEY = "emptyLogin";

export const getLogin = (cartSettings, key = "login") => ({
  ...LOGIN_DEFAULTS,
  ...(cartSettings?.[key] || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the key is dropped, so the save bar goes away.
export const patchLogin =
  (patch, key = "login") =>
  (prev) => {
    const { [key]: _old, ...rest } = prev || {};
    const next = { ...LOGIN_DEFAULTS, ...(_old || {}), ...patch };
    const isDefault = JSON.stringify(next) === JSON.stringify(LOGIN_DEFAULTS);
    return isDefault ? rest : { ...rest, [key]: next };
  };

export const toggleLogin = (prev, key = "login") =>
  patchLogin({ enabled: !getLogin(prev, key).enabled }, key)(prev);

export const toggleEmptyLogin = (prev) => toggleLogin(prev, EMPTY_LOGIN_KEY);
