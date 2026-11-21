import { backgroundToCss } from "../utils/background";
import {
  getFontWeight,
  getHeadingSize,
  getIconSize,
  getBorderWidth,
} from "../utils/helpers";

const DEFAULT_LOGO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48"><rect width="160" height="48" rx="4" fill="#f3f4f6"/><path d="M18 16h20v17H18zM15 16l3-6h20l3 6M23 33v-8h10v8" fill="none" stroke="#6b7280" stroke-width="2" stroke-linejoin="round"/><text x="48" y="29" fill="#6b7280" font-family="Arial,sans-serif" font-size="14">Your logo</text></svg>',
)}`;

import { useState, useEffect } from "react";

function useMaxWidth(maxWidth) {
  const query = `(max-width: ${maxWidth}px)`;
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export default function CartHeading({
  headerSettings,
  designSettings,
  onClose,
  qty,
}) {
  const isCloseEnabled = useMaxWidth(1440);

  const CloseButton = ({ headerSettings }) => {
    return (
      <button
        onClick={isCloseEnabled ? onClose : undefined}
        className="cart-app__close cart-plus-close-btn cart-plus-public-header__close-button cart-plus-header-close-button"
        style={{
          flexShrink: 0,
          "--icon-color": headerSettings.iconColor,
          "--icon-bg": headerSettings.iconBgColor,
          "--icon-hover-bg": headerSettings.iconbgHoverColor,
          "--icon-hover-color": headerSettings.iconHoverColor,
          "--icon-border-hover": headerSettings.borderHoverColor,
          "--border-color": headerSettings.iconBorderColor,
          "--border-width": getBorderWidth(headerSettings.iconBorder),
          borderRadius: `${headerSettings.iconRadius ?? designSettings.buttonRadius ?? 0}px`,
        }}
      >
        <svg
          className="cart-plus-public-header__close-button-icon cart-plus-header-close-button-icon"
          width={getIconSize(headerSettings.iconSize)}
          height={getIconSize(headerSettings.iconSize)}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={headerSettings.iconThickNess === "thick" ? 3 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>
    );
  };

  return (
    <div
      className="cart-app__header-top cart-plus-public-header cart-plus-header"
      style={{
        padding: headerSettings.height === "slim" ? "15px 25px" : "30px 30px",
        background:
          backgroundToCss(headerSettings.background) ||
          headerSettings.backgroundColor ||
          designSettings.backgroundColor ||
          "",
      }}
    >
      <div
        className="cart-app__row-between cart-plus-header-text"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {headerSettings.closePosition === "left" && (
          <CloseButton headerSettings={headerSettings} />
        )}

        <div
          style={{
            flex: 1,
            textAlign:
              headerSettings.alignment === "center"
                ? "center"
                : headerSettings.closePosition === "left"
                  ? "right"
                  : "left",
          }}
          className="cart-plus-header-logo"
        >
          {headerSettings.titleType === "logo" ? (
            <img
              className="cart-plus-header-logo"
              src={headerSettings.logo || DEFAULT_LOGO}
              alt="Store logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_LOGO;
              }}
              style={{
                maxWidth: `${headerSettings.logoSize || 120}px`,
                display: "block",
                margin:
                  headerSettings.alignment === "center"
                    ? "0 auto"
                    : headerSettings.closePosition === "left"
                      ? "0 0 0 auto"
                      : "0",
              }}
            />
          ) : headerSettings.titleType === "custom" ? (
            <span
              className="cart-app__title cart-plus-header-text"
              style={{
                color: headerSettings.textColor,
                fontWeight: getFontWeight(headerSettings.fontWeight),
                fontSize: `${headerSettings.fontSize}px`,
                display: "block",
                margin: 0,
              }}
            >
              {headerSettings.titleText?.replace("{{cart_quantity}}", qty) ||
                `Cart • ${qty}`}
            </span>
          ) : (
            (() => {
              const HeadingTag = headerSettings.heading || "h3";
              const text =
                headerSettings.titleText?.replace("{{cart_quantity}}", qty) ||
                `Cart • ${qty}`;

              return (
                <HeadingTag
                  className="cart-app__title cart-plus-header-text"
                  style={{
                    margin: 0,
                    color: designSettings.textColor,
                    fontWeight: getFontWeight(headerSettings.fontWeight),
                    fontSize: getHeadingSize(headerSettings.heading),
                  }}
                >
                  {text}
                </HeadingTag>
              );
            })()
          )}
        </div>

        {headerSettings.closePosition === "right" && (
          <CloseButton headerSettings={headerSettings} />
        )}
      </div>
    </div>
  );
}
