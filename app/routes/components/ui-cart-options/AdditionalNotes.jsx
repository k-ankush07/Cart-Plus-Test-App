import {
    Badge,
    BlockStack,
    Button,
    Card,
    Divider,
    InlineStack,
    Link,
    Select,
    Text,
    TextField,
} from "@shopify/polaris";
import RichTextEditor from "../ui/RichTextEditor";

export default function AdditionalNotes({ additionalNotesSettings, handleChange }) {
    const update = (key, value) => {
        handleChange("additionalNotesSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <BlockStack gap="400">
            <Card>
                <BlockStack gap="300">
                    <InlineStack align="space-between">
                        <Text variant="headingMd">Additional notes</Text>
                        <Button
                            variant={additionalNotesSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !additionalNotesSettings.enabled)}
                        >
                            {additionalNotesSettings.enabled ? "Enabled" : "Disabled"}
                        </Button>
                    </InlineStack>

                    <Divider />

                    <InlineStack align="space-between">
                        <Text variant="bodyMd" fontWeight="medium">Notes title</Text>
                        <Button variant="plain" onClick={() => update("title", "")}>
                            Clear
                        </Button>
                    </InlineStack>
                    <RichTextEditor
                        value={additionalNotesSettings.title}
                        onChange={(val) => update("title", val)}
                    />

                    <TextField
                        label="Notes placeholder"
                        value={additionalNotesSettings.placeholder}
                        onChange={(val) => update("placeholder", val)}
                        autoComplete="off"
                    />

                    <Select
                        label="Notes placement"
                        options={[
                            { label: "Below cart items", value: "below_items" },
                            { label: "Top of footer", value: "top_of_footer" },
                        ]}
                        value={additionalNotesSettings.placement}
                        onChange={(val) => update("placement", val)}
                    />
                </BlockStack>
            </Card>

            <Card>
                <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
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
