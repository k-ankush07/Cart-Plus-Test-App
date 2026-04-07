import { useRef, useState } from "react";
import { uploadImage } from "../../../services/apiRoutes";
import {
    Badge,
    BlockStack,
    Button,
    Card,
    Divider,
    InlineStack,
    Link,
    Select,
    Spinner,
    Text,
} from "@shopify/polaris";

const PRESET_OPTIONS = [
    { label: "Select", value: "" },
    { label: "Payment icons", value: "https://storage.googleapis.com/upcart-public/payment-icons.webp" },
];

export default function Trustbadges({ trustBadgesSettings, handleChange, accessToken, shop, apiUrl }) {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const update = (key, value) => {
        handleChange("trustBadgesSettings", (prev) => ({
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
            update("customImage", data.imageUrl);
            update("presetImage", "");
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setIsUploading(false);
        }
    };

    const activeImage = trustBadgesSettings.customImage || trustBadgesSettings.presetImage;

    return (
        <BlockStack gap="400">
            <Card>
                <BlockStack gap="300">
                    <InlineStack align="space-between">
                        <Text variant="headingMd">Trust badges</Text>
                        <Button
                            variant={trustBadgesSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !trustBadgesSettings.enabled)}
                        >
                            {trustBadgesSettings.enabled ? "Enabled" : "Disabled"}
                        </Button>
                    </InlineStack>

                    <Divider />

                    {/* BADGE UPLOAD */}
                    <Text variant="bodyMd" fontWeight="medium">Badge upload</Text>
                    <div
                        style={{
                            border: "2px dashed #c9cccf",
                            borderRadius: "8px",
                            padding: "32px 16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "10px",
                            background: "#fff",
                        }}
                    >
                        {isUploading ? (
                            <Spinner size="small" />
                        ) : activeImage ? (
                            <BlockStack gap="200" inlineAlign="center">
                                <img
                                    src={activeImage}
                                    alt="Trust badge"
                                    style={{ maxHeight: "60px", maxWidth: "100%", objectFit: "contain" }}
                                />
                                <Button
                                    variant="plain"
                                    tone="critical"
                                    onClick={() => {
                                        update("customImage", "");
                                        update("presetImage", "");
                                    }}
                                >
                                    Remove
                                </Button>
                            </BlockStack>
                        ) : (
                            <>
                                <Button onClick={() => fileInputRef.current?.click()}>
                                    Upload file
                                </Button>
                                <Text variant="bodySm" tone="subdued">
                                    Add custom image or use presets below
                                </Text>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleUpload}
                        />
                    </div>

                    {/* PRESET IMAGES */}
                    <Select
                        label="Preset images"
                        options={PRESET_OPTIONS}
                        value={trustBadgesSettings.presetImage}
                        onChange={(val) => {
                            update("presetImage", val);
                            update("customImage", "");
                        }}
                    />

                    {/* POSITION */}
                    <Select
                        label="Position"
                        options={[
                            { label: "Top", value: "top" },
                            { label: "Bottom", value: "bottom" },
                        ]}
                        value={trustBadgesSettings.position}
                        onChange={(val) => update("position", val)}
                    />
                </BlockStack>
            </Card>

            {/* CUSTOM TEMPLATE */}
            <Card>
                <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm">Custom template</Text>
                        <Badge tone="info">Advanced</Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued">
                        Custom templates aren't enabled.{" "}
                        <Link url="/app/settings/advanced">
                            Navigate to Settings &gt; Advanced Settings to enable.
                        </Link>
                    </Text>
                </BlockStack>
            </Card>
        </BlockStack>
    );
}
