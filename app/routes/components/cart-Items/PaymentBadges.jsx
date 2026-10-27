import {
  ChatIcon,
  CheckCircleIcon,
  DeliveryIcon,
  GiftCardIcon,
  HeartIcon,
  LockIcon,
  NatureIcon,
  ReturnIcon,
  ShieldCheckMarkIcon,
  StarIcon,
} from "@shopify/polaris-icons";
import { backgroundToCss } from "../utils/background";
import { getPaymentBadges, resolveBadge } from "../utils/paymentBadges";

// icons offered for trust badges, in picker order
export const TRUST_ICONS = [
  { key: "lock", Icon: LockIcon },
  { key: "truck", Icon: DeliveryIcon },
  { key: "return", Icon: ReturnIcon },
  { key: "shield", Icon: ShieldCheckMarkIcon },
  { key: "star", Icon: StarIcon },
  { key: "heart", Icon: HeartIcon },
  { key: "gift", Icon: GiftCardIcon },
  { key: "leaf", Icon: NatureIcon },
  { key: "chat", Icon: ChatIcon },
  { key: "check", Icon: CheckCircleIcon },
];

export const TrustIcon = ({ name, size = 16 }) => {
  const Icon = (TRUST_ICONS.find((i) => i.key === name) || TRUST_ICONS[0]).Icon;
  return <Icon width={size} height={size} style={{ fill: "currentColor", flexShrink: 0 }} />;
};

// One badge: uploaded image, or a brand-coloured tile for the library badges
export function BadgeIcon({ badge, height = 28 }) {
  const box = {
    height,
    minWidth: Math.round(height * 1.45),
    borderRadius: 4,
    border: "1px solid #e3e3e3",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  };

  if (badge.image) {
    return (
      <span style={{ ...box, background: "#fff" }}>
        <img src={badge.image} alt={badge.name || badge.label} style={{ height: "100%", width: "auto" }} />
      </span>
    );
  }

  if (badge.mastercard) {
    const r = height * 0.28;
    return (
      <span style={{ ...box, background: badge.bg }} title={badge.name}>
        <svg width={r * 3} height={r * 2} viewBox="0 0 30 20">
          <circle cx="10" cy="10" r="10" fill="#eb001b" />
          <circle cx="20" cy="10" r="10" fill="#f79e1b" fillOpacity="0.9" />
        </svg>
      </span>
    );
  }

  return (
    <span
      title={badge.name}
      style={{
        ...box,
        padding: "0 6px",
        background: badge.bg,
        color: badge.fg,
        fontFamily: "Arial, sans-serif",
        fontWeight: 700,
        fontStyle: badge.italic ? "italic" : "normal",
        fontSize: Math.max(7, Math.round(height * 0.32)),
        whiteSpace: "nowrap",
      }}
    >
      {badge.label}
    </span>
  );
}

// Badges shown under the checkout button: payment icons and / or trust badges
export default function PaymentBadges({ cartSettings }) {
  const s = getPaymentBadges(cartSettings);
  if (!s.enabled) return null;

  const showPayment = s.show !== "trust";
  const showTrust = s.show !== "payment";

  const badges = showPayment ? s.badges.map((id) => resolveBadge(s, id)).filter(Boolean) : [];
  const trust = showTrust ? s.trustBadges.filter((t) => t.text?.trim()) : [];
  if (!badges.length && !trust.length) return null;

  const justify =
    s.alignment === "left" ? "flex-start" : s.alignment === "right" ? "flex-end" : "center";

  return (
    <div
      className="cart-plus-payment-badges"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 16px",
        background: backgroundToCss(s.background),
      }}
    >
      {badges.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: justify }}>
          {badges.map((b) => (
            <BadgeIcon key={b.id} badge={b} height={s.size} />
          ))}
        </div>
      )}
      {trust.length > 0 && (
        <div
          className="cart-plus-trust-badges"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
            justifyContent: justify,
            fontSize: 13,
          }}
        >
          {trust.map((t) => (
            <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <TrustIcon name={t.icon} size={16} />
              {t.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
