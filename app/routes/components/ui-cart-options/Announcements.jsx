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
  Tooltip,
} from "@shopify/polaris";

import {
  MegaphoneIcon,
  InfoIcon, // Announcements
} from "@shopify/polaris-icons";

import RichTextEditor from "../ui/RichTextEditor";
import ColorInput from "../ui/ColorInput";
import IconLibrary from "../ui/IconLibrary";
import BackgroundInput from "../ui/BackgroundInput";
import "../../../index.css";

export default function Announcements({
  handleChange,
  announcementSettings,
  shop,
  accessToken,
  apiUrl,
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
                <Text variant="headingMd" as="h2">
                  Announcements{" "}
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
            <button
              type="button"
              role="switch"
              aria-checked={!announcementSettings.enabled}
              aria-label="Toggle announcements"
              className={`sb-switch ${!announcementSettings.enabled ? "is-on" : ""}`}
              onClick={() => update("enabled", !announcementSettings.enabled)}
            >
              <span className="sb-switch-knob" />
            </button>
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
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="medium">
              Icon
            </Text>
            <IconLibrary
              value={announcementSettings.icon}
              onChange={(icon) => update("icon", icon)}
              shop={shop}
              accessToken={accessToken}
              apiUrl={apiUrl}
            />
            <ColorInput
              label="Icon color"
              value={announcementSettings.iconColor || "#000000"}
              onChange={(val) => update("iconColor", val)}
            />
          </BlockStack>

          <BlockStack gap="100">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" fontWeight="medium">
                Announcement text
              </Text>
              <Button variant="plain" onClick={() => update("text", "")}>
                Clear
              </Button>
            </InlineStack>

            <RichTextEditor
              value={announcementSettings.text}
              onChange={(val) => update("text", val)}
            />
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
          {/* <ColorInput
            label="Border color"
            value={announcementSettings.borderColor}
            onChange={(val) => update("borderColor", val)}
          /> */}
        </LegacyStack>
      </LegacyCard>

      <BackgroundInput
        value={announcementSettings.background}
        onChange={(background) => update("background", background)}
      />
    </div>
  );
}
