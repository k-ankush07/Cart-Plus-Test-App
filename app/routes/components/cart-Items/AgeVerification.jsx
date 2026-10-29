import { backgroundToCss } from "../utils/background";
import { fillAge, getAgeVerification } from "../utils/ageVerification";

const TICK_IMG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 6.5l2.6 2.6L10 3.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

// Preview of the age confirmation box above the checkout button
export default function AgeVerification({ cartSettings, checked, error, onChange }) {
  const s = getAgeVerification(cartSettings);
  if (!s.enabled) return null;

  const radius = error ? s.errorBorderRadius : s.borderRadius;
  const html = (value) => ({ __html: fillAge(value, s.minimumAge) });

  return (
    <div className="cart-plus-age-verification" style={{ padding: "12px 16px" }}>
      <div
        style={{
          padding: 12,
          borderRadius: radius,
          border: `1px solid ${error ? s.errorBorderColor : s.borderColor}`,
          "--cp-age-edge": error ? s.errorBorderColor : s.borderColor,
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
            // custom box: the "Border" colour outlines it, the toggle colour fills it once ticked
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              width: 16,
              height: 16,
              marginTop: 2,
              marginLeft: 0,
              marginRight: 0,
              flexShrink: 0,
              cursor: "pointer",
              borderRadius: 4,
              border: `1.5px solid ${checked ? s.toggleColor : s.borderColor}`,
              background: checked
                ? `${s.toggleColor} ${TICK_IMG} center / 12px no-repeat`
                : "transparent",
            }}
          />
          <span>
            <span style={{ fontSize: 13 }} dangerouslySetInnerHTML={html(s.checkboxText)} />
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
