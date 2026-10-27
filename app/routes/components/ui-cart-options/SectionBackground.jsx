import { Button, InlineStack, BlockStack } from "@shopify/polaris";
import BackgroundInput from "../ui/BackgroundInput";
import {
  getSectionBackground,
  patchSectionBackground,
} from "../utils/sectionBackground";

// "Background color" card shown at the bottom of a section's options; the colour fills
// that section in the cart preview.
export default function SectionBackground({ sectionKey, cartSettings, handleChange }) {
  const background = getSectionBackground(cartSettings, sectionKey);

  return (
    <BlockStack gap="200">
      <BackgroundInput
        title="Background color"
        value={background || { type: "plain", color: "#ffffff" }}
        onChange={(bg) =>
          handleChange("cartSettings", patchSectionBackground(sectionKey, bg))
        }
      />
      {background && (
        <InlineStack align="end">
          <Button
            variant="plain"
            onClick={() =>
              handleChange("cartSettings", patchSectionBackground(sectionKey, null))
            }
          >
            Remove background color
          </Button>
        </InlineStack>
      )}
    </BlockStack>
  );
}
