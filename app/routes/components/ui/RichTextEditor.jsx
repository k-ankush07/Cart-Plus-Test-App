import { useRef, useEffect, useState } from "react";
import { BlockStack, InlineGrid, Select } from "@shopify/polaris";
import ColorInput from "./ColorInput";

const TOOLS = [
    { cmd: "bold", icon: "https://slide.upcart.app/icons/bold-1.png", alt: "Bold" },
    { cmd: "italic", icon: "https://www.hubsyntax.com/cart-images/italic-1.png", alt: "Italic" },
    { cmd: "underline", icon: "https://www.hubsyntax.com/cart-images/underline-1.png", alt: "Underline" },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40].map((n) => ({
    label: `${n}px`,
    value: String(n),
}));

const DEFAULT_COLOR = "#000000";
const DEFAULT_SIZE = "14";

const rgbToHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || "");
    if (!m) return null;
    return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
};

// the colour / size the saved html is already using (first styled element)
function readStyle(html) {
    const box = document.createElement("div");
    box.innerHTML = html || "";
    const colored = box.querySelector("[style*='color']");
    const sized = box.querySelector("[style*='font-size']");
    return {
        color: (colored && rgbToHex(colored.style.color)) || DEFAULT_COLOR,
        fontSize: (sized && String(parseInt(sized.style.fontSize, 10))) || DEFAULT_SIZE,
    };
}

// Drop wrappers that only carry the default colour / size, so choosing the original
// values again gives back the original html (and the unsaved-changes bar goes away).
function normalize(root) {
    root.querySelectorAll("font").forEach((node) => node.removeAttribute("size"));
    root.querySelectorAll("span, font").forEach((node) => {
        if (rgbToHex(node.style.color) === DEFAULT_COLOR) node.style.removeProperty("color");
        if (parseInt(node.style.fontSize, 10) === Number(DEFAULT_SIZE)) node.style.removeProperty("font-size");
        if (!node.getAttribute("style")?.trim()) node.removeAttribute("style");
        if (!node.attributes.length) node.replaceWith(...node.childNodes);
    });
    root.normalize();
}

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
        return range && !range.collapsed && ref.current.contains(range.commonAncestorContainer)
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
        setFontSize(px);

        const range = selectedRange();
        if (range) {
            const editor = ref.current;
            editor.focus();
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand("styleWithCSS", false, false);
            document.execCommand("fontSize", false, "7");
            editor.querySelectorAll('font[size="7"]').forEach((node) => {
                const span = document.createElement("span");
                span.style.fontSize = `${px}px`;
                span.innerHTML = node.innerHTML;
                node.replaceWith(span);
            });
        } else {
            styleWholeText("font-size", `${px}px`);
        }
        emit();
    };

    return (
        <BlockStack gap="200">
            <div
                style={{
                    border: "1px solid #dcdcdc",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        borderBottom: "1px solid #e0e0e0",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    {TOOLS.map(({ cmd, icon, alt }) => (
                        <div
                            key={cmd}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => format(cmd)}
                            title={alt}
                            style={{
                                width: "30px",
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                borderRadius: "4px",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            <img src={icon} alt={alt} style={{ width: "20px" }} />
                        </div>
                    ))}
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
                        padding: "16px",
                        outline: "none",
                    }}
                />
            </div>

            <InlineGrid columns={2} gap="300" alignItems="end">
                <ColorInput
                    label="Text color"
                    value={color}
                    onChange={applyColor}
                />
                <Select
                    label="Font size"
                    options={FONT_SIZES}
                    value={fontSize}
                    onChange={applyFontSize}
                />
            </InlineGrid>
        </BlockStack>
    );
}

export default RichTextEditor;
