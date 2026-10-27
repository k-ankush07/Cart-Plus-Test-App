// Cart visibility lives in cartSettings.visibility (saved with the cart settings).
export const VISIBILITY_DEFAULTS = {
  marketMode: "all", // "all" | "except" | "specific"
  markets: [], // ids of the ticked markets
  publishMode: "immediately", // "immediately" | "schedule"
  timezone: "America/New_York",
  startDate: "", // YYYY-MM-DD
  startTime: "", // HH:MM
  endEnabled: true,
  endDate: "",
  endTime: "",
};

export const MARKET_MODES = [
  { value: "all", label: "All markets" },
  { value: "except", label: "All markets except selected" },
  { value: "specific", label: "Specific markets" },
];

const TIMEZONES = [
  ["Pacific/Honolulu", "Honolulu"],
  ["America/Anchorage", "Anchorage"],
  ["America/Los_Angeles", "Los Angeles"],
  ["America/Denver", "Denver"],
  ["America/Chicago", "Chicago"],
  ["America/New_York", "New York"],
  ["America/Toronto", "Toronto"],
  ["America/Sao_Paulo", "Sao Paulo"],
  ["Atlantic/Reykjavik", "Reykjavik"],
  ["Europe/London", "London"],
  ["Europe/Paris", "Paris"],
  ["Europe/Berlin", "Berlin"],
  ["Africa/Cairo", "Cairo"],
  ["Europe/Moscow", "Moscow"],
  ["Asia/Dubai", "Dubai"],
  ["Asia/Kolkata", "Kolkata"],
  ["Asia/Dhaka", "Dhaka"],
  ["Asia/Bangkok", "Bangkok"],
  ["Asia/Singapore", "Singapore"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
  ["Pacific/Auckland", "Auckland"],
];

// "New York (GMT-04:00)" - the offset is read from the browser, so DST is right
const offsetOf = (zone) => {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    const name = part?.value || "GMT";
    return name === "GMT" ? "GMT+00:00" : name;
  } catch {
    return "GMT";
  }
};

export const timezoneOptions = () =>
  TIMEZONES.map(([value, city]) => ({
    value,
    label: `${city} (${offsetOf(value)})`,
  }));

export const getVisibility = (cartSettings) => ({
  ...VISIBILITY_DEFAULTS,
  ...(cartSettings?.visibility || {}),
});

// functional updater for handleChange("cartSettings", ...)
// Back at all defaults -> the `visibility` key is dropped, so the save bar goes away.
export const patchVisibility = (patch) => (prev) => {
  const { visibility: _old, ...rest } = prev || {};
  const next = { ...VISIBILITY_DEFAULTS, ...(_old || {}), ...patch };
  const isDefault = JSON.stringify(next) === JSON.stringify(VISIBILITY_DEFAULTS);
  return isDefault ? rest : { ...rest, visibility: next };
};
