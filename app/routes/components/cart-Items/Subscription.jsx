import { useState } from "react";
import {
  SUBSCRIPTION_TEMPLATES,
  DEFAULT_SUBSCRIBE_LABEL,
} from "../utils/subscriptionTemplates";

export default function Subscription({
  subscriptionUpgradesSettings,
  designSettings = {},
}) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("onetime");

  const s = subscriptionUpgradesSettings || {};
  // unknown (removed) template: closest one with the same layout, else Default
  const t =
    SUBSCRIPTION_TEMPLATES[s.template] ||
    Object.values(SUBSCRIPTION_TEMPLATES).find((x) => x.layout === s.layout) ||
    SUBSCRIPTION_TEMPLATES.default;
  const pick = (k) => s[k] ?? t[k];

  const layout = pick("layout");
  const accent = pick("accent") ?? designSettings?.buttonColor ?? "#000";
  const accentText =
    pick("accentText") ?? designSettings?.buttonTextColor ?? "#fff";
  const trackBg = pick("trackBg");
  const trackText = pick("trackText");
  const radius = pick("radius") ?? Number(designSettings?.buttonRadius) ?? 8;

  const planName = "Subscribe & Save 20%";
  const previewText = (
    s.buttonText || "Upgrade to {{selling_plan_group_name}}"
  ).replace(/\{\{selling_plan_group_name\}\}/g, planName);
  const subLabel = (s.subscribeLabel ?? DEFAULT_SUBSCRIBE_LABEL).replace(
    /\{\{selling_plan_group_name\}\}/g,
    planName,
  );
  const oneLabel = s.planOptionsOneTimePurchaseText || "One-time";

  if (layout === "button") {
    return (
      <div className="cart-plus-subscription-upgrade-dropdown subscription-upgrade-preview cart-plus-subscription-upgrade-section cart-plus-public-component-product-tile__subscription-upgrade">
        <button
          className="subscription-upgrade-btn cart-plus-subscription-upgrade-button cart-plus-public-component-product-tile__subscription-upgrade"
          style={{
            borderRadius: `${radius}px`,
            background: accent,
            "--btn-hover-text": designSettings?.buttonHoverColor || "#333",
            "--btn-text": accentText,
          }}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 3000);
          }}
        >
          {loading ? <span className="loader"></span> : previewText}
        </button>
      </div>
    );
  }

  const subscribed = mode === "subscribe";
  const r = Math.min(radius, 14);

  const opt = (key, label) => {
    const active = mode === key;
    return layout === "toggle" ? (
      <button
        key={key}
        type="button"
        onClick={() => setMode(key)}
        style={{
          flex: 1,
          border: 0,
          cursor: "pointer",
          padding: "9px 12px",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: radius,
          background: active ? accent : "transparent",
          color: active ? accentText : trackText,
        }}
      >
        {label}
      </button>
    ) : (
      <button
        key={key}
        type="button"
        onClick={() => setMode(key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          cursor: "pointer",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "left",
          background: trackBg,
          color: trackText,
          border: `1.5px solid ${active ? accent : "#e5e7eb"}`,
          borderRadius: r,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            boxSizing: "border-box",
            flexShrink: 0,
            border: `${active ? 5 : 2}px solid ${active ? accent : "#9ca3af"}`,
          }}
        />
        {label}
      </button>
    );
  };

  return (
    <div className="subscription-upgrade-preview" style={{ marginTop: 8 }}>
      {layout === "toggle" ? (
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: trackBg,
            borderRadius: radius,
          }}
        >
          {opt("subscribe", subLabel)}
          {opt("onetime", oneLabel)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {opt("subscribe", subLabel)}
          {opt("onetime", oneLabel)}
        </div>
      )}
      {subscribed && (
        <select style={{ width: "100%", marginTop: 8, padding:"6px", fontSize:"12px" }} defaultValue="4">
          <option value="4">Every 4 weeks</option>
          <option value="8">Every 8 weeks</option>
        </select>
      )}
    </div>
  );
}