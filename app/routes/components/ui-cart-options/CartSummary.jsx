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

import IconLibrary from "../ui/IconLibrary";
import RichTextEditor from "../ui/RichTextEditor";
import BackgroundInput from "../ui/BackgroundInput";
import ColorInput from "../ui/ColorInput";
import {
  COMPARE_AT_OPTIONS,
  SUMMARY_DESIGNS,
  getSummary,
  patchSummary,
} from "../utils/summary";
import "../../../index.css";

const PREVIEW_LINE = {
  height: 5,
  borderRadius: 4,
  background: "#d8dde5",
};

export default function CartSummary({
  cartSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
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
            <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="medium">
                Design
              </Text>
              <InlineGrid columns={3} gap="200">
                {SUMMARY_DESIGNS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={s.design === d.value}
                    onClick={() => {
                      const defaultTemplateTitles = [
                        "Summary",
                        ...SUMMARY_DESIGNS.map((design) => design.label),
                      ];
                      const defaultShippingLabels = [
                        "Shipping",
                        "Delivery charge",
                        "Delivery Fee",
                        "Platform Fee",
                      ];
                      const templateShippingLabel = {
                        "bill-details": "Delivery charge",
                        "bill-summary": "Delivery Fee",
                        "price-details": "Platform Fee",
                      }[d.value];
                      update({
                        design: d.value,
                        ...(defaultTemplateTitles.includes(s.title)
                          ? { title: d.label }
                          : {}),
                        ...(templateShippingLabel &&
                        defaultShippingLabels.includes(s.shippingLabel)
                          ? { shippingLabel: templateShippingLabel }
                          : {}),
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      width: "100%",
                      padding: 10,
                      borderRadius: 9,
                      border:
                        s.design === d.value
                          ? "2px solid #303030"
                          : "1px solid #e1e3e5",
                      background: "#fff",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: "#303030",
                      }}
                    >
                      {d.label}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        gap: 5,
                        padding: 8,
                        borderRadius: d.value === "bill-summary" ? 7 : 4,
                        background:
                          d.value === "price-details" ? "#f8fafc" : "#fff",
                        border:
                          d.value === "bill-summary"
                            ? "1px solid #e6e9ee"
                            : "none",
                      }}
                    >
                      {(d.value === "bill-details"
                        ? [
                            "Items total",
                            "Delivery charge",
                            "Handling charge",
                            "Grand total",
                          ]
                        : d.value === "price-details"
                          ? [
                              "Total MRP",
                              "Discount on MRP",
                              "Platform fee",
                              "Total amount",
                            ]
                          : [
                              "Item total",
                              "Delivery fee",
                              "Handling fee",
                              "To pay",
                            ]
                      ).map((row, index) => (
                        <span
                          key={row}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 6,
                            paddingTop:
                              d.value === "bill-details" && index === 3 ? 5 : 0,
                            borderTop:
                              d.value === "bill-details" && index === 3
                                ? "1px dashed #b9c9e8"
                                : "none",
                          }}
                        >
                          <span
                            style={{
                              ...PREVIEW_LINE,
                              width: index === 3 ? "43%" : "55%",
                            }}
                          />
                          <span
                            style={{
                              ...PREVIEW_LINE,
                              width: "25%",
                              background:
                                d.value === "price-details" && index === 1
                                  ? "#79bd8b"
                                  : index === 3
                                    ? "#5887e8"
                                    : "#c4cad3",
                            }}
                          />
                        </span>
                      ))}
                      {d.value === "price-details" && (
                        <span
                          style={{
                            ...PREVIEW_LINE,
                            width: "100%",
                            height: 9,
                            marginTop: 2,
                            background: "#b9e8ad",
                          }}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </InlineGrid>
            </BlockStack>
            <Checkbox
              label="Show icons"
              checked={s.showIcons}
              onChange={(val) => update({ showIcons: val })}
            />
            {s.showIcons && (
              <BlockStack gap="100">
                <Text variant="bodyMd" fontWeight="medium">
                  Summary icon
                </Text>
                <IconLibrary
                  value={s.titleIcon}
                  onChange={(val) => update({ titleIcon: val })}
                  quickIcons={[
                    "receipt",
                    "cart",
                    "discount",
                    "delivery",
                    "payment",
                    "gift",
                    "star",
                    "shield",
                  ]}
                  shop={shop}
                  accessToken={accessToken}
                  apiUrl={apiUrl}
                />
              </BlockStack>
            )}

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

            {s.design === "price-details" && (
              <>
                <Checkbox
                  label="Show savings banner"
                  checked={s.showSavingsBanner}
                  onChange={(val) => update({ showSavingsBanner: val })}
                />
                <TextField
                  label="Savings banner text"
                  helpText="Use {amount} where the saved amount should appear"
                  value={s.savingsBannerText}
                  disabled={!s.showSavingsBanner}
                  onChange={(val) => update({ savingsBannerText: val })}
                  autoComplete="off"
                />
                <InlineGrid columns={2} gap="400">
                  <ColorInput
                    label="Banner background"
                    value={s.savingsBannerBg}
                    onChange={(val) => update({ savingsBannerBg: val })}
                  />
                  <ColorInput
                    label="Banner text color"
                    value={s.savingsBannerTextColor}
                    onChange={(val) => update({ savingsBannerTextColor: val })}
                  />
                </InlineGrid>
              </>
            )}

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
