import { Modal, TextField, BlockStack, Text, Box, Card } from "@shopify/polaris";
import {
  CART_TEXTS,
  getCartText,
  patchCartText,
} from "../utils/cartTexts";

const VarBadge = () => (
  <span
    title="This text uses a variable. Keep the {{ }} part."
    style={{ fontFamily: "monospace", fontSize: 13, color: "#616161" }}
  >
    {"{ }"}
  </span>
);

export default function EditTranslationsModal({
  open,
  onClose,
  designSettings,
  cartSettings,
  handleChange,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Edit translations" primaryAction={{ content: "Done", onAction: onClose }}>
      <Modal.Section>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            General texts
          </Text>
          <Card padding="300">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                en - English
              </Text>
              {CART_TEXTS.map((t) => (
                <TextField
                  key={t.key}
                  label={t.label}
                  labelHidden
                  autoComplete="off"
                  value={
                    t.setting
                      ? cartSettings?.[t.setting] ?? ""
                      : getCartText(designSettings, t.key)
                  }
                  onChange={(v) =>
                    t.setting
                      ? handleChange("cartSettings", (prev) => ({
                          ...prev,
                          [t.setting]: v,
                        }))
                      : handleChange("design", patchCartText(t.key, v))
                  }
                  suffix={t.vars ? <VarBadge /> : undefined}
                />
              ))}
            </BlockStack>
          </Card>
          <Box>
            <Text as="p" variant="bodySm" tone="subdued">
              Clear a field to go back to its default text.
            </Text>
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
