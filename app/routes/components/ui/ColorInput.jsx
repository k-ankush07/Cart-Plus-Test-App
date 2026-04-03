import {
    ColorPicker,
    TextField,
    Popover,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;

    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }

    return { r, g, b };
}

function rgbToHsb({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { hue: h, saturation: s, brightness: v };
}

function hsbToHex({ hue, saturation, brightness }) {
    const c = brightness * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = brightness - c;

    let r = 0, g = 0, b = 0;

    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    const toHex = (v) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorInput({ label, value, onChange }) {
    const [active, setActive] = useState(false);

    const togglePopover = useCallback(() => {
        setActive((prev) => !prev);
    }, []);

    const closePopover = useCallback(() => {
        setActive(false);
    }, []);

    const hsb = rgbToHsb(hexToRgb(value));

    return (
        <Popover
            active={active}
            activator={
                <TextField
                    label={label}
                    value={value}
                    onChange={(val) => onChange(val)}
                    autoComplete="off"
                    suffix={
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePopover();
                            }}
                            style={{
                                width: 25,
                                height: 25,
                                background: value,
                                borderRadius: 4,
                                border: "1px solid #ccc",
                                cursor: "pointer",
                            }}
                        />
                    }
                />
            }
            onClose={closePopover}
            preferredAlignment="right"
            preferredPosition="below"
        >
            <div style={{ padding: 10 }}>
                <ColorPicker
                    color={hsb}
                    onChange={(newColor) => {
                        const hex = hsbToHex(newColor);
                        onChange(hex);
                    }}
                />
            </div>
        </Popover>
    );
}