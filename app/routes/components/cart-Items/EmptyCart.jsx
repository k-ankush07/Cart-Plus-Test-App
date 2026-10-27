import { LibraryIcon } from "../ui/IconLibrary";
import { backgroundToCss } from "../utils/background";
import { getEmptyCart } from "../utils/emptyCart";

// What the cart shows when it has no items: icon, message and a "Continue shopping" button.
// The chosen Background fills the whole area; `children` (the Login message) sit between the message and the button.
// `footer` (the Cross-sell) sits at the bottom, on the same Background.
export default function EmptyCart({ cartSettings, designSettings, children, footer }) {
  const s = getEmptyCart(cartSettings);
  const message = s.message ?? cartSettings?.emptyCartMessage ?? "Your cart is empty";

  return (
    <div
      className="cart-plus-empty-cart"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto", // fills the cart body
        background: backgroundToCss(s.background),
      }}
    >
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center", // content sits in the middle
          gap: 16,
          padding: "48px 16px",
          textAlign: "center",
        }}
      >
        <LibraryIcon value={s.icon} size={56} color={s.iconColor} />

        <div style={{ fontSize: 16 }} dangerouslySetInnerHTML={{ __html: message }} />

        {children}

        {s.showButton && (
          <a
            href={s.buttonUrl || "/"}
            onClick={(e) => e.preventDefault()}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: s.buttonRadius,
              fontSize: s.buttonFontSize,
              fontWeight: 600,
              textDecoration: "none",
              background:
                backgroundToCss(s.buttonBackground) || designSettings?.buttonColor || "#000000",
              color: s.buttonTextColor || designSettings?.buttonTextColor || "#ffffff",
            }}
          >
            {s.buttonText}
          </a>
        )}
      </div>

      {footer}
    </div>
  );
}
