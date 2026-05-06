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
    Box,
    Icon,
    DropZone,
    ProgressBar
} from "@shopify/polaris";

import {
    ShieldCheckMarkIcon,
} from "@shopify/polaris-icons";

const PRESET_OPTIONS = [
    { label: "Select", value: "" },
    { label: "Payment icons", value: "https://cdn.shopify.com/s/files/1/0875/3679/5938/files/Frame_2121451254_1.svg" },
];

export default function SecurityBadges({ trustBadgesSettings, handleChange, accessToken, shop, apiUrl }) {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const update = (key, value) => {
        handleChange("trustBadgesSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleUpload = async (_files, acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadProgress(30); 
            const data = await uploadImage(apiUrl, file, shop, accessToken);
            setUploadProgress(100); 
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
            setUploadProgress(0);
        }
    };

    const activeImage = trustBadgesSettings.customImage || trustBadgesSettings.presetImage;

    return (
        <div className="mainContent">
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={ShieldCheckMarkIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Security Badges</Text>
                            </InlineStack>
                            <Box paddingInlineStart="200">
                                <Badge tone={trustBadgesSettings.enabled ? "critical" : "success"}>
                                    {trustBadgesSettings.enabled ? "Disabled" : "Active"}
                                </Badge>
                            </Box>
                        </InlineStack>
                        <InlineStack gap="200" />
                        <Button
                            variant={trustBadgesSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !trustBadgesSettings.enabled)}
                        >
                            {trustBadgesSettings.enabled ? "Enable" : "Disable"}
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>
            <BlockStack gap="400">
                <Card>
                    <BlockStack gap="300">
                        {/* BADGE UPLOAD */}
                        <BlockStack gap="200">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd" fontWeight="medium">Badge upload</Text>
                                {activeImage && (
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
                                )}
                            </InlineStack>
                            <DropZone accept="image/*" type="image" onDrop={handleUpload}>
                                {isUploading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                        <Box padding="500" width="35%">
                                            <ProgressBar progress={uploadProgress} size="small" tone="primary" />
                                        </Box>
                                    </div>
                                ) : activeImage ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                        <Box padding="500">
                                            <img
                                                src={activeImage}
                                                alt="Trust badge"
                                                width="100%"
                                                height="100%"
                                                style={{ objectFit: "contain" }}
                                            />
                                        </Box>
                                    </div>
                                ) : (
                                    <DropZone.FileUpload actionTitle="Upload file" actionHint="Add custom image or use presets below" />
                                )}
                            </DropZone>
                        </BlockStack>

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
                {/* <Card>
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
                </Card> */}
            </BlockStack>
        </div>
    );
}
