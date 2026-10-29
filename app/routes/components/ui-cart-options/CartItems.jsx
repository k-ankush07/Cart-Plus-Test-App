import {
  Card,
  Text,
  Button,
  ButtonGroup,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  RangeSlider,
  Badge,
  LegacyStack,
  Box,
  Icon,
  Divider,
  DropZone,
  ProgressBar,
  Tooltip,
  Checkbox,
} from "@shopify/polaris";

import {
  CartIcon, // Upsells
} from "@shopify/polaris-icons";

import { getCartItemOptions, patchCartItem } from "../utils/cartItemOptions";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import DeleteGlyph, { DELETE_ICONS } from "../ui/DeleteGlyph";

const LAYOUT_OPTIONS = ["classic", "subscription", "modern"];

const bar = (w, h, bg, extra) => ({
  width: w,
  height: h,
  background: bg,
  borderRadius: "2px",
  ...extra,
});

const GREY = "#d2d5d9";
const DARK = "#2b2b2b";
const GREEN = "#1fa463";

function ThumbImage() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 4,
        background: "#eceef0",
      }}
    />
  );
}

function ThumbQty() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={bar(22, 6, GREY, { borderRadius: 4 })} />
    </div>
  );
}

// Wireframe previews of each cart item layout
function ThumbBody({ value }) {
  const trash = <div style={bar(5, 8, GREY)} />;

  // classic: price + savings on the right, qty & trash under the title
  if (value === "classic") {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <ThumbImage />
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <div style={bar("75%", 4, GREY)} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <ThumbQty />
            {trash}
          </div>
        </div>
        <div style={{ display: "grid", gap: 5, justifyItems: "end" }}>
          <div style={bar(18, 6, DARK)} />
          <div style={bar(24, 5, GREEN, { borderRadius: 4 })} />
        </div>
      </div>
    );
  }

  // subscription: trash top-right, price under title, qty below
  if (value === "subscription") {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <ThumbImage />
        <div style={{ flex: 1, display: "grid", gap: 5 }}>
          <div style={bar("70%", 4, GREY)} />
          <div style={{ display: "flex", gap: 4 }}>
            <div style={bar(16, 6, DARK)} />
            <div style={bar(12, 4, GREY)} />
          </div>
          <ThumbQty />
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          {trash}
          <div style={bar(28, 5, GREEN, { borderRadius: 4 })} />
        </div>
      </div>
    );
  }

  // modern: price + savings under title, qty & trash together
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <ThumbImage />
      <div style={{ flex: 1, display: "grid", gap: 5 }}>
        <div style={bar("60%", 4, GREY)} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div style={bar(16, 6, DARK)} />
          <div style={bar("70%", 5, GREEN, { borderRadius: 4 })} />
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <ThumbQty />
          {trash}
        </div>
      </div>
    </div>
  );
}

function LayoutThumb({ value, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-label={`${value} layout`}
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      style={{
        padding: "16px 12px",
        borderRadius: 10,
        background: "#fff",
        cursor: "pointer",
        textAlign: "left",
        border: selected ? "2px solid #303030" : "1px solid #c9cccf",
        boxShadow: selected ? "0 0 0 1px #303030" : undefined,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <ThumbBody value={value} />
    </button>
  );
}

export default function CartItems({ handleChange, cartSettings, currency }) {
  const selected = cartSettings.cartItemLayout || "classic";
  const deleteBehavior = cartSettings.deleteBehavior || "undo";

  const onSelect = (value) =>
    handleChange("cartSettings", (prev) => ({
      ...prev,
      cartItemLayout: value,
    }));

  const onDeleteBehaviorChange = (behavior) =>
    handleChange("cartSettings", (prev) => ({
      ...prev,
      deleteBehavior: behavior,
    }));


  const opts = getCartItemOptions(cartSettings);
  const setOpt = (patch) => handleChange("cartSettings", patchCartItem(patch));

  return (
    <BlockStack gap="400">
       <Box >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Icon source={CartIcon} />
           <Text variant="headingMd" as="h2">
              Products
            </Text>
          </InlineStack>
        </InlineStack>
      </Box>

      <Card sectioned>
        <BlockStack gap="300">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {LAYOUT_OPTIONS.map((layout) => (
              <LayoutThumb
                key={layout}
                value={layout}
                selected={selected === layout}
                onSelect={onSelect}
              />
            ))}
          </div>
        </BlockStack>
      </Card>

      <Card sectioned>
        <Box paddingBlockEnd="100">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "12px",
              background: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <div>
              <Text variant="bodySm" fontWeight="semibold">
                Delete Behavior
              </Text>
              <Text variant="bodySm" tone="subdued">
                Choose how items are removed
              </Text>
            </div>
            <ButtonGroup>
              <Button
                onClick={() => onDeleteBehaviorChange("undo")}
                variant={deleteBehavior === "undo" ? "primary" : "secondary"}
                size="slim"
              >
                Undo Toast
              </Button>
              <Button
                onClick={() => onDeleteBehaviorChange("direct")}
                variant={deleteBehavior === "direct" ? "primary" : "secondary"}
                size="slim"
              >
                Direct Delete
              </Button>
            </ButtonGroup>
          </div>
        </Box>
      </Card>

      {/* ── Display options ── */}
      <Card sectioned>
        <BlockStack gap="200">
          <Checkbox
            label="Show variants"
            checked={opts.showVariants}
            onChange={(v) => setOpt({ showVariants: v })}
          />
          <Checkbox
            label="Show quantity selector"
            checked={opts.showQuantity}
            onChange={(v) => setOpt({ showQuantity: v })}
          />
          <Checkbox
            label="Show compare-at price"
            checked={opts.showCompareAt}
            onChange={(v) => setOpt({ showCompareAt: v })}
          />
          <Checkbox
            label="Show discount tag"
            checked={opts.showDiscountTag}
            onChange={(v) => setOpt({ showDiscountTag: v })}
          />
          <Checkbox
            label="Show Savings"
            checked={opts.showSavings ?? !!cartSettings.showSavingsBelowPrices}
            onChange={(v) => setOpt({ showSavings: v })}
          />
          <Checkbox
            label="Show single item price instead of total price"
            checked={opts.singleItemPrice}
            onChange={(v) => setOpt({ singleItemPrice: v })}
          />
        </BlockStack>
      </Card>

      {/* ── Styles ── */}
      <Card sectioned>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Styles
          </Text>
          <InlineGrid columns={2} gap="400">
            <RangeSlider
              label="Image Size"
              min={40}
              max={160}
              output
              value={opts.imageSize ?? 72}
              suffix={<Text as="span">{opts.imageSize ?? 72} px</Text>}
              onChange={(imageSize) => setOpt({ imageSize })}
            />
            <RangeSlider
              label="Radius"
              min={0}
              max={24}
              output
              value={opts.radius ?? 5}
              suffix={<Text as="span">{opts.radius ?? 5} px</Text>}
              onChange={(radius) => setOpt({ radius })}
            />
            <ColorInput
              label="Primary Text"
              value={opts.primaryTextColor || "#000000"}
              onChange={(primaryTextColor) => setOpt({ primaryTextColor })}
            />
            <ColorInput
              label="Secondary Text"
              value={opts.secondaryTextColor || "#616161"}
              onChange={(secondaryTextColor) => setOpt({ secondaryTextColor })}
            />
            <ColorInput
              label="Label Text"
              value={opts.labelTextColor || "#1e7e34"}
              onChange={(labelTextColor) => setOpt({ labelTextColor })}
            />
            <ColorInput
              label="Label Background"
              value={opts.labelBackground || "#e6f4ea"}
              onChange={(labelBackground) => setOpt({ labelBackground })}
            />
          </InlineGrid>
        </BlockStack>
      </Card>

      {/* ── Delete button ── */}
      <Card sectioned>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Delete button
          </Text>
          <InlineStack gap="200" blockAlign="center">
            {DELETE_ICONS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-label={`Delete icon ${kind}`}
                onClick={() => setOpt({ deleteIcon: kind })}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "#fff",
                  padding: 0,
                  border:
                    opts.deleteIcon === kind
                      ? "2px solid #303030"
                      : "1px solid #c9cccf",
                }}
              >
                <DeleteGlyph kind={kind} />
              </button>
            ))}
          </InlineStack>
          <ColorInput
            label="Icon color"
            value={opts.deleteColor || "#616161"}
            onChange={(deleteColor) => setOpt({ deleteColor })}
          />
        </BlockStack>
      </Card>
      <Card>
        <BackgroundInput
          title="Card color"
          value={opts.cardBackground || { type: "plain", color: "#ffffff" }}
          onChange={(cardBackground) => setOpt({ cardBackground })}
        />

        <BackgroundInput
          title="Background color"
          value={opts.sectionBackground || { type: "plain", color: "#ffffff" }}
          onChange={(sectionBackground) => setOpt({ sectionBackground })}
        />
      </Card>
    </BlockStack>
  );
}
