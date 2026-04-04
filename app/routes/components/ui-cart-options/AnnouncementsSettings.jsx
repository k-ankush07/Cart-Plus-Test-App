import {
  Card,
  Text,
  Button,
  ButtonGroup,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  RangeSlider
} from "@shopify/polaris";
import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";

export default function AnnouncementsSettings({
  handleChange,
  announcementSettings,
}) {
  const update = (key, value) => {
    handleChange("announcement", {
      ...announcementSettings,
      [key]: value,
    });
  };

  return (
    <Card>
      <BlockStack gap="300" align="space-between">
        <InlineStack gap="300" align="space-between">
          <Text variant="headingMd">Announcements</Text>
          <Button
            variant={announcementSettings.enabled ? "primary" : "secondary"}
            onClick={() => update("enabled", !announcementSettings.enabled)}
          >
            {announcementSettings.enabled ? "Enable" : "Disable"}
          </Button>
        </InlineStack>
        {/* HEIGHT */}
        <InlineStack gap="300" align="space-between">
          <Text>Height</Text>
          <ButtonGroup segmented>
            {["slim", "normal", "thick"].map((val) => (
              <Button
                key={val}
                pressed={announcementSettings.height === val}
                onClick={() => update("height", val)}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Button>
            ))}
          </ButtonGroup>
        </InlineStack>

        {/* POSITION */}
        <InlineStack gap="300" align="space-between">
          <Text>Position</Text>
          <ButtonGroup segmented>
            <Button
              pressed={announcementSettings.position === "before"}
              onClick={() => update("position", "before")}
            >
              Before products
            </Button>

            <Button
              pressed={announcementSettings.position === "after"}
              onClick={() => update("position", "after")}
            >
              After products
            </Button>
          </ButtonGroup>
        </InlineStack>

        <TextField
          label="Timer duration"
          value={announcementSettings.timer || "00:"}
          onChange={(val) => {
            let parts = val.split(":");

            let minutes = parts[0]?.replace(/\D/g, "") || "";
            let seconds = parts[1]?.replace(/\D/g, "") || "";
            if (minutes === "") {
              minutes = "00";
            }
            seconds = seconds.slice(0, 2);
            if (seconds && Number(seconds) > 59) {
              seconds = "59";
            }

            const formatted = `${minutes}:${seconds}`;

            update("timer", formatted);
          }}
          helpText="Use this Format: MM:SS"
        />

        <Text variant="bodyMd" fontWeight="medium">
          Announcement text
        </Text>
        <RichTextEditor
          value={announcementSettings.text}
          onChange={(val) => update("text", val)}
        />
        <Text variant="bodySm" tone="subdued">
          Use {"{TIMER}"} to show countdown
        </Text>

        <InlineStack align="space-between">
          <Text>Font size</Text>
          <Text>{announcementSettings.fontSize || 10}px</Text>
        </InlineStack>

        <RangeSlider
          value={announcementSettings.fontSize || 10}
          onChange={(val) => update("fontSize", val)}
          min={0}
          max={24}
          step={1}
        />
        <InlineGrid columns={2} gap="200">
          <ColorInput
            label="Background color"
            value={announcementSettings.backgroundColor}
            onChange={(val) => update("backgroundColor", val)}
          />
          <ColorInput
            label="Border color"
            value={announcementSettings.borderColor}
            onChange={(val) => update("borderColor", val)}
          />
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}