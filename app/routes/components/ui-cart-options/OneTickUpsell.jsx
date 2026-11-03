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

/* ---------- mini previews ---------- */
const P_DARK = "#1a1a1a";
const P_GRAY = "#d9d9d9";
const P_BLUE = "#6b7cff";

const PBar = ({ w = "100%", h = 3, color = P_GRAY, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: h,
      background: color,
      flexShrink: 0,
      ...style,
    }}
  />
);

const PSquare = ({ size = 14, color = P_GRAY, radius = 3 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: color,
      flexShrink: 0,
    }}
  />
);

/* Layout previews */
const RowPreview = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#fff",
      border: "1px solid #e1e3e5",
      borderRadius: 6,
      padding: "8px 10px",
      width: "100%",
      boxSizing: "border-box",
    }}
  >
    <PSquare size={14} />
    <div style={{ flex: 1, display: "grid", gap: 4 }}>
      <PBar h={2} />
      <PBar h={2} w="60%" />
    </div>
    <PBar w={18} h={6} color={P_BLUE} />
  </div>
);

const ListPreview = () => (
  <div style={{ display: "grid", gap: 8, width: "100%" }}>
    {[0, 1].map((i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PSquare size={16} />
        <div style={{ flex: 1, display: "grid", gap: 4 }}>
          <PBar h={2} w="75%" />
          <PBar h={2} />
        </div>
      </div>
    ))}
  </div>
);

const CarouselPreview = () => (
  <div style={{ display: "grid", justifyItems: "center", gap: 5 }}>
    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <PSquare key={i} size={18} radius={9} />
      ))}
    </div>
    <div style={{ display: "flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <PSquare key={i} size={3} radius={2} color={i === 1 ? P_DARK : P_GRAY} />
      ))}
    </div>
  </div>
);

/* Trigger previews */
const TriggerFrame = ({ children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      width: "100%",
    }}
  >
    <div style={{ flex: 1, display: "grid", gap: 4 }}>
      <PBar h={2} />
      <PBar h={2} w="85%" />
      <PBar h={2} w="70%" />
    </div>
    {children}
  </div>
);

const ButtonTriggerPreview = () => (
  <TriggerFrame>
    <div style={{ display: "grid", gap: 3 }}>
      <PBar w={16} h={5} color={P_DARK} />
      <PBar w={16} h={5} color={P_DARK} />
    </div>
  </TriggerFrame>
);

const CheckboxTriggerPreview = () => (
  <TriggerFrame>
    <div style={{ display: "grid", gap: 3 }}>
      <PSquare size={6} color={P_DARK} radius={1} />
      <div
        style={{
          width: 6,
          height: 6,
          border: `1px solid ${P_DARK}`,
          borderRadius: 1,
          boxSizing: "border-box",
        }}
      />
    </div>
  </TriggerFrame>
);

const MiniSwitch = ({ on }) => (
  <div
    style={{
      width: 14,
      height: 7,
      borderRadius: 7,
      background: on ? P_DARK : P_GRAY,
      display: "flex",
      alignItems: "center",
      justifyContent: on ? "flex-end" : "flex-start",
      padding: 1,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }}
    />
  </div>
);

const ToggleTriggerPreview = () => (
  <TriggerFrame>
    <div style={{ display: "grid", gap: 3 }}>
      <MiniSwitch on />
      <MiniSwitch />
    </div>
  </TriggerFrame>
);

const LAYOUTS = [
  { value: "row", label: "Row", preview: <RowPreview /> },
  { value: "list", label: "List", preview: <ListPreview /> },
  { value: "carousel", label: "Carousel", preview: <CarouselPreview /> },
];

const TRIGGERS = [
  { value: "button", label: "Button", preview: <ButtonTriggerPreview /> },
  { value: "checkbox", label: "Checkbox", preview: <CheckboxTriggerPreview /> },
  { value: "toggle", label: "Toggle", preview: <ToggleTriggerPreview /> },
];

const OptionCards = ({
  label,
  options,
  value,
  onChange,
  showLabels = false,
}) => (
  <BlockStack gap="100">
    <Text as="p" variant="bodyMd" fontWeight="medium">
      {label}
    </Text>
    <InlineGrid columns={3} gap="200">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <div
            key={o.value}
            role="button"
            tabIndex={0}
            aria-label={`${label}: ${o.label}`}
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => e.key === "Enter" && onChange(o.value)}
            style={{
              cursor: "pointer",
              borderRadius: 10,
              padding: 12,
              minHeight: 84,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              background: selected ? "#fff" : "#f6f6f7",
              border: selected ? "2px solid #1a1a1a" : "1px solid #e1e3e5",
            }}
          >
            <div style={{ pointerEvents: "none" }}>{o.preview}</div>
            {showLabels && (
              <div style={{ textAlign: "center" }}>
                <Text as="span" variant="bodySm" fontWeight="medium">
                  {o.label}
                </Text>
              </div>
            )}
          </div>
        );
      })}
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

      <BlockStack gap="200">
        {/* Title + icon + Layout + Trigger + Button label in one card */}
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
              showLabels
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
                      {(() => {
                        const items = offer.selected?.items;
                        const title = items?.titles?.[0];
                        const count = items?.variants?.length || 0;
                        // the image key depends on the picker data, so several options are checked
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
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {count} variant{count === 1 ? "" : "s"}{" "}
                                    selected
                                  </Text>
                                </div>
                              </>
                            ) : (
                              <div style={{ width: "100%", textAlign: "left" }}>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  No product selected yet.
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                max={96}
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