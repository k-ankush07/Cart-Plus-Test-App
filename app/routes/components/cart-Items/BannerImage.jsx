import { useRef, useState } from "react";
import { getBanner } from "../utils/banner";

const clamp = (n) => Math.min(100, Math.max(0, n));

// `onReposition` is only passed by the editor preview; the storefront gets a
// plain cropped banner with the saved focal point.
export default function BannerImage({ headerSettings, onReposition }) {
  const banner = getBanner(headerSettings);
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [repositioning, setRepositioning] = useState(false);
  const [pos, setPos] = useState(null); // live position while dragging

  if (!banner.enabled) return null;

  const x = pos?.x ?? banner.posX;
  const y = pos?.y ?? banner.posY;

  const onPointerDown = (e) => {
    if (!repositioning) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { cx: e.clientX, cy: e.clientY, x, y };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    const box = boxRef.current;
    const img = box?.querySelector("img");
    if (!d || !img) return;
    const scale = Math.max(
      box.clientWidth / (img.naturalWidth || 1),
      box.clientHeight / (img.naturalHeight || 1),
    );
    const slackX = (img.naturalWidth || 0) * scale - box.clientWidth;
    const slackY = (img.naturalHeight || 0) * scale - box.clientHeight;
    const nx =
      slackX > 0 ? clamp(d.x - ((e.clientX - d.cx) / slackX) * 100) : d.x;
    const ny =
      slackY > 0 ? clamp(d.y - ((e.clientY - d.cy) / slackY) * 100) : d.y;
    setPos({ x: nx, y: ny });
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (pos) onReposition?.({ posX: Math.round(pos.x), posY: Math.round(pos.y) });
    setPos(null);
  };

  return (
    <div
      className="cart-plus-banner-image"
      style={{
        padding: `${banner.padding}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {banner.image ? (
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: "relative",
            overflow: "hidden",
            width: `${banner.width}%`,
            maxWidth: "100%",
            aspectRatio: "700 / 200",
            borderRadius: `${banner.radius}px`,
            cursor: repositioning ? "grab" : "default",
            touchAction: repositioning ? "none" : "auto",
          }}
        >
          <img
            src={banner.image}
            alt=""
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${x}% ${y}%`,
              userSelect: "none",
            }}
          />
          {onReposition && (
            <button
              type="button"
              // keep the button out of the drag handlers, otherwise pointer
              // capture on the box swallows the click and "Done" never works
              onPointerDown={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => {
                dragRef.current = null;
                setPos(null);
                setRepositioning((v) => !v);
              }}
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                fontSize: 12,
                lineHeight: "16px",
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: 8,
                background: "#fff",
                color: "#303030",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            >
              {repositioning ? "Done" : "✥ Reposition image"}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            width: `${banner.width}%`,
            aspectRatio: "700 / 200",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${banner.radius}px`,
            background: "rgba(0,0,0,0.04)",
            color: "#c9cccf",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            <path
              fillRule="evenodd"
              d="M2 5.75A2.75 2.75 0 0 1 4.75 3h10.5A2.75 2.75 0 0 1 18 5.75v8.5A2.75 2.75 0 0 1 15.25 17H4.75A2.75 2.75 0 0 1 2 14.25v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v5.69l2.47-2.47a1.25 1.25 0 0 1 1.77 0l2.53 2.53 1.97-1.97a1.25 1.25 0 0 1 1.77 0l1.96 1.96V5.75c0-.69-.56-1.25-1.25-1.25H4.75Z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
