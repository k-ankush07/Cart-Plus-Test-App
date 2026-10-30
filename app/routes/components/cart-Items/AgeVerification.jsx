import { backgroundToCss } from "../utils/background";
import { fillAge, getAgeVerification } from "../utils/ageVerification";
import { AGE_TEMPLATES,  } from "../utils/ageTemplates";

const TICK_IMG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 6.5l2.6 2.6L10 3.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const Badge = ({ size = 28, color, label = "18+", ring = 2 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${ring}px solid ${color}`,
      color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      flexShrink: 0,
      boxSizing: "border-box",
    }}
  >
    {label}
  </span>
);

const btnBase = {
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: 6,
  whiteSpace: "nowrap",
};

// Preview of the age confirmation box above the checkout button
export default function AgeVerification({
  cartSettings,
  checked,
  error,
  onChange,
}) {
  const s = getAgeVerification(cartSettings);
  if (!s.enabled) return null;

  const radius = error ? s.errorBorderRadius : s.borderRadius;
  const html = (value) => ({ __html: fillAge(value, s.minimumAge) });
  const layout = AGE_TEMPLATES[s.template]?.layout;

  const boxStyle = {
    padding: 14,
    borderRadius: radius,
    border: `1px solid ${error ? s.errorBorderColor : s.borderColor}`,
    "--cp-age-edge": error ? s.errorBorderColor : s.borderColor,
    background: error ? s.errorBackground : backgroundToCss(s.background),
  };

  const errorNode = error && (
    <div
      role="alert"
      style={{ marginTop: 6, fontSize: 12, color: "#c0281c" }}
      dangerouslySetInnerHTML={html(s.errorText)}
    />
  );

  /* ---------------- CLASSIC (unchanged) ---------------- */
  if (!s.template || !AGE_TEMPLATES[s.template]) {
    return (
      <div
        className="cart-plus-age-verification"
        style={{ padding: "12px 16px" }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: radius,
            border: `1px solid ${error ? s.errorBorderColor : s.borderColor}`,
            background: error
              ? s.errorBackground
              : backgroundToCss(s.background),
          }}
        >
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
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
                border: `1.5px solid ${
                  checked ? s.toggleColor : s.borderColor
                }`,
                background: checked
                  ? `${s.toggleColor} ${TICK_IMG} center / 12px no-repeat`
                  : "transparent",
              }}
            />
            <span>
              <span
                style={{ fontSize: 13 }}
                dangerouslySetInnerHTML={html(s.checkboxText)}
              />
              <span
                style={{ display: "block", fontSize: 12, opacity: 0.7 }}
                dangerouslySetInnerHTML={html(s.subtitle)}
              />
            </span>
          </label>
          {errorNode}
        </div>
      </div>
    );
  }

  /* ---------------- TEMPLATES (Figma match) ---------------- */
  const accent = s.accent ?? "#111827";
  const accentText = s.accentText ?? "#ffffff";
  const secBg = s.secondaryBg ?? "#f1f3f5";
  const secText = s.secondaryText ?? "#1a1a1a";
  const badgeColor = s.badgeColor ?? "#e5383b";
  const badgeLabel = `${s.minimumAge}+`;

  const question = (size = 14, center = false, weight = 500) => (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        textAlign: center ? "center" : "left",
      }}
      dangerouslySetInnerHTML={html(s.checkboxText)}
    />
  );

  const sub = (center = false) =>
    s.subtitle ? (
      <div
        style={{
          fontSize: 12,
          opacity: 0.7,
          marginTop: 2,
          textAlign: center ? "center" : "left",
        }}
        dangerouslySetInnerHTML={html(s.subtitle)}
      />
    ) : null;

  const yesBtn = (extra = {}) => (
    <button
      type="button"
      onClick={() => onChange(true)}
      style={{
        ...btnBase,
        background: accent,
        color: accentText,
        boxShadow: checked ? `0 0 0 2px #fff, 0 0 0 4px ${accent}` : "none",
        ...extra,
      }}
    >
      <span dangerouslySetInnerHTML={html(s.yesText)} />
    </button>
  );

  const noBtn = (extra = {}) => (
    <button
      type="button"
      onClick={() => onChange(false)}
      style={{ ...btnBase, background: secBg, color: secText, ...extra }}
    >
      <span dangerouslySetInnerHTML={html(s.noText)} />
    </button>
  );

  const noLink = () => (
    <button
      type="button"
      onClick={() => onChange(false)}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 11,
        textDecoration: "underline",
        color: secText,
        padding: 0,
      }}
    >
      <span dangerouslySetInnerHTML={html(s.noText)} />
    </button>
  );

  const column = (children, gap = 10) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap,
      }}
    >
      {children}
    </div>
  );

  let content = null;

  if (layout === "inline") {
    // red badge left, small Yes / No right
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge size={32} color={badgeColor} label={badgeLabel} ring={1.5} />
        <div style={{ flex: 1 }}>
          {question()}
          {sub()}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {yesBtn({ padding: "7px 14px" })}
          {noBtn({ padding: "7px 14px" })}
        </div>
      </div>
    );
  } else if (layout === "toggle") {
    // bold "18+" text (no circle) + switch
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: badgeColor }}>
          {badgeLabel}
        </span>
        <div style={{ flex: 1 }}>
          {question(13)}
          {sub()}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: checked ? "flex-end" : "flex-start",
            background: checked ? accent : "#d1d5db",
            transition: "background .15s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,.3)",
            }}
          />
        </button>
      </div>
    );
  } else if (layout === "confirm") {
    // checkbox + text left, Continue right (disabled until ticked)
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            cursor: "pointer",
            flex: 1,
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              width: 16,
              height: 16,
              margin: 0,
              flexShrink: 0,
              cursor: "pointer",
              borderRadius: 4,
              border: `1.5px solid ${checked ? accent : s.borderColor}`,
              background: checked
                ? `${accent} ${TICK_IMG} center / 12px no-repeat`
                : "transparent",
            }}
          />
          <span style={{ fontSize: 12 }}>
            <span dangerouslySetInnerHTML={html(s.checkboxText)} />
            {s.subtitle && (
              <span
                style={{ display: "block", fontSize: 11, opacity: 0.7 }}
                dangerouslySetInnerHTML={html(s.subtitle)}
              />
            )}
          </span>
        </label>
        <button
          type="button"
          disabled={!checked}
          style={{
            ...btnBase,
            padding: "8px 22px",
            background: accent,
            color: accentText,
            opacity: checked ? 1 : 0.35,
            cursor: checked ? "pointer" : "not-allowed",
          }}
        >
          <span dangerouslySetInnerHTML={html(s.continueText)} />
        </button>
      </div>
    );
  } else if (layout === "badge-row") {
    // small badge centered, Yes / No side by side
    content = column(
      <>
        <Badge size={30} color={badgeColor} label={badgeLabel} ring={1.5} />
        {question(13, true)}
        {sub(true)}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          {yesBtn({ flex: 1 })}
          {noBtn({ flex: 1 })}
        </div>
      </>,
    );
  } else if (layout === "badge-stack") {
    // big badge, Yes / No stacked full width
    content = column(
      <>
        <Badge size={74} ring={3} color={badgeColor} label={badgeLabel} />
        {question(13, true)}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          {yesBtn({ width: "100%" })}
          {noBtn({ width: "100%" })}
        </div>
      </>,
      12,
    );
  } else if (layout === "title") {
    // big title, full-width blue Yes, "No" as underlined link
    content = column(
      <>
        {question(18, true, 700)}
        {sub(true)}
        {yesBtn({ width: "100%" })}
        {noLink()}
      </>,
      8,
    );
  }

  return (
    <div
      className="cart-plus-age-verification"
      style={{ padding: "12px 16px" }}
    >
      <div style={boxStyle}>
        {content}
        {errorNode}
      </div>
    </div>
  );
}