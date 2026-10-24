import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  Link,
  Select,
  Text,
  TextField,
  Modal,
  Badge,
  Box,
  Icon,
  Pagination,
} from "@shopify/polaris";
import {
  PlusCircleIcon, // Upsells
} from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import ProductItemCollections from "../ui/ProductItem-Collections";
import { useState, useEffect } from "react";

export default function UpsellsSettings({
  upsellsSettings,
  handleChange,
  currency,
}) {
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
                  Upsells
                </Text>
              </InlineStack>
              <Box paddingInlineStart="200">
                <Badge tone={upsellsSettings.enabled ? "critical" : "success"}>
                  {upsellsSettings.enabled ? "Disabled" : "Active"}
                </Badge>
              </Box>
            </InlineStack>
            <InlineStack gap="200" />
            <Button
              variant={upsellsSettings.enabled ? "primary" : "secondary"}
              onClick={() => update("enabled", !upsellsSettings.enabled)}
            >
              {upsellsSettings.enabled ? "Enable" : "Disable"}
            </Button>
          </InlineStack>
        </BlockStack>
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

            <Select
              label="Upsell direction"
              options={[
                { label: "Block", value: "block" },
                { label: "Carousel", value: "carousel" },
              ]}
              value={upsellsSettings.direction}
              onChange={(val) => update("direction", val)}
            />

            {upsellsSettings.direction === "carousel" && (
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
                  onChange={(val) => update("upsellsSettings", val)}
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
