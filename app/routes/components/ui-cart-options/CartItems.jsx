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

import { getCurrencySymbol } from "../utils/currency";
import { getCartItemOptions, patchCartItem } from "../utils/cartItemOptions";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import DeleteGlyph, { DELETE_ICONS } from "../ui/DeleteGlyph";

const DEFAULT_IMAGE =
  "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg";

const CHECKMARK = (
  <span
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      background: "#1e7e34",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      zIndex: 2,
    }}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

// ─── Qty Stepper ──────────────────────────────────────────────────────────────
function QtyStepper() {
  return (
    <div
      style={{
        overflow: "hidden",
        width: "fit-content",
      }}
      className="cart-app-item__qty custom-cart-public-component-product-tile__quantity-selector"
    >
      <button className="cart-app-item__qty-btn upcart-product-quantity-minus custom-cart-public-component-product-tile__quantity-minus">
        <span className="svg-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            className="icon icon-minus"
            viewBox="0 0 10 2"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1"
              clipRule="evenodd"
            ></path>
          </svg>
        </span>
      </button>
      <span className="cart-app-item__qty-value upcart-product-quantity-input custom-cart-public-component-product-tile__quantity-plus">
        1
      </span>
      <button className="cart-app-item__qty-btn upcart-product-quantity-plus custom-cart-public-component-product-tile__quantity-plus">
        <span className="svg-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            className="icon icon-plus"
            viewBox="0 0 10 10"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z"
              clipRule="evenodd"
            ></path>
          </svg>
        </span>
      </button>
    </div>
  );
}

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function LayoutWrapper({ value, selected, onSelect, children }) {
  return (
    <div
      onClick={() => onSelect(value)}
      style={{
        position: "relative",
        borderRadius: "12px",
        border: `2px solid ${selected ? "#1e7e34" : "transparent"}`,
        boxShadow: selected ? "0 0 0 2px #c3e6cb" : undefined,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {selected && CHECKMARK}
      {children}
    </div>
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

  const symbol = getCurrencySymbol(currency);

  const opts = getCartItemOptions(cartSettings);
  const setOpt = (patch) => handleChange("cartSettings", patchCartItem(patch));

  return (
    <BlockStack gap="400">
      <Box paddingBlockEnd="50">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={CartIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">
                  Items in Cart
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
          </InlineStack>
        </BlockStack>
      </Box>

      <Card sectioned>
        {/* ── Layout 1: Classic ── */}
        <Box paddingBlockEnd="400">
          <LayoutWrapper
            value="classic"
            selected={selected === "classic"}
            onSelect={onSelect}
          >
            <Card>
              <InlineStack
                gap="300"
                align="start"
                blockAlign="start"
                wrap={false}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    flexShrink: 0,
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--p-color-border)",
                    background: "var(--p-color-bg-surface-secondary)",
                  }}
                >
                  <img
                    src={DEFAULT_IMAGE}
                    alt="product"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InlineStack
                    align="space-between"
                    blockAlign="start"
                    wrap={false}
                  >
                    <BlockStack gap="100">
                      The Monaco - Black
                      <BlockStack gap="050">
                        <Text variant="bodyXs">
                          Size:{" "}
                          <Text as="span" variant="bodyXs" fontWeight="medium">
                            STANDARD
                          </Text>
                        </Text>
                        <Text variant="bodyXs">
                          Color:{" "}
                          <Text as="span" variant="bodyXs" fontWeight="medium">
                            BLACK
                          </Text>
                        </Text>
                      </BlockStack>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          className="discount-bgColor"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#1e7e34",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "20px",
                          }}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            style={{ width: "15px", fill: "#10812f" }}
                          >
                            <path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z" />
                            <path
                              fillRule="evenodd"
                              d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"
                            />
                          </svg>
                          MEGA20
                        </span>
                      </div>
                    </BlockStack>
                    <BlockStack gap="200" align="end" inlineAlign="end">
                      <InlineStack gap="150" blockAlign="center">
                        <Text variant="bodyMd" fontWeight="bold">
                          {symbol} 200.00
                        </Text>
                        <Text variant="bodyXs" tone="subdued">
                          <span style={{ textDecoration: "line-through" }}>
                            {symbol} 400.00
                          </span>
                        </Text>
                      </InlineStack>
                      <div
                        style={{
                          background: "#e6f4ea",
                          color: "#1e7e34",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "3px",
                          display: "inline-block",
                        }}
                      >
                        SAVE 50%
                      </div>
                      <InlineStack gap="200" blockAlign="center">
                        <QtyStepper />
                        <button className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button">
                          <TrashIcon />
                        </button>
                      </InlineStack>
                    </BlockStack>
                  </InlineStack>
                </div>
              </InlineStack>
            </Card>
          </LayoutWrapper>
        </Box>

        <Box paddingBlockEnd="400">
          {/* ── Layout 2: Subscription ── */}
          <LayoutWrapper
            value="subscription"
            selected={selected === "subscription"}
            onSelect={onSelect}
          >
            <Card>
              <InlineStack
                gap="300"
                align="start"
                blockAlign="start"
                wrap={false}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    flexShrink: 0,
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: "1px solid var(--p-color-border)",
                    background: "var(--p-color-bg-surface-secondary)",
                  }}
                >
                  <img
                    src={DEFAULT_IMAGE}
                    alt="product"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InlineStack
                    align="space-between"
                    blockAlign="start"
                    wrap={false}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="semibold">
                        The Monaco - Black
                      </Text>
                      <div style={{ marginTop: "6px" }}>
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="bodyXs">
                            Qty:{" "}
                            <Text
                              as="span"
                              variant="bodyXs"
                              fontWeight="medium"
                            >
                              100ml
                            </Text>
                          </Text>
                          <span
                            style={{
                              color: "var(--p-color-border)",
                              fontSize: "14px",
                            }}
                          >
                            |
                          </span>
                          <Text variant="bodyXs">
                            Bottles:{" "}
                            <Text
                              as="span"
                              variant="bodyXs"
                              fontWeight="medium"
                            >
                              1
                            </Text>
                          </Text>
                        </InlineStack>
                      </div>
                    </BlockStack>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "end",
                        flexWrap: "wrap",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "right" }}>
                        <button
                          className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button"
                          style={{ display: "flex", justifyContent: "right" }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <span
                        className="discount-bgColor"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#1e7e34",
                          fontSize: "11px",
                          fontWeight: 600,
                          marginTop: "5px",
                        }}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          style={{ width: "15px", fill: "#10812f" }}
                        >
                          <path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z" />
                          <path
                            fillRule="evenodd"
                            d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"
                          />
                        </svg>
                        MEGA20
                      </span>
                    </div>
                  </InlineStack>
                  <div style={{ marginTop: "4px" }}>
                    <InlineStack gap="150" blockAlign="center" wrap={false}>
                      <Text variant="bodyMd" fontWeight="bold">
                        {symbol} 27.00
                      </Text>
                      <Text variant="bodyXs" tone="subdued">
                        <span style={{ textDecoration: "line-through" }}>
                          {symbol} 40.00
                        </span>
                      </Text>
                      <span
                        style={{
                          background: "#e6f4ea",
                          color: "#1e7e34",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "3px",
                          display: "inline-block",
                        }}
                      >
                        SAVE 10%
                      </span>
                    </InlineStack>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <BlockStack gap="200">
                      <QtyStepper />
                    </BlockStack>
                  </div>
                </div>
              </InlineStack>
            </Card>
          </LayoutWrapper>
        </Box>

        <Box>
          {/* ── Layout 3: Modern ── */}
          <LayoutWrapper
            value="modern"
            selected={selected === "modern"}
            onSelect={onSelect}
          >
            <Card>
              <InlineStack
                gap="300"
                align="start"
                blockAlign="start"
                wrap={false}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <span
                    style={{
                      background: "#e6f4ea",
                      color: "#1e7e34",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      display: "inline-block",
                      marginBottom: "5px",
                    }}
                  >
                    SAVE 50%
                  </span>

                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      flexShrink: 0,
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--p-color-border)",
                      background: "var(--p-color-bg-surface-secondary)",
                    }}
                  >
                    <img
                      src={DEFAULT_IMAGE}
                      alt="product"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InlineStack
                    align="space-between"
                    blockAlign="start"
                    wrap={false}
                  >
                    <div>
                      <Text variant="bodyMd" fontWeight="semibold">
                        The Monaco - Black
                      </Text>
                      <div style={{ marginTop: "8px" }}>
                        <BlockStack gap="100">
                          {/* Size */}
                          <InlineStack gap="200" blockAlign="center">
                            <Text variant="bodyXs">
                              Size:{" "}
                              <Text
                                as="span"
                                variant="bodyXs"
                                fontWeight="medium"
                              >
                                <select
                                  style={{
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    padding: "2px 4px",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <option>STANDARD</option>
                                  <option>LARGE</option>
                                  <option>SMALL</option>
                                </select>
                              </Text>
                            </Text>
                          </InlineStack>

                          {/* Color */}
                          <InlineStack gap="200" blockAlign="center">
                            <Text variant="bodyXs">
                              Color:{" "}
                              <Text
                                as="span"
                                variant="bodyXs"
                                fontWeight="medium"
                              >
                                <select
                                  style={{
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    padding: "2px 4px",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <option>BLACK</option>
                                  <option>WHITE</option>
                                  <option>BLUE</option>
                                </select>
                              </Text>
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      </div>
                    </div>
                    <BlockStack gap="050" inlineAlign="end">
                      <button
                        className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button"
                        style={{ display: "flex", justifyContent: "right" }}
                      >
                        <TrashIcon />
                      </button>
                      <Text variant="bodyXs" tone="subdued">
                        <span style={{ textDecoration: "line-through" }}>
                          {symbol} 400.00
                        </span>
                      </Text>
                      <Text variant="bodyLg" fontWeight="bold">
                        {symbol} 200.00
                      </Text>
                      <span
                        className="discount-bgColor"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#1e7e34",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          style={{ width: "15px", fill: "#10812f" }}
                        >
                          <path d="M13 2.5c.414 0 .75.336.75.75s-.336.75-.75.75h-3.029c-.468 0-.917.188-1.245.521l-4.692 4.756c-.291.295-.766.298-1.06.007-.296-.291-.299-.766-.008-1.06l4.692-4.756c.61-.62 1.444-.968 2.313-.968h3.029Z" />
                          <path
                            fillRule="evenodd"
                            d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm3.983 3.402c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"
                          />
                        </svg>
                        MEGA20
                      </span>
                    </BlockStack>
                  </InlineStack>

                  <div style={{ marginTop: "8px" }}>
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      wrap={false}
                    >
                      <div></div>
                      <InlineStack gap="150" blockAlign="center">
                        <QtyStepper />
                      </InlineStack>
                    </InlineStack>
                  </div>
                </div>
              </InlineStack>
            </Card>
          </LayoutWrapper>
        </Box>
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
