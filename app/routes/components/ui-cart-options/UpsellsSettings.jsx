import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  InlineGrid,
  Link,
  RangeSlider,
  Select,
  Text,
  TextField,
  Modal,
  Box,
  Icon,
  Pagination,
} from "@shopify/polaris";
import {
  PlusCircleIcon, // Upsells
} from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import IconLibrary from "../ui/IconLibrary";
import BackgroundInput from "../ui/BackgroundInput";
import ProductItemCollections from "../ui/ProductItem-Collections";
import { useState } from "react";

/* ---------- mini previews ---------- */
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

const PBlock = ({
  w = "100%",
  h = 20,
  color = P_GRAY,
  radius = 3,
  children,
}) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      borderRadius: radius,
      background: color,
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

const ListPreview = () => (
  <div style={{ display: "grid", gap: 6, width: "100%" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PBlock w={10} h={10} />
        <div style={{ flex: 1, display: "grid", gap: 3 }}>
          <PBar h={2} />
          <PBar h={2} w="80%" />
        </div>
        <PBar w={10} h={4} color={P_BLUE} />
      </div>
    ))}
  </div>
);

const CarouselPreview = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      width: "100%",
    }}
  >
    {[0, 1].map((i) => (
      <div key={i} style={{ display: "grid", gap: 3 }}>
        <PBlock h={22} />
        <PBar h={2} />
        <PBar h={3} color={P_BLUE} />
      </div>
    ))}
  </div>
);

const CompactPreview = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      width: "100%",
    }}
  >
    {[0, 1, 2].map((i) => (
      <PBlock key={i} h={26}>
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: P_BLUE,
          }}
        />
      </PBlock>
    ))}
  </div>
);

const SidePreview = () => (
  <div style={{ display: "flex", gap: 8, width: "100%", minHeight: 40 }}>
    <div
      style={{ width: "36%", display: "grid", gap: 4, alignContent: "start" }}
    >
      {[0, 1].map((i) => (
        <div key={i} style={{ display: "grid", gap: 2 }}>
          <PBlock h={12} />
          <PBar h={2} color={P_BLUE} />
        </div>
      ))}
    </div>
    <div style={{ width: 1, background: "#e1e3e5", flexShrink: 0 }} />
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <div style={{ display: "grid", gap: 3 }}>
        <PBar h={2} />
        <PBar h={2} w="70%" />
      </div>
      <PBar h={3} color={P_BLUE} />
    </div>
  </div>
);

const UPSELL_LAYOUTS = [
  { value: "list", label: "List", preview: <ListPreview /> },
  { value: "carousel", label: "Carousel", preview: <CarouselPreview /> },
  { value: "compact", label: "Compact", preview: <CompactPreview /> },
  { value: "side", label: "Side panel", preview: <SidePreview /> },
];

// selectable cards; options with a `preview` show a mini wireframe + label,
// options without one stay as plain text cards
const OptionCards = ({ label, options, value, onChange, columns = 3 }) => (
  <BlockStack gap="100">
    <Text as="p" variant="bodyMd" fontWeight="medium">
      {label}
    </Text>
    <InlineGrid columns={columns} gap="200">
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
              padding: o.preview ? 12 : "14px 12px",
              minHeight: o.preview ? 112 : undefined,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: o.preview ? "space-between" : "center",
              gap: 8,
              textAlign: "center",
              background: !o.preview || selected ? "#fff" : "#f6f6f7",
              border: selected ? "2px solid #303030" : "1px solid #e1e3e5",
            }}
          >
            {o.preview && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                {o.preview}
              </div>
            )}
            <Text as="span" variant="bodySm" fontWeight="medium">
              {o.label}
            </Text>
          </div>
        );
      })}
    </InlineGrid>
  </BlockStack>
);

export default function UpsellsSettings({
  upsellsSettings,
  handleChange,
  currency,
  shop,
  accessToken,
  apiUrl,
}) {
  // older carts only have `direction`
  const layout =
    upsellsSettings.layout === "row" || !upsellsSettings.layout
      ? upsellsSettings.direction === "carousel"
        ? "carousel"
        : "list"
      : upsellsSettings.layout;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({
    type: upsellsSettings.sourceType || "products",
    items: upsellsSettings.selectedItems || [],
  });

  const [suggestedOpen, setSuggestedOpen] = useState(false);
  const [suggestedSelected, setSuggestedSelected] = useState(
    upsellsSettings.suggestedProduct || { type: "products", items: [] },
  );

  const update = (key, value) => {
    handleChange("upsellsSettings", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [pagination, setPagination] = useState({
    hasPrevious: false,
    hasNext: false,
    handlePrev: () => {},
    handleNext: () => {},
  });

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={PlusCircleIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Cross-sell
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />

            <button
              type="button"
              role="switch"
              aria-checked={!upsellsSettings.enabled}
              aria-label="Cross-sell"
              className={`sb-switch ${!upsellsSettings.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !upsellsSettings.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
          </InlineStack>
        </BlockStack>
      </Box>

      <Box paddingBlockEnd="400">
        <Card>
          <BlockStack gap="400">
            <OptionCards
              label="Layout"
              columns={2}
              options={UPSELL_LAYOUTS}
              value={layout}
              onChange={(val) =>
                handleChange("upsellsSettings", (prev) => ({
                  ...prev,
                  layout: val,
                  direction: val === "carousel" ? "carousel" : "block",
                }))
              }
            />

            {layout === "side" && (
              <OptionCards
                label="Side panel position"
                columns={2}
                options={[
                  { value: "left", label: "Left of cart" },
                  { value: "right", label: "Right of cart" },
                ]}
                value={upsellsSettings.sidePanelPosition || "left"}
                onChange={(val) => update("sidePanelPosition", val)}
              />
            )}
          </BlockStack>
        </Card>
      </Box>
      {/* SELECT PRODUCT */}
      <Card>
        <BlockStack gap="300">
          <Text variant="headingSm">Select product</Text>
          <InlineStack>
            <Checkbox
              label="AI-Powered Upsell Suggestions"
              checked={upsellsSettings.useAiRecommended}
              onChange={(val) => update("useAiRecommended", val)}
            />
          </InlineStack>
          {upsellsSettings.useAiRecommended && (
            <>
              <Select
                label="Recommendation Algorithm"
                options={[
                  { label: "Related", value: "related" },
                  { label: "Complementary", value: "complementary" },
                ]}
                value={upsellsSettings.recommendationAlgorithm}
                onChange={(val) => update("recommendationAlgorithm", val)}
              />

              {upsellsSettings.recommendationAlgorithm !== "complementary" && (
                <InlineStack>
                  <Checkbox
                    label="Use smart variant matching"
                    checked={upsellsSettings.useSmartVariantMatching}
                    onChange={(val) => update("useSmartVariantMatching", val)}
                  />
                </InlineStack>
              )}
            </>
          )}

          <Button
            variant="primary"
            disabled={upsellsSettings.useAiRecommended}
            onClick={() => setOpen(true)}
          >
            Configure Manual Upsells
          </Button>
        </BlockStack>
      </Card>

      {/* STYLES */}
      <Box paddingBlockStart="300">
        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Styles</Text>
            <InlineGrid columns={2} gap="400">
              {upsellsSettings.layout === "compact" ? (
                // Compact: the image always fills its tile, so choose how many tiles share a row
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    Products per row
                  </Text>
                  <ButtonGroup variant="segmented">
                    {[1, 2, 3, 4].map((n) => (
                      <Button
                        key={n}
                        pressed={(upsellsSettings.compactColumns ?? 3) === n}
                        onClick={() => update("compactColumns", n)}
                      >
                        {String(n)}
                      </Button>
                    ))}
                  </ButtonGroup>
                </BlockStack>
              ) : (
                <RangeSlider
                  label="Image size"
                  min={40}
                  max={200}
                  output
                  value={upsellsSettings.imageSize ?? 72}
                  suffix={
                    <Text as="span">{upsellsSettings.imageSize ?? 72} px</Text>
                  }
                  onChange={(val) => update("imageSize", val)}
                />
              )}
              <RangeSlider
                label="Radius"
                min={0}
                max={24}
                output
                value={upsellsSettings.radius ?? 5}
                suffix={<Text as="span">{upsellsSettings.radius ?? 5} px</Text>}
                onChange={(val) => update("radius", val)}
              />
              <ColorInput
                label="Primary text"
                value={upsellsSettings.primaryTextColor || "#000000"}
                onChange={(val) => update("primaryTextColor", val)}
              />
              <ColorInput
                label="Secondary text"
                value={upsellsSettings.secondaryTextColor || "#616161"}
                onChange={(val) => update("secondaryTextColor", val)}
              />
            </InlineGrid>
          </BlockStack>
        </Card>
      </Box>

      <Box paddingBlockStart="300">
        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Button Style</Text>
            <InlineGrid columns={2} gap="400">
              <RangeSlider
                label="Border radius"
                min={0}
                max={24}
                output
                value={upsellsSettings.buttonRadius ?? 6}
                onChange={(val) => update("buttonRadius", val)}
              />
              <RangeSlider
                label="Font size"
                min={10}
                max={20}
                output
                value={upsellsSettings.buttonFontSize ?? 14}
                onChange={(val) => update("buttonFontSize", val)}
              />
              <ColorInput
                label="Background"
                value={upsellsSettings.buttonBackground || "#303030"}
                onChange={(val) => update("buttonBackground", val)}
              />
              <ColorInput
                label="Text"
                value={upsellsSettings.buttonTextColor || "#ffffff"}
                onChange={(val) => update("buttonTextColor", val)}
              />
            </InlineGrid>
          </BlockStack>
        </Card>
      </Box>

      <Box paddingBlockStart="300">
        <BackgroundInput
          title="Card color"
          value={
            upsellsSettings.cardBackground || {
              type: "plain",
              color: "#ffffff",
            }
          }
          onChange={(val) => update("cardBackground", val)}
        />
      </Box>

      {/* UPSELL SETTINGS */}
      <Box paddingBlockStart="300">
        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Upsell settings</Text>
            <InlineStack>
              <Checkbox
                label="Show upsell for items already in cart"
                checked={upsellsSettings.showIfAlreadyInCart}
                onChange={(val) => update("showIfAlreadyInCart", val)}
              />
            </InlineStack>

            <InlineStack>
              <BlockStack gap="100">
                <Checkbox
                  label="Set Upsell Limit in Cart"
                  checked={upsellsSettings.limitUpsellsInCart}
                  onChange={(val) => update("limitUpsellsInCart", val)}
                />
              </BlockStack>
            </InlineStack>

            <BlockStack gap="200">
              <InlineStack>
                <Checkbox
                  label="Recommended Products"
                  checked={upsellsSettings.showSuggestedProduct}
                  onChange={(val) => update("showSuggestedProduct", val)}
                />
              </InlineStack>
              {upsellsSettings.showSuggestedProduct && (
                <Button onClick={() => setSuggestedOpen(true)}>
                  {upsellsSettings.suggestedProduct?.items?.titles?.[0]
                    ? `Selected: ${upsellsSettings.suggestedProduct.items.titles[0]}`
                    : "Recommended Products"}
                </Button>
              )}
            </BlockStack>

            <Modal
              open={suggestedOpen}
              onClose={() => setSuggestedOpen(false)}
              title="Recommended Products"
              primaryAction={{
                content: "Save",
                onAction: () => {
                  update("suggestedProduct", suggestedSelected);
                  setSuggestedOpen(false);
                },
              }}
              secondaryActions={[
                { content: "Close", onAction: () => setSuggestedOpen(false) },
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
                <div style={{ height: "700px" }}>
                  <ProductItemCollections
                    currency={currency}
                    maxSelect={1}
                    showCollections={false}
                    onSelect={(data) => setSuggestedSelected(data)}
                    initialSelected={suggestedSelected}
                    onPaginationChange={(p) => setPagination(p)}
                  />
                </div>
              </Modal.Section>
            </Modal>

            {upsellsSettings.limitUpsellsInCart && (
              <TextField
                label="Maximum number of upsells to display"
                type="number"
                min={1}
                value={String(upsellsSettings.maxUpsellsInCart)}
                onChange={(val) => update("maxUpsellsInCart", Number(val))}
                autoComplete="off"
              />
            )}

            <InlineStack align="space-between">
              <Text variant="bodyMd" fontWeight="medium">
                Upsell title
              </Text>
              <Button variant="plain" onClick={() => update("title", "")}>
                Clear
              </Button>
            </InlineStack>
            <RichTextEditor
              value={upsellsSettings.title}
              onChange={(val) => update("title", val)}
            />
            <IconLibrary
              value={
                upsellsSettings.icon === undefined
                  ? { type: "icon", name: "star" }
                  : upsellsSettings.icon
              }
              onChange={(icon) => update("icon", icon)}
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
              value={upsellsSettings.iconColor || "#000000"}
              onChange={(val) => update("iconColor", val)}
            />

            <TextField
              label="Button text"
              value={upsellsSettings.buttonText}
              maxLength={15}
              onChange={(val) => update("buttonText", val.slice(0, 15))}
            />
            <Select
              label="Upsell position"
              options={[
                { label: "Bottom", value: "bottom" },
                { label: "Top", value: "top" },
              ]}
              value={upsellsSettings.position}
              onChange={(val) => update("position", val)}
            />
            <InlineGrid columns={2} gap="300">
              <Select
                label="Discount"
                options={[
                  { label: "No discount", value: "none" },
                  { label: "Percentage off", value: "percentage" },
                  { label: "Amount off", value: "amount" },
                ]}
                value={upsellsSettings.discountType || "none"}
                onChange={(val) => update("discountType", val)}
              />
              <TextField
                label="Value"
                type="number"
                min={0}
                value={String(upsellsSettings.discountValue ?? 10)}
                disabled={(upsellsSettings.discountType || "none") === "none"}
                autoComplete="off"
                onChange={(val) => update("discountValue", Number(val) || 0)}
              />
            </InlineGrid>

            <Checkbox
              label="Show label"
              checked={upsellsSettings.showLabel ?? true}
              onChange={(val) => update("showLabel", val)}
            />
            {(upsellsSettings.showLabel ?? true) && (
              <>
                <RichTextEditor
                  value={
                    upsellsSettings.labelText ?? "Save {{saved_percentage}}"
                  }
                  onChange={(val) => update("labelText", val)}
                />
                <Text variant="bodySm" tone="subdued">
                  Use {"{{saved_percentage}}"} or {"{{saved_amount}}"}. The
                  discount is shown on the products only when a discount is set
                  above.
                </Text>
              </>
            )}

            {layout === "carousel" && (
              <Select
                label="Carousel indicator"
                options={[
                  { label: "Progress bar", value: "progressBar" },
                  { label: "Buttons", value: "buttons" },
                  { label: "None", value: "none" },
                ]}
                value={upsellsSettings.carouselIndicator || "progressBar"}
                onChange={(val) => update("carouselIndicator", val)}
              />
            )}
          </BlockStack>

          <Box paddingBlockStart="300" paddingBlockEnd="300">
            <Divider />
          </Box>

          <Box paddingBlockStart="100">
            <BlockStack gap="200">
              <Text variant="bodyMd" fontWeight="semibold">
                Product reviews
              </Text>
              <InlineStack>
                <Checkbox
                  label="Show product reviews on upsells"
                  checked={upsellsSettings.showReviews}
                  onChange={(val) => update("showReviews", val)}
                />
              </InlineStack>
              <>
                <Text variant="bodySm" tone="subdued">
                  Product reviews will also be shown on recommendations
                </Text>
                <TextField
                  label="Review count text"
                  value={
                    upsellsSettings.reviewCountText ||
                    "({{review_count}} reviews)"
                  }
                  onChange={(val) => update("reviewCountText", val)}
                  helpText="Use {{review_count}} for the number of reviews"
                  autoComplete="off"
                  disabled={!upsellsSettings.showReviews}
                />
                <Banner tone="info">
                  This works only with product review apps that allow to read
                  product review data through the{" "}
                  <Link
                    url="https://shopify.dev/docs/api/storefront"
                    target="_blank"
                  >
                    Shopify Storefront API metafields.
                  </Link>
                </Banner>
              </>
            </BlockStack>
          </Box>

          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Select Products"
            primaryAction={{
              content: "Save",
              onAction: () => {
                handleChange("upsellsSettings", (prev) => ({
                  ...prev,
                  sourceType: selected?.type || "products",
                  selectedItems: selected?.items || [],
                }));

                setOpen(false);
              },
            }}
            secondaryActions={[
              {
                content: "Close",
                onAction: () => setOpen(false),
              },
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
              <div>
                <ProductItemCollections
                  currency={currency}
                  onSelect={(data) => {
                    setSelected(data);
                  }}
                  initialSelected={selected}
                  onPaginationChange={(p) => setPagination(p)}
                />
              </div>
            </Modal.Section>
          </Modal>
        </Card>
      </Box>
    </div>
  );
}
