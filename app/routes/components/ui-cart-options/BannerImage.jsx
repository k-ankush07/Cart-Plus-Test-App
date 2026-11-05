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
  InlineGrid 
} from "@shopify/polaris";
import { ImageIcon, DeleteIcon } from "@shopify/polaris-icons";
import { uploadImage } from "../../../services/apiRoutes";
import { getBanner, patchBanner, toggleBanner } from "../utils/banner";
import "../../../index.css";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const BANNER_W = 700;
const BANNER_H = 200;

// Scales the image down so it just covers 700 × 200 (aspect ratio kept, nothing is
// cut off, so "Reposition image" can still choose the visible part). Smaller images
// are left as they are; GIF/SVG are uploaded untouched to keep animation / vectors.
async function fitToBanner(file) {
  if (/^image\/(gif|svg)/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      Math.max(BANNER_W / bitmap.width, BANNER_H / bitmap.height),
    );
    if (scale === 1 && file.size < 2 * 1024 * 1024) return file;
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((res) => canvas.toBlob(res, type, 0.9));
    if (!blob || blob.size >= file.size) return file;
    const ext = type === "image/png" ? "png" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type });
  } catch {
    return file; // undecodable in the browser: let the server deal with it
  }
}

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
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size >= MAX_SIZE) {
      setError("Image must be smaller than 20 MB.");
      return;
    }
    let interval;
    try {
      file = await fitToBanner(file);
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
        <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued">
            We recommend a 700 × 200 px aspect ratio for the best visual
            experience. Images up to 20 MB are accepted and fitted to the
            banner automatically.
          </Text>
        </Box>
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
        </BlockStack>
      </LegacyCard>

     <LegacyCard sectioned title="Layout">
  <BlockStack gap="300">
    <InlineGrid columns={3} gap="400">
      <RangeSlider
        label="Top & bottom margin"
        value={banner.paddingY}
        min={0}
        max={40}
        output
        suffix={unit(banner.paddingY, "px")}
        onChange={(paddingY) => update({ paddingY })}
      />
      <RangeSlider
        label="Left & right margin"
        value={banner.paddingX}
        min={0}
        max={40}
        output
        suffix={unit(banner.paddingX, "px")}
        onChange={(paddingX) => update({ paddingX })}
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
    </InlineGrid>
  </BlockStack>
</LegacyCard>
    </div>
  );
}
