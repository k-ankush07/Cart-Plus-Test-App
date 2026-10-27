import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { backgroundToCss } from "../utils/background";

const MAX_CHARS = 500;

const PencilIcon = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export default function AdditionalNotes({ additionalNotesSettings, designSettings }) {
  const s = additionalNotesSettings || {};
  const expandable = s.expandable ?? true;
  const collapsedByDefault = s.collapsedByDefault ?? true;
  const limit = s.limitChars ?? true;

  const [open, setOpen] = useState(expandable ? !collapsedByDefault : false); // row expanded
  const [sheetOpen, setSheetOpen] = useState(false); // ORDER NOTE bottom sheet
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [portalTarget, setPortalTarget] = useState(null);
  const rootRef = useRef(null);
  const textareaRef = useRef(null);

  // Live-sync with editor settings
  useEffect(() => {
    setOpen(expandable ? !collapsedByDefault : false);
  }, [expandable, collapsedByDefault]);

  // Render the sheet inside the cart drawer so overlay covers the whole cart
  useEffect(() => {
    if (!rootRef.current) return;
    setPortalTarget(
      rootRef.current.closest(".cart-app__container") ||
        rootRef.current.closest(".cart-app") ||
        null,
    );
  }, []);

  // Esc closes the sheet + autofocus textarea
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    textareaRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const iconColor = designSettings?.iconColor || "#000000";
  const isBelowItems = s.placement === "below_items";
  const buttonBg = backgroundToCss(s.noteButtonBackground);
  const noteBg = backgroundToCss(s.orderNoteBackground);
  const saveBg =
    backgroundToCss(s.saveNoteBackground) || designSettings?.buttonColor || "#303030";

  const openSheet = () => {
    setText(saved); // reopen with previously saved note
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);
  const handleSave = () => {
    if (!text.trim()) return;
    setSaved(text.trim());
    setSheetOpen(false);
  };

  const canSave = text.trim().length > 0;

  // ── "Note" button (+ saved preview) ──
  const noteButton = (
    <div style={{ padding: "8px 0" }}>
      <button
        type="button"
        onClick={openSheet}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.15)",
          background: buttonBg || "transparent",
        }}
      >
        <PencilIcon color={iconColor} />
        <span dangerouslySetInnerHTML={{ __html: s.buttonLabel ?? "Note" }} />
      </button>
      {saved && (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8, wordBreak: "break-word" }}>
          {saved}
        </div>
      )}
    </div>
  );

  // ── Bottom sheet ──
  const sheet =
    sheetOpen && portalTarget
      ? createPortal(
          <>
            <div
              onClick={closeSheet}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 40,
              }}
            />
            <div
              role="dialog"
              aria-label="Order note"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 41,
                background: noteBg || "#ffffff",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                  dangerouslySetInnerHTML={{ __html: s.heading ?? "Order note" }}
                />
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeSheet}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "inline-flex",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="cart-additional-notes__textarea cart-plus-public-notes__textarea"
                placeholder={s.placeholder || "Add instructions for your order"}
                value={text}
                maxLength={limit ? MAX_CHARS : undefined}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.3)",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <button
                type="button"
                disabled={!canSave}
                onClick={handleSave}
                style={{
                  border: "none",
                  cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.5,
                  padding: "10px 16px",
                  borderRadius: `${designSettings?.buttonRadius ?? 6}px`,
                  background: saveBg,
                  color: designSettings?.buttonTextColor || "#ffffff",
                  fontSize: 14,
                  alignSelf: "flex-start",
                }}
                dangerouslySetInnerHTML={{ __html: s.saveLabel ?? "Save note" }}
              />
            </div>
          </>,
          portalTarget,
        )
      : null;

  const wrapperClass = `cart-additional-notes cart-plus-public-notes ${isBelowItems ? "notes-below-items" : ""}`;

  // ── Not expandable: only the Note button ──
  if (!expandable) {
    return (
      <div ref={rootRef} className={wrapperClass}>
        {noteButton}
        {sheet}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={wrapperClass}>
      <button
        type="button"
        className="cart-additional-notes__toggle cart-plus-public-component-collapse__dropdown-container"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span
          className="cart-plus-public-notes__text-container"
          style={{ display: "flex", gap: 4, lineHeight: 1, alignItems: "center" }}
        >
          <span dangerouslySetInnerHTML={{ __html: s.title || "Add special instructions" }} />
          <span
            className="cart-plus-public-component-collapse__expand-icon"
            style={{
              display: "inline-flex",
              transition: "transform 0.3s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </span>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>{noteButton}</div>
      </div>

      {sheet}
    </div>
  );
}