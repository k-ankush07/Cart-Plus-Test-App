import {
  BlockStack,
  Box,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  RangeSlider,
  Text,
} from "@shopify/polaris";
import { CartIcon } from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import BackgroundInput from "../ui/BackgroundInput";
import ColorInput from "../ui/ColorInput";
import {
  getCheckoutButton,
  patchCheckoutButton,
} from "../utils/checkoutButton";
import "../../../index.css";

export default function CheckoutButton({ cartSettings, designSettings, handleChange }) {
  const s = getCheckoutButton(cartSettings);
  const update = (patch) =>
    handleChange("cartSettings", patchCheckoutButton(patch));

  const label = s.label ?? cartSettings?.checkoutButtonText ?? "Checkout • {{Price}}";
  const radius = s.radius ?? (Number(designSettings?.buttonRadius) || 0);

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={CartIcon} />
              </Box>
              <Text variant="headingMd" as="h2">
                Checkout Button
              </Text>
            </InlineStack>

            <RichTextEditor value={label} onChange={(val) => update({ label: val })} />
            <Text variant="bodySm" tone="subdued">
              Use {"{{Price}}"} to show the cart total.
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Styles</Text>
            <RangeSlider
              label="Radius"
              value={radius}
              min={0}
              max={40}
              output
              onChange={(val) => update({ radius: val })}
            />
            <InlineGrid columns={2} gap="400">
              <ColorInput
                label="Button Background"
                value={
                  s.background?.color || designSettings?.buttonColor || "#000000"
                }
                onChange={(color) =>
                  update({ background: { type: "plain", color } })
                }
              />
              <ColorInput
                label="Button Border"
                value={s.borderColor || "#000000"}
                onChange={(val) => update({ borderColor: val })}
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        <BackgroundInput
          title="Background color"
          value={s.sectionBackground || { type: "plain", color: "#ffffff" }}
          onChange={(val) => update({ sectionBackground: val })}
        />
      </BlockStack>
    </div>
  );
}
