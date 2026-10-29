// Timer section lives in headerSettings.timer (saved with the header settings).
export const TIMER_DEFAULTS = {
  enabled: false,
  style: "text", // "text" | "digits" | "bar"
  message: "This offer expires in {{timer}}",
  icon: { type: "icon", name: "clock" },
  iconColor: "#000000",
  alignment: "center", // "left" | "center" | "right"
  minutes: 10,
  removeProducts: false,
  labels: { days: "days", hrs: "hrs", min: "min", sec: "sec" },
  background: null, // BackgroundInput value, null = transparent
  // Styles card (null = follow the theme / text color)
  digitsColor: null,
  labelsColor: null,
  boxColor: null,
  barColor: null,
  barBackground: null,
};

export const getTimer = (headerSettings) => ({
  ...TIMER_DEFAULTS,
  ...(headerSettings?.timer || {}),
  labels: { ...TIMER_DEFAULTS.labels, ...(headerSettings?.timer?.labels || {}) },
});

// functional updater for handleChange("header", ...)
// Back at all defaults → the `timer` key is dropped, so the save bar goes away.
export const patchTimer = (patch) => (prev) => {
  const { timer: _old, ...rest } = prev || {};
  const next = { ...TIMER_DEFAULTS, ...(_old || {}), ...patch };
  next.labels = { ...TIMER_DEFAULTS.labels, ...(next.labels || {}) };
  const isDefault = JSON.stringify(next) === JSON.stringify(TIMER_DEFAULTS);
  return isDefault ? rest : { ...rest, timer: next };
};

export const toggleTimer = (prev) =>
  patchTimer({ enabled: !getTimer(prev).enabled })(prev);

export const formatParts = (totalSeconds) => {
  const s = Math.max(0, totalSeconds);
  return {
    days: Math.floor(s / 86400),
    hrs: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    sec: s % 60,
  };
};

export const pad = (n) => String(n).padStart(2, "0");
