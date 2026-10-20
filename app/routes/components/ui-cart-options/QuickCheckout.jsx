import { useState } from "react";
import {
    Banner,
    BlockStack,
    Button,
    Card,
    Checkbox,
    Collapsible,
    Divider,
    InlineGrid,
    InlineStack,
    Link,
    RangeSlider,
    Select,
    Text,
    TextField,
    Badge,
    Box,
    Icon
} from "@shopify/polaris";
import { ClipboardIcon, CreditCardIcon } from "@shopify/polaris-icons";

const SNIPPET = `{% if additional_checkout_buttons %}
<div id="cart-plus-checkout-buttons-source" style="display:none;">
  {{ content_for_additional_checkout_buttons }}
</div>
{% endif %}`;

export default function QuickCheckout({ expressPaymentsSettings, handleChange }) {
    const [guideOpen, setGuideOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const update = (key, value) => {
        handleChange("expressPaymentsSettings", (prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(SNIPPET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mainContent">
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={CreditCardIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Quick Checkout</Text>
                            </InlineStack>
                            <Box paddingInlineStart="200">
                                <Badge tone={expressPaymentsSettings.enabled ? "critical" : "success"}>
                                    {expressPaymentsSettings.enabled ? "Disabled" : "Active"}
                                </Badge>
                            </Box>
                        </InlineStack>
                        <InlineStack gap="200" />
                        <Button
                            variant={expressPaymentsSettings.enabled ? "primary" : "secondary"}
                            onClick={() => update("enabled", !expressPaymentsSettings.enabled)}
                        >
                            {expressPaymentsSettings.enabled ? "Enable" : "Disable"}
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Box>
            <BlockStack gap="400">
               
                {/* ACCELERATED CHECKOUT BUTTONS INFO */}
                <Card>
                    <BlockStack gap="300">
                        <Text variant="headingSm">Accelerated checkout buttons</Text>

                        <Banner tone="info">
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">
                                    Accelerated Checkout Buttons Are Now Upgraded By Shopify.
                                </Text>
                                <Text variant="bodySm">
                                    Styling rules are now enforced by Shopify going forward. This new version of our module will support the upgraded Accelerated Checkout Buttons.
                                </Text>
                                <Link url="https://shopify.dev/docs/storefronts/themes/accelerated-checkout" target="_blank">
                                    Shopify Documentation On Accelerated Checkouts
                                </Link>
                                <Link url="https://changelog.shopify.com/posts/accelerated-checkout-buttons" target="_blank">
                                    Shopify Release Notes: Accelerated Checkout Buttons
                                </Link>
                            </BlockStack>
                        </Banner>

                        <Text variant="bodySm">
                            To get Accelerated Checkout Buttons to show up in Cart Plus, the buttons must already be somewhere else on the theme page. you can do one of the following:
                        </Text>

                        <BlockStack gap="200">
                            {/* Step 1 */}
                            <BlockStack gap="100">
                                <Text variant="bodySm">1. Edit your theme code so there is always Accelerated Checkout Buttons on the page.</Text>
                                <div style={{ paddingLeft: "16px" }}>
                                    <Button
                                        variant="plain"
                                        onClick={() => setGuideOpen((v) => !v)}
                                        disclosure={guideOpen ? "up" : "down"}
                                    >
                                        {guideOpen ? "Hide" : "Show"} Recommended Guide To Edit Your Theme Code
                                    </Button>
                                    <Collapsible open={guideOpen} id="theme-guide">
                                        <div style={{
                                            marginTop: "12px",
                                            padding: "16px",
                                            background: "#f9fafb",
                                            border: "1px solid #e1e3e5",
                                            borderRadius: "8px",
                                        }}>
                                            <BlockStack gap="200">
                                                <Text variant="bodyMd" fontWeight="semibold">
                                                    How to add code in your theme code to make accelerated checkout buttons work
                                                </Text>
                                                <Text variant="bodySm">
                                                    To start refer to{" "}
                                                    <Link url="https://shopify.dev/docs/storefronts/themes/architecture" target="_blank">
                                                        Shopify's documentation on how to edit theme code.
                                                    </Link>
                                                </Text>
                                                <BlockStack gap="050">
                                                    {[
                                                        "Open the code editor for your Shopify theme.",
                                                        "Open the layout folder.",
                                                        'Open a file called "theme.liquid".',
                                                        "Find the line that contains <body>.",
                                                        "Add a new line below the line with <body> and paste the code below.",
                                                        "Save the file.",
                                                    ].map((step, i) => (
                                                        <Text key={i} variant="bodySm">{i + 1}. {step}</Text>
                                                    ))}
                                                </BlockStack>
                                                <div style={{
                                                    background: "#f4f4f4",
                                                    border: "1px solid #e1e3e5",
                                                    borderRadius: "6px",
                                                    padding: "12px 16px",
                                                    fontFamily: "monospace",
                                                    fontSize: "13px",
                                                    whiteSpace: "pre",
                                                    overflowX: "auto",
                                                }}>
                                                    {SNIPPET}
                                                </div>
                                                <Button icon={ClipboardIcon} onClick={handleCopy} fullWidth>
                                                    {copied ? "Copied!" : "Copy Code"}
                                                </Button>
                                            </BlockStack>
                                        </div>
                                    </Collapsible>
                                </div>
                            </BlockStack>

                            {/* Steps 2 & 3 */}
                            <Text variant="bodySm">2. Reach out to your Theme Provider.</Text>
                            <Text variant="bodySm">
                                3.{" "}
                                <Link url="https://www.shopify.com/partners/experts" target="_blank">
                                    Hire a Shopify Expert.
                                </Link>
                            </Text>
                        </BlockStack>
                    </BlockStack>
                </Card>

                {/* DESIGN SETTINGS */}
                <Card>
                    <BlockStack gap="400">
                        <Text variant="headingSm">Accelerated checkout buttons design</Text>

                        {/* Default button height */}
                        <BlockStack gap="200">
                            <Text variant="bodyMd">Default button height</Text>
                            <InlineStack gap="400" blockAlign="center">
                                <div style={{ width: "130px" }}>
                                    <TextField
                                        value={String(expressPaymentsSettings.defaultButtonHeight)}
                                        onChange={(val) => update("defaultButtonHeight", Number(val))}
                                        suffix="px"
                                        type="number"
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <InlineStack gap="200" blockAlign="center">
                                        <Text variant="bodySm" tone="subdued">25px</Text>
                                        <div style={{ flex: 1 }}>
                                            <RangeSlider
                                                value={expressPaymentsSettings.defaultButtonHeight}
                                                onChange={(val) => update("defaultButtonHeight", val)}
                                                min={25}
                                                max={55}
                                                step={1}
                                                output={false}
                                            />
                                        </div>
                                        <Text variant="bodySm" tone="subdued">55px</Text>
                                    </InlineStack>
                                </div>
                            </InlineStack>
                        </BlockStack>

                        {/* Mobile button height */}
                        <BlockStack gap="200">
                            <Text variant="bodyMd">Mobile button height</Text>
                            <InlineStack gap="400" blockAlign="center">
                                <div style={{ width: "130px" }}>
                                    <TextField
                                        value={String(expressPaymentsSettings.mobileButtonHeight)}
                                        onChange={(val) => update("mobileButtonHeight", Number(val))}
                                        suffix="px"
                                        type="number"
                                        autoComplete="off"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <InlineStack gap="200" blockAlign="center">
                                        <Text variant="bodySm" tone="subdued">25px</Text>
                                        <div style={{ flex: 1 }}>
                                            <RangeSlider
                                                value={expressPaymentsSettings.mobileButtonHeight}
                                                onChange={(val) => update("mobileButtonHeight", val)}
                                                min={25}
                                                max={55}
                                                step={1}
                                                output={false}
                                            />
                                        </div>
                                        <Text variant="bodySm" tone="subdued">55px</Text>
                                    </InlineStack>
                                </div>
                            </InlineStack>
                        </BlockStack>

                        {/* Alignment + Row Gap */}
                        <InlineGrid columns={2} gap="300">
                            <Select
                                label="Checkout Button Alignment"
                                options={[
                                    { label: "Center", value: "center" },
                                    { label: "Left", value: "left" },
                                    { label: "Right", value: "right" },
                                ]}
                                value={expressPaymentsSettings.alignment}
                                onChange={(val) => update("alignment", val)}
                            />
                            <TextField
                                label="Row Gap"
                                value={String(expressPaymentsSettings.rowGap)}
                                onChange={(val) => update("rowGap", Number(val))}
                                suffix="px"
                                type="number"
                                autoComplete="off"
                            />
                        </InlineGrid>

                        <Divider />

                        <BlockStack gap="100">
                            <Checkbox
                                label="Hide buyer consent"
                                checked={expressPaymentsSettings.hideBuyerConsent}
                                onChange={(val) => update("hideBuyerConsent", val)}
                            />
                            <Text variant="bodySm" tone="subdued">
                                Hides the buyer consent information for accelerated checkout buttons. This will normally be shown when a subscription product is in the cart.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <Checkbox
                                label="Render cart in shadow DOM"
                                checked={expressPaymentsSettings.renderInShadowDom}
                                onChange={(val) => update("renderInShadowDom", val)}
                            />
                            <Text variant="bodySm" tone="subdued">
                                Shadow DOM will ensure Cart Plus, and the Accelerated Checkout Buttons are not affected by the theme's CSS.
                            </Text>
                        </BlockStack>
                    </BlockStack>
                </Card>
            </BlockStack>
        </div>
    );
}
