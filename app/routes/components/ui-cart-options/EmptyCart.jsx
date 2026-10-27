import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  Icon,
  InlineGrid,
  InlineStack,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import { CartIcon, PaintBrushFlatIcon } from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import IconLibrary from "../ui/IconLibrary";
import ColorInput from "../ui/ColorInput";
import BackgroundInput from "../ui/BackgroundInput";
import { getEmptyCart, patchEmptyCart } from "../utils/emptyCart";
import "../../../index.css";

const CardTitle = ({ icon, children }) => (
  <InlineStack gap="200" blockAlign="center">
    <span style={{ display: "inline-flex", width: 20, height: 20 }}>
      <Icon source={icon} />
    </span>
    <Text variant="headingSm" as="h3">
      {children}
    </Text>
  </InlineStack>
);

export default function EmptyCart({ cartSettings, designSettings, handleChange, shop, accessToken, apiUrl }) {
  const s = getEmptyCart(cartSettings);
  const update = (patch) => handleChange("cartSettings", patchEmptyCart(patch));

  const message = s.message ?? cartSettings?.emptyCartMessage ?? "Your cart is empty";

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <CardTitle icon={CartIcon}>Empty Cart</CardTitle>

            <RichTextEditor value={message} onChange={(val) => update({ message: val })} />

            <InlineStack align="space-between" blockAlign="center" wrap={false}>
              <IconLibrary
                value={s.icon}
                onChange={(icon) => update({ icon })}
                quickIcons={["product", "cart", "store"]}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
              />
              <div style={{ width: 120 }}>
                <ColorInput
                  label="Icon color"
                  value={s.iconColor}
                  onChange={(val) => update({ iconColor: val })}
                />
              </div>
            </InlineStack>

            <Checkbox
              label="Show button"
              checked={s.showButton}
              onChange={(val) => update({ showButton: val })}
            />
            <Text variant="bodySm" tone="subdued">
              Enter a path (e.g. /collections/all) or leave empty to link to your store home
            </Text>
            <InlineGrid columns={2} gap="300">
              <TextField
                label="Button Text"
                value={s.buttonText}
                disabled={!s.showButton}
                onChange={(val) => update({ buttonText: val })}
                autoComplete="off"
              />
              <TextField
                label="URL"
                value={s.buttonUrl}
                disabled={!s.showButton}
                onChange={(val) => update({ buttonUrl: val })}
                autoComplete="off"
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        {s.showButton && (
          <Card>
            <BlockStack gap="300">
              <CardTitle icon={PaintBrushFlatIcon}>Button Style</CardTitle>
              <InlineGrid columns={2} gap="400">
                <RangeSlider
                  label="Border radius"
                  value={s.buttonRadius}
                  min={0}
                  max={40}
                  output
                  onChange={(val) => update({ buttonRadius: val })}
                />
                <RangeSlider
                  label="Font size"
                  value={s.buttonFontSize}
                  min={10}
                  max={32}
                  output
                  onChange={(val) => update({ buttonFontSize: val })}
                />
                <ColorInput
                  label="Background"
                  value={s.buttonBackground?.color || designSettings?.buttonColor || "#000000"}
                  onChange={(color) => update({ buttonBackground: { type: "plain", color } })}
                />
                <ColorInput
                  label="Text"
                  value={s.buttonTextColor || designSettings?.buttonTextColor || "#ffffff"}
                  onChange={(val) => update({ buttonTextColor: val })}
                />
              </InlineGrid>
            </BlockStack>
          </Card>
        )}

        <BackgroundInput
          title="Background"
          value={s.background || { type: "plain", color: "#ffffff" }}
          onChange={(val) => update({ background: val })}
        />
      </BlockStack>
    </div>
  );
}
