import { useRef, useEffect, useState } from "react";
import {
    Text,
    Button,
    InlineStack,
    BlockStack,
    Popover,
    ColorPicker,
} from "@shopify/polaris";

function hsbToHex({ hue, saturation, brightness }) {
    let s = saturation;
    let v = brightness;

    let c = v * s;
    let x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    let m = v - c;

    let r = 0,
        g = 0,
        b = 0;

    if (hue >= 0 && hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    const toHex = (n) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function RichTextEditor({ value, onChange }) {
    const ref = useRef(null);

    const [color, setColor] = useState(null);

    const [popoverActive, setPopoverActive] = useState(false);

    useEffect(() => {
        if (ref.current && value !== ref.current.innerHTML) {
            ref.current.innerHTML = value || "";
        }
    }, [value]);

    const format = (command, value = null) => {
        document.execCommand(command, false, value);
        ref.current.focus();
    };

    const handleInput = () => {
        const html = ref.current.innerHTML;

        if (html !== value) {
            onChange(html);
        }
    };

    const applyColor = (newColor) => {
        setColor(newColor);

        if (!newColor) return;

        const hex = hsbToHex(newColor);
        format("foreColor", hex);
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
                        padding: "6px",
                        background: "#f6f6f7",
                    }}
                >
                    <InlineStack gap="200" align="left">
                        <Button size="slim" onClick={() => format("bold")}>
                            <b>B</b>
                        </Button>
                        <Button size="slim" onClick={() => format("italic")}>
                            <i>I</i>
                        </Button>
                        <Button size="slim" onClick={() => format("underline")}>
                            <u>U</u>
                        </Button>

                        <Popover
                            active={popoverActive}
                            activator={
                                <Button size="slim" onClick={() => setPopoverActive(!popoverActive)}>
                                    🎨
                                </Button>
                            }
                            onClose={() => setPopoverActive(false)}
                        >
                            <div style={{ padding: "10px" }}>
                                <ColorPicker
                                    onChange={applyColor}
                                    color={
                                        color || {
                                            hue: 0,
                                            saturation: 0,
                                            brightness: 0
                                        }
                                    }
                                />
                            </div>
                        </Popover>
                    </InlineStack>
                </div>

                <div
                    ref={ref}
                    contentEditable
                    onInput={handleInput}
                    suppressContentEditableWarning
                    style={{
                        padding: "10px",
                        minHeight: "80px",
                        outline: "none",
                    }}
                />
            </div>
        </BlockStack>
    );
}

export default RichTextEditor;