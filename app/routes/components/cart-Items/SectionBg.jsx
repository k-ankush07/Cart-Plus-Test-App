import { backgroundToCss } from "../utils/background";
import { getSectionBackground } from "../utils/sectionBackground";

// Fills a preview section with its "Background color"; renders the section untouched when none is set.
export default function SectionBg({ id, cartSettings, children }) {
  const bg = backgroundToCss(getSectionBackground(cartSettings, id));
  if (!bg) return children;
  return <div style={{ background: bg }}>{children}</div>;
}
