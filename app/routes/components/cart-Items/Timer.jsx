import { useEffect, useState } from "react";
import { getTimer, formatParts, pad } from "../utils/timer";
import { backgroundToCss } from "../utils/background";
import { LibraryIcon } from "../ui/IconLibrary";

export default function Timer({ headerSettings, designSettings }) {
  const timer = getTimer(headerSettings);
  const total = Math.max(1, Number(timer.minutes) || 1) * 60;
  const [left, setLeft] = useState(total);

  // restart whenever the duration changes
  useEffect(() => setLeft(total), [total]);

  useEffect(() => {
    if (!timer.enabled) return;
    const id = setInterval(
      // the preview loops so the countdown always stays visible
      () => setLeft((prev) => (prev <= 1 ? total : prev - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [timer.enabled, total]);

  if (!timer.enabled) return null;

  const parts = formatParts(left);
  const clock = `${pad(parts.min + parts.hrs * 60 + parts.days * 1440)}:${pad(parts.sec)}`;
  const color = designSettings?.textColor;
  // message is rich text (HTML); {{timer}} is swapped for the live countdown
  const TOKEN = /\{\{timer\}\}|\{timer\}/gi;
  const messageHtml = String(timer.message).replace(TOKEN, `<strong>${clock}</strong>`);
  const messageNoTimer = String(timer.message).replace(TOKEN, "").trim();

  const wrapper = {
    // only the background picked for the Timer; by default it has none
    background: timer.background ? backgroundToCss(timer.background) : "transparent",
    color,
    padding: "10px 20px",
    textAlign: timer.alignment,
    fontSize: 14,
  };
  const justify =
    timer.alignment === "left" ? "flex-start" : timer.alignment === "right" ? "flex-end" : "center";

  if (timer.style === "digits") {
    const cells = [
      ...(parts.days ? [["days", parts.days]] : []),
      ["hrs", parts.hrs],
      ["min", parts.min],
      ["sec", parts.sec],
    ];
    return (
      <div className="cart-plus-timer cart-plus-timer--digits" style={wrapper}>
        <div style={{ display: "flex", justifyContent: justify, gap: 10 }}>
          {cells.map(([key, value]) => (
            <div key={key} style={{ minWidth: 40 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{pad(value)}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{timer.labels[key]}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
          <span dangerouslySetInnerHTML={{ __html: messageNoTimer }} />
        </div>
      </div>
    );
  }

  if (timer.style === "bar") {
    const pct = Math.max(0, Math.min(100, (left / total) * 100));
    return (
      <div className="cart-plus-timer cart-plus-timer--bar" style={wrapper}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span>
            <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}>
              <LibraryIcon value={timer.icon} size={20} color={timer.iconColor} />
            </span>
            <span dangerouslySetInnerHTML={{ __html: messageNoTimer || "Offer expires soon" }} />
          </span>
          <strong>{clock}</strong>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.12)", marginTop: 6 }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 4,
              background: designSettings?.buttonColor || "#303030",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-plus-timer cart-plus-timer--text" style={wrapper}>
      <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 8 }}>
        <LibraryIcon value={timer.icon} size={16} color={timer.iconColor} />
      </span>
      <span dangerouslySetInnerHTML={{ __html: messageHtml }} />
    </div>
  );
}
