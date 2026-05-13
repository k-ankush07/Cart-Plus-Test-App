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
import { CalendarIcon, ArrowRightIcon } from "@shopify/polaris-icons";
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
    const [appliedRange, setAppliedRange] = useState(
        value || { start: today, end: today }
    );

    const [preset, setPreset] = useState("30");
    const [appliedPreset, setAppliedPreset] = useState("30");

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
        PRESETS.find((p) => p.value === appliedPreset)?.label ||
        `${formatDate(appliedRange.start)} – ${formatDate(
            appliedRange.end
        )}`;

    const handlePreset = (vals) => {
        const days = parseInt(vals[0]);

        const end = new Date();
        end.setHours(0, 0, 0, 0);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        start.setDate(end.getDate() - (days - 1));

        const newRange = { start, end };

        setRange(newRange);
        setStartInput(formatDate(start));
        setEndInput(formatDate(end));
        setPreset(vals[0]);

        setDate({
            month: start.getMonth(),
            year: start.getFullYear(),
        });
    };

    const handleCalendarChange = (r) => {
        setRange(r);
        setStartInput(formatDate(r.start));
        setEndInput(formatDate(r.end));
        setPreset(null);
    };

    const handleSave = () => {
        setAppliedRange(range);
        setAppliedPreset(preset);

        onChange && onChange(range);

        setOpen(false);
    };

    const handleCancel = () => {
        setRange(appliedRange);
        setPreset(appliedPreset);

        setStartInput(formatDate(appliedRange.start));
        setEndInput(formatDate(appliedRange.end));

        setOpen(false);
    };

    useEffect(() => {
        const handleClick = (e) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target)
            ) {
                handleCancel();
            }
        };

        document.addEventListener("mousedown", handleClick);

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClick
            );
    }, [appliedRange, appliedPreset]);

    return (
        <div>
            <Button icon={CalendarIcon} disclosure onClick={toggle}>
                {buttonLabel}
            </Button>

            <div
                ref={panelRef}
                style={{
                    position: "absolute",
                    top: "45px",
                    right: 0,
                    zIndex: 999,
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    padding: "4px",
                    width: "100%",
                    maxWidth: "700px",
                    marginTop: "15px",
                    border: "1px solid #dfe3e8",
                    opacity: open ? 1 : 0,
                    transform: open
                        ? "translateY(0px) scale(1)"
                        : "translateY(-10px) scale(0.98)",
                    transition: "all 250ms ease",
                    pointerEvents: open ? "auto" : "none",

                    transformOrigin: "top right",
                }}
            >
                <Box
                    style={{
                        borderBottom: "0.5px solid #dfe3e8",
                    }}
                >
                    <InlineStack gap="100" align="start" wrap={false}>

                        {/* LEFT — Presets */}
                        <Box
                            minWidth="400px"
                            paddingInlineEnd="300"
                            style={{
                                minWidth: "180px",
                                borderRight: "0.5px solid #dfe3e8",
                            }}
                        >
                            <BlockStack gap="50">
                                <Box paddingBlockStart="200" paddingInlineStart="300">
                                    <Text variant="bodyMd" fontWeight="semibold">
                                        Presets
                                    </Text>
                                </Box>
                                <OptionList
                                    options={PRESETS}
                                    selected={preset ? [preset] : []}
                                    onChange={handlePreset}
                                />
                            </BlockStack>
                        </Box>

                        {/* RIGHT — Calendar */}
                        <Box padding="200">
                            <BlockStack gap="200">
                                <InlineStack gap="100" blockAlign="center" align="space-around">
                                    <TextField
                                        label="Start Date"
                                        labelHidden
                                        value={startInput}
                                        onChange={handleStartInput}
                                        placeholder="YYYY-MM-DD"
                                        autoComplete="off"
                                    />
                                    <InlineStack> <Icon source={ArrowRightIcon} tone="subdued" /></InlineStack>
                                    <TextField
                                        label="End Date"
                                        labelHidden
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
                            </BlockStack>
                        </Box>
                    </InlineStack>
                </Box>
                <Box padding="200">
                    <InlineStack align="end" gap="200">
                        <Button onClick={handleCancel}>Cancel</Button>

                        <Button variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                    </InlineStack>
                </Box>
            </div>
        </div>
    );
}
