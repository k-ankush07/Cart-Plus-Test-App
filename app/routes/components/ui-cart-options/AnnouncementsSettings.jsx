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
  LegacyCard,
  LegacyStack,
  Box,
  Icon,
  Divider,
  DropZone,
  ProgressBar,
  Tooltip
} from "@shopify/polaris";

import {
  MegaphoneIcon, InfoIcon           // Announcements
} from "@shopify/polaris-icons";

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
    <div className="mainContent">
      {/* Page heading — matches reference HTML exactly */}
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={MegaphoneIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">Announcements</Text>
              </InlineStack>
              <Box paddingInlineStart="200">
                <Badge tone={announcementSettings.enabled ? "critical" : "success"}>
                  {announcementSettings.enabled ? "Disabled" : "Active"}
                </Badge>
              </Box>
            </InlineStack>
            <InlineStack gap="200" />
            <Button
              variant={announcementSettings.enabled ? "primary" : "secondary"}
              onClick={() => update("enabled", !announcementSettings.enabled)}
            >
              {announcementSettings.enabled ? "Enable" : "Disable"}
            </Button>
          </InlineStack>
        </BlockStack>
      </Box>

      <LegacyCard sectioned title="Settings">
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Height
            </Text>
            <ButtonGroup variant="segmented">
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
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Position
            </Text>
            <ButtonGroup variant="segmented">
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
          </BlockStack>
          <TextField
            label="Timer duration"
            value={announcementSettings.timer || "00:00"}
            onChange={(val) => {
              let parts = val.split(":");
              let minutes = parts[0]?.replace(/\D/g, "") || "00";
              let seconds = parts[1]?.replace(/\D/g, "") || "";
              seconds = seconds.slice(0, 2);
              if (seconds && Number(seconds) > 59) seconds = "59";
              update("timer", `${minutes}:${seconds}`);
            }}
            helpText={
              <InlineStack gap="100" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Use the MM:SS format
                </Text>
                <Tooltip content="e.g. 05:00 for a 5 minute countdown, 00:30 for 30 seconds">
                  <span style={{ color: 'black' }}>
                    <Icon source={InfoIcon} />
                  </span>                </Tooltip>
              </InlineStack>
            }
          />

          <BlockStack gap="100">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" fontWeight="medium">
                Announcement text
              </Text>
              <Button
                variant="plain"
                onClick={() => update("text", "")}
              >
                Clear
              </Button>
            </InlineStack>

            <RichTextEditor
              value={announcementSettings.text}
              onChange={(val) => update("text", val)}
            />

            <Text variant="bodySm" tone="subdued">
              Use {"{timer}"} to show countdown timer
            </Text>
          </BlockStack>
          <RangeSlider
            label="Font size"
            value={announcementSettings.fontSize || 10}
            onChange={(val) => update("fontSize", val)}
            min={10}
            max={24}
            step={1}
            prefix={<Text>10px</Text>}
            suffix={<Text>24px</Text>}
            output
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
        </LegacyStack>
      </LegacyCard>
    </div>
  );
}