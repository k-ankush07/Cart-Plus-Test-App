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
  Popover,
  Scrollable,
} from "@shopify/polaris";

import { CalendarIcon, ArrowRightIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";

const CalendarPrefix = () => <Icon source={CalendarIcon} tone="subdued" />;

const PRESETS = [
  { label: "Today", value: "today", prefix: <CalendarPrefix /> },
  { label: "Yesterday", value: "yesterday", prefix: <CalendarPrefix /> },
  { label: "Last 7 days", value: "7", prefix: <CalendarPrefix /> },
  { label: "Last 30 days", value: "30", prefix: <CalendarPrefix /> },
  { label: "Last 60 days", value: "60", prefix: <CalendarPrefix /> },
  { label: "Last 90 days", value: "90", prefix: <CalendarPrefix /> },
  { label: "Last 365 days", value: "365", prefix: <CalendarPrefix /> },
];

const detectPreset = (r) => {
  const today = todayMidnight();
  const sameDay = (a, b) => fmt(a) === fmt(b);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(r.start, yesterday) && sameDay(r.end, yesterday))
    return "yesterday";

  if (!sameDay(r.end, today)) return null;
  if (sameDay(r.start, today)) return "today";

  for (const d of [7, 30, 60, 90, 365]) {
    if (sameDay(r.start, presetRange(d).start)) return String(d);
  }
  return null;
};

// ── Date helpers ──────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");

const fmt = (d) =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";

const parse = (s) => {
  if (!s) return null;

  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return isNaN(date.getTime()) ? null : date;
};

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const presetRange = (days) => {
  const end = todayMidnight();
  const start = new Date(end);

  start.setDate(start.getDate() - (days - 1));

  return { start, end };
};

// ── Preset range handler ───────────────────────────────────────

const getPresetRange = (selected) => {
  const today = todayMidnight();

  if (selected === "today") {
    return {
      start: today,
      end: new Date(today),
    };
  }

  if (selected === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      start: yesterday,
      end: new Date(yesterday),
    };
  }

  const days = Number(selected);

  return presetRange(days);
};

// ── Main component ────────────────────────────────────────────

export default function DateRangePicker({ value, onChange }) {
  const today = todayMidnight();

  // Open state
  const [open, setOpen] = useState(false);

  // Applied state
  const initRange = value || presetRange(30);
  const initPreset = detectPreset(initRange);

  const [appliedRange, setAppliedRange] = useState(initRange);
  const [appliedPreset, setAppliedPreset] = useState(initPreset);

  // Draft state
  const [range, setRange] = useState(initRange);
  const [preset, setPreset] = useState(initPreset);

  const [startInput, setStartInput] = useState(fmt(initRange.start));
  const [endInput, setEndInput] = useState(fmt(initRange.end));

  const [{ month, year }, setCalDate] = useState({
    month: initRange.start.getMonth(),
    year: initRange.start.getFullYear(),
  });

  // ── Sync draft state ───────────────────────────────────────

  const syncDraftToApplied = useCallback((r, p) => {
    setRange(r);
    setPreset(p);
    setStartInput(fmt(r.start));
    setEndInput(fmt(r.end));

    setCalDate({
      month: r.start.getMonth(),
      year: r.start.getFullYear(),
    });
  }, []);

  // ── Toggle popover ─────────────────────────────────────────

  const handleToggle = useCallback(() => {
    if (!open) {
      syncDraftToApplied(appliedRange, appliedPreset);
    }

    setOpen((o) => !o);
  }, [open, appliedRange, appliedPreset, syncDraftToApplied]);

  // ── Close popover ──────────────────────────────────────────

  const handleClose = useCallback(() => {
    syncDraftToApplied(appliedRange, appliedPreset);
    setOpen(false);
  }, [appliedRange, appliedPreset, syncDraftToApplied]);

  // ── Handle preset selection ─────────────────────────────────

  const handlePreset = useCallback((vals) => {
    const selected = vals[0];

    if (!selected) return;

    const r = getPresetRange(selected);

    setRange(r);
    setPreset(selected);

    setStartInput(fmt(r.start));
    setEndInput(fmt(r.end));

    setCalDate({
      month: r.start.getMonth(),
      year: r.start.getFullYear(),
    });
  }, []);

  // ── Start date input ────────────────────────────────────────

  const handleStartInput = useCallback((val) => {
    setStartInput(val);
    setPreset(null);

    const d = parse(val);

    if (d) {
      setRange((prev) => ({
        start: d,
        end: d > prev.end ? d : prev.end,
      }));

      setCalDate({
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
  }, []);

  // ── End date input ──────────────────────────────────────────

  const handleEndInput = useCallback((val) => {
    setEndInput(val);
    setPreset(null);

    const d = parse(val);

    if (d) {
      setRange((prev) => ({
        start: d < prev.start ? d : prev.start,
        end: d,
      }));
    }
  }, []);

  // ── Calendar change ─────────────────────────────────────────

  const handleCalendarChange = useCallback((r) => {
    setRange(r);
    setPreset(null);

    if (r.start) {
      setStartInput(fmt(r.start));
    }

    setEndInput(fmt(r.end ?? r.start));
  }, []);

  // ── Save selected range ─────────────────────────────────────

  const handleSave = useCallback(() => {
    setAppliedRange(range);
    setAppliedPreset(preset);

    setOpen(false);

    onChange?.(range);
  }, [range, preset, onChange]);

  // ── Button label ────────────────────────────────────────────

  const buttonLabel =
    PRESETS.find((p) => p.value === appliedPreset)?.label ||
    `${fmt(appliedRange.start)} – ${fmt(appliedRange.end)}`;

  // ── Activator ───────────────────────────────────────────────

  const activator = (
    <Button icon={CalendarIcon} disclosure onClick={handleToggle}>
      {buttonLabel}
    </Button>
  );

  return (
    <Popover
      active={open}
      activator={activator}
      onClose={handleClose}
      fluidContent
    >
      <Box minWidth="calc(500px + 200px)" padding="100">
        {/* Presets + Calendar */}

        <Box
          borderBlockEndWidth="025"
          borderColor="border-secondary"
          borderStyle="solid"
        >
          <InlineStack gap="100" align="start" wrap={false}>
            {/* LEFT - Presets */}

            <Scrollable style={{ minWidth: "180px" }}>
              <Box
                minHeight="100%"
                minWidth="180px"
                borderInlineEndWidth="025"
                borderColor="border-secondary"
                borderStyle="solid"
              >
                <BlockStack gap="050">
                  <Box paddingBlockStart="200" paddingInlineStart="300">
                    <Text variant="headingMd" as="h4">
                      Presets
                    </Text>
                  </Box>

                  <Scrollable style={{ maxHeight: "239px" }}>
                    <OptionList
                      options={PRESETS}
                      selected={preset ? [preset] : []}
                      onChange={handlePreset}
                    />
                  </Scrollable>
                </BlockStack>
              </Box>
            </Scrollable>

            {/* RIGHT - Calendar */}

            <Scrollable>
              <Box
                maxWidth="500px"
                paddingBlockStart="200"
                paddingBlockEnd="200"
                paddingInlineStart="300"
                paddingInlineEnd="200"
              >
                <BlockStack gap="400">
                  {/* Date inputs */}

                  <InlineStack
                    gap="100"
                    blockAlign="center"
                    align="space-around"
                    wrap={false}
                  >
                    <Box>
                      <TextField
                        label="Start Date"
                        labelHidden
                        value={startInput}
                        onChange={handleStartInput}
                        placeholder="YYYY-MM-DD"
                        autoComplete="off"
                      />
                    </Box>

                    <Box minHeight="100%">
                      <Icon source={ArrowRightIcon} tone="subdued" />
                    </Box>

                    <Box>
                      <TextField
                        label="End Date"
                        labelHidden
                        value={endInput}
                        onChange={handleEndInput}
                        placeholder="YYYY-MM-DD"
                        autoComplete="off"
                      />
                    </Box>
                  </InlineStack>

                  {/* Calendar */}

                  <DatePicker
                    month={month}
                    year={year}
                    selected={range}
                    onChange={handleCalendarChange}
                    onMonthChange={(m, y) =>
                      setCalDate({
                        month: m,
                        year: y,
                      })
                    }
                    allowRange
                    multiMonth
                    disableDatesAfter={today}
                  />
                </BlockStack>
              </Box>
            </Scrollable>
          </InlineStack>
        </Box>

        {/* Footer */}

        <Box
          borderColor="border-secondary"
          borderStyle="solid"
          paddingBlockStart="200"
          paddingBlockEnd="200"
          paddingInlineStart="200"
          paddingInlineEnd="200"
        >
          <InlineStack align="end" gap="200">
            <Button onClick={handleClose}>Cancel</Button>

            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Popover>
  );
}
