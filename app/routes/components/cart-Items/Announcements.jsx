import { useEffect, useState } from "react";
import { backgroundToCss, useTemplateBackground } from "../utils/background";
import { LibraryIcon } from "../ui/IconLibrary";
import { ANNOUNCEMENT_TEMPLATES } from "../utils/announcementTemplates";

const paddingMap = {
  slim: "4px 20px",
  normal: "10px 20px",
  thick: "18px 20px",
};

const svg = (d) => (c) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={c}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

const ICONS = {
  free_shipping: svg(
    <>
      <path d="M1 6h13v10H1zM14 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>,
  ),
  coupon: svg(
    <>
      <path d="M3 12V3h9l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </>,
  ),
  progress: svg(
    <>
      <rect x="3" y="8" width="18" height="13" />
      <path d="M12 8v13M3 12h18M12 8c-3-5-7-2-4 0M12 8c3-5 7-2 4 0" />
    </>,
  ),
  vip: svg(<path d="M3 18l-1-10 5 4 5-8 5 8 5-4-1 10z" />),
  countdown: svg(
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M9 2h6" />
    </>,
  ),
  flash_sale: svg(<path d="M13 2L4 14h7l-1 8 9-12h-7z" />),
};

const pad = (n) => String(n).padStart(2, "0");

function useCountdown(total = 0) {
  const [left, setLeft] = useState(total);
  useEffect(() => {
    setLeft(total);
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : total)), 1000);
    return () => clearInterval(id);
  }, [total]);
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60];
}

function TemplateAnnouncement({ s }) {
  const t = ANNOUNCEMENT_TEMPLATES[s.template];
  const [open, setOpen] = useState(true);
  const [h, m, sec] = useCountdown(Number(s.seconds ?? t.seconds) || 0);
  if (!open) return null;

  const color = s.textColor || t.color;
  const iconColor = s.iconColor || t.iconColor;
  const accentBg = s.accentBg || t.accentBg;
  const accentText = s.accentText || t.accentText;
  const Icon = ICONS[s.template];

  const current = Number(s.current ?? t.current) || 0;
  const goal = Number(s.goal ?? t.goal) || t.goal || 1;
  const remaining = Math.max(0, goal - current);
  const html = (s.text || t.text).replace(/\{remaining\}/g, `$${remaining}`);

  const pill = {
    background: "#fff",
    color: "#111",
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    lineHeight: 1.3,
    boxSizing: "border-box",
  };

  let right = null;

  if (s.template === "coupon")
    right = (
      <span style={{ ...pill, background: accentBg, color: accentText }}>
        Use code: {s.couponCode || t.code}
      </span>
    );

  if (s.template === "progress") {
    const pct = Math.min(100, (current / goal) * 100);
    right = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 90,
            height: 6,
            borderRadius: 6,
            background: `${accentBg}33`,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${pct}%`,
              height: "100%",
              background: accentBg,
            }}
          />
        </span>
        <small>
          ${current} / ${goal}
        </small>
      </span>
    );
  }

  if (s.template === "vip")
    right = (
      <a
        href={s.link || "#"}
        style={{ color, fontWeight: 700, textDecoration: "underline" }}
      >
        {s.linkText || t.linkText}
      </a>
    );

  if (s.template === "countdown")
    right = (
      <span
        style={{
          display: "inline-flex",
          gap: 4,
          alignItems: "center",
          fontWeight: 700,
        }}
      >
        {[h, m, sec].map((v, i) => (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                background: accentBg,
                color: accentText,
                borderRadius: 6,
                padding: "2px 8px",
              }}
            >
              {pad(v)}
            </span>
            {i < 2 && ":"}
          </span>
        ))}
      </span>
    );

  if (s.template === "flash_sale")
    right = (
      <a
        href={s.link || "#"}
        style={{
          ...pill,
          background: accentBg,
          color: accentText,
          textDecoration: "none",
        }}
      >
        {s.buttonText || t.buttonText}
      </a>
    );

  return (
    <div
      className={`cart-plus-public-announcement cart-plus-announcement ${s.position === "after" ? "announcement-after" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: paddingMap[s.height] || paddingMap.normal,
        borderRadius: `${s.borderRadius ?? 12}px`,
        color,
        background: s.background ? backgroundToCss(s.background) : t.background,
        fontSize: `${s.fontSize || 15}px`,
        lineHeight: 1.3,
        boxSizing: "border-box",
      }}
    >
      <span style={{ display: "inline-flex", flexShrink: 0 }}>
        {s.icon ? (
          <LibraryIcon value={s.icon} size={22} color={iconColor} />
        ) : (
          Icon(iconColor)
        )}
      </span>

      <span
        style={{ flex: 1, minWidth: 0 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {right}
       {s.showClose !== false && s.template !== "progress" && s.template !== "vip" && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: "none",
              border: 0,
              color,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}

export default function Announcements({ announcementSettings }) {
  const templateBg = useTemplateBackground();

  if (
    announcementSettings?.template &&
    ANNOUNCEMENT_TEMPLATES[announcementSettings.template]
  ) {
    return <TemplateAnnouncement s={announcementSettings} />;
  }

  const html = (announcementSettings.text || "").replace(/\s*\{timer\}/gi, "");

  return (
    <div
      className={`cart-plus-public-announcement cart-plus-announcement  ${announcementSettings?.position === "after" ? "announcement-after" : ""}`}
      style={{
        padding: paddingMap[announcementSettings.height],
        textAlign: "center",
        ...(!announcementSettings.background && templateBg
          ? { color: "#fff" }
          : {}),
        fontSize: `${announcementSettings.fontSize}px`,
        lineHeight: "30px",
        borderRadius: `${announcementSettings.borderRadius ?? 0}px`,
        background: backgroundToCss(
          announcementSettings.background ||
            templateBg || {
              type: "plain",
              color: announcementSettings.backgroundColor,
            },
        ),
      }}
    >
      {announcementSettings.icon && (
        <span
          style={{
            display: "inline-flex",
            verticalAlign: "middle",
            marginRight: 8,
          }}
        >
          <LibraryIcon
            value={announcementSettings.icon}
            size={25}
            color={announcementSettings.iconColor}
          />
        </span>
      )}
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}