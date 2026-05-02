import {
    DatePicker,
    OptionList,
    TextField,
    Button,
    Box,
    InlineStack,
    BlockStack,
    Text,
    Icon,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { useState, useRef, useEffect } from "react";

const CalendarPrefix = () => (
    <Icon source={CalendarIcon} tone="subdued" />
);

const PRESETS = [
    { label: "Last 30 days", value: "30", prefix: <CalendarPrefix /> },
    { label: "Last 60 days", value: "60", prefix: <CalendarPrefix /> },
    { label: "Last 90 days", value: "90", prefix: <CalendarPrefix /> },
    { label: "Last 365 days", value: "365", prefix: <CalendarPrefix /> },
];

export default function DateRangePicker({ value, onChange }) {
    const today = new Date();
    const panelRef = useRef();

    const [open, setOpen] = useState(false);
    const toggle = () => setOpen((o) => !o);

    const [{ month, year }, setDate] = useState({
        month: today.getMonth(),
        year: today.getFullYear(),
    });

    const [range, setRange] = useState(
        value || { start: today, end: today }
    );
    const [preset, setPreset] = useState("30");
    const [startInput, setStartInput] = useState(() =>
        (value?.start || today).toISOString().slice(0, 10)
    );
    const [endInput, setEndInput] = useState(() =>
        (value?.end || today).toISOString().slice(0, 10)
    );

    const formatDate = (date) =>
        date ? date.toISOString().slice(0, 10) : "";

    const parseInput = (str) => {
        const d = new Date(str + "T00:00:00");
        return isNaN(d.getTime()) ? null : d;
    };

    const handleStartInput = (val) => {
        setStartInput(val);
        setPreset(null);
        const d = parseInput(val);
        if (d) {
            const end = d > range.end ? d : range.end;
            setRange({ start: d, end });
            setDate({ month: d.getMonth(), year: d.getFullYear() });
        }
    };

    const handleEndInput = (val) => {
        setEndInput(val);
        setPreset(null);
        const d = parseInput(val);
        if (d) {
            const start = d < range.start ? d : range.start;
            setRange({ start, end: d });
        }
    };

    const buttonLabel =
        PRESETS.find((p) => p.value === preset)?.label ||
        `${formatDate(range.start)} – ${formatDate(range.end)}`;

    const handlePreset = (vals) => {
        const days = parseInt(vals[0]);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setRange({ start, end });
        setStartInput(formatDate(start));
        setEndInput(formatDate(end));
        setPreset(vals[0]);
    };

    const handleCalendarChange = (r) => {
        setRange(r);
        setStartInput(formatDate(r.start));
        setEndInput(formatDate(r.end));
        setPreset(null);
    };

    const handleSave = () => {
        onChange && onChange(range);
        setOpen(false);
    };

    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div>
            <Button icon={CalendarIcon} disclosure onClick={toggle}>
              {buttonLabel}
            </Button>

            {open && (
                <div
                    ref={panelRef}
                    style={{
                        position: "absolute",
                        top: "50px",
                        right: 0,
                        zIndex: 999,
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                        padding: "16px",
                        width: "800px",
                        marginTop:'15px'
                    }}
                >
                    <InlineStack gap="400" align="start" wrap={false}>

                        {/* LEFT — Presets */}
                        <Box
                            minWidth="200px"
                            borderInlineEndWidth="1"
                            borderColor="border-subdued"
                            paddingInlineEnd="300"
                        >
                            <BlockStack gap="200">
                                <Text variant="bodySm" tone="subdued">Presets</Text>
                                <OptionList
                                    options={PRESETS}
                                    selected={preset ? [preset] : []}
                                    onChange={handlePreset}
                                />
                            </BlockStack>
                        </Box>

                        {/* RIGHT — Calendar */}
                        <BlockStack gap="200">
                            <InlineStack gap="200" blockAlign="center">
                                <TextField
                                    value={startInput}
                                    onChange={handleStartInput}
                                    placeholder="YYYY-MM-DD"
                                    autoComplete="off"
                                />
                                <Text as="span">→</Text>
                                <TextField
                                    value={endInput}
                                    onChange={handleEndInput}
                                    placeholder="YYYY-MM-DD"
                                    autoComplete="off"
                                />
                            </InlineStack>

                            <DatePicker
                                month={month}
                                year={year}
                                selected={range}
                                onChange={handleCalendarChange}
                                onMonthChange={(m, y) => setDate({ month: m, year: y })}
                                allowRange
                                multiMonth
                                disableDatesAfter={today}
                            />

                            <InlineStack align="end" gap="200">
                                <Button onClick={() => setOpen(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSave}>Save</Button>
                            </InlineStack>
                        </BlockStack>

                    </InlineStack>
                </div>
            )}
        </div>
    );
}
