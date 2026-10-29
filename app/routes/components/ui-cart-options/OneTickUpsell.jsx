import { useState } from "react";
import {
  LegacyCard,
  Text,
  TextField,
  Select,
  Button,
  Modal,
  Pagination,
  RadioButton,
  Checkbox,
  RangeSlider,
  InlineStack,
  InlineGrid,
  BlockStack,
  Box,
  Icon,
} from "@shopify/polaris";
import { CartIcon, DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import IconLibrary from "../ui/IconLibrary";
import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import ProductItemCollections from "../ui/ProductItem-Collections";
import {
  getOneTick,
  newOffer,
  patchOneTick,
  toggleOneTick,
} from "../utils/oneTick";
import "../../../index.css";

const LAYOUTS = [
  { value: "row", label: "Row" },
  { value: "list", label: "List" },
  { value: "carousel", label: "Carousel" },
];

const TRIGGERS = [
  { value: "button", label: "Button" },
  { value: "checkbox", label: "Checkbox" },
  { value: "toggle", label: "Toggle" },
];

const OptionCards = ({ label, options, value, onChange }) => (
  <BlockStack gap="100">
    <Text as="p" variant="bodyMd">
      {label}
    </Text>
    <InlineGrid columns={3} gap="200">
      {options.map((o) => (
        <div
          key={o.value}
          role="button"
          tabIndex={0}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => e.key === "Enter" && onChange(o.value)}
          style={{
            cursor: "pointer",
            borderRadius: 10,
            padding: "14px 12px",
            textAlign: "center",
            background: "#fff",
            border:
              value === o.value ? "2px solid #303030" : "1px solid #e1e3e5",
          }}
        >
          <Text as="span" variant="bodySm" fontWeight="medium">
            {o.label}
          </Text>
        </div>
      ))}
    </InlineGrid>
  </BlockStack>
);

export default function OneTickUpsell({
  cartSettings,
  handleChange,
  currency,
  shop,
  accessToken,
  apiUrl,
}) {
  const oneTick = getOneTick(cartSettings);
  const update = (patch) => handleChange("cartSettings", patchOneTick(patch));

  const updateOffer = (id, patch) =>
    update({
      offers: oneTick.offers.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });

  // product picker for the offer being edited
  const [pickerFor, setPickerFor] = useState(null);
  const [picked, setPicked] = useState(null);
  const [pagination, setPagination] = useState({
    hasPrevious: false,
    hasNext: false,
    handlePrev: () => {},
    handleNext: () => {},
  });
  const pickerOffer = oneTick.offers.find((o) => o.id === pickerFor);

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Icon source={CartIcon} />
            <Text variant="headingMd" as="h2">
              One Tick Upsell
            </Text>
          </InlineStack>
          <button
            type="button"
            role="switch"
            aria-checked={oneTick.enabled}
            aria-label="Toggle one tick upsell"
            className={`sb-switch ${oneTick.enabled ? "is-on" : ""}`}
            onClick={() => handleChange("cartSettings", toggleOneTick)}
          >
            <span className="sb-switch-knob" />
          </button>
        </InlineStack>
      </Box>

      <BlockStack gap="400">
        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Title
            </Text>
            <RichTextEditor
              value={oneTick.title}
              onChange={(title) => update({ title })}
            />
            <IconLibrary
              value={oneTick.icon}
              onChange={(icon) => update({ icon })}
              quickIcons={[
                "star",
                "heart",
                "right",
                "gift",
                "discount",
                "cart",
                "megaphone",
                "delivery",
              ]}
              shop={shop}
              accessToken={accessToken}
              apiUrl={apiUrl}
            />
            <ColorInput
              label="Icon color"
              value={oneTick.iconColor || "#000000"}
              onChange={(iconColor) => update({ iconColor })}
            />
            <OptionCards
              label="Layout"
              options={LAYOUTS}
              value={oneTick.layout}
              onChange={(layout) => update({ layout })}
            />
            <OptionCards
              label="Trigger"
              options={TRIGGERS}
              value={oneTick.trigger}
              onChange={(trigger) => update({ trigger })}
            />
            <TextField
              label="Button Label"
              value={oneTick.buttonLabel}
              onChange={(buttonLabel) => update({ buttonLabel })}
              autoComplete="off"
            />
          </BlockStack>
        </LegacyCard>

        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Offers
            </Text>

            {oneTick.offers.map((offer, index) => (
              <div
                key={offer.id}
                style={{
                  border: "1px solid #e1e3e5",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={CartIcon} />
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Offer {index + 1}
                      </Text>
                    </InlineStack>
                    <Button
                      variant="plain"
                      tone="critical"
                      icon={DeleteIcon}
                      accessibilityLabel="Delete offer"
                      onClick={() =>
                        update({
                          offers: oneTick.offers.filter(
                            (o) => o.id !== offer.id,
                          ),
                        })
                      }
                    />
                  </InlineStack>

                  <InlineStack gap="400">
                    <RadioButton
                      label="Auto-recommend (AI)"
                      checked={offer.mode === "auto"}
                      onChange={() => updateOffer(offer.id, { mode: "auto" })}
                    />
                    <RadioButton
                      label="Manual selection"
                      checked={offer.mode === "manual"}
                      onChange={() => updateOffer(offer.id, { mode: "manual" })}
                      disabled
                    />
                  </InlineStack>

                  {offer.mode === "manual" && (
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => {
                          setPicked(offer.selected);
                          setPickerFor(offer.id);
                        }}
                      >
                        Select Product
                      </Button>
                      <div
                        style={{
                          border: "1px dashed #c9cccf",
                          borderRadius: 8,
                          padding: 12,
                          textAlign: "center",
                        }}
                      >
                        {(() => {
                          const items = offer.selected?.items;
                          const title = items?.titles?.[0];
                          const count = items?.variants?.length || 0;
                          // image ka key aapke picker data par depend karta hai, isliye kai options check kiye hain
                          const image =
                            items?.images?.[0] ||
                            items?.image ||
                            items?.imageUrls?.[0] ||
                            offer.selected?.image ||
                            null;

                          return (
                            <div
                              style={{
                                border: "1px dashed #c9cccf",
                                borderRadius: 8,
                                padding: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              {title ? (
                                <>
                                  {image && (
                                    <img
                                      src={image}
                                      alt={title}
                                      style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <div
                                    style={{
                                      minWidth: 0,
                                      flex: 1,
                                      textAlign: "left",
                                    }}
                                  >
                                    <Text
                                      as="p"
                                      variant="bodySm"
                                      fontWeight="semibold"
                                      truncate
                                    >
                                      {title}
                                    </Text>
                                    <Text
                                      as="p"
                                      variant="bodySm"
                                      tone="subdued"
                                    >
                                      {count} variant{count === 1 ? "" : "s"}{" "}
                                      selected
                                    </Text>
                                  </div>
                                </>
                              ) : (
                                <div
                                  style={{ width: "100%", textAlign: "left" }}
                                >
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    No product selected yet.
                                  </Text>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}

                  <InlineGrid columns={2} gap="300">
                    <Select
                      label="Discount"
                      options={[
                        { label: "No discount", value: "none" },
                        { label: "Percentage off", value: "percentage" },
                        { label: "Amount off", value: "amount" },
                      ]}
                      value={offer.discountType}
                      onChange={(discountType) =>
                        updateOffer(offer.id, { discountType })
                      }
                    />
                    <TextField
                      label="Value"
                      type="number"
                      min={0}
                      value={String(offer.discountValue)}
                      disabled={offer.discountType === "none"}
                      autoComplete="off"
                      onChange={(v) =>
                        updateOffer(offer.id, { discountValue: Number(v) || 0 })
                      }
                    />
                  </InlineGrid>

                  <Checkbox
                    label="Show label"
                    checked={offer.showLabel}
                    onChange={(showLabel) =>
                      updateOffer(offer.id, { showLabel })
                    }
                  />
                  {offer.showLabel && (
                    <>
                      <RichTextEditor
                        value={offer.label}
                        onChange={(label) => updateOffer(offer.id, { label })}
                      />
                      <Text as="p" variant="bodySm" tone="subdued">
                        Use {"{{saved_percentage}}"} or {"{{saved_amount}}"}.
                      </Text>
                    </>
                  )}
                </BlockStack>
              </div>
            ))}

            <Button
              variant="primary"
              icon={PlusIcon}
              fullWidth
              onClick={() =>
                update({ offers: [...oneTick.offers, newOffer()] })
              }
            >
              Offer
            </Button>
          </BlockStack>
        </LegacyCard>

        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Styles
            </Text>
            <InlineGrid columns={2} gap="400">
              <RangeSlider
                label="Image size"
                min={60}
                max={240}
                output
                value={oneTick.imageSize}
                suffix={<Text as="span">{oneTick.imageSize} px</Text>}
                onChange={(imageSize) => update({ imageSize })}
              />
              <RangeSlider
                label="Radius"
                min={0}
                max={24}
                output
                value={oneTick.radius}
                suffix={<Text as="span">{oneTick.radius} px</Text>}
                onChange={(radius) => update({ radius })}
              />
              <ColorInput
                label="Primary text"
                value={oneTick.primaryTextColor}
                onChange={(primaryTextColor) => update({ primaryTextColor })}
              />
              <ColorInput
                label="Secondary text"
                value={oneTick.secondaryTextColor}
                onChange={(secondaryTextColor) =>
                  update({ secondaryTextColor })
                }
              />
            </InlineGrid>
          </BlockStack>
        </LegacyCard>

        <LegacyCard sectioned>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Button Style
            </Text>
            <InlineGrid columns={2} gap="400">
              <RangeSlider
                label="Border radius"
                min={0}
                max={24}
                output
                value={oneTick.buttonRadius}
                onChange={(buttonRadius) => update({ buttonRadius })}
              />
              <RangeSlider
                label="Font size"
                min={10}
                max={20}
                output
                value={oneTick.buttonFontSize}
                onChange={(buttonFontSize) => update({ buttonFontSize })}
              />
              <ColorInput
                label="Background"
                value={oneTick.buttonBackground?.color || "#303030"}
                onChange={(color) =>
                  update({ buttonBackground: { type: "plain", color } })
                }
              />
              <ColorInput
                label="Text"
                value={oneTick.buttonTextColor}
                onChange={(buttonTextColor) => update({ buttonTextColor })}
              />
            </InlineGrid>
          </BlockStack>
        </LegacyCard>

        <BackgroundInput
          title="Card color"
          value={oneTick.cardBackground || undefined}
          onChange={(cardBackground) => update({ cardBackground })}
        />
      </BlockStack>

      <Modal
        open={!!pickerOffer}
        onClose={() => setPickerFor(null)}
        title="Select Product"
        primaryAction={{
          content: "Save",
          onAction: () => {
            if (pickerOffer && picked)
              updateOffer(pickerOffer.id, { selected: picked });
            setPickerFor(null);
          },
        }}
        secondaryActions={[
          { content: "Close", onAction: () => setPickerFor(null) },
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
          {pickerOffer && (
            <ProductItemCollections
              currency={currency}
              singleProduct
              showCollections={false}
              onSelect={(data) => setPicked(data)}
              initialSelected={pickerOffer.selected}
              onPaginationChange={(p) => setPagination(p)}
            />
          )}
        </Modal.Section>
      </Modal>
    </div>
  );
}
