import { useEffect, useState } from "react";

// true while the viewport matches the media query (false during SSR / first paint)
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

// below this width the cross-sell "Side panel" is shown as the normal list layout
export const SIDE_PANEL_LIST_QUERY = "(max-width: 900px)";
