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
    CartIcon,           // Upsells
} from "@shopify/polaris-icons";

const DEFAULT_IMAGE = "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/campstool-1.jpg";

const CHECKMARK = (
    <span style={{
        position: "absolute", top: "10px", right: "10px",
        width: "22px", height: "22px", borderRadius: "50%",
        background: "#1e7e34", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 2,
    }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    </span>
);

// ─── Qty Stepper ──────────────────────────────────────────────────────────────
function QtyStepper() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--p-color-border)",
                borderRadius: "6px",
                overflow: "hidden",
                width: "fit-content",
            }}
        >
            <button style={{ padding: "4px 10px", border: "none", background: "none", cursor: "pointer" }}>−</button>
            <span style={{ padding: "4px 10px" }}>
                2
            </span>
            <button style={{ padding: "4px 10px", border: "none", background: "none", cursor: "pointer" }}>+</button>
        </div>
    );
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

function LayoutWrapper({ value, selected, onSelect, children }) {
    return (
        <div
            onClick={() => onSelect(value)}
            style={{
                position: "relative",
                borderRadius: "12px",
                border: `2px solid ${selected ? "#1e7e34" : "transparent"}`,
                boxShadow: selected ? "0 0 0 2px #c3e6cb" : undefined,
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
            }}
        >
            {selected && CHECKMARK}
            {children}
        </div>
    );
}

export default function CartItems({ handleChange, cartSettings }) {
    const selected = cartSettings.cartItemLayout || "classic";

    const onSelect = (value) => handleChange("cartSettings", (prev) => ({ ...prev, cartItemLayout: value }));

    return (
        <BlockStack gap="400">
            <Box paddingBlockEnd="50">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={CartIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Items in Cart</Text>
                            </InlineStack>
                        </InlineStack>
                        <InlineStack gap="200" />
                    </InlineStack>
                </BlockStack>
            </Box>
            <LegacyCard sectioned>
                {/* ── Layout 1: Classic ── */}
                <Box paddingBlockEnd="400">
                    <LayoutWrapper value="classic" selected={selected === "classic"} onSelect={onSelect}>
                        <Card>
                            <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                                <div style={{
                                    width: "80px", height: "80px", flexShrink: 0,
                                    borderRadius: "8px", overflow: "hidden",
                                    border: "1px solid var(--p-color-border)",
                                    background: "var(--p-color-bg-surface-secondary)",
                                }}>
                                    <img src={DEFAULT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                        <BlockStack gap="100">
                                            The Monaco - Black
                                            <BlockStack gap="050">
                                                <Text variant="bodyXs">
                                                    Size: <Text as="span" variant="bodyXs" fontWeight="medium">STANDARD</Text>
                                                </Text>
                                                <Text variant="bodyXs">
                                                    Color: <Text as="span" variant="bodyXs" fontWeight="medium">BLACK</Text>
                                                </Text>
                                            </BlockStack>
                                            <div style={{ marginTop: "4px" }}>
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: "4px",
                                                    background: "#e6f4ea", color: "#1e7e34",
                                                    fontSize: "12px", fontWeight: 600,
                                                    padding: "3px 10px", borderRadius: "20px",
                                                }}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                        <line x1="7" y1="7" x2="7.01" y2="7" />
                                                    </svg>
                                                    MEGA20
                                                </span>
                                            </div>
                                        </BlockStack>
                                        <BlockStack gap="200" align="end" inlineAlign="end">
                                            <InlineStack gap="150" blockAlign="center">
                                                <Text variant="bodyMd" fontWeight="bold">$200.00</Text>
                                                <Text variant="bodyXs" tone="subdued">
                                                    <span style={{ textDecoration: "line-through" }}>$400.00</span>
                                                </Text>
                                            </InlineStack>
                                            <div style={{
                                                background: "#e6f4ea", color: "#1e7e34",
                                                fontSize: "11px", fontWeight: 700,
                                                padding: "2px 7px", borderRadius: "3px", display: "inline-block",
                                            }}>SAVE 50%</div>
                                            <InlineStack gap="200" blockAlign="center">
                                                <QtyStepper />
                                                <button className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button">
                                                    <TrashIcon />
                                                </button>
                                            </InlineStack>
                                        </BlockStack>
                                    </InlineStack>
                                </div>
                            </InlineStack>
                        </Card>
                    </LayoutWrapper>
                </Box>

                <Box paddingBlockEnd="400">
                    {/* ── Layout 2: Subscription ── */}
                    <LayoutWrapper value="subscription" selected={selected === "subscription"} onSelect={onSelect}>
                        <Card>
                            <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                                <div style={{
                                    width: "72px", height: "72px", flexShrink: 0,
                                    borderRadius: "6px", overflow: "hidden",
                                    border: "1px solid var(--p-color-border)",
                                    background: "var(--p-color-bg-surface-secondary)",
                                }}>
                                    <img src={DEFAULT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                        <BlockStack gap="100">
                                            <Text variant="bodyMd" fontWeight="semibold">
                                                The Monaco - Black
                                            </Text>
                                            <div style={{ marginTop: "6px" }}>
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Text variant="bodyXs">
                                                        Qty: <Text as="span" variant="bodyXs" fontWeight="medium">100ml</Text>
                                                    </Text>
                                                    <span style={{ color: "var(--p-color-border)", fontSize: "14px" }}>|</span>
                                                    <Text variant="bodyXs">
                                                        Bottles: <Text as="span" variant="bodyXs" fontWeight="medium">1</Text>
                                                    </Text>
                                                </InlineStack>
                                            </div>
                                        </BlockStack>
                                        <div style={{ display: 'flex', justifyContent: 'end', flexWrap: 'wrap', flexDirection: 'column', }}>
                                            <div style={{ display: 'flex', justifyContent: 'right' }}>
                                                <button className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button" style={{ display: "flex", justifyContent: "right" }}>
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: "4px",
                                                color: "#1e7e34", fontSize: "12px", fontWeight: 600,
                                            }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                                </svg>
                                                MEGA20
                                            </span>
                                        </div>
                                    </InlineStack>
                                    <div style={{ marginTop: "4px" }}>
                                        <InlineStack gap="150" blockAlign="center" wrap={false}>
                                            <Text variant="bodyMd" fontWeight="bold">$27.00</Text>
                                            <Text variant="bodyXs" tone="subdued">
                                                <span style={{ textDecoration: "line-through" }}>$40.00</span>
                                            </Text>
                                            <span style={{
                                                background: "#e6f4ea", color: "#1e7e34",
                                                fontSize: "11px", fontWeight: 700,
                                                padding: "2px 7px", borderRadius: "3px", display: "inline-block",
                                            }}>SAVE 10%</span>
                                        </InlineStack>
                                    </div>

                                    <div style={{ marginTop: "8px" }}>
                                        <BlockStack gap="200">
                                            <QtyStepper />
                                        </BlockStack>
                                    </div>
                                </div>
                            </InlineStack>
                        </Card>
                    </LayoutWrapper>
                </Box>

                <Box paddingBlockEnd="400">
                    {/* ── Layout 3: Modern ── */}
                    <LayoutWrapper value="modern" selected={selected === "modern"} onSelect={onSelect}>
                        <Card>
                            <InlineStack gap="300" align="start" blockAlign="start" wrap={false}>
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <span style={{
                                        background: "#e6f4ea", color: "#1e7e34",
                                        fontSize: "11px", fontWeight: 700,
                                        padding: "2px 7px", display: "inline-block", marginBottom: "5px",
                                    }}>SAVE 50%</span>

                                    <div style={{
                                        width: "80px", height: "80px", flexShrink: 0,
                                        borderRadius: "6px", overflow: "hidden",
                                        border: "1px solid var(--p-color-border)",
                                        background: "var(--p-color-bg-surface-secondary)",
                                    }}>
                                        <img src={DEFAULT_IMAGE} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                        <div>
                                            <Text variant="bodyMd" fontWeight="semibold">
                                                The Monaco - Black
                                            </Text>
                                            <div style={{ marginTop: "8px" }}>
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Text variant="bodyXs">
                                                        Size:{" "}
                                                        <Text as="span" variant="bodyXs" fontWeight="medium">
                                                            STANDARD
                                                        </Text>
                                                    </Text>

                                                    <Text variant="bodyXs">
                                                        Color:{" "}
                                                        <Text as="span" variant="bodyXs" fontWeight="medium">
                                                            BLACK
                                                        </Text>
                                                    </Text>
                                                </InlineStack>
                                            </div>
                                        </div>
                                        <BlockStack gap="050" inlineAlign="end">
                                            <button className="cart-app-item__remove custom-cart-public-component-product-tile__remove-button" style={{ display: "flex", justifyContent: "right" }}>
                                                <TrashIcon />
                                            </button>
                                            <Text variant="bodyXs" tone="subdued">
                                                <span style={{ textDecoration: "line-through" }}>$400.00</span>
                                            </Text>
                                            <Text variant="bodyLg" fontWeight="bold">$200.00</Text>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: "4px",
                                                color: "#1e7e34", fontSize: "12px", fontWeight: 600,
                                            }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                                </svg>
                                                MEGA20
                                            </span>
                                        </BlockStack>
                                    </InlineStack>

                                    <div style={{ marginTop: "8px" }}>
                                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                                            <div>

                                            </div>
                                            <InlineStack gap="150" blockAlign="center">
                                                <QtyStepper />

                                            </InlineStack>
                                        </InlineStack>
                                    </div>
                                </div>
                            </InlineStack>
                        </Card>
                    </LayoutWrapper>
                </Box>
            </LegacyCard>
        </BlockStack>
    );
}
