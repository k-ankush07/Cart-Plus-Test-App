import {
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import RichTextEditor from "../ui/RichTextEditor";
import { ALIGNMENT_OPTIONS, getLogin, patchLogin } from "../utils/loginMessage";
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

const px = (val) => Math.max(0, Math.min(100, Number(val) || 0));

export default function LoginMessage({ cartSettings, handleChange, settingsKey = "login" }) {
  const s = getLogin(cartSettings, settingsKey);
  const update = (patch) => handleChange("cartSettings", patchLogin(patch, settingsKey));

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingSm" as="h2">
                Login message
              </Text>
              <button
                type="button"
                role="switch"
                aria-checked={s.enabled}
                aria-label="Login message"
                className={`sb-switch ${s.enabled ? "is-on" : ""}`}
                onClick={() => update({ enabled: !s.enabled })}
              >
                <span className="sb-switch-knob" />
              </button>
            </InlineStack>

            <Field
              label="Before link"
              value={s.beforeLink}
              onChange={(val) => update({ beforeLink: val })}
            />
            <Field
              label="Link text"
              value={s.linkText}
              onChange={(val) => update({ linkText: val })}
            />
            <Field
              label="After link"
              value={s.afterLink}
              onChange={(val) => update({ afterLink: val })}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Layout</Text>
            <InlineGrid columns={3} gap="300">
              <Select
                label="Alignment"
                options={ALIGNMENT_OPTIONS}
                value={s.alignment}
                onChange={(val) => update({ alignment: val })}
              />
              <TextField
                label="Top"
                type="number"
                min={0}
                max={100}
                suffix="px"
                value={String(s.top)}
                onChange={(val) => update({ top: px(val) })}
                autoComplete="off"
              />
              <TextField
                label="Bottom"
                type="number"
                min={0}
                max={100}
                suffix="px"
                value={String(s.bottom)}
                onChange={(val) => update({ bottom: px(val) })}
                autoComplete="off"
              />
            </InlineGrid>
          </BlockStack>
        </Card>
      </BlockStack>
    </div>
  );
}
