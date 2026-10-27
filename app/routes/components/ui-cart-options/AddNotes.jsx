import {
  BlockStack,
  Card,
  Checkbox,
  InlineStack,
  Select,
  Text,
  TextField,
  Box,
  Icon,
} from "@shopify/polaris";
import {
  NoteIcon, // Additional notes
} from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import BackgroundInput from "../ui/BackgroundInput";
import "../../../index.css";

// a labelled rich-text field
const Field = ({ label, value, onChange }) => (
  <BlockStack gap="100">
    <Text variant="bodyMd" fontWeight="medium">
      {label}
    </Text>
    <RichTextEditor value={value} onChange={onChange} />
  </BlockStack>
);

export default function AddNotes({ additionalNotesSettings, handleChange }) {
  const s = additionalNotesSettings;
  const update = (key, value) => {
    handleChange("additionalNotesSettings", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const expandable = s.expandable ?? true;

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={NoteIcon} />
              </Box>
              <Text variant="headingMd" as="h2">
                Order notes
              </Text>
            </InlineStack>

            <button
              type="button"
              role="switch"
              aria-checked={!s.enabled}
              aria-label="Order notes"
              className={`sb-switch ${!s.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !s.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>

      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <Checkbox
              label="Make it expandable"
              checked={expandable}
              onChange={(val) => update("expandable", val)}
            />
            <Checkbox
              label="Collapsed by default"
              checked={s.collapsedByDefault ?? true}
              disabled={!expandable}
              onChange={(val) => update("collapsedByDefault", val)}
            />

            <Field
              label={expandable ? "Title" : "Title (shown when expandable)"}
              value={s.title}
              onChange={(val) => update("title", val)}
            />
            <Field
              label="Button label"
              value={s.buttonLabel ?? "Note"}
              onChange={(val) => update("buttonLabel", val)}
            />
            <Field
              label="Heading"
              value={s.heading ?? "Order note"}
              onChange={(val) => update("heading", val)}
            />
            <TextField
              label="Placeholder"
              value={s.placeholder ?? ""}
              onChange={(val) => update("placeholder", val)}
              autoComplete="off"
            />
            <Field
              label="Save button"
              value={s.saveLabel ?? "Save note"}
              onChange={(val) => update("saveLabel", val)}
            />

            <Checkbox
              label="Limit to 500 characters"
              checked={s.limitChars ?? true}
              onChange={(val) => update("limitChars", val)}
            />
          </BlockStack>
        </Card>

        <Card>
          <BackgroundInput
            title="Note button color"
            value={
              s.noteButtonBackground || { type: "plain", color: "#ffffff" }
            }
            onChange={(val) => update("noteButtonBackground", val)}
          />
          <BackgroundInput
            title="Order note background"
            value={s.orderNoteBackground || { type: "plain", color: "#ffffff" }}
            onChange={(val) => update("orderNoteBackground", val)}
          />
          <BackgroundInput
            title="Save note background"
            value={s.saveNoteBackground || { type: "plain", color: "#303030" }}
            onChange={(val) => update("saveNoteBackground", val)}
          />
        </Card>
      </BlockStack>
    </div>
  );
}
