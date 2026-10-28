import { LockIcon } from "@shopify/polaris-icons";
import { LibraryIcon } from "./IconLibrary";

// What the cart preview shows for a Cross-sell / One Tick Upsell that has no product picked yet:
// the section title with its icon, and a card saying "No product selected yet".
export default function NoProductPlaceholder({
  title,
  icon,
  iconColor,
  titleColor,
  textColor,
  cardBackground,
  radius = 8,
}) {
  return (
    <div className="cart-plus-no-product" style={{ padding: "12px 16px" }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            fontWeight: 600,
            color: titleColor,
          }}
        >
          {icon && <LibraryIcon value={icon} size={20} color={iconColor} />}
          <span dangerouslySetInnerHTML={{ __html: title }} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderRadius: radius,
          background: cardBackground || "#ffffff",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px dashed #1553d8",
            borderRadius: 8,
            color: "#1553d8",
            background: "rgba(21, 83, 216, 0.06)",
          }}
        >
          <span style={{ display: "inline-flex", width: 20, height: 20 }}>
            <LockIcon width={20} height={20} style={{ fill: "currentColor" }} />
          </span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
          No product selected yet
        </span>
      </div>
    </div>
  );
}
