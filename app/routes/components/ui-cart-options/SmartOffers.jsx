import { useState } from "react";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";
import {
  Card, Text, BlockStack, InlineStack, Button, TextField, Thumbnail,
  Badge, Modal, Checkbox, ButtonGroup, Icon, LegacyCard,
  LegacyStack, RangeSlider, Box, Divider, Pagination
} from "@shopify/polaris";
import {
  DeleteIcon, EditIcon, RefreshIcon, CartIcon,
  CashDollarIcon, GiftCardIcon, PersonIcon,
  ChevronUpIcon, ChevronDownIcon, AutomationIcon, PlusIcon
} from "@shopify/polaris-icons";

const TriggerIcon = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="white">
    <path d="M13 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
    <path fillRule="evenodd" d="M11.276 3.5a3.75 3.75 0 0 0-2.701 1.149l-4.254 4.417a2.75 2.75 0 0 0 .036 3.852l2.898 2.898a2.5 2.5 0 0 0 3.502.033l4.747-4.571a3.25 3.25 0 0 0 .996-2.341v-2.187a3.25 3.25 0 0 0-3.25-3.25h-1.974Zm-1.62 2.19a2.25 2.25 0 0 1 1.62-.69h1.974c.966 0 1.75.784 1.75 1.75v2.187c0 .475-.194.93-.536 1.26l-4.747 4.572a1 1 0 0 1-1.401-.014l-2.898-2.898a1.25 1.25 0 0 1-.016-1.75l4.253-4.418Z"></path>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor">
    <path fillRule="evenodd" d="M3.5 10a.75.75 0 0 1 .75-.75h9.69l-2.72-2.72a.75.75 0 1 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06-1.06l2.72-2.72h-9.69a.75.75 0 0 1-.75-.75Z"></path>
  </svg>
);

const DiscountIcon = () => (
  <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
    <path d="M13 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
    <path fillRule="evenodd" d="M11.276 3.5a3.75 3.75 0 0 0-2.701 1.149l-4.254 4.417a2.75 2.75 0 0 0 .036 3.852l2.898 2.898a2.5 2.5 0 0 0 3.502.033l4.747-4.571a3.25 3.25 0 0 0 .996-2.341v-2.187a3.25 3.25 0 0 0-3.25-3.25h-1.974Zm-1.62 2.19a2.25 2.25 0 0 1 1.62-.69h1.974c.966 0 1.75.784 1.75 1.75v2.187c0 .475-.194.93-.536 1.26l-4.747 4.572a1 1 0 0 1-1.401-.014l-2.898-2.898a1.25 1.25 0 0 1-.016-1.75l4.253-4.418Z"></path>
  </svg>
);

const RewardIcon = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="white">
    <path d="M10.029 3.033a.75.75 0 0 1 .5.935l-.703 2.313a.75.75 0 0 1-1.436-.436l.703-2.313a.75.75 0 0 1 .936-.5Z"></path>
    <path d="M16 3.75a.75.75 0 0 0-1.5 0v.25h-.25a.75.75 0 0 0 0 1.5h.25v.25a.75.75 0 0 0 1.5 0v-.25h.25a.75.75 0 0 0 0-1.5h-.25v-.25Z"></path>
    <path fillRule="evenodd" d="M8.306 7.746a1.75 1.75 0 0 0-2.834.521l-2.093 4.669a2.75 2.75 0 0 0 .565 3.07l.051.05a2.75 2.75 0 0 0 3.07.565l4.668-2.093a1.75 1.75 0 0 0 .521-2.834l-3.948-3.948Zm-1.465 1.135a.25.25 0 0 1 .405-.074l3.948 3.947a.25.25 0 0 1-.075.405l-4.668 2.093a1.25 1.25 0 0 1-1.395-.257l-.051-.05a1.25 1.25 0 0 1-.257-1.396l2.093-4.668Z"></path>
    <path d="M5.75 3a.75.75 0 0 1 .75.75v.25h.25a.75.75 0 1 1 0 1.5h-.25v.25a.75.75 0 0 1-1.5 0v-.25h-.25a.75.75 0 0 1 0-1.5h.25v-.25a.75.75 0 0 1 .75-.75Z"></path>
    <path d="M16 13.25a.75.75 0 0 0-1.5 0v.25h-.25a.75.75 0 0 0 0 1.5h.25v.25a.75.75 0 0 0 1.5 0v-.25h.25a.75.75 0 0 0 0-1.5h-.25v-.25Z"></path>
    <path d="M13.53 7.53a.75.75 0 0 0-1.06-1.06l-1 1a.75.75 0 0 0 1.06 1.06l1-1Z"></path>
    <path d="M16.578 11.032a.75.75 0 1 0-.413-1.442l-2.343.672a.75.75 0 1 0 .413 1.442l2.343-.672Z"></path>
  </svg>
);

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

const ICON_BG = "#c20075";
const emptyForm = { id: null, title: "", discountCode: "", description: "", triggers: [], reward: null, enabled: false };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrencyValue(value, currencyCode = "USD") {
  const safeCurrency = (currencyCode || "USD").toUpperCase();
  const locale = safeCurrency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: safeCurrency === "JPY" ? 0 : 2,
  }).format(Number(value) || 0);
}

function getCurrencySymbol(currencyCode = "USD") {
  const safeCurrency = (currencyCode || "USD").toUpperCase();
  const locale = safeCurrency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0).find((part) => part.type === "currency")?.value || safeCurrency;
}

function triggerBadgeLabel(t, currencyCode = "USD") {
  if (!t) return "";
  switch (t.type) {
    case "cart_total": return `Cart total (${formatCurrencyValue(t.minAmount || 0, currencyCode)}+)`;
    case "cart_quantity": return `Cart quantity (${t.minQuantity || 0}+)`;
    case "specific_products": return "Specific product";
    case "specific_collections": return "Specific collection";
    case "subscription": return "Subscription";
    case "customer_logged_in": return "Customer logged in";
    default: return t.type;
  }
}

function rewardBadgeLabel(r, currencyCode = "USD") {
  if (!r) return "";
  switch (r.type) {
    case "cart_discount": return r.discountType === "fixed" ? `${formatCurrencyValue(r.value || 0, currencyCode)} cart discount` : `${r.value || 0}% cart discount`;
    case "free_gift": return "Free gift";
    case "free_shipping": return "Free shipping";
    default: return r.type;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TriggerSlot({ trigger, onRemove, onEdit, currency }) {
  const meta = TRIGGER_OPTIONS.find((o) => o.type === trigger.type);
  const icon = TRIGGER_ICON[trigger.type] || CartIcon;

  const titles = trigger.type === "specific_collections"
    ? (trigger.items?.titles || Object.values(trigger.items || {}).map(i => i.title).filter(Boolean))
    : (trigger.items?.titles || []);

  const count = trigger.type === "specific_products"
    ? (trigger.items?.products?.length || trigger.items?.titles?.length || 0)
    : trigger.type === "specific_collections"
      ? titles.length
      : null;

  const label = count !== null
    ? `${meta?.label} (${count} selected)`
    : meta?.label || trigger.type;

  const titleLine = (() => {
    switch (trigger.type) {
      case "cart_total":
        return `${formatCurrencyValue(trigger.minAmount || 0, currency)} or more`;
      case "cart_quantity":
        return `${trigger.minQuantity || 0} item(s) or more`;
      case "specific_products":
        return titles.length > 0 ? titles.join(", ") : "No products selected";
      case "specific_collections":
        return titles.length > 0 ? titles.join(", ") : "No collections selected";
      default:
        return meta?.description || "";
    }
  })();

  return (
    <Box padding="300">
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <div style={{
            backgroundColor: ICON_BG,
            borderRadius: "var(--p-border-radius-200)",
            padding: "var(--p-space-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{ filter: "brightness(0) invert(1)" }}>
              <Icon source={icon} tone="base" />
            </div>
          </div>
          <BlockStack gap="0">
            <Text variant="headingSm">{label}</Text>
            <div style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "300px",
              color: "var(--p-color-text-subdued)"
            }}>
              {titleLine}
            </div>
          </BlockStack>
        </InlineStack>
        <ButtonGroup>
          {onEdit && (
            <Button icon={EditIcon} accessibilityLabel="Edit" onClick={onEdit} />
          )}
          <Button icon={DeleteIcon} tone="critical" accessibilityLabel="Delete" onClick={onRemove} />
        </ButtonGroup>
      </InlineStack>
    </Box>
  );
}

function RewardSlot({ reward, onRemove, currency }) {
  const meta = REWARD_OPTIONS.find((o) => o.type === reward.type);
  const icon = REWARD_ICON[reward.type] || CartIcon;

  const descriptionLine = (() => {
    switch (reward.type) {
      case "cart_discount":
        return reward.discountType === "fixed"
          ? `${formatCurrencyValue(reward.value || 0, currency)} off`
          : `${reward.value || 0}% off`;
      case "free_gift": {
        const titles = reward.items?.titles || [];
        return titles.length > 0 ? titles.join(", ") : "No product selected";
      }
      case "free_shipping":
        return "Free shipping applied";
      default:
        return meta?.description || "";
    }
  })();

  return (
    <Box padding="300">
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <div style={{
            backgroundColor: ICON_BG,
            borderRadius: "var(--p-border-radius-200)",
            padding: "var(--p-space-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{ filter: "brightness(0) invert(1)" }}>
              <Icon source={icon} tone="base" />
            </div>
          </div>
          <BlockStack gap="0">
            <Text variant="headingSm">{meta?.label || reward.type}</Text>
            <Text variant="bodyLg" truncate>{descriptionLine}</Text>
          </BlockStack>
        </InlineStack>
        <Button
          icon={DeleteIcon}
          tone="critical"
          accessibilityLabel="Delete"
          onClick={onRemove}
        />
      </InlineStack>
    </Box>
  );
}

function Toggle({ value, onChange, disabled }) {
  const displayValue = disabled ? false : value;

  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        position: "relative",
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        background: disabled ? "#ddd" : displayValue ? "#008060" : "#bbb",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: displayValue ? "18px" : "2px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

const slotBox = { border: "1px dashed #ccc", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "48px" };
const modalRow = { padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center" };

// ─── Main component ───────────────────────────────────────────────────────────

export default function SmartOffers({ cartId, triggeredRewardsSettings, handleChange, currency, cartStatus }) {

  const authenticatedFetch = useAuthenticatedFetch();
  const currencyCode = (currency || "USD").toUpperCase();
  const isPublished = cartStatus === "published";

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
  const [pendingDiscountError, setPendingDiscountError] = useState("");

  const [pagination, setPagination] = useState({
    hasPrevious: false,
    hasNext: false,
    handlePrev: () => { },
    handleNext: () => { },
  });

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
    console.log(" [removeTrigger] Removing index:", idx);
    const t = [...form.triggers];
    t.splice(idx, 1);
    updateForm("triggers", t);
  };

  const confirmSpecificProducts = () => {
    addTrigger({ type: "specific_products", minItems: parseInt(pendingMinItems) || 1, items: pendingItems.items });
    setSpecificProductsOpen(false);
  };

  const confirmSpecificCollections = () => {
    const ids = pendingItems.items || [];
    const titles = pendingItems.titles || [];
    const images = pendingItems.images || [];

    addTrigger({
      type: "specific_collections",
      minItems: parseInt(pendingMinItems) || 1,
      items: { ids, titles, images },
    });
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
      setPendingDiscountError("Enter a valid discount value");
      return;
    }

    if (pendingDiscountType === "percentage" && parsed > 100) {
      setPendingDiscountError("Percentage discount cannot exceed 100%");
      return;
    }

    updateForm("reward", {
      type: "cart_discount",
      discountType: pendingDiscountType,
      value: parsed,
    });

    setPendingDiscountError("");
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
      await authenticatedFetch("/shopify/create-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, rewards: newRewards, discountCombinations, existingDiscountId, cartStatus, }),
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
      <Box paddingBlockEnd="400">
        <BlockStack gap="400">
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack blockAlign="center" gap="100">
              <Box>
                <Icon source={AutomationIcon} />
              </Box>
              <InlineStack gap="200">
                <Text variant="headingMd" as="h2">Triggered Rewards</Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="200" />
          </InlineStack>
        </BlockStack>
      </Box>
      <Box paddingBlockEnd="400">
        <Text as="p" variant="bodySm">
          Rewards shown when specific conditions are met (e.g., products in cart, customer type). You can create up to 10 rules.
        </Text>
      </Box>
      <Divider />

      {rewards.length === 0 && !showForm && (
        <Box paddingBlockStart="1200" paddingBlockEnd="400">
          <BlockStack align="center" inlineAlign="center" gap="200">
            <InlineStack gap="200" blockAlign="center">
              <div style={{ backgroundColor: "rgb(74, 74, 74)", borderRadius: "4px", padding: "10px", display: "flex" }}>
                <TriggerIcon />
              </div>
              <ArrowIcon />
              <div style={{ backgroundColor: "rgb(74, 74, 74)", borderRadius: "4px", padding: "10px", display: "flex" }}>
                <RewardIcon />
              </div>
            </InlineStack>
            <Text variant="headingXs" as="h6">No triggered rewards yet</Text>
            <Text variant="bodySm" tone="subdued">Add a reward to see more here.</Text>
          </BlockStack>
        </Box>
      )}

      {!showForm && rewards.length < 10 && (
        <Box paddingBlockEnd="200">
          <InlineStack align="center">
            <Button onClick={() => setShowForm(true)}>Add rewards</Button>
          </InlineStack>
        </Box>
      )}

      {showForm && (
        <Box paddingBlockEnd="400">
          <LegacyCard sectioned >
            <BlockStack gap="300">
              <TextField label="Title" value={form.title} onChange={(v) => updateForm("title", v)} placeholder="e.g. Free shipping on orders over $50" requiredIndicator autoComplete="off" error={formErrors.title} />
              <TextField label="Discount Code" value={form.discountCode} onChange={(v) => updateForm("discountCode", v)} placeholder="e.g. FREESHIP50" requiredIndicator autoComplete="off" error={formErrors.discountCode} />
              <TextField label="Description" value={form.description} onChange={(v) => updateForm("description", v)} placeholder="e.g. Get free shipping when you spend $50 or more" requiredIndicator autoComplete="off" error={formErrors.description} />

              <BlockStack>
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodyMd" fontWeight="medium">Triggers</Text>
                  <Text variant="bodyMd" tone="critical">*</Text>
                  <Text variant="bodySm" tone="subdued">({form.triggers.length} of 2)</Text>
                </InlineStack>

                <Box
                  background="bg-surface"
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                >
                  {form.triggers.map((t, i) => (
                    <Box key={i}>
                      {i > 0 && <Divider />}
                      <TriggerSlot
                        trigger={t}
                        onRemove={() => removeTrigger(i)}
                        currency={currencyCode}
                        onEdit={
                          ["specific_products", "specific_collections", "cart_total", "cart_quantity"].includes(t.type)
                            ? () => openEditTrigger(i)
                            : null
                        }
                      />
                    </Box>
                  ))}

                  {Array.from({ length: 2 - form.triggers.length }).map((_, i) => (
                    <Box key={i}>
                      {(form.triggers.length + i) > 0 && <Divider />}
                      <Box paddingBlock="500" paddingInline="400">
                        <InlineStack align="center" blockAlign="center">
                          <Button
                            icon={PlusIcon}
                            onClick={() => openTriggerList(form.triggers.length + i)}
                          >
                            Add trigger
                          </Button>
                        </InlineStack>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {formErrors.triggers && (
                  <Text tone="critical" variant="bodySm">{formErrors.triggers}</Text>
                )}
              </BlockStack>

              <BlockStack gap="200">
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodyMd" fontWeight="medium">Reward</Text>
                  <Text variant="bodyMd" tone="critical">*</Text>
                </InlineStack>

                <Box
                  background="bg-surface"
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                >
                  {form.reward ? (
                    <RewardSlot
                      reward={form.reward}
                      currency={currencyCode}
                      onRemove={() => updateForm("reward", null)}
                    />
                  ) : (
                    <Box paddingBlock="500" paddingInline="400">
                      <InlineStack align="center" blockAlign="center">
                        <Button
                          icon={PlusIcon}
                          onClick={() => setRewardListOpen(true)}
                        >
                          Add reward
                        </Button>
                      </InlineStack>
                    </Box>
                  )}
                </Box>

                {formErrors.reward && (
                  <Text tone="critical" variant="bodySm">{formErrors.reward}</Text>
                )}
              </BlockStack>

              <InlineStack align="end" blockAlign="center">
                <ButtonGroup>
                  <Badge tone={isPublished && form.enabled ? "success" : "critical"}>
                    {isPublished && form.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Toggle value={form.enabled} onChange={(v) => updateForm("enabled", v)} disabled={!isPublished} />
                  <Button tone="critical" onClick={handleCancel}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={
                      !form.title.trim() ||
                      !form.discountCode.trim() ||
                      !form.description.trim() ||
                      form.triggers.length === 0 ||
                      !form.reward
                    }
                  >
                    Save
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </BlockStack>
          </LegacyCard>
        </Box>
      )}

      {rewards.map((reward, index) => {
        const isExpanded = !!expandedCards[reward.id];
        const hasConditions = (reward.triggers || []).filter(Boolean).some((t) =>
          t.type === "specific_products" || t.type === "specific_collections"
        );

        return (
          <Box key={reward.id} paddingBlockStart={index === 0 ? "0" : "400"}>
            <Box
              background="bg-surface"
              borderWidth="025"
              borderColor="border"
              borderRadius="200"
              padding="400"
            >
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="bodyMd" fontWeight="semibold">{reward.title}</Text>
                    {reward.discountCode && (
                      <Badge tone="info" icon={DiscountIcon}>
                        {reward.discountCode}
                      </Badge>
                    )}

                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={isPublished && reward.enabled ? "success" : "critical"}>
                      {isPublished && reward.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Toggle value={reward.enabled} onChange={() => toggleReward(reward.id)} disabled={!isPublished} />
                    <Button
                      tone="critical"
                      icon={DeleteIcon}
                      onClick={() => deleteReward(reward.id)}
                      accessibilityLabel="Delete"
                    />
                  </InlineStack>

                </InlineStack>

                {reward.description && (
                  <Text variant="bodySm" tone="subdued">{reward.description}</Text>
                )}

                <InlineStack gap="200" blockAlign="center" wrap>
                  <Text variant="bodySm" fontWeight="medium">Trigger type</Text>
                  {(reward.triggers || []).filter(Boolean).map((t, i) => (
                    <Badge key={i}>{triggerBadgeLabel(t, currencyCode)}</Badge>
                  ))}
                  {hasConditions && (
                    <button
                      onClick={() => toggleCardExpand(reward.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" }}
                    >
                      <Icon source={isExpanded ? ChevronUpIcon : ChevronDownIcon} />
                    </button>
                  )}
                  <Text variant="bodySm" fontWeight="medium">Reward</Text>
                  {reward.reward && <Badge>{rewardBadgeLabel(reward.reward, currencyCode)}</Badge>}
                </InlineStack>

                {isExpanded && hasConditions && (
                  <Box paddingBlockStart="300">
                    <BlockStack gap="200">
                      <Text variant="bodySm" fontWeight="semibold">Trigger conditions</Text>
                      {reward.triggers.map((t, i) => {
                        if (t.type !== "specific_products" && t.type !== "specific_collections") return null;
                        const titles = t.items?.titles || [];
                        const images = t.items?.images || [];
                        const minItems = t.minItems || 1;
                        const label = t.type === "specific_products" ? "Products" : "Collections";
                        return (
                          <BlockStack key={i} gap="150">
                            <InlineStack gap="200" blockAlign="center">
                              <Badge tone="info" icon={DiscountIcon}>
                                {label}
                              </Badge>
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
                        );
                      })}
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Box>
          </Box>
        );
      })}

      {rewards.length !== 0 && (
        <Box paddingBlockStart="400">
          <LegacyCard sectioned>
            <BlockStack gap="300">
              <Text variant="headingMd">Discount combinations</Text>
              <Text variant="bodySm" tone="subdued">Allow stacking triggered rewards with...</Text>
              <Checkbox label="Product discounts" helpText="Applies alongside other product-level discounts for different items; only the best discount applies if targeting the same product." checked={discountCombinations.productDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, productDiscounts: v })} />
              <Checkbox label="Order discounts" helpText="Applies with order-level discounts; product discounts are applied first, then order-level discounts on the subtotal." checked={discountCombinations.orderDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, orderDiscounts: v })} />
              <Checkbox label="Shipping discounts" helpText="Applies together with free shipping or shipping-level discounts to get the largest eligible shipping discount." checked={discountCombinations.shippingDiscounts} onChange={(v) => update("discountCombinations", { ...discountCombinations, shippingDiscounts: v })} />
            </BlockStack>
          </LegacyCard>
        </Box>)}

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
        footer={
          <InlineStack align="space-between" blockAlign="center">
            <Pagination
              hasPrevious={pagination.hasPrevious}
              onPrevious={pagination.handlePrev}
              hasNext={pagination.hasNext}
              onNext={pagination.handleNext}
            />
          </InlineStack>
        }
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField label="Minimum number of matching items" type="number" value={pendingMinItems} onChange={setPendingMinItems} autoComplete="off" />
            <ProductItemCollections currency={currency} onSelect={setPendingItems} initialSelected={{ type: "products", items: pendingItems.items }} showCollections={false} onPaginationChange={(p) => setPagination(p)} />
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
            <ProductItemCollections currency={currency} onSelect={setPendingItems} multiSelectCollections={true} initialSelected={{ type: "collections", items: pendingItems.items }} showProducts={false} onPaginationChange={(p) => setPagination(p)} />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal open={cartTotalOpen} onClose={() => setCartTotalOpen(false)} title="Cart total"
        primaryAction={{ content: "Confirm", onAction: confirmCartTotal }}
        secondaryActions={[{ content: "Back", onAction: () => { setCartTotalOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <TextField
            label="Cart total minimum amount"
            type="number"
            min="0"
            value={pendingCartTotal}
            onChange={(val) => {
              if (val === "") {
                setPendingCartTotal("");
                return;
              }
              const num = Math.max(0, Number(val));
              setPendingCartTotal(String(num));
            }}
            autoComplete="off"
          />
        </Modal.Section>
      </Modal>

      <Modal open={cartQuantityOpen} onClose={() => setCartQuantityOpen(false)} title="Cart quantity"
        primaryAction={{ content: "Confirm", onAction: confirmCartQty }}
        secondaryActions={[{ content: "Back", onAction: () => { setCartQuantityOpen(false); setTriggerListOpen(true); } }]}
      >
        <Modal.Section>
          <TextField
            label="Item count minimum amount"
            type="number"
            min="0"
            value={pendingCartQty}
            onChange={(val) => {
              if (val === "") {
                setPendingCartQty("");
                return;
              }
              const num = Math.max(0, Number(val));
              setPendingCartQty(String(num));
            }}
            autoComplete="off"
          />
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
        footer={
          <InlineStack align="space-between" blockAlign="center">
            <Pagination
              hasPrevious={pagination.hasPrevious}
              onPrevious={pagination.handlePrev}
              hasNext={pagination.hasNext}
              onNext={pagination.handleNext}
            />
          </InlineStack>
        }
      >
        <Modal.Section>
          <ProductItemCollections currency={currency} onSelect={setPendingGiftItems} initialSelected={{ type: "products", items: pendingGiftItems.items }} showCollections={false} maxSelect={1} onPaginationChange={(p) => setPagination(p)} />
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
                <Button
                  pressed={pendingDiscountType === "percentage"}
                  onClick={() => { setPendingDiscountType("percentage"); setPendingDiscountError(""); }}
                >
                  Percentage (%)
                </Button>
                <Button
                  pressed={pendingDiscountType === "fixed"}
                  onClick={() => { setPendingDiscountType("fixed"); setPendingDiscountError(""); }}
                >
                  Fixed amount ({getCurrencySymbol(currencyCode)})
                </Button>
              </ButtonGroup>
              <TextField
                label={pendingDiscountType === "percentage" ? "Discount percentage" : "Discount amount"}
                type="number"
                min="0"
                max={pendingDiscountType === "percentage" ? 100 : undefined}
                value={pendingDiscountValue}
                onChange={(v) => {
                  setPendingDiscountError("");

                  if (v === "") {
                    setPendingDiscountValue("");
                    return;
                  }

                  let num = Number(v);
                  if (isNaN(num)) return;

                  num = Math.max(0, num);

                  if (pendingDiscountType === "percentage") {
                    num = Math.min(100, num);
                  }

                  setPendingDiscountValue(String(num));
                }}
                suffix={pendingDiscountType === "percentage" ? "%" : undefined}
                prefix={pendingDiscountType === "fixed" ? getCurrencySymbol(currencyCode) : undefined}
                autoComplete="off"
                error={pendingDiscountError}
              />
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

    </>
  );
}