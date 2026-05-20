import {
    Text,
    Button,
    TextField,
    InlineStack,
    InlineGrid,
    BlockStack,
    LegacyCard,
    LegacyStack,
    Box,
    Icon,
    Divider,
    Checkbox,
    Select,
    Modal,
    Thumbnail,
    RadioButton,
    Grid,
    Popover,
} from "@shopify/polaris";

import RichTextEditor from "../ui/RichTextEditor";
import Prodcuts from "./Products";
import { useState } from "react";
import { EditIcon, DeleteIcon, XSmallIcon, PlusIcon } from "@shopify/polaris-icons";

export default function TierSettings({ rewardsSettings, handleChange, products, nextCursor, hasNextPage, currency }) {
    const tiers = rewardsSettings?.tiers || [];
    const activeTier = rewardsSettings?.activeTier || 0;
    const current = tiers[activeTier] || { products: [] };
    const [openProductModal, setOpenProductModal] = useState(false);
    const [tempSelected, setTempSelected] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [activePopover, setActivePopover] = useState(null);

    const updateTier = (key, value) => {
        handleChange("rewardsSettings", (prev) => {
            const updatedTiers = [...(prev.tiers || [])];

            updatedTiers[prev.activeTier] = {
                ...updatedTiers[prev.activeTier],
                [key]: value,
            };

            return { ...prev, tiers: updatedTiers };
        });
    };

    const addTier = () => {
        handleChange("rewardsSettings", (prev) => {
            const existing = prev.tiers || [];

            if (existing.length >= 3) return prev;

            const index = existing.length;
            const globalShowIcon = true;

            let defaultType = "discount";
            let minAmount = 1000;
            let title = "";
            let description = "";

            if (index === 0) {
                defaultType = "shipping";
                minAmount = 1000;
                title = "You're {AMOUNT} away from free shipping!";
            } else if (index === 1) {
                defaultType = "discount";
                minAmount = 2000;
                title = "You're {AMOUNT} away from a discount!";
                description = "Cool discount";
            } else if (index === 2) {
                defaultType = "product";
                minAmount = 3000;
                title = "You're {AMOUNT} away from a free gift!";
                description = "Cool Product";
            }

            const updatedExisting = existing.map((tier) => ({
                ...tier,
                showIcon: globalShowIcon,
            }));

            return {
                ...prev,
                tiers: [
                    ...updatedExisting,
                    {
                        id: Date.now(),
                        type: defaultType,
                        minAmount,
                        description,
                        title,
                        showIcon: globalShowIcon,
                    },
                ],
                activeTier: index,
            };
        });
    };

    const removeTier = (index) => {
        handleChange("rewardsSettings", (prev) => {
            const updated = prev.tiers.filter((_, i) => i !== index);

            return {
                ...prev,
                tiers: updated,
                activeTier: Math.max(0, index - 1),
            };
        });
    };

    return (
        <>
            <LegacyCard sectioned title="Rewards calculation">
                <LegacyStack vertical spacing="tight">
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6 }}>
                            <Box
                                padding="300"
                                borderRadius="300"
                                borderWidth="025"
                                borderColor="border"
                            >
                                <RadioButton
                                    label="Cart total ($)"
                                    id="total"
                                    name="rewards-calculation"
                                    checked={rewardsSettings.calculationType === "total"}
                                    helpText="Your rewards will be calculated based on the total amount of the cart."
                                    onChange={() => {
                                        handleChange("rewardsSettings", (prev) => ({
                                            ...prev,
                                            calculationType: "total",
                                            usePreDiscount: true,
                                        }));
                                    }}
                                />
                            </Box>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6 }}>
                            <Box
                                padding="300"
                                borderRadius="300"
                                borderWidth="025"
                                borderColor="border"
                            >
                                <RadioButton
                                    label="Cart quantity (#)"
                                    id="quantity"
                                    name="rewards-calculation"
                                    checked={rewardsSettings.calculationType === "quantity"}
                                    helpText="Your rewards will be calculated based on the quantity of items in the cart."
                                    onChange={() => {
                                        handleChange("rewardsSettings", (prev) => ({
                                            ...prev,
                                            calculationType: "quantity",
                                            usePreDiscount: false,
                                        }));
                                    }}
                                />
                            </Box>
                        </Grid.Cell>
                    </Grid>

                    <Box paddingBlockStart="200">
                        <Checkbox
                            label="Use pre-discounted prices for cart total"
                            checked={rewardsSettings.usePreDiscount}
                            helpText="Enable calculating reward bar tiers based on the cart total before any discounts are applied. This ensures that rewards are based on the original prices of items, allowing you to maintain consistent reward thresholds regardless of any discounts given."
                            onChange={(value) => {
                                handleChange("rewardsSettings", (prev) => ({
                                    ...prev,
                                    usePreDiscount: value,
                                }));
                            }}
                        />
                    </Box>
                </LegacyStack>
            </LegacyCard>
            <LegacyCard sectioned>
                <BlockStack gap="300">

                    {/* HEADER */}
                    <InlineStack blockAlign="baseline" gap="200" wrap>
                        <Text variant="headingMd" as="h2">
                            Tier settings
                        </Text>

                        <Text variant="bodySm" tone="subdued">
                            {tiers.length} of 3 tiers created
                        </Text>
                    </InlineStack>

                    <InlineStack align="start" wrap gap="400">
                        {tiers.map((tier, index) => {
                            const isActive = index === activeTier;
                            const isPopoverOpen = activePopover === index;

                            return (
                                <div
                                    key={tier.id}
                                    style={{
                                        position: "relative",
                                        flex: "1 1 120px",
                                        minWidth: "120px",
                                        maxWidth: "150px",
                                    }}
                                >
                                    {/* TAB BUTTON */}
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() =>
                                            handleChange("rewardsSettings", (prev) => ({
                                                ...prev,
                                                activeTier: index,
                                            }))
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px 32px 10px 10px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: isActive ? "500" : "400",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",

                                            background: isActive
                                                ? "#e3e3e3"
                                                : "transparent",

                                            border: isActive
                                                ? "none"
                                                : "1px solid var(--p-color-border)",
                                        }}
                                    >
                                        Tier {index + 1}
                                    </button>

                                    {/* DELETE ICON */}
                                    {isActive && tiers.length > 1 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: "10px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                zIndex: 2,
                                            }}
                                        >
                                            <Popover
                                                active={isPopoverOpen}
                                                activator={
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActivePopover(isPopoverOpen ? null : index);
                                                        }}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            padding: 0,
                                                            display: "flex",
                                                        }}
                                                    >
                                                        <Box width="200" height="100">
                                                            <Icon source={XSmallIcon} />
                                                        </Box>
                                                    </button>
                                                }
                                                onClose={() => setActivePopover(null)}

                                            >
                                                <Box padding="300">
                                                    <InlineStack blockAlign="center" gap="100" wrap="noWrap">

                                                        <Text variant="bodySm">
                                                            Remove this tier?
                                                        </Text>

                                                        <Button
                                                            variant="secondary" tone="critical" size="slim"
                                                            removeUnderline
                                                            onClick={() => {
                                                                removeTier(index);
                                                                setActivePopover(null);
                                                            }}
                                                        >
                                                            Delete tier
                                                        </Button>

                                                    </InlineStack>
                                                </Box>
                                            </Popover>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* ADD TIER */}
                        {tiers.length < 3 && (
                            <button
                                type="button"
                                onClick={addTier}
                                style={{
                                    flex: "1 1 120px",
                                    minWidth: "120px",
                                    maxWidth: "150px",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    border: "2px dashed var(--p-color-border)",
                                    background: "transparent",
                                }}
                            >
                                + Add tier
                            </button>
                        )}
                    </InlineStack>

                    {/* DIVIDER */}
                    <Divider />

                    {/* INPUT ROW */}
                    <InlineGrid columns={2} gap="300">
                        <Select
                            label="Reward type"
                            options={[
                                { label: "Shipping", value: "shipping" },
                                { label: "Discount", value: "discount" },
                                { label: "Product", value: "product" },
                            ]}
                            value={current?.type || "discount"}
                            onChange={(val) => updateTier("type", val)}
                        />

                        <TextField
                            label={
                                rewardsSettings.calculationType === "quantity"
                                    ? "Minimum quantity"
                                    : "Minimum amount"
                            }
                            type="number"
                            value={
                                rewardsSettings.calculationType === "quantity"
                                    ? String(current?.minQuantity || 0)
                                    : String(current?.minAmount || 0)
                            }
                            onChange={(val) => {
                                if (rewardsSettings.calculationType === "quantity") {
                                    updateTier("minQuantity", Number(val));
                                } else {
                                    updateTier("minAmount", Number(val));
                                }
                            }}
                        />
                    </InlineGrid>

                    {tiers.length === 1 && (
                        <Checkbox
                            label="Show reward icon"
                            checked={current?.showIcon || false}
                            onChange={(val) => {
                                handleChange("rewardsSettings", (prev) => {
                                    const updatedTiers = (prev.tiers || []).map((tier) => ({
                                        ...tier,
                                        showIcon: val,
                                    }));

                                    return {
                                        ...prev,
                                        tiers: updatedTiers,
                                    };
                                });
                            }}
                        />
                    )}

                    <TextField
                        label="Reward description"
                        value={current?.description || ""}
                        onChange={(val) => updateTier("description", val)}
                    />

                    <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="bodyMd" fontWeight="medium">
                                Title before achieving tier
                            </Text>
                            <Button
                                variant="plain"
                                onClick={() => updateTier("title", "")}
                            >
                                Clear
                            </Button>
                        </InlineStack>
                        <RichTextEditor
                            label="Title before achieving tier"
                            value={current?.title || ""}
                            onChange={(val) => updateTier("title", val)}
                        />
                    </BlockStack>

                    {current?.type === "product" && (
                        <BlockStack gap="200">
                            <InlineStack gap="200" align="start">
                                <Text variant="bodyMd" fontWeight="medium">
                                    Products
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                    {current?.products?.length || 0} of 3 products added
                                </Text>
                            </InlineStack>

                            <div style={{ display: "flex", width: "100%", gap: "12px", flexWrap: "wrap" }}>

                                {current?.products?.map((item, index) => (
                                    <div key={item.id + index} style={{ flex: "1 1 calc(33.333% - 8px)", minWidth: "160px" }}>
                                        <Box
                                            borderColor="border"
                                            borderWidth="025"
                                            borderStyle="solid"
                                            borderRadius="300"
                                            padding="400"
                                            background="bg-surface"
                                        >
                                            <BlockStack gap="200">
                                                <InlineStack gap="300" align="start" wrap={false}>
                                                    <div style={{ flexShrink: 0 }}>
                                                        <Thumbnail
                                                            source={item.productImage}
                                                            alt={item.productTitle}
                                                            size="medium"
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        <Text variant="bodySm" fontWeight="medium" as="p" truncate>
                                                            {item.productTitle}
                                                        </Text>
                                                        <InlineStack gap="100" align="start">
                                                            <Button
                                                                icon={EditIcon}
                                                                variant="secondary"
                                                                size="slim"
                                                                onClick={() => {
                                                                    setTempSelected([item]);
                                                                    setOpenProductModal(true);
                                                                    setIsEditing(true);
                                                                    setEditIndex(index);
                                                                }}
                                                            />
                                                            <Button
                                                                icon={DeleteIcon}
                                                                tone="critical"
                                                                size="slim"
                                                                onClick={() => {
                                                                    const updated = current.products.filter(
                                                                        (_, i) => i !== index
                                                                    );
                                                                    updateTier("products", updated);
                                                                }}
                                                            />
                                                        </InlineStack>
                                                    </div>
                                                </InlineStack>
                                            </BlockStack>
                                        </Box>
                                    </div>
                                ))}

                                {/* Add product button — always 1 slot wide */}
                                {(current?.products?.length || 0) < 3 && (
                                    <div style={{ flex: "1 1 calc(33.333% - 8px)", minWidth: "160px" }}>
                                        <Box
                                            borderColor="border"
                                            borderStyle="dashed"
                                            borderWidth="050"
                                            borderRadius="400"
                                            padding="400"
                                        >
                                            <div style={{ minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Button
                                                    icon={PlusIcon}
                                                    size="slim"
                                                    onClick={() => {
                                                        setTempSelected([]);
                                                        setIsEditing(false);
                                                        setOpenProductModal(true);
                                                    }}
                                                >
                                                    Add product
                                                </Button>
                                            </div>
                                        </Box>
                                    </div>
                                )}

                                {Array.from({
                                    length: Math.max(0, 2 - (current?.products?.length || 0))
                                }).map((_, i) => (
                                    <div
                                        key={`spacer-${i}`}
                                        style={{ flex: "1 1 calc(33.333% - 8px)", minWidth: "160px" }}
                                    />
                                ))}

                            </div>

                            <Modal
                                open={openProductModal}
                                onClose={() => setOpenProductModal(false)}
                                title="Select Product"
                                primaryAction={{
                                    content: "Save",
                                    onAction: () => {
                                        let updated = [...(current.products || [])];
                                        if (isEditing && editIndex !== null) {
                                            updated[editIndex] = tempSelected[0];
                                        } else {
                                            updated.push(...tempSelected);
                                        }
                                        updateTier("products", updated);
                                        setTempSelected([]);
                                        setIsEditing(false);
                                        setEditIndex(null);
                                        setOpenProductModal(false);
                                    }
                                }}
                                secondaryActions={[
                                    {
                                        content: "Cancel",
                                        onAction: () => setOpenProductModal(false),
                                    },
                                ]}
                            >
                                <Modal.Section>
                                    <Prodcuts
                                        products={products}
                                        hasNextPage={hasNextPage}
                                        nextCursor={nextCursor}
                                        currency={currency}
                                        selectedItems={tempSelected}
                                        onSelect={(items) => setTempSelected(items)}
                                    />
                                </Modal.Section>
                            </Modal>
                        </BlockStack>
                    )}

                </BlockStack>
            </LegacyCard>
        </>
    );
}