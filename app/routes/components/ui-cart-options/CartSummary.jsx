import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  Icon,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { ReceiptIcon } from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import BackgroundInput from "../ui/BackgroundInput";
import ColorInput from "../ui/ColorInput";
import {
  COMPARE_AT_OPTIONS,
  getSummary,
  patchSummary,
} from "../utils/summary";
import "../../../index.css";

export default function CartSummary({ cartSettings, handleChange }) {
  const s = getSummary(cartSettings);
  const update = (patch) => handleChange("cartSettings", patchSummary(patch));

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <InlineStack gap="300" align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Box>
              <Icon source={ReceiptIcon} />
            </Box>
            <Text variant="headingMd" as="h2">
              Summary
            </Text>
          </InlineStack>

          <button
            type="button"
            role="switch"
            aria-checked={s.enabled}
            aria-label="Summary"
            className={`sb-switch ${s.enabled ? "is-on" : ""}`}
            onClick={() => update({ enabled: !s.enabled })}
          >
            <span className="sb-switch-knob" />
          </button>
        </InlineStack>
      </Box>

      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
     
            <Checkbox
              label="Make it expandable"
              checked={s.expandable}
              onChange={(val) => update({ expandable: val })}
            />
            <Checkbox
              label="Collapsed by default"
              checked={s.collapsedByDefault}
              disabled={!s.expandable}
              onChange={(val) => update({ collapsedByDefault: val })}
            />
            
       <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="medium">
                Title
              </Text>
              <RichTextEditor
                value={s.title}
                onChange={(val) => update({ title: val })}
              />
            </BlockStack>

            <InlineGrid columns={2} gap="400" alignItems="end">
              <BlockStack gap="200">
                <Checkbox
                  label="Show Sub-total"
                  checked={s.showSubtotal}
                  onChange={(val) => update({ showSubtotal: val })}
                />
                <TextField
                  label="Subtotal"
                  value={s.subtotalLabel}
                  disabled={!s.showSubtotal}
                  onChange={(val) => update({ subtotalLabel: val })}
                  autoComplete="off"
                />
              </BlockStack>
              <BlockStack gap="200">
                <Checkbox
                  label="Show Discounts row"
                  checked={s.showDiscountsRow}
                  onChange={(val) => update({ showDiscountsRow: val })}
                />
                <TextField
                  label="Discounts row label"
                  value={s.discountsRowLabel}
                  disabled={!s.showDiscountsRow}
                  onChange={(val) => update({ discountsRowLabel: val })}
                  autoComplete="off"
                />
              </BlockStack>
            </InlineGrid>

            <InlineGrid columns={2} gap="400" alignItems="center">
              <Checkbox
                label="Compare-at price savings"
                checked={s.compareAtSavings}
                onChange={(val) => update({ compareAtSavings: val })}
              />
              <Select
                label="Compare-at price display"
                labelHidden
                options={COMPARE_AT_OPTIONS}
                value={s.compareAtMode}
                disabled={!s.compareAtSavings}
                onChange={(val) => update({ compareAtMode: val })}
              />
            </InlineGrid>

            <Checkbox
              label="Show applied discounts"
              checked={s.showAppliedDiscounts}
              onChange={(val) => update({ showAppliedDiscounts: val })}
            />
            <TextField
              label="Applied discounts label"
              value={s.appliedDiscountsLabel}
              disabled={!s.showAppliedDiscounts}
              onChange={(val) => update({ appliedDiscountsLabel: val })}
              autoComplete="off"
            />

            <Checkbox
              label="Show Shipping"
              checked={s.showShipping}
              onChange={(val) => update({ showShipping: val })}
            />
            <InlineGrid columns={2} gap="400" alignItems="end">
              <TextField
                label="Shipping label"
                value={s.shippingLabel}
                disabled={!s.showShipping}
                onChange={(val) => update({ shippingLabel: val })}
                autoComplete="off"
              />
              <TextField
                label="Free label"
                value={s.shippingFreeLabel}
                disabled={!s.showShipping || !s.showShippingFree}
                onChange={(val) => update({ shippingFreeLabel: val })}
                autoComplete="off"
              />
            </InlineGrid>
            <Checkbox
              label="Show Free"
              checked={s.showShippingFree}
              disabled={!s.showShipping}
              onChange={(val) => update({ showShippingFree: val })}
            />

            <ColorInput
              label="Text color"
              value={s.textColor}
              onChange={(val) => update({ textColor: val })}
            />
          </BlockStack>
        </Card>

        <BackgroundInput
          title="Background"
          value={s.background || { type: "plain", color: "#ffffff" }}
          onChange={(val) => update({ background: val })}
        />
      </BlockStack>
    </div>
  );
}
