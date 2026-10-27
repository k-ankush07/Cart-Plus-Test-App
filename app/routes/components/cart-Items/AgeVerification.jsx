import { backgroundToCss } from "../utils/background";
import { fillAge, getAgeVerification } from "../utils/ageVerification";

// Preview of the age confirmation box above the checkout button
export default function AgeVerification({ cartSettings, checked, error, onChange }) {
  const s = getAgeVerification(cartSettings);
  if (!s.enabled) return null;

  const radius = error ? s.errorBorderRadius : s.borderRadius;
  const html = (value) => ({ __html: fillAge(value, s.minimumAge) });

  return (
    <div className="cart-plus-age-verification" style={{ padding: "8px 16px" }}>
      <div
        style={{
          padding: 12,
          borderRadius: radius,
          border: `1px solid ${error ? s.errorBorderColor : s.borderColor}`,
          background: error ? s.errorBackground : backgroundToCss(s.background),
        }}
      >
        <label
          style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ accentColor: s.toggleColor, width: 16, height: 16, marginTop: 2 }}
          />
          <span>
            <span style={{ fontSize: 14 }} dangerouslySetInnerHTML={html(s.checkboxText)} />
            <span
              style={{ display: "block", fontSize: 12, opacity: 0.7 }}
              dangerouslySetInnerHTML={html(s.subtitle)}
            />
          </span>
        </label>
        {error && (
          <div
            role="alert"
            style={{ marginTop: 6, fontSize: 12, color: "#c0281c" }}
            dangerouslySetInnerHTML={html(s.errorText)}
          />
        )}
      </div>
    </div>
  );
}
