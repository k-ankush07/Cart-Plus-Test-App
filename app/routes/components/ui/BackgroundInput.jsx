import {
  LegacyCard,
  Text,
  InlineStack,
  InlineGrid,
  BlockStack,
  Icon,
  RadioButton,
  RangeSlider,
} from "@shopify/polaris";
import { PaintBrushFlatIcon } from "@shopify/polaris-icons";
import ColorInput from "./ColorInput";
import { DEFAULT_BACKGROUND, useTemplateBackground } from "../utils/background";

/**
 * Reusable "Background" card: Plain colour or Gradient (two colours + angle).
 *
 * value:    { type: "plain" | "gradient", color, color2, angle }
 * onChange: receives the complete new background object
 */
export default function BackgroundInput({
  title = "Background",
  value,
  onChange,
}) {
  const templateBg = useTemplateBackground();
  const bg = { ...DEFAULT_BACKGROUND, ...(value || templateBg) };
  const isGradient = bg.type === "gradient";

  const update = (patch) => onChange({ ...bg, ...patch });

  return (
    <LegacyCard sectioned>
      <BlockStack gap="300">
        {/* Title: left aligned */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Icon ka margin:auto isi wrapper ke andar rehta hai */}
          <span
            style={{
              display: "inline-flex",
              flexShrink: 0,
              width: 20,
              height: 20,
            }}
          >
            <Icon source={PaintBrushFlatIcon} />
          </span>
          <Text as="h3" variant="headingSm">
            {title}
          </Text>
        </div>

        <InlineStack gap="400" align="start">
          <RadioButton
            label="Plain"
            checked={!isGradient}
            onChange={() => update({ type: "plain" })}
          />
          <RadioButton
            label="Gradient"
            checked={isGradient}
            onChange={() => update({ type: "gradient" })}
          />
        </InlineStack>

        {isGradient ? (
          <InlineGrid columns={3} gap="400" alignItems="end">
            <ColorInput
              label="Color"
              value={bg.color}
              onChange={(color) => update({ color })}
            />
            <ColorInput
              label="Color"
              value={bg.color2}
              onChange={(color2) => update({ color2 })}
            />
            <RangeSlider
              label="Angle"
              value={Number(bg.angle) || 0}
              min={0}
              max={360}
              output
              onChange={(angle) => update({ angle })}
            />
          </InlineGrid>
        ) : (
          <ColorInput
            label="Color"
            value={bg.color}
            onChange={(color) => update({ color })}
          />
        )}
      </BlockStack>
    </LegacyCard>
  );
}