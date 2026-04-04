import {
    Card,
    Text,
    InlineStack,
    BlockStack,
    Button,
    Select,
    TextField,
    Checkbox,
    RadioButton,
    Modal,
    Thumbnail
} from "@shopify/polaris";
import RichTextEditor from "../ui/RichTextEditor";
import Prodcuts from "./Products";
import { useState } from "react";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";

export default function TierSettings({ rewardsSettings, handleChange, products, nextCursor, hasNextPage, currency }) {
    const tiers = rewardsSettings?.tiers || [];
    const activeTier = rewardsSettings?.activeTier || 0;
    const current = tiers[activeTier] || { products: [] };
    const [openProductModal, setOpenProductModal] = useState(false);
    const [tempSelected, setTempSelected] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);

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

            return {
                ...prev,
                tiers: [
                    ...existing,
                    {
                        id: Date.now(),
                        type: defaultType,
                        minAmount,
                        description,
                        title,
                        showIcon: true,
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
        <Card>
            <BlockStack gap="300">
                <Text variant="headingSm">Rewards calculation</Text>
                <InlineStack gap="300">

                    <div
                        style={{
                            flex: 1,
                            border: "1px solid #e1e3e5",
                            borderRadius: "12px",
                            padding: "12px",
                            background:
                                rewardsSettings.calculationType === "total"
                                    ? "#f6f6f7"
                                    : "#fff",
                        }}
                        onChange={() => {
                            handleChange("rewardsSettings", (prev) => ({
                                ...prev,
                                calculationType: "total",
                                usePreDiscount: true,
                            }));
                        }}
                    >
                        <BlockStack gap="100">
                            <RadioButton
                                label="Cart total ($)"
                                checked={rewardsSettings.calculationType === "total"}
                                id="total"
                                name="rewards-calculation"
                                onChange={() => {
                                    handleChange("rewardsSettings", (prev) => ({
                                        ...prev,
                                        calculationType: "total",
                                        usePreDiscount: true,
                                    }));
                                }}
                            />
                            <Text tone="subdued" variant="bodySm">
                                Your rewards will be calculated based on the total amount of the cart.
                            </Text>
                        </BlockStack>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            border: "1px solid #e1e3e5",
                            borderRadius: "12px",
                            padding: "12px",
                            background:
                                rewardsSettings.calculationType === "quantity"
                                    ? "#f6f6f7"
                                    : "#fff",
                        }}
                        onChange={() => {
                            handleChange("rewardsSettings", (prev) => ({
                                ...prev,
                                calculationType: "quantity",
                                usePreDiscount: false,
                            }));
                        }}
                    >
                        <BlockStack gap="100">
                            <RadioButton
                                label="Cart quantity (#)"
                                checked={rewardsSettings.calculationType === "quantity"}
                                id="quantity"
                                name="rewards-calculation"
                                onChange={() => {
                                    handleChange("rewardsSettings", (prev) => ({
                                        ...prev,
                                        calculationType: "quantity",
                                        usePreDiscount: false,
                                    }));
                                }}
                            />
                            <Text tone="subdued" variant="bodySm">
                                Your rewards will be calculated based on the quantity of items in the cart.
                            </Text>
                        </BlockStack>
                    </div>

                </InlineStack>
                {rewardsSettings.calculationType === "total" && (
                    <>
                        <InlineStack>
                            <Checkbox
                                label="Use pre-discounted prices for cart total"
                                checked={rewardsSettings.usePreDiscount}
                                onChange={(val) =>
                                    handleChange("rewardsSettings", (prev) => ({
                                        ...prev,
                                        usePreDiscount: val,
                                    }))
                                }
                            />
                        </InlineStack>
                        <Text tone="subdued" variant="bodySm">
                            Enable calculating reward bar tiers based on the cart total before any discounts are applied. This ensures that rewards are based on the original prices of items, allowing you to maintain consistent reward thresholds regardless of any discounts given.
                        </Text>
                    </>
                )}
                <InlineStack align="space-between">
                    <Text variant="headingSm">
                        Tier settings ({tiers.length} tiers)
                    </Text>

                    {tiers.length < 3 && (
                        <Button onClick={addTier}>+ Add tier</Button>
                    )}
                </InlineStack>

                {/* TABS */}
                <InlineStack gap="200">
                    {tiers.map((tier, index) => (
                        <InlineStack key={tier.id} gap="100">
                            <Button
                                variant={index === activeTier ? "primary" : "secondary"}
                                onClick={() =>
                                    handleChange("rewardsSettings", (prev) => ({
                                        ...prev,
                                        activeTier: index,
                                    }))
                                }
                            >
                                Tier {index + 1}
                            </Button>

                            {tiers.length > 1 && (
                                <Button
                                    tone="critical"
                                    onClick={() => removeTier(index)}
                                >
                                    ✕
                                </Button>
                            )}
                        </InlineStack>
                    ))}
                </InlineStack>
                <InlineStack>
                    {tiers.length === 1 && (
                        <Checkbox
                            label="Show reward icon"
                            checked={current?.showIcon || false}
                            onChange={(val) => updateTier("showIcon", val)}
                        />
                    )}</InlineStack>

                <InlineStack gap="200">
                    <div style={{ flex: 1 }}>
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
                    </div>

                    <div style={{ flex: 1 }}>
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
                    </div>
                </InlineStack>

                <TextField
                    label="Reward description"
                    value={current?.description || ""}
                    onChange={(val) => updateTier("description", val)}
                />
                <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="medium">
                        Title before achieving tier
                    </Text>
                    <RichTextEditor
                        label="Title before achieving tier"
                        value={current?.title || ""}
                        onChange={(val) => updateTier("title", val)}
                    />
                </BlockStack>

                {current?.type === "product" && (
                    <BlockStack gap="200">
                        <Text variant="bodyMd" fontWeight="medium">
                            Products
                        </Text>

                        <InlineStack
                            gap="300"
                            align="start"
                            wrap={false}
                        >
                            <div style={{ display: "flex", width: "100%", gap: "12px" }}>

                                {current?.products?.map((item, index) => (
                                    <div
                                        key={item.id + index}
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            border: "1px solid #e1e3e5",
                                            borderRadius: "12px",
                                            padding: "12px",
                                            background: "#fff",
                                        }}
                                    >
                                        <BlockStack gap="200" align="center">
                                            <InlineStack gap="400" align="center" wrap={false}>
                                                <div style={{ flexShrink: 0 }}>
                                                    <Thumbnail
                                                        source={item.productImage}
                                                        alt={item.productTitle}
                                                        size="medium"
                                                    />
                                                </div>

                                                <Text
                                                    variant="bodySm"
                                                    fontWeight="medium"
                                                    as="p"
                                                    truncate
                                                >
                                                    {item.productTitle}
                                                </Text>
                                            </InlineStack>

                                            <InlineStack gap="100" align="right">
                                                <Button
                                                    icon={EditIcon}
                                                    variant="secondary"
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
                                                    onClick={() => {
                                                        const updated = current.products.filter(
                                                            (_, i) => i !== index
                                                        );
                                                        updateTier("products", updated);
                                                    }}
                                                />
                                            </InlineStack>
                                        </BlockStack>
                                    </div>
                                ))}

                                {(current?.products?.length || 0) < 3 && (
                                    <div
                                        onClick={() => {
                                            setTempSelected([]);
                                            setIsEditing(false);
                                            setOpenProductModal(true);
                                        }}
                                        style={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "1px dashed #c9cccf",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            minHeight: "140px",
                                        }}
                                    >
                                        <Text variant="bodySm" tone="subdued">
                                            + Add product
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </InlineStack>
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
        </Card>
    );
}