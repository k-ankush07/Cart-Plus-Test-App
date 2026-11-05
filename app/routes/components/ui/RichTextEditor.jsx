import { useRef, useEffect, useState } from "react";
import { RangeSlider } from "@shopify/polaris";

// text buttons instead of image icons: crisp at any size, no extra requests
const TOOLS = [
  { cmd: "bold", alt: "Bold", label: <b>B</b> },
  { cmd: "italic", alt: "Italic", label: <i>I</i> },
  { cmd: "underline", alt: "Underline", label: <u>U</u> },
];

const DEFAULT_COLOR = "#000000";
const DEFAULT_SIZE = "14";

const rgbToHex = (rgb) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || "");
  if (!m) return null;
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
};

// the colour / size the saved html is already using (first styled element)
function readStyle(html) {
  const box = document.createElement("div");
  box.innerHTML = html || "";
  const colored = box.querySelector("[style*='color']");
  const sized = box.querySelector("[style*='font-size']");
  return {
    color: (colored && rgbToHex(colored.style.color)) || DEFAULT_COLOR,
    fontSize:
      (sized && String(parseInt(sized.style.fontSize, 10))) || DEFAULT_SIZE,
  };
}

// Drop wrappers that only carry the default colour / size, so choosing the original
// values again gives back the original html (and the unsaved-changes bar goes away).
function normalize(root) {
  root.querySelectorAll("font").forEach((node) => node.removeAttribute("size"));
  root.querySelectorAll("span, font").forEach((node) => {
    if (rgbToHex(node.style.color) === DEFAULT_COLOR)
      node.style.removeProperty("color");
    if (parseInt(node.style.fontSize, 10) === Number(DEFAULT_SIZE))
      node.style.removeProperty("font-size");
    if (!node.getAttribute("style")?.trim()) node.removeAttribute("style");
    if (!node.attributes.length) node.replaceWith(...node.childNodes);
  });
  root.normalize();
}

const divider = (
  <span
    aria-hidden="true"
    style={{ width: 1, height: 18, background: "#e1e3e5", margin: "0 2px" }}
  />
);

function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const savedRange = useRef(null);

  const [color, setColor] = useState(() => readStyle(value).color);
  const [fontSize, setFontSize] = useState(() => readStyle(value).fontSize);

  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || "";
      const st = readStyle(value);
      setColor(st.color);
      setFontSize(st.fontSize);
    }
  }, [value]);

  const emit = () => {
    normalize(ref.current);
    const html = ref.current.innerHTML;
    if (html !== value) onChange(html);
  };

  const format = (command, arg = null) => {
    document.execCommand(command, false, arg);
    ref.current.focus();
    emit();
  };

  // remember the selection, because clicking the colour input moves focus away
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // the saved selection, only while it is still inside the editor
  const selectedRange = () => {
    const range = savedRange.current;
    return range &&
      !range.collapsed &&
      ref.current.contains(range.commonAncestorContainer)
      ? range
      : null;
  };

  // nothing selected -> style the whole message through one wrapper <span>
  const styleWholeText = (prop, value) => {
    const editor = ref.current;
    let wrap =
      editor.childNodes.length === 1 && editor.firstChild.tagName === "SPAN"
        ? editor.firstChild
        : null;
    if (!wrap) {
      wrap = document.createElement("span");
      while (editor.firstChild) wrap.appendChild(editor.firstChild);
      editor.appendChild(wrap);
    }
    // inner spans would override the new value
    wrap.querySelectorAll("*").forEach((n) => n.style?.removeProperty(prop));
    wrap.style.setProperty(prop, value);
  };

  const applyColor = (hex) => {
    setColor(hex);
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;

    const range = selectedRange();
    if (range) {
      ref.current.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("foreColor", false, hex);
    } else {
      styleWholeText("color", hex);
    }
    emit();
  };

  // execCommand only knows sizes 1-7, so a selection is marked with 7 and swapped for a real px size
  const applyFontSize = (px) => {
    const size = Number(px);
    setFontSize(String(size));

    const range = selectedRange();
    if (range) {
      const editor = ref.current;
      editor.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("fontSize", false, "7");

      const spans = [];
      editor.querySelectorAll('font[size="7"]').forEach((node) => {
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        span.innerHTML = node.innerHTML;
        node.replaceWith(span);
        spans.push(span);
      });

      // keep the text selected, so the next slider tick still hits the same words
      if (spans.length) {
        const next = document.createRange();
        next.setStartBefore(spans[0]);
        next.setEndAfter(spans[spans.length - 1]);
        savedRange.current = next;
      }
    } else {
      styleWholeText("font-size", `${size}px`);
    }
    emit();
  };

  return (
    <div
      style={{
        border: "1px solid #dcdcdc",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* One compact toolbar row: B I U | colour | size */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          background: "#fafafa",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        {TOOLS.map(({ cmd, alt, label }) => (
          <button
            key={cmd}
            type="button"
            title={alt}
            aria-label={alt}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => format(cmd)}
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: "#303030",
              fontSize: 14,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ececec")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {label}
          </button>
        ))}

        {divider}

        {/* colour swatch: the native picker sits invisibly on top of it */}
        <label
          title="Text color"
          style={{
            position: "relative",
            width: 20,
            height: 20,
            borderRadius: 6,
            border: "1px solid #c9cccf",
            background: color,
            cursor: "pointer",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <input
            type="color"
            aria-label="Text color"
            value={color}
            onChange={(e) => applyColor(e.target.value)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </label>

        {divider}

        <div style={{ width: 110, flexShrink: 0 }}>
          <RangeSlider
            label="Font size"
            labelHidden
            value={Number(fontSize)}
            min={10}
            max={40}
            step={1}
            onChange={applyFontSize}
          />
        </div>
        <span
          style={{
            minWidth: 30,
            fontSize: 12,
            color: "#616161",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fontSize}px
        </span>
      </div>

      <div
        ref={ref}
        contentEditable
        onInput={emit}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        suppressContentEditableWarning
        style={{
          padding: "10px 12px",
          minHeight: 40,
          fontSize: 14,
          lineHeight: 1.4,
          outline: "none",
        }}
      />
    </div>
  );
}

export default RichTextEditor;
