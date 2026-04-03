import {
  Card,
  Text,
  Button,
  ButtonGroup,
  TextField,
  InlineStack,
  InlineGrid,
  BlockStack,
  Checkbox
} from "@shopify/polaris";
import RichTextEditor from "../ui/RichTextEditor";

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
            variant={announcementSettings.enabled ? "secondary" : "primary"}
            onClick={() => update("enabled", !announcementSettings.enabled)}
          >
            {announcementSettings.enabled ? "Disable" : "Enable"}
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

        {/* TEXT */}
        <RichTextEditor
          value={announcementSettings.text}
          onChange={(val) => update("text", val)}
        />

        {/* FONT SIZE */}
        <TextField
          label="Font size"
          type="number"
          value={announcementSettings.fontSize.toString()}
          onChange={(val) => update("fontSize", Number(val))}
        />

        {/* COLORS */}
        <InlineGrid columns={2} gap="200">
          <TextField
            label="Background color"
            value={announcementSettings.backgroundColor}
            onChange={(val) => update("backgroundColor", val)}
          />

          <TextField
            label="Border color"
            value={announcementSettings.borderColor}
            onChange={(val) => update("borderColor", val)}
          />
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}