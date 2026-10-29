import { useState } from "react";
import {
  LegacyCard,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Icon,
  Button,
  DropZone,
  ProgressBar,
  RangeSlider,
} from "@shopify/polaris";
import { ImageIcon, DeleteIcon } from "@shopify/polaris-icons";
import { uploadImage } from "../../../services/apiRoutes";
import { getBanner, patchBanner, toggleBanner } from "../utils/banner";
import "../../../index.css";

const unit = (value, suffix) => (
  <Text as="span" variant="bodySm" tone="subdued">
    {value}
    {suffix}
  </Text>
);

export default function BannerImage({
  headerSettings,
  handleChange,
  shop,
  accessToken,
  apiUrl,
}) {
  const banner = getBanner(headerSettings);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const update = (patch) => handleChange("header", patchBanner(patch));

  const handleUpload = async (file) => {
    if (!file) return;
    setError("");
    let interval;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      interval = setInterval(
        () => setUploadProgress((p) => (p >= 90 ? 90 : p + 10)),
        200,
      );

      const data = await uploadImage(apiUrl, file, shop, accessToken);
      if (!data?.imageUrl) throw new Error("imageUrl missing in response");
      update({ image: data.imageUrl });
    } catch (err) {
      console.error("Banner upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mainContent">
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack blockAlign="center" gap="100">
            <Icon source={ImageIcon} />
            <Text variant="headingMd" as="h2">
              Banner Image
            </Text>
          </InlineStack>
          <button
            type="button"
            role="switch"
            aria-checked={banner.enabled}
            aria-label="Toggle banner image"
            className={`sb-switch ${banner.enabled ? "is-on" : ""}`}
            onClick={() => handleChange("header", toggleBanner)}
          >
            <span className="sb-switch-knob" />
          </button>
        </InlineStack>
      </Box>

      <LegacyCard sectioned>
        <BlockStack gap="200">
          {isUploading ? (
            <DropZone accept="image/*" type="image" disabled>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Box width="35%">
                  <ProgressBar
                    progress={uploadProgress}
                    size="small"
                    tone="primary"
                  />
                </Box>
              </div>
            </DropZone>
          ) : banner.image ? (
            <InlineStack
              align="space-between"
              blockAlign="center"
              gap="300"
              wrap={false}
            >
              <img
                alt="Banner"
                src={banner.image}
                style={{
                  maxHeight: 80,
                  maxWidth: "80%",
                  borderRadius: 6,
                  objectFit: "contain",
                }}
              />
              <Button
                icon={DeleteIcon}
                tone="critical"
                variant="tertiary"
                accessibilityLabel="Remove banner image"
                onClick={() => update({ image: "" })}
              />
            </InlineStack>
          ) : (
            <DropZone
              accept="image/*"
              type="image"
              onDrop={(_, files) => handleUpload(files[0])}
            >
              <DropZone.FileUpload
                actionTitle="Upload banner image"
                actionHint="Click or drag image here"
              />
            </DropZone>
          )}
          {error && (
            <Text as="p" variant="bodySm" tone="critical">
              {error}
            </Text>
          )}
          <Text as="p" variant="bodySm" tone="subdued">
            We recommend a 700 × 200 px aspect ratio for the best visual
            experience.
          </Text>
        </BlockStack>
      </LegacyCard>

      <LegacyCard sectioned title="Layout">
        <BlockStack gap="300">
          <RangeSlider
            label="Width"
            value={banner.width}
            min={10}
            max={100}
            output
            suffix={unit(banner.width, "%")}
            onChange={(width) => update({ width })}
          />
          <RangeSlider
            label="Padding"
            value={banner.padding}
            min={0}
            max={40}
            output
            suffix={unit(banner.padding, "px")}
            onChange={(padding) => update({ padding })}
          />
          <RangeSlider
            label="Corner radius"
            value={banner.radius}
            min={0}
            max={24}
            output
            suffix={unit(banner.radius, "px")}
            onChange={(radius) => update({ radius })}
          />
        </BlockStack>
      </LegacyCard>
    </div>
  );
}
