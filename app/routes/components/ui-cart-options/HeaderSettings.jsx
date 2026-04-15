import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  ButtonGroup,
  Button,
  Divider,
  Spinner,
  RangeSlider,
  InlineGrid
} from "@shopify/polaris";
import ColorInput from "../ui/ColorInput";
import { uploadImage } from "../../../services/apiRoutes";
import { useState } from "react";
import "../../../index.css";

export default function HeaderSettings({ handleChange, headerSettings, accessToken, shop, apiUrl }) {
  const [isUploading, setIsUploading] = useState(false);

  const updateHeader = (key, value) => {
    handleChange("header", (prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const data = await uploadImage(apiUrl, file, shop, accessToken);

      if (!data.imageUrl) {
        console.warn("imageUrl missing in backend response!");
        return;
      }

      updateHeader("logo", data.imageUrl);

    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Header Settings</Text>

        {/* GENERAL */}
        <BlockStack gap="300">
          <Text variant="headingSm">General</Text>
          <InlineStack gap="300" align="space-between">
            <Text>Height</Text>
            <ButtonGroup segmented>
              {["slim", "tall"].map((value) => (
                <Button
                  key={value}
                  pressed={headerSettings.height === value}
                  onClick={() => updateHeader("height", value)}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </InlineStack>

          <InlineStack gap="300" align="space-between">
            <Text>Bottom border</Text>

            <ButtonGroup segmented>
              {["none", "thin"].map((val) => (
                <Button
                  key={val}
                  pressed={headerSettings.border === val}
                  onClick={() => updateHeader("border", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </InlineStack>

          <ColorInput
            label="Background color"
            value={headerSettings.backgroundColor}
            onChange={(val) => updateHeader("backgroundColor", val)}
          />
        </BlockStack>

        <Divider />

        {/* TITLE */}
        <ButtonGroup>
          {[
            { label: "Inherit from theme titles", value: "inherit" },
            { label: "Brand logo", value: "logo" },
            { label: "Define text styles", value: "custom" },
          ].map((item) => (
            <Button
              key={item.value}
              pressed={headerSettings.titleType === item.value}
              onClick={() => updateHeader("titleType", item.value)}
            >
              {item.label}
            </Button>
          ))}
        </ButtonGroup>

        {headerSettings.titleType === "inherit" && (
          <>
            <TextField
              label="Text"
              value={headerSettings.titleText}
              onChange={(val) => updateHeader("titleText", val)}
              helpText="Use {{cart_quantity}} for the # of items in cart"
            />

            <InlineStack align="space-between">
              <Text>Alignment</Text>
              <ButtonGroup segmented>
                {["side", "center"].map((val) => (
                  <Button
                    key={val}
                    pressed={headerSettings.alignment === val}
                    onClick={() => updateHeader("alignment", val)}
                  >
                    {val}
                  </Button>
                ))}
              </ButtonGroup>
            </InlineStack>

            <InlineStack align="space-between">
              <Text>Heading element</Text>
              <ButtonGroup segmented>
                {["h2", "h3", "h4"].map((val) => (
                  <Button
                    key={val}
                    pressed={headerSettings.heading === val}
                    onClick={() => updateHeader("heading", val)}
                  >
                    {val.toUpperCase()}
                  </Button>
                ))}
              </ButtonGroup>
            </InlineStack>
          </>
        )}

        {headerSettings.titleType === "logo" && (
          <>
            <div
              className="upload-box"
              style={{
                cursor: headerSettings.logo ? "pointer" : "default",
                position: "relative",
                minHeight: "120px",
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                id="logo-upload"
                onChange={handleUpload}
              />

              {isUploading && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  <Spinner accessibilityLabel="Uploading" size="large" />
                </div>
              )}

              {!isUploading && headerSettings.logo && (
                <img
                  src={headerSettings.logo}
                  alt="Logo"
                  onClick={() => document.getElementById("logo-upload").click()}
                  style={{
                    maxWidth: "200px",
                    margin: "0 auto",
                    display: "block",
                    cursor: "pointer"
                  }}
                />
              )}

              {/* Upload UI */}
              {!isUploading && !headerSettings.logo && (
                <>
                  <Button onClick={() => document.getElementById("logo-upload").click()}>
                    Upload brand logo
                  </Button>

                  <Text variant="bodySm" as="p">
                    Click or drag image here
                  </Text>
                </>
              )}
            </div>

            <InlineStack align="space-between">
              <Text>Alignment</Text>
              <ButtonGroup segmented>
                {["side", "center"].map((val) => (
                  <Button
                    key={val}
                    pressed={headerSettings.alignment === val}
                    onClick={() => updateHeader("alignment", val)}
                  >
                    {val}
                  </Button>
                ))}
              </ButtonGroup>
            </InlineStack>
            <RangeSlider
              label="Logo size"
              value={headerSettings.logoSize || 120}
              onChange={(val) => updateHeader("logoSize", val)}
              min={15}
              max={60}
              step={3}
            />
          </>
        )}

        {headerSettings.titleType === "custom" && (
          <>
            <TextField
              label="Text"
              value={headerSettings.titleText}
              onChange={(val) => updateHeader("titleText", val)}
            />

            <ColorInput
              label="Text color override"
              value={headerSettings.textColor || "#000000"}
              onChange={(val) => updateHeader("textColor", val)}
            />

            <InlineStack align="space-between">
              <Text>Alignment</Text>
              <ButtonGroup segmented>
                {["side", "center"].map((val) => (
                  <Button
                    key={val}
                    pressed={headerSettings.alignment === val}
                    onClick={() => updateHeader("alignment", val)}
                  >
                    {val}
                  </Button>
                ))}
              </ButtonGroup>
            </InlineStack>

            <InlineStack align="space-between">
              <Text>Font weight</Text>
              <ButtonGroup segmented>
                {["normal", "semibold", "bold"].map((val) => (
                  <Button
                    key={val}
                    pressed={headerSettings.fontWeight === val}
                    onClick={() => updateHeader("fontWeight", val)}
                  >
                    {val}
                  </Button>
                ))}
              </ButtonGroup>
            </InlineStack>
            <RangeSlider
              label="Font size"
              value={headerSettings.fontSize || 120}
              onChange={(val) => updateHeader("fontSize", val)}
              min={16}
              max={50}
              step={3}
            />
          </>
        )}

        <Divider />

        {/* CLOSE BUTTON */}
        <BlockStack gap="300">
          <Text variant="headingSm">Close button</Text>

          <InlineStack gap="300" align="space-between">
            <Text>Location</Text>

            <ButtonGroup segmented>
              {["left", "right"].map((val) => (
                <Button
                  key={val}
                  pressed={headerSettings.closePosition === val}
                  onClick={() => updateHeader("closePosition", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </InlineStack>
          <InlineGrid columns={2} gap="200">
            <ColorInput
              label="Background color"
              value={headerSettings.iconBgColor}
              onChange={(val) => updateHeader("iconBgColor", val)}
            />
            <ColorInput
              label="Background hover color"
              value={headerSettings.iconbgHoverColor}
              onChange={(val) => updateHeader("iconbgHoverColor", val)}
            />

          </InlineGrid>
          <InlineStack gap="300" align="space-between">
            <Text>Icon size</Text>

            <ButtonGroup segmented>
              <Button
                pressed={headerSettings.iconSize === "small"}
                onClick={() => updateHeader("iconSize", "small")}
              >
                Small
              </Button>

              <Button
                pressed={headerSettings.iconSize === "medium"}
                onClick={() => updateHeader("iconSize", "medium")}
              >
                Medium
              </Button>

              <Button
                pressed={headerSettings.iconSize === "large"}
                onClick={() => updateHeader("iconSize", "large")}
              >
                Large
              </Button>
            </ButtonGroup>
          </InlineStack>

          <InlineStack gap="300" align="space-between">
            <Text>Icon thickness</Text>

            <ButtonGroup segmented>
              <Button
                pressed={headerSettings.iconThickNess === "normal"}
                onClick={() => updateHeader("iconThickNess", "normal")}
              >
                Normal
              </Button>

              <Button
                pressed={headerSettings.iconThickNess === "thick"}
                onClick={() => updateHeader("iconThickNess", "thick")}
              >
                Thick
              </Button>
            </ButtonGroup>
          </InlineStack>

          {headerSettings.iconHoverEnabled ? (
            <InlineGrid columns={2} gap="200">
              <ColorInput
                label="Icon color"
                value={headerSettings.iconColor}
                onChange={(val) => updateHeader("iconColor", val)}
              />
              <ColorInput
                label="Icon hover color"
                value={headerSettings.iconHoverColor}
                onChange={(val) => updateHeader("iconHoverColor", val)}
              />
            </InlineGrid>
          ) : (
            <InlineStack align="space-between" gap="200">
              <div style={{ flex: 1 }}>
                <ColorInput
                  label="Icon color"
                  value={headerSettings.iconColor}
                  onChange={(val) => updateHeader("iconColor", val)}
                />
              </div>

              <div style={{ paddingTop: "24px" }}>
                <Button
                  plain
                  onClick={() => updateHeader("iconHoverEnabled", true)}
                >
                  + Add hover color
                </Button>
              </div>
            </InlineStack>
          )}

          <InlineStack gap="300" align="space-between">
            <Text>Border</Text>

            <ButtonGroup segmented>
              <Button
                pressed={headerSettings.iconBorder === "none"}
                onClick={() => updateHeader("iconBorder", "none")}
              >
                None
              </Button>

              <Button
                pressed={headerSettings.iconBorder === "thin"}
                onClick={() => updateHeader("iconBorder", "thin")}
              >
                Thin
              </Button>

              <Button
                pressed={headerSettings.iconBorder === "normal"}
                onClick={() => updateHeader("iconBorder", "normal")}
              >
                Normal
              </Button>

              <Button
                pressed={headerSettings.iconBorder === "thick"}
                onClick={() => updateHeader("iconBorder", "thick")}
              >
                Thick
              </Button>
            </ButtonGroup>
          </InlineStack>

          {headerSettings.iconBorder !== "none" ? (
            headerSettings.borderHoverEnabled ? (
              <InlineGrid columns={2} gap="200">
                <ColorInput
                  label="Border color"
                  value={headerSettings.iconBorderColor}
                  onChange={(val) => updateHeader("iconBorderColor", val)}
                />

                <ColorInput
                  label="Border hover color"
                  value={headerSettings.borderHoverColor}
                  onChange={(val) => updateHeader("borderHoverColor", val)}
                />
              </InlineGrid>
            ) : (
              <InlineStack align="space-between" gap="200">
                <div style={{ flex: 1 }}>
                  <ColorInput
                    label="Border color"
                    value={headerSettings.iconBorderColor}
                    onChange={(val) => updateHeader("iconBorderColor", val)}
                  />
                </div>

                <div style={{ paddingTop: "24px" }}>
                  <Button
                    plain
                    onClick={() => updateHeader("borderHoverEnabled", true)}
                  >
                    + Add hover color
                  </Button>
                </div>
              </InlineStack>
            )
          ) : (
            <div style={{ opacity: 0.4, pointerEvents: "none" }}>
              <ColorInput label="Border color" value="#000000" onChange={() => { }} />
            </div>
          )}

        </BlockStack>
      </BlockStack>
    </Card>
  );
}