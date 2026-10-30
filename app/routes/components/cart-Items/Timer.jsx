import { Fragment, useEffect, useState } from "react";
import { getTimer, formatParts, pad } from "../utils/timer";
import { backgroundToCss } from "../utils/background";
import { LibraryIcon } from "../ui/IconLibrary";

const TOKEN = /\{\{timer\}\}|\{timer\}/gi;

const Ring = ({ size, value, max, color, track, children }) => {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, value / max));
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1.1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

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
  const totalMin = parts.min + parts.hrs * 60 + parts.days * 1440;
  const clock = `${pad(totalMin)}:${pad(parts.sec)}`;
  const color =
    timer.textColor || designSettings?.accentText || designSettings?.textColor;

  const title = String(timer.message || "")
    .replace(TOKEN, "")
    .trim();
  const eyebrow = timer.eyebrow || "";
  const subText = String(timer.subText || "").replace(
    /\{\{minutes\}\}/gi,
    String(Math.ceil(left / 60)),
  );
  const digitsColor = timer.digitsColor || color;
  const track = timer.barBackground || "rgba(0,0,0,0.12)";
  const fill = timer.barColor || designSettings?.buttonColor || "#303030";

  const bg = !timer.background
    ? "transparent"
    : typeof timer.background === "string"
      ? timer.background
      : backgroundToCss(timer.background);

  const justify =
    timer.alignment === "right"
      ? "flex-end"
      : timer.alignment === "center"
        ? "center"
        : "flex-start";

  const icon = timer.icon || { type: "icon", name: "clock" };

  const wrapper = {
    background: bg,
    color,
    padding: "14px 16px",
    margin: "12px",
    borderRadius: 14,
    fontSize: 14,
    textAlign: timer.alignment,
    display: "flex",
    alignItems: "center",
    justifyContent: justify,
    gap: 12,
  };

  const iconBubble = (
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: timer.iconBg || "rgba(0,0,0,0.06)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <LibraryIcon
       value={icon}
        size={22}
        color={timer.iconColor || color}
      />
    </span>
  );

  const heading = (
    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.85,
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{ fontSize: 17, fontWeight: 700 }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
    </div>
  );

  // 1) boxes: icon + heading + digit boxes (DAYS / HOURS / MINS / SECS)
  if (timer.style === "boxes") {
    const cells = [
      ...(parts.days ? [["days", parts.days]] : []),
      ["hrs", parts.hrs],
      ["min", parts.min],
      ["sec", parts.sec],
    ];
    return (
      <div className="cart-plus-timer cart-plus-timer--boxes" style={wrapper}>
        {iconBubble}
        {heading}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
          {cells.map(([key, value], i) => (
            <Fragment key={key}>
              {i > 0 && (
                <span
                  style={{
                    fontWeight: 700,
                    lineHeight: "34px",
                    color: digitsColor,
                    opacity: 0.6,
                  }}
                >
                  :
                </span>
              )}
              <div style={{ textAlign: "center", minWidth: 34 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: "34px",
                    color: digitsColor,
                    background: timer.boxColor || "rgba(0,0,0,0.08)",
                    borderRadius: 8,
                    padding: "0 6px",
                  }}
                >
                  {pad(value)}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    marginTop: 3,
                    textTransform: "uppercase",
                    color: timer.labelsColor || color,
                    opacity: 0.8,
                  }}
                >
                  {timer.labels?.[key]}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  // 2) clock: ring with mm:ss + title + sub text on the right
  if (timer.style === "clock") {
    return (
      <div className="cart-plus-timer cart-plus-timer--clock" style={wrapper}>
        <Ring size={50} value={left} max={total} color={fill} track={track}>
          <span style={{ fontSize: 11, fontWeight: 600, color: digitsColor }}>
            {clock}
          </span>
        </Ring>
        <div
          style={{ flex: 1, fontSize: 17, fontWeight: 700, textAlign: "left" }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {subText && (
          <div style={{ fontSize: 12, opacity: 0.7, textAlign: "right" }}>
            {subText}
          </div>
        )}
      </div>
    );
  }

  // 3) inline: icon + title, bold time + sub text below
  if (timer.style === "inline") {
    const h = parts.hrs + parts.days * 24;
    return (
      <div className="cart-plus-timer cart-plus-timer--inline" style={wrapper}>
        {iconBubble}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div dangerouslySetInnerHTML={{ __html: title }} />
          <div style={{ marginTop: 2 }}>
            <strong style={{ fontSize: 16, color: digitsColor }}>
              {h}h {parts.min}m {parts.sec}s
            </strong>
            {subText && <span style={{ marginLeft: 6 }}>{subText}</span>}
          </div>
        </div>
      </div>
    );
  }

  // 4) rings: icon + heading + circular hrs / min / sec
  if (timer.style === "rings") {
    const rings = [
      ["hrs", parts.hrs + parts.days * 24, 24],
      ["min", parts.min, 60],
      ["sec", parts.sec, 60],
    ];
    return (
      <div className="cart-plus-timer cart-plus-timer--rings" style={wrapper}>
        {iconBubble}
        {heading}
        <div style={{ display: "flex", gap: 6 }}>
          {rings.map(([key, value, max]) => (
            <Ring
              key={key}
              size={46}
              value={value}
              max={max}
              color={fill}
              track={track}
            >
              <span
                style={{ fontSize: 13, fontWeight: 700, color: digitsColor }}
              >
                {pad(value)}
              </span>
              <span
                style={{
                  fontSize: 7,
                  textTransform: "uppercase",
                  color: timer.labelsColor || color,
                  opacity: 0.8,
                }}
              >
                {timer.labels?.[key]}
              </span>
            </Ring>
          ))}
        </div>
      </div>
    );
  }

  // 6) text: small pill with the message and live countdown
  if (timer.style === "text") {
    const html = String(timer.message || "").replace(
      TOKEN,
      `<strong>${clock}</strong>`,
    );
    return (
      <div
        className="cart-plus-timer cart-plus-timer--text"
        style={{
          ...wrapper,
          background: "transparent",
          padding: "10px 16px",
          margin: "12px 12px 0",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: bg,
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 13,
          }}
        >
          <LibraryIcon
            value={timer.icon}
            size={16}
            color={timer.iconColor || color}
          />
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </span>
      </div>
    );
  }

  // 7) progress: message on the left, clock on the right, thin bar below
  if (timer.style === "progress") {
    const pctP = Math.max(0, Math.min(100, (left / total) * 100));
    return (
      <div
        className="cart-plus-timer cart-plus-timer--progress"
        style={{ ...wrapper, display: "block" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <LibraryIcon
              value={timer.icon}
              size={18}
              color={timer.iconColor || color}
            />
            <span
              dangerouslySetInnerHTML={{
                __html: title || "Offer expires soon",
              }}
            />
          </span>
          <strong style={{ color: digitsColor }}>{clock}</strong>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 4,
            background: track,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: `${pctP}%`,
              height: "100%",
              borderRadius: 4,
              background: fill,
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    );
  }

  // 5) bar: icon + title + progress bar + clock
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className="cart-plus-timer cart-plus-timer--bar" style={wrapper}>
      {iconBubble}
      <span
        style={{ fontWeight: 700, fontSize: 15 }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: track }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 4,
            background: fill,
            transition: "width 1s linear",
          }}
        />
      </div>
      <strong style={{ color: digitsColor }}>{clock}</strong>
    </div>
  );
}
