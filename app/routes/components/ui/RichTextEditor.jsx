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

function RichTextEditor({ value, onChange }) {
    const ref = useRef(null);
    const savedRange = useRef(null);

    const [color, setColor] = useState("#000000");
    const [fontSize, setFontSize] = useState("14");

    useEffect(() => {
        if (ref.current && value !== ref.current.innerHTML) {
            ref.current.innerHTML = value || "";
        }
    }, [value]);

    const emit = () => {
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

    // colour the selected text, or the whole text when nothing is selected
    const applyColor = (hex) => {
        setColor(hex);
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;

        const editor = ref.current;
        editor.focus();

        const sel = window.getSelection();
        sel.removeAllRanges();

        const range = savedRange.current;
        if (range && !range.collapsed) {
            sel.addRange(range);
        } else {
            const all = document.createRange();
            all.selectNodeContents(editor);
            sel.addRange(all);
        }

        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, hex);
        emit();
    };

    // font size in px for the selected text, or the whole text when nothing is selected.
    // execCommand only knows sizes 1-7, so mark the text with 7 and swap in a real px size.
    const applyFontSize = (px) => {
        setFontSize(px);

        const editor = ref.current;
        editor.focus();

        const sel = window.getSelection();
        sel.removeAllRanges();

        const range = savedRange.current;
        if (range && !range.collapsed) {
            sel.addRange(range);
        } else {
            const all = document.createRange();
            all.selectNodeContents(editor);
            sel.addRange(all);
        }

        document.execCommand("styleWithCSS", false, false);
        document.execCommand("fontSize", false, "7");
        editor.querySelectorAll(`font[size="7"]`).forEach((node) => {
            const span = document.createElement("span");
            span.style.fontSize = `${px}px`;
            span.innerHTML = node.innerHTML;
            node.replaceWith(span);
        });
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
