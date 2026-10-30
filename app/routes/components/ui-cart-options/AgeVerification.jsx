import { useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Modal,
  Pagination,
  RadioButton,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import { PersonIcon } from "@shopify/polaris-icons";
import { AGE_TEMPLATES, CLASSIC_BASE } from "../utils/ageTemplates";

import RichTextEditor from "../ui/RichTextEditor";
import BackgroundInput from "../ui/BackgroundInput";
import ColorInput from "../ui/ColorInput";
import ProductItemCollections from "../ui/ProductItem-Collections";
import {
  APPLY_TO_OPTIONS,
  getAgeVerification,
  patchAgeVerification,
} from "../utils/ageVerification";
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

const countText = (s) => {
  const items = s?.items;
  if (!items) return "Nothing selected";
  if (s.type === "products")
    return `${items.products?.length || 0} product(s) selected`;
  return `${items.length || 0} collection(s) selected`;
};

export default function AgeVerification({
  cartSettings,
  handleChange,
  currency,
}) {
  const s = getAgeVerification(cartSettings);
  const update = (patch) =>
    handleChange("cartSettings", patchAgeVerification(patch));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [pagination, setPagination] = useState({
    hasPrevious: false,
    hasNext: false,
    handlePrev: () => {},
    handleNext: () => {},
  });

  const needsPicker = s.applyTo !== "all";
  const selectedForType =
    s.selected?.type === s.applyTo ? s.selected : undefined;

  const applyTemplate = (key) => {
    const { label, ...settings } = AGE_TEMPLATES[key];
    update({ template: key, ...settings });
  };
  const isTpl = !!s.template && !!AGE_TEMPLATES[s.template];

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Box>
              <Icon source={PersonIcon} />
            </Box>
            <Text variant="headingMd" as="h2">
              Apply the age verification for :
            </Text>
          </InlineStack>
          <button
            type="button"
            role="switch"
            aria-checked={s.enabled}
            aria-label="Age Verification"
            className={`sb-switch ${s.enabled ? "is-on" : ""}`}
            onClick={() => update({ enabled: !s.enabled })}
          >
            <span className="sb-switch-knob" />
          </button>
        </InlineStack>
        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Template</Text>
            <InlineStack gap="200" wrap>
              <Button
                pressed={!s.template}
                onClick={() => update({ template: "", ...CLASSIC_BASE })}
              >
                Classic
              </Button>
              {Object.entries(AGE_TEMPLATES).map(([key, t]) => (
                <Button
                  key={key}
                  pressed={s.template === key}
                  onClick={() => applyTemplate(key)}
                >
                  {t.label}
                </Button>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>

        {isTpl && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingSm">Customize template</Text>
              {["inline", "badge-row", "badge-stack", "title"].includes(
                AGE_TEMPLATES[s.template].layout,
              ) && (
                <InlineGrid columns={2} gap="300">
                  <TextField
                    label="Yes button text"
                    autoComplete="off"
                    value={s.yesText ?? ""}
                    onChange={(v) => update({ yesText: v })}
                  />
                  <TextField
                    label="No button text"
                    autoComplete="off"
                    value={s.noText ?? ""}
                    onChange={(v) => update({ noText: v })}
                  />
                </InlineGrid>
              )}
              {AGE_TEMPLATES[s.template].layout === "confirm" && (
                <TextField
                  label="Continue button text"
                  autoComplete="off"
                  value={s.continueText ?? ""}
                  onChange={(v) => update({ continueText: v })}
                />
              )}
              <InlineGrid columns={2} gap="300">
                <ColorInput
                  label="Button / toggle color"
                  value={s.accent ?? "#111827"}
                  onChange={(v) => update({ accent: v })}
                />
                <ColorInput
                  label="Button text color"
                  value={s.accentText ?? "#ffffff"}
                  onChange={(v) => update({ accentText: v })}
                />
                <ColorInput
                  label="Second button color"
                  value={s.secondaryBg ?? "#f1f3f5"}
                  onChange={(v) => update({ secondaryBg: v })}
                />
                <ColorInput
                  label="Second button text"
                  value={s.secondaryText ?? "#1a1a1a"}
                  onChange={(v) => update({ secondaryText: v })}
                />
                <ColorInput
                  label="18+ badge color"
                  value={s.badgeColor ?? "#e5383b"}
                  onChange={(v) => update({ badgeColor: v })}
                />
              </InlineGrid>
              <Text variant="bodySm" tone="subdued">
                Question, subtitle, background, border and radius use the fields
                below.
              </Text>
            </BlockStack>
          </Card>
        )}
        <Card>
          <BlockStack gap="300">
            <BlockStack gap="100">
              {APPLY_TO_OPTIONS.map((o) => (
                <RadioButton
                  key={o.value}
                  label={o.label}
                  checked={s.applyTo === o.value}
                  onChange={() => update({ applyTo: o.value })}
                />
              ))}
            </BlockStack>

            {needsPicker && (
              <InlineStack gap="300" blockAlign="center">
                <Button
                  onClick={() => {
                    setPicked(null);
                    setPickerOpen(true);
                  }}
                >
                  {s.applyTo === "products"
                    ? "Select products"
                    : "Select collections"}
                </Button>
                <Text tone="subdued">{countText(selectedForType)}</Text>
              </InlineStack>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Age verification</Text>

            <div style={{ maxWidth: 200 }}>
              <TextField
                label="Minimum age"
                type="number"
                min={1}
                max={99}
                value={String(s.minimumAge)}
                suffix="Years"
                onChange={(val) =>
                  update({
                    minimumAge: Math.max(1, Math.min(99, Number(val) || 1)),
                  })
                }
                autoComplete="off"
              />
            </div>

            <Field
              label="Confirmation checkbox"
              value={s.checkboxText}
              onChange={(val) => update({ checkboxText: val })}
            />
            <Field
              label="Subtitle field"
              value={s.subtitle}
              onChange={(val) => update({ subtitle: val })}
            />
            <Field
              label="Error state"
              value={s.errorText}
              onChange={(val) => update({ errorText: val })}
            />
            <Text variant="bodySm" tone="subdued">
              Use {"{{minimumAge}}"} to insert the minimum age.
            </Text>
          </BlockStack>
        </Card>

        <BackgroundInput
          title="Background"
          value={s.background || { type: "plain", color: "#ffffff" }}
          onChange={(val) => update({ background: val })}
        />

        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Other colors</Text>
            <InlineGrid columns={2} gap="400">
              <RangeSlider
                label="Border radius"
                value={s.borderRadius}
                min={0}
                max={24}
                output
                onChange={(val) => update({ borderRadius: val })}
              />
              <RangeSlider
                label="Error state border radius"
                value={s.errorBorderRadius}
                min={0}
                max={24}
                output
                onChange={(val) => update({ errorBorderRadius: val })}
              />
              <ColorInput
                label="Border"
                value={s.borderColor}
                onChange={(val) => update({ borderColor: val })}
              />
              <ColorInput
                label="Toggle"
                value={s.toggleColor}
                onChange={(val) => update({ toggleColor: val })}
              />
              <ColorInput
                label="Error state background"
                value={s.errorBackground}
                onChange={(val) => update({ errorBackground: val })}
              />
              <ColorInput
                label="Error state border"
                value={s.errorBorderColor}
                onChange={(val) => update({ errorBorderColor: val })}
              />
            </InlineGrid>
          </BlockStack>
        </Card>
      </BlockStack>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={
          s.applyTo === "products" ? "Select products" : "Select collections"
        }
        primaryAction={{
          content: "Save",
          onAction: () => {
            if (picked) update({ selected: picked });
            setPickerOpen(false);
          },
        }}
        secondaryActions={[
          { content: "Close", onAction: () => setPickerOpen(false) },
        ]}
        footer={
          <InlineStack align="space-between" blockAlign="center">
            <Pagination
              hasPrevious={pagination.hasPrevious}
              onPrevious={pagination.handlePrev}
              hasNext={pagination.hasNext}
              onNext={pagination.handleNext}
            />
          </InlineStack>
        }
      >
        <Modal.Section>
          {pickerOpen && (
            <ProductItemCollections
              key={s.applyTo}
              currency={currency}
              showProducts={s.applyTo === "products"}
              showCollections={s.applyTo === "collections"}
              multiSelectCollections
              onSelect={(data) => setPicked(data)}
              initialSelected={selectedForType}
              onPaginationChange={(p) => setPagination(p)}
            />
          )}
        </Modal.Section>
      </Modal>
    </div>
  );
}
