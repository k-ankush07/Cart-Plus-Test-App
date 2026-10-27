// Icons for the cart item's delete button. `kind` is saved in cartSettings.cartItem.deleteIcon.
export const DELETE_ICONS = ["trash", "bin", "lid", "x", "x-circle"];

export default function DeleteGlyph({ kind = "trash", color, size = 16 }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (kind === "bin") {
    return (
      <svg {...common}>
        <path d="M5 7h14l-1.2 13a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M3 7h18" />
      </svg>
    );
  }
  if (kind === "lid") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M9 7l.5-2h5L15 7" />
        <path d="M6 7l1 13h10l1-13" />
      </svg>
    );
  }
  if (kind === "x") {
    return (
      <svg {...common}>
        <path d="M5 5l14 14" />
        <path d="M19 5L5 19" />
      </svg>
    );
  }
  if (kind === "x-circle") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6" />
        <path d="M15 9l-6 6" />
      </svg>
    );
  }
  // trash (default, the one the cart used before)
  return (
    <svg {...common}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
