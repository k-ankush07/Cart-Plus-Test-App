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
    ReceiptIcon
} from "@shopify/polaris-icons";


export default function CartSummary() {
    return (
        <div className="mainContent">
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={ReceiptIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Cart summary </Text>
                            </InlineStack>

                        </InlineStack>
                        <InlineStack gap="200" />

                    </InlineStack>
                </BlockStack>
            </Box>
        </div>
    )
}
