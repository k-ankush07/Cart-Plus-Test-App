import { useState } from "react";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";
import {
  Card, Text, BlockStack, InlineStack, Button, TextField,
  Badge, Modal, Checkbox, ButtonGroup, Icon,
} from "@shopify/polaris";
import {
  DeleteIcon, EditIcon, RefreshIcon, CartIcon,
  CashDollarIcon, GiftCardIcon, PersonIcon,
  ChevronUpIcon, ChevronDownIcon,
} from "@shopify/polaris-icons";
import ProductItemCollections from "../ui/ProductItem-Collections";

const TRIGGER_OPTIONS = [
  { type: "specific_products", label: "Specific products", description: "Any item in the cart belongs to selected products or variants" },
  { type: "specific_collections", label: "Specific collections", description: "Any item in the cart belongs to selected collections" },
  { type: "cart_total", label: "Cart total", description: "Combined value of all items before discounts" },
  { type: "cart_quantity", label: "Cart quantity", description: "Total quantity of all items in the cart" },
  { type: "subscription", label: "Subscription", description: "Any item in the cart has a subscription" },
  { type: "customer_logged_in", label: "Customer is logged in", description: "Targeted customer who is logged in" },
];

const REWARD_OPTIONS = [
  { type: "free_gift", label: "Free gift", description: "Give a free gift" },
  { type: "cart_discount", label: "Cart discount", description: "Discount apply on cart total" },
  { type: "free_shipping", label: "Free shipping", description: "No standard shipping costs for the cart" },
];

const TRIGGER_ICON = {
  specific_products: CartIcon,
  specific_collections: CartIcon,
  cart_total: CashDollarIcon,
  cart_quantity: CartIcon,
  subscription: RefreshIcon,
  customer_logged_in: PersonIcon,
};

const REWARD_ICON = {
  free_gift: GiftCardIcon,
  cart_discount: CashDollarIcon,
  free_shipping: CartIcon,
};

const ICON_BG = "#9B2C8A";
const emptyForm = { id: null, title: "", discountCode: "", description: "", triggers: [], reward: null, enabled: false };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function triggerBadgeLabel(t) {
  if (!t) return "";
  switch (t.type) {
    case "cart_total": return `Cart total ($${(t.minAmount || 0).toFixed(2)}+)`;
    case "cart_quantity": return `Cart quantity (${t.minQuantity || 0}+)`;
    case "specific_products": return "Specific product";
    case "specific_collections": return "Specific collection";
    case "subscription": return "Subscription";
    case "customer_logged_in": return "Customer logged in";
    default: return t.type;
  }
}

function rewardBadgeLabel(r) {
  if (!r) return "";
  switch (r.type) {
    case "cart_discount": return r.discountType === "fixed" ? `$${r.value || 0} cart discount` : `${r.value || 0}% cart discount`;
    case "free_gift": return "Free gift";
    case "free_shipping": return "Free shipping";
    default: return r.type;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TriggerSlot({ trigger, onRemove, onEdit }) {
  const meta = TRIGGER_OPTIONS.find((o) => o.type === trigger.type);
  const icon = TRIGGER_ICON[trigger.type] || CartIcon;

  const titles = trigger.items?.titles || [];
  const count = trigger.type === "specific_products"
    ? (trigger.items?.products?.length || 0)
    : trigger.type === "specific_collections"
      ? (trigger.items?.length || 0)
      : null;

  const titleLine = titles.length > 0 ? titles.join(", ") : meta?.description || "";
  const label = count !== null ? `${meta?.label} (${count} selected)` : meta?.label || trigger.type;

  return (
    <div style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "12px 16px" }}>
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <div style={{ background: ICON_BG, borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", flexShrink: 0 }}>
            <div style={{ filter: "brightness(0) invert(1)" }}><Icon source={icon} /></div>
          </div>
          <BlockStack gap="0">
            <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
            <Text variant="bodySm" tone="subdued">{titleLine}</Text>
          </BlockStack>
        </InlineStack>
        <InlineStack gap="100">
          {onEdit && <Button variant="plain" icon={EditIcon} onClick={onEdit} accessibilityLabel="Edit trigger" />}
          <Button variant="plain" tone="critical" icon={DeleteIcon} onClick={onRemove} accessibilityLabel="Remove trigger" />
        </InlineStack>
      </InlineStack>
    </div>
  );
}

function RewardSlot({ reward, onRemove }) {
  const meta = REWARD_OPTIONS.find((o) => o.type === reward.type);
  const icon = REWARD_ICON[reward.type] || CartIcon;
  return (
    <div style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "12px 16px" }}>
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <div style={{ background: ICON_BG, borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", flexShrink: 0 }}>
            <div style={{ filter: "brightness(0) invert(1)" }}><Icon source={icon} /></div>
          </div>
          <BlockStack gap="0">
            <Text variant="bodyMd" fontWeight="semibold">{meta?.label || reward.type}</Text>
            <Text variant="bodySm" tone="subdued">{meta?.description || ""}</Text>
          </BlockStack>
        </InlineStack>
        <Button variant="plain" tone="critical" icon={DeleteIcon} onClick={onRemove} accessibilityLabel="Remove reward" />
      </InlineStack>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ position: "relative", width: "36px", height: "20px", borderRadius: "10px", background: value ? "#008060" : "#bbb", border: "none", cursor: "pointer", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "2px", left: value ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
    </button>
  );
}

const slotBox = { border: "1px dashed #ccc", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "48px" };
const modalRow = { padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center" };

// ─── Main component ───────────────────────────────────────────────────────────

export default function TriggeredReward({ triggeredRewardsSettings, handleChange, currency }) {
  const authenticatedFetch = useAuthenticatedFetch();
  const update = (key, value) =>
    handleChange("triggeredRewards", (prev) => ({ ...prev, [key]: value }));

  const rewards = triggeredRewardsSettings?.rewards || [];
  const discountCombinations = triggeredRewardsSettings?.discountCombinations || { productDiscounts: true, orderDiscounts: true, shippingDiscounts: true };

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpand = (id) => setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const [triggerListOpen, setTriggerListOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [rewardListOpen, setRewardListOpen] = useState(false);
  const [specificProductsOpen, setSpecificProductsOpen] = useState(false);
  const [specificCollectionsOpen, setSpecificCollectionsOpen] = useState(false);
  const [cartTotalOpen, setCartTotalOpen] = useState(false);
  const [cartQuantityOpen, setCartQuantityOpen] = useState(false);
  const [freeGiftOpen, setFreeGiftOpen] = useState(false);
  const [cartDiscountOpen, setCartDiscountOpen] = useState(false);

  const [pendingMinItems, setPendingMinItems] = useState("1");
  const [pendingItems, setPendingItems] = useState({ type: "products", items: {} });
  const [pendingCartTotal, setPendingCartTotal] = useState("0.00");
  const [pendingCartQty, setPendingCartQty] = useState("0");
  const [pendingGiftItems, setPendingGiftItems] = useState({ type: "products", items: {} });
  const [pendingDiscountType, setPendingDiscountType] = useState("percentage");
  const [pendingDiscountValue, setPendingDiscountValue] = useState("0");
  const [editingTriggerIdx, setEditingTriggerIdx] = useState(null);

  const openTriggerList = (slot) => {
    setActiveSlot(slot);
    setEditingTriggerIdx(null);
    setTriggerListOpen(true);
  };

  const openEditTrigger = (idx) => {
    const t = form.triggers[idx];
    setEditingTriggerIdx(idx);
    setTriggerListOpen(false);
    if (t.type === "specific_products") {
      setPendingMinItems(String(t.minItems || 1));
      setPendingItems({ type: "products", items: t.items || {} });
      setSpecificProductsOpen(true);
    } else if (t.type === "specific_collections") {
      setPendingMinItems(String(t.minItems || 1));
      setPendingItems({ type: "collections", items: t.items || [] });
      setSpecificCollectionsOpen(true);
    } else if (t.type === "cart_total") {
      setPendingCartTotal(String(t.minAmount ?? 0));
      setCartTotalOpen(true);
    } else if (t.type === "cart_quantity") {
      setPendingCartQty(String(t.minQuantity ?? 0));
      setCartQuantityOpen(true);
    }
  };

  const selectTrigger = (type) => {
    setTriggerListOpen(false);
    if (type === "specific_products") {
      setPendingMinItems("1"); setPendingItems({ type: "products", items: {} });
      setSpecificProductsOpen(true);
    } else if (type === "specific_collections") {
      setPendingMinItems("1"); setPendingItems({ type: "collections", items: [] });
      setSpecificCollectionsOpen(true);
    } else if (type === "cart_total") {
      setPendingCartTotal("0.00"); setCartTotalOpen(true);
    } else if (type === "cart_quantity") {
      setPendingCartQty("0"); setCartQuantityOpen(true);
    } else {
      addTrigger({ type });
    }
  };

  const addTrigger = (trigger) => {
    const newTriggers = [...form.triggers];
    if (editingTriggerIdx !== null) {
      newTriggers[editingTriggerIdx] = trigger;
    } else if (activeSlot !== null && activeSlot < 2) {
      newTriggers[activeSlot] = trigger;
    } else {
      if (newTriggers.length < 2) newTriggers.push(trigger);
    }
    setEditingTriggerIdx(null);
    updateForm("triggers", newTriggers);
  };

  const removeTrigger = (idx) => {
    console.log("🗑️ [removeTrigger] Removing index:", idx);
    const t = [...form.triggers];
    t.splice(idx, 1);
    updateForm("triggers", t);
  };

  const confirmSpecificProducts = () => {
    addTrigger({ type: "specific_products", minItems: parseInt(pendingMinItems) || 1, items: pendingItems.items });
    setSpecificProductsOpen(false);
  };

  const confirmSpecificCollections = () => {
    addTrigger({ type: "specific_collections", minItems: parseInt(pendingMinItems) || 1, items: pendingItems.items });
    setSpecificCollectionsOpen(false);
  };

  const confirmCartTotal = () => {
    addTrigger({ type: "cart_total", minAmount: parseFloat(pendingCartTotal) || 0 });
    setCartTotalOpen(false);
  };

  const confirmCartQty = () => {
    addTrigger({ type: "cart_quantity", minQuantity: parseInt(pendingCartQty) || 0 });
    setCartQuantityOpen(false);
  };

  const selectReward = (type) => {
    setRewardListOpen(false);
    if (type === "free_gift") {
      setPendingGiftItems({ type: "products", items: {} });
      setFreeGiftOpen(true);
    } else if (type === "cart_discount") {
      setPendingDiscountType("percentage"); setPendingDiscountValue("0");
      setCartDiscountOpen(true);
    } else {
      updateForm("reward", { type });
    }
  };

  const confirmFreeGift = () => {
    updateForm("reward", { type: "free_gift", items: pendingGiftItems.items });
    setFreeGiftOpen(false);
  };

  const confirmCartDiscount = () => {
    const parsed = parseFloat(pendingDiscountValue);

    if (isNaN(parsed) || parsed <= 0) {
      alert("Enter valid discount value");
      return;
    }

    updateForm("reward", {
      type: "cart_discount",
      discountType: pendingDiscountType,
      value: parsed,
    });

    setCartDiscountOpen(false);
  };

  const handleSave = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.discountCode.trim()) errors.discountCode = "Discount code is required";
    if (!form.description.trim()) errors.description = "Description is required";
    if (form.triggers.length === 0) errors.triggers = "At least one trigger is required";
    if (!form.reward) errors.reward = "Reward is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (form.reward?.type === "cart_discount" && (!form.reward?.value || form.reward.value <= 0)) {
      alert("Enter valid discount value");
      return;
    }

    const newReward = { ...form, id: form.id || Date.now() };
    const newRewards = form.id
      ? rewards.map((r) => (r.id === form.id ? newReward : r))
      : [...rewards, newReward];

    update("rewards", newRewards);

    setShowForm(false);
    setForm({ ...emptyForm });
    setFormErrors({});
  };

  const handleCancel = () => {
    console.log(" [handleCancel] Cancelled form");
    setShowForm(false);
    setForm({ ...emptyForm });
    setFormErrors({});
  };

  const syncRewards = async (newRewards) => {
    const existingDiscountId = triggeredRewardsSettings?.shopifyDiscountId || null;
    const discountCombinations = triggeredRewardsSettings?.discountCombinations || {};
    try {
      await authenticatedFetch("/api/create-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewards: newRewards, discountCombinations, existingDiscountId }),
      });
    } catch (e) {
      console.error(" [syncRewards] Failed to sync:", e);
    }
  };

  const deleteReward = (id) => {
    const newRewards = rewards.filter((r) => r.id !== id);
    update("rewards", newRewards);
    syncRewards(newRewards);
  };

  const toggleReward = (id) => {
    const newRewards = rewards.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    update("rewards", newRewards);
    syncRewards(newRewards);
  };

  return (
    <>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text variant="headingMd">Triggered rewards</Text>
              <Text variant="bodySm" tone="subdued">
                Rewards that are shown if specific conditions (eg. products in cart, customer type) are met. You can create up to 10 rules.
              </Text>
            </BlockStack>

            {!showForm && rewards.length < 10 && (
              <div><Button onClick={() => { console.log("➕ [UI] Add rewards clicked"); setShowForm(true); }}>+ Add rewards</Button></div>
            )}

            {rewards.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ background: "#1a1a1a", borderRadius: "8px", padding: "10px 12px" }}><span style={{ fontSize: "18px" }}>🏷️</span></div>
                  <span style={{ fontSize: "18px", color: "#637381" }}>→</span>
                  <div style={{ background: "#e8e8e8", borderRadius: "8px", padding: "10px 12px" }}><span style={{ fontSize: "18px" }}>🔥</span></div>
                </div>
                <Text variant="bodyMd" fontWeight="semibold">No triggered rewards yet</Text>
                <Text variant="bodySm" tone="subdued">Add a reward to see more here.</Text>
              </div>
            )}

            {showForm && (
              <div style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px" }}>
                <BlockStack gap="300">
                  <TextField label="Title" value={form.title} onChange={(v) => updateForm("title", v)} placeholder="e.g. Free shipping on orders over $50" requiredIndicator autoComplete="off" error={formErrors.title} />
                  <TextField label="Discount Code" value={form.discountCode} onChange={(v) => updateForm("discountCode", v)} placeholder="e.g. FREESHIP50" requiredIndicator autoComplete="off" error={formErrors.discountCode} />
                  <TextField label="Description" value={form.description} onChange={(v) => updateForm("description", v)} placeholder="e.g. Get free shipping when you spend $50 or more" requiredIndicator autoComplete="off" error={formErrors.description} />

                  <BlockStack gap="200">
                    <InlineStack gap="100" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="medium">Triggers</Text>
                      <Text variant="bodyMd" tone="critical">*</Text>
                      <Text variant="bodySm" tone="subdued">({form.triggers.length} of 2)</Text>
                    </InlineStack>
                    {form.triggers.map((t, i) => (
                      <TriggerSlot key={i} trigger={t} onRemove={() => removeTrigger(i)} onEdit={["specific_products", "specific_collections", "cart_total", "cart_quantity"].includes(t.type) ? () => openEditTrigger(i) : null} />
                    ))}
                    {form.triggers.length < 2 && (
                      <div style={slotBox}>
                        <Button variant="plain" onClick={() => openTriggerList(form.triggers.length)}>+ Add trigger</Button>
                      </div>
                    )}
                    {formErrors.triggers && <Text tone="critical" variant="bodySm">{formErrors.triggers}</Text>}
                  </BlockStack>

                  <BlockStack gap="200">
                    <InlineStack gap="100" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="medium">Reward</Text>
                      <Text variant="bodyMd" tone="critical">*</Text>
                    </InlineStack>
                    {form.reward ? (
                      <RewardSlot reward={form.reward} onRemove={() => updateForm("reward", null)} />
                    ) : (
                      <div style={slotBox}>
                        <Button variant="plain" onClick={() => setRewardListOpen(true)}>+ Add reward</Button>
                      </div>
                    )}
                    {formErrors.reward && <Text tone="critical" variant="bodySm">{formErrors.reward}</Text>}
                  </BlockStack>

                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone={form.enabled ? "success" : "critical"}>{form.enabled ? "Enabled" : "Disabled"}</Badge>
                      <Toggle value={form.enabled} onChange={(v) => updateForm("enabled", v)} />
                    </InlineStack>
                    <InlineStack gap="200">
                      <Button onClick={handleCancel}>Cancel</Button>
                      <Button variant="primary" onClick={handleSave}>Save</Button>
                    </InlineStack>
                  </InlineStack>
                </BlockStack>
              </div>
            )}

            {rewards.map((reward) => {
              const isExpanded = !!expandedCards[reward.id];
              const hasConditions = reward.triggers.some((t) =>
                (t.type === "specific_products" && (t.items?.titles?.length > 0 || t.items?.products?.length > 0)) ||
                (t.type === "specific_collections" && (t.items?.titles?.length > 0 || (Array.isArray(t.items) && t.items.length > 0)))
              );
              return (
                <div key={reward.id} style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px" }}>
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <Text variant="bodyMd" fontWeight="semibold">{reward.title}</Text>
                        {reward.discountCode && <Badge tone="info">🏷️ {reward.discountCode}</Badge>}
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={reward.enabled ? "success" : "critical"}>{reward.enabled ? "Enabled" : "Disabled"}</Badge>
                        <Toggle value={reward.enabled} onChange={() => toggleReward(reward.id)} />
                        <Button variant="plain" tone="critical" icon={DeleteIcon} onClick={() => deleteReward(reward.id)} accessibilityLabel="Delete" />
                      </InlineStack>
                    </InlineStack>
                    {reward.description && <Text variant="bodySm" tone="subdued">{reward.description}</Text>}
                    <InlineStack gap="200" blockAlign="center" wrap>
                      <Text variant="bodySm" fontWeight="medium">Trigger type</Text>
                      {reward.triggers.map((t, i) => <Badge key={i}>{triggerBadgeLabel(t)}</Badge>)}
                      {hasConditions && (
                        <button onClick={() => toggleCardExpand(reward.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" }}>
                          <Icon source={isExpanded ? ChevronUpIcon : ChevronDownIcon} />
                        </button>
                      )}
                      <Text variant="bodySm" fontWeight="medium">Reward</Text>
                      {reward.reward && <Badge>{rewardBadgeLabel(reward.reward)}</Badge>}
                    </InlineStack>

                    {isExpanded && hasConditions && (
                      <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: "12px", marginTop: "4px" }}>
                        <BlockStack gap="200">
                          <Text variant="bodySm" fontWeight="semibold">Trigger conditions</Text>
                          {reward.triggers.map((t, i) => {
                            if (t.type !== "specific_products" && t.type !== "specific_collections") return null;
                            const titles = t.items?.titles || [];
                            const images = t.items?.images || [];
                            const minItems = t.minItems || 1;
                            const label = t.type === "specific_products" ? "Products" : "Collections";
                            return (
                              <div key={i} style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "12px" }}>
                                <BlockStack gap="150">
                                  <InlineStack gap="200" blockAlign="center">
                                    <Badge>🔷 {label}</Badge>
                                    <Text variant="bodySm" tone="subdued">{minItems} item{minItems !== 1 ? "s" : ""} required</Text>
                                  </InlineStack>
                                  {titles.map((title, j) => (
                                    <InlineStack key={j} gap="200" blockAlign="center">
                                      {images[j] ? (
                                        <img src={images[j]} alt={title} style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
                                      ) : (
                                        <div style={{ width: "32px", height: "32px", borderRadius: "4px", background: "#f1f2f3", flexShrink: 0 }} />
                                      )}
                                      <Text variant="bodySm">{title}</Text>
                                    </InlineStack>
                                  ))}
                                </BlockStack>
                              </div>
                            );
                          })}
                        </BlockStack>
                      </div>
                    )}
                  </BlockStack>
                </div>
              );
            })}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Discount combinations</Text>
            <Text variant="bodySm" tone="subdued">Allow stacking triggered rewards with...</Text>
            <Checkbox label="Product discounts" helpText="Applies alongside other product-level discounts for different items; only the best discount applies if targeting the same product." checked={discountCombinations.productDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, productDiscounts: v })} />
            <Checkbox label="Order discounts" helpText="Applies with order-level discounts; product discounts are applied first, then order-level discounts on the subtotal." checked={discountCombinations.orderDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, orderDiscounts: v })} />
            <Checkbox label="Shipping discounts" helpText="Applies together with free shipping or shipping-level discounts to get the largest eligible shipping discount." checked={discountCombinations.shippingDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, shippingDiscounts: v })} />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="bodyMd" fontWeight="medium">Custom template</Text>
              <Badge tone="info">Advanced</Badge>
            </InlineStack>
            <Text variant="bodySm" tone="subdued">Custom templates aren't enabled. Navigate to Settings &gt; Advanced Settings to enable.</Text>
          </BlockStack>
        </Card>
      </BlockStack>

      <Modal open={triggerListOpen} onClose={() => setTriggerListOpen(false)} title="Select a trigger condition">
        <Modal.Section flush>
          {TRIGGER_OPTIONS.map((opt) => (
            <div key={opt.type} style={modalRow} onClick={() => selectTrigger(opt.type)}>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">{opt.label}</Text>
                <Text variant="bodySm" tone="subdued">{opt.description}</Text>
              </div>
              <span style={{ color: "#637381", fontSize: "18px" }}>›</span>
            </div>
          ))}
        </Modal.Section>
      </Modal>

      <Modal open={specificProductsOpen} onClose={() => setSpecificProductsOpen(false)} title="Specific products"
        primaryAction={{ content: "Confirm", onAction: confirmSpecificProducts }}
        secondaryActions={[{ content: "Back", onAction: () => { setSpecificProductsOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField label="Minimum number of matching items" type="number" value={pendingMinItems} onChange={setPendingMinItems} autoComplete="off" />
            <ProductItemCollections currency={currency} onSelect={setPendingItems} initialSelected={{ type: "products", items: pendingItems.items }} showCollections={false} />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal open={specificCollectionsOpen} onClose={() => setSpecificCollectionsOpen(false)} title="Specific collections"
        primaryAction={{ content: "Confirm", onAction: confirmSpecificCollections }}
        secondaryActions={[{ content: "Back", onAction: () => { setSpecificCollectionsOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField label="Minimum number of matching items" type="number" value={pendingMinItems} onChange={setPendingMinItems} autoComplete="off" />
            <ProductItemCollections currency={currency} onSelect={setPendingItems} initialSelected={{ type: "collections", items: pendingItems.items }} showProducts={false} />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal open={cartTotalOpen} onClose={() => setCartTotalOpen(false)} title="Cart total"
        primaryAction={{ content: "Confirm", onAction: confirmCartTotal }}
        secondaryActions={[{ content: "Back", onAction: () => { setCartTotalOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <TextField label="Cart total minimum amount" type="number" value={pendingCartTotal} onChange={setPendingCartTotal} autoComplete="off" />
        </Modal.Section>
      </Modal>

      <Modal open={cartQuantityOpen} onClose={() => setCartQuantityOpen(false)} title="Cart quantity"
        primaryAction={{ content: "Confirm", onAction: confirmCartQty }}
        secondaryActions={[{ content: "Back", onAction: () => { setCartQuantityOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <TextField label="Item count minimum amount" type="number" value={pendingCartQty} onChange={setPendingCartQty} autoComplete="off" />
        </Modal.Section>
      </Modal>

      <Modal open={rewardListOpen} onClose={() => setRewardListOpen(false)} title="Select a reward">
        <Modal.Section flush>
          {REWARD_OPTIONS.map((opt) => (
            <div key={opt.type} style={modalRow} onClick={() => selectReward(opt.type)}>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">{opt.label}</Text>
                <Text variant="bodySm" tone="subdued">{opt.description}</Text>
              </div>
              <span style={{ color: "#637381", fontSize: "18px" }}>›</span>
            </div>
          ))}
        </Modal.Section>
      </Modal>

      <Modal open={freeGiftOpen} onClose={() => setFreeGiftOpen(false)} title="Select a free Gift"
        primaryAction={{ content: "Confirm", onAction: confirmFreeGift }}
        secondaryActions={[{ content: "Back", onAction: () => { setFreeGiftOpen(false); setRewardListOpen(true); } }]}
      >
        <Modal.Section>
          <ProductItemCollections currency={currency} onSelect={setPendingGiftItems} initialSelected={{ type: "products", items: pendingGiftItems.items }} showCollections={false} maxSelect={1} />
        </Modal.Section>
      </Modal>

      <Modal open={cartDiscountOpen} onClose={() => setCartDiscountOpen(false)} title="Configure cart discount"
        primaryAction={{ content: "Confirm", onAction: confirmCartDiscount }}
        secondaryActions={[{ content: "Back", onAction: () => { setCartDiscountOpen(false); setRewardListOpen(true); } }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="medium">Discount type</Text>
              <ButtonGroup variant="segmented">
                <Button pressed={pendingDiscountType === "percentage"} onClick={() => setPendingDiscountType("percentage")}>Percentage (%)</Button>
                <Button pressed={pendingDiscountType === "fixed"} onClick={() => setPendingDiscountType("fixed")}>Fixed amount ($)</Button>
              </ButtonGroup>
            </BlockStack>
            <TextField
              label={pendingDiscountType === "percentage" ? "Discount percentage" : "Discount amount"}
              type="number"
              value={pendingDiscountValue}
              onChange={setPendingDiscountValue}
              suffix={pendingDiscountType === "percentage" ? "%" : undefined}
              prefix={pendingDiscountType === "fixed" ? "$" : undefined}
              autoComplete="off"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}