import {
  LegacyCard,
  LegacyStack,
  Text,
  TextField,
  InlineStack,
  BlockStack,
  Box,
  Icon,
  RangeSlider,
  ButtonGroup,
  Button,
  Divider,
  InlineGrid,
  DropZone,
  ProgressBar
} from "@shopify/polaris";

import {
  TextTitleIcon,
  ImageIcon,
  AdjustIcon,
  LayoutHeaderIcon,
  PlusCircleIcon
} from "@shopify/polaris-icons";

import ColorInput from "../ui/ColorInput";
import { uploadImage } from "../../../services/apiRoutes";
import { useState } from "react";
import "../../../index.css";

export default function TopSection({ handleChange, headerSettings, accessToken, shop, apiUrl }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + 10;
        });
      }, 200);

      const data = await uploadImage(apiUrl, file, shop, accessToken);

      clearInterval(interval);
      setUploadProgress(100);

      if (!data.imageUrl) {
        console.warn("imageUrl missing in backend response!");
        return;
      }

      updateHeader("logo", data.imageUrl);

    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isDisabled = headerSettings.iconBorder === "none";

  return (
    <div className="mainContent">
      {/* Page heading — matches reference HTML exactly */}
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={LayoutHeaderIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">Top Section</Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
          </InlineStack>
        </BlockStack>
      </Box>
      <LegacyCard sectioned title="General">
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Height
            </Text>

            <ButtonGroup variant="segmented">
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
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Bottom border
            </Text>

            <ButtonGroup variant="segmented">
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
            <ColorInput
              label="Background color"
              value={headerSettings.backgroundColor}
              onChange={(val) => updateHeader("backgroundColor", val)}
            />
          </BlockStack>
        </LegacyStack>
      </LegacyCard>

      <LegacyCard sectioned title="Title">
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <LegacyStack distribution="fillEvenly">
              {[
                { label: "Inherit from theme titles", value: "inherit", icon: TextTitleIcon },
                { label: "Brand logo", value: "logo", icon: ImageIcon },
                { label: "Define text styles", value: "custom", icon: AdjustIcon },
              ].map((item) => (
                <div
                  key={item.value}
                  onClick={() => updateHeader("titleType", item.value)}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: headerSettings.titleType === item.value ? "rgb(46, 94, 131)" : "rgb(202, 204, 207)",
                    backgroundColor: headerSettings.titleType === item.value ? "rgb(236, 244, 254)" : "transparent",
                  }}
                >
                  <BlockStack inlineAlign="center" gap="100">
                    <Icon source={item.icon} />
                    <Text variant={headerSettings.titleType === item.value ? "bodyMd" : "bodyMd"}>
                      {item.label}
                    </Text>
                  </BlockStack>
                </div>
              ))}
            </LegacyStack>
          </BlockStack>

          {headerSettings.titleType === "inherit" && (
            <BlockStack gap="200">
              <TextField
                label="Text"
                value={headerSettings.titleText}
                onChange={(val) => updateHeader("titleText", val)}
                helpText="Use {{cart_quantity}} for the # of items in cart"
              />

              <BlockStack gap="100">
                <Text as="p">Alignment</Text>
                <ButtonGroup variant="segmented">
                  {["side", "center"].map((val) => (
                    <Button
                      key={val}
                      pressed={headerSettings.alignment === val}
                      onClick={() => updateHeader("alignment", val)}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>

              <BlockStack gap="100">
                <Text as="p">Heading element</Text>
                <ButtonGroup variant="segmented">
                  {[
                    { value: "h2", label: "Heading 2 (H2)" },
                    { value: "h3", label: "Heading 3 (H3)" },
                    { value: "h4", label: "Heading 4 (H4)" },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      pressed={headerSettings.heading === item.value}
                      onClick={() => updateHeader("heading", item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>
            </BlockStack>
          )}

          {headerSettings.titleType === "logo" && (
            <BlockStack gap="200">

              {isUploading ? (
                <DropZone
                  label="Logo"
                  accept="image/*"
                  type="image"
                  disabled
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Box width="35%">
                      <ProgressBar
                        progress={uploadProgress}
                        size="small"
                        tone="primary"
                      />
                    </Box>
                  </div>
                </DropZone>
              ) : headerSettings.logo ? (
                <DropZone
                  label="Logo"
                  accept="image/*"
                  type="image"
                  onDrop={(_, acceptedFiles) => {
                    if (acceptedFiles.length > 0) {
                      handleUpload({ target: { files: acceptedFiles } });
                    }
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateHeader("logo", null);
                      }}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "14px",
                        lineHeight: 1,
                        zIndex: 10,
                      }}
                    >
                      ✕
                    </button>

                    <Box padding="500">
                      <img
                        alt="Logo"
                        src={headerSettings.logo}
                        width="100%"
                        height="100%"
                        style={{ objectFit: "contain", maxHeight: "100px" }}
                      />
                    </Box>
                  </div>
                </DropZone>
              ) : (
                <DropZone
                  label="Logo"
                  accept="image/*"
                  type="image"
                  onDrop={(_, acceptedFiles) => {
                    if (acceptedFiles.length > 0) {
                      handleUpload({ target: { files: acceptedFiles } });
                    }
                  }}
                >
                  <DropZone.FileUpload
                    actionTitle="Upload brand logo"
                    actionHint="Click or drag image here"
                  />
                </DropZone>
              )}

              {/* Alignment */}
              <BlockStack gap="100">
                <Text as="p">Alignment</Text>
                <ButtonGroup variant="segmented">
                  {["side", "center"].map((val) => (
                    <Button
                      key={val}
                      pressed={headerSettings.alignment === val}
                      onClick={() => updateHeader("alignment", val)}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>

              {/* Logo size */}
              <RangeSlider
                label="Logo size"
                value={headerSettings.logoSize || 24}
                onChange={(val) => updateHeader("logoSize", val)}
                min={14}
                max={48}
                step={1}
              />

            </BlockStack>
          )}

          {headerSettings.titleType === "custom" && (
            <BlockStack gap="400">
              <TextField
                label="Text"
                value={headerSettings.titleText}
                onChange={(val) => updateHeader("titleText", val)}
                helpText="Use {{cart_quantity}} for the # of items in cart"
              />

              <ColorInput
                label="Text color override"
                value={headerSettings.textColor || "#000000"}
                onChange={(val) => updateHeader("textColor", val)}
              />

              <BlockStack gap="100">
                <Text as="p">Alignment</Text>
                <ButtonGroup variant="segmented">
                  {["side", "center"].map((val) => (
                    <Button
                      key={val}
                      pressed={headerSettings.alignment === val}
                      onClick={() => updateHeader("alignment", val)}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>

              <BlockStack gap="100">
                <Text as="p">Font weight</Text>
                <ButtonGroup variant="segmented">
                  {["normal", "semibold", "bold"].map((val) => (
                    <Button
                      key={val}
                      pressed={headerSettings.fontWeight === val}
                      onClick={() => updateHeader("fontWeight", val)}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>

              <RangeSlider
                label="Font size"
                value={headerSettings.fontSize || 24}
                onChange={(val) => updateHeader("fontSize", val)}
                min={14}
                max={48}
                step={1}
                prefix="14px"
                suffix="48px"
              />
            </BlockStack>
          )}
        </LegacyStack>
      </LegacyCard>

      <LegacyCard sectioned title="Close button">
        <LegacyStack vertical spacing="tight">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              Location
            </Text>

            <ButtonGroup variant="segmented">
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
          </BlockStack>

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
          <Box paddingBlockStart="200" paddingBlockEnd="200">
            <Divider />
          </Box>

          <BlockStack gap="100">
            <Text as="p">Icon size</Text>
            <ButtonGroup variant="segmented">
              {["small", "medium", "large"].map((val) => (
                <Button
                  key={val}
                  pressed={headerSettings.iconSize === val}
                  onClick={() => updateHeader("iconSize", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </BlockStack>

          <BlockStack gap="100">
            <Text as="p">Icon thickness</Text>
            <ButtonGroup variant="segmented">
              {["normal", "thick"].map((val) => (
                <Button
                  key={val}
                  pressed={headerSettings.iconThickNess === val}
                  onClick={() => updateHeader("iconThickNess", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </BlockStack>
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
            <InlineStack align="space-between" blockAlign="end" gap="200">
              <div style={{ flex: 1 }}>
                <ColorInput
                  label="Icon color"
                  value={headerSettings.iconColor}
                  onChange={(val) => updateHeader("iconColor", val)}
                />
              </div>

              <Box paddingBlockEnd="050">
                <Button
                  variant="plain"
                  removeUnderline
                  icon={PlusCircleIcon}
                  onClick={() => updateHeader("iconHoverEnabled", true)}
                >
                  Add hover color
                </Button>
              </Box>
            </InlineStack>
          )}

          <BlockStack gap="100">
            <Text as="p">Border</Text>
            <ButtonGroup variant="segmented">
              {["none", "thin", "normal", "thick"].map((val) => (
                <Button
                  key={val}
                  pressed={headerSettings.iconBorder === val}
                  onClick={() => updateHeader("iconBorder", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </BlockStack>

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
              <InlineStack gap="400" blockAlign="end" wrap>
                <div style={{ flex: 1 }}>
                  <ColorInput
                    label="Border color"
                    value={headerSettings.iconBorderColor}
                    onChange={(val) => updateHeader("iconBorderColor", val)}
                  />
                </div>
                <Box paddingBlockEnd="050">
                  <Button
                    variant="plain"
                    removeUnderline
                    icon={PlusCircleIcon}
                    onClick={() => updateHeader("borderHoverEnabled", true)}
                  >
                    Add hover color
                  </Button>
                </Box>
              </InlineStack>
            )
          ) : (
            <InlineStack gap="400" blockAlign="end" wrap>
              <div
                style={{
                  flex: 1,
                  opacity: isDisabled ? 0.5 : 1,
                  pointerEvents: isDisabled ? "none" : "auto",
                }}
              >
                <ColorInput
                  label="Border color"
                  value={headerSettings.iconBorderColor || "#000000"}
                  onChange={() => { }}
                  disabled
                />
              </div>
              <Box paddingBlockEnd="050">
                <Button
                  variant="plain"
                  removeUnderline
                  icon={PlusCircleIcon}
                  disabled
                >
                  Add hover color
                </Button>
              </Box>
            </InlineStack>
          )}
        </LegacyStack>
      </LegacyCard>
    </div>
  );
}