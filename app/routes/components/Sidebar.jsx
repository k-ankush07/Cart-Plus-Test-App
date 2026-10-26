import { memo, useState, useEffect } from "react";
import {
  Box,
  BlockStack,
  InlineStack,
  Text,
  Icon,
  Divider,
  ButtonGroup,
  Button,
  Select,
} from "@shopify/polaris";
import {
  DragHandleIcon,
  AppsIcon,
  LayoutHeaderIcon,
  ImageIcon,
  MegaphoneIcon,
  ClockIcon,
  ProductIcon,
  CartIcon,
  RefreshIcon,
  PlusCircleIcon,
  EditIcon,
  ReceiptIcon,
  DiscountIcon,
  PersonIcon,
  PaymentIcon,
  SettingsIcon,
  GlobeIcon,
  ShieldCheckMarkIcon,
  CodeIcon,
} from "@shopify/polaris-icons";
// import "./Sidebar.css"; // agar CSS alag file mein hai to uncomment karo

const SECTIONS = [
  {
    title: "Header",
    items: [
      { key: "Header", icon: LayoutHeaderIcon, root: true },
      { key: "Banner Image", icon: ImageIcon, toggle: true, drag: true },
      { key: "Announcement", icon: MegaphoneIcon, toggle: true, drag: true },
      { key: "Timer", icon: ClockIcon, toggle: true, drag: true },
      { key: "Progress Bar", icon: ProductIcon, toggle: true, drag: true },
    ],
  },
  {
    title: "Body",
    items: [
      { key: "One Tick Upsell", icon: CartIcon, toggle: true, drag: true },
      { key: "Products in cart", icon: ProductIcon, drag: true },
      { key: "Subscription Upgrade", icon: RefreshIcon, toggle: true },
      { key: "Cross-sell", icon: PlusCircleIcon, toggle: true, drag: true },
    ],
  },
  {
    title: "Footer",
    items: [
      { key: "Order notes", icon: EditIcon, toggle: true, drag: true },
      {
        key: "Shipping Protection & Add-ons",
        icon: ShieldCheckMarkIcon,
        toggle: true,
        drag: true,
      },
      { key: "Summary", icon: ReceiptIcon, toggle: true, drag: true },
      { key: "Discount code", icon: DiscountIcon, toggle: true, drag: true },
      { key: "Age Verification", icon: PersonIcon, toggle: true, drag: true },
      { key: "Login", icon: PersonIcon, toggle: true, drag: true },
      { key: "Checkout Button", icon: CartIcon, drag: true },
      { key: "Payment Badges", icon: PaymentIcon, toggle: true, drag: true },
    ],
  },
];

const ADVANCED = [
  { key: "Settings", icon: SettingsIcon, root: true },
  { key: "Cart Visibility", icon: GlobeIcon, root: true },
];

const DEFAULT_ENABLED = { Announcement: true, Timer: true, "Cross-sell": true };

const DEFAULT_MARKETS = [{ label: "Default (India)", value: "default" }];

/* Polaris React has no Switch, so this is the only custom piece */
const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className={`sb-switch ${checked ? "is-on" : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
  >
    <span className="sb-switch-knob" />
  </button>
);

const SectionTitle = ({ children }) => (
  <InlineStack gap="200" blockAlign="center" wrap={false}>
    <div className="sb-line">
      <Divider />
    </div>
    <Text as="span" variant="bodyXs" tone="subdued" fontWeight="semibold">
      {String(children).toUpperCase()}
    </Text>
    <div className="sb-line">
      <Divider />
    </div>
  </InlineStack>
);

const Sidebar = memo(function Sidebar({
  activeTab,
  setActiveTab,

  // Item in cart / Empty
  previewMode: previewModeProp,
  setPreviewMode: setPreviewModeProp,

  // toggles
  enabledMap,
  onToggleItem,

  // custom html / css rows
  customItems: customItemsProp, // optional: [{ key, label }]
  onAddCustomItem,

  // previewing items & market
  previewProducts = [], // [{ label, value }]
  previewProduct,
  onPreviewProductChange,
  markets = DEFAULT_MARKETS, // [{ label, value }]
  market,
  onMarketChange,
}) {
  /* ---------- previewing product & market ---------- */
  const [localProduct, setLocalProduct] = useState(
    previewProducts[0]?.value ?? "",
  );
  const [localMarket, setLocalMarket] = useState(markets[0]?.value ?? "");

  // products baad mein load hon (loader/API) to first product auto select ho
  useEffect(() => {
    if (!localProduct && previewProducts[0]?.value) {
      setLocalProduct(previewProducts[0].value);
    }
  }, [previewProducts, localProduct]);

  const productValue = previewProduct ?? localProduct;
  const marketValue = market ?? localMarket;

  const changeProduct = (v) => {
    setLocalProduct(v);
    onPreviewProductChange?.(v);
  };
  const changeMarket = (v) => {
    setLocalMarket(v);
    onMarketChange?.(v);
  };

  /* ---------- preview mode ---------- */
  const [previewMode, setPreviewModeLocal] = useState(
    previewModeProp ?? "cart",
  );
  useEffect(() => {
    if (previewModeProp !== undefined) setPreviewModeLocal(previewModeProp);
  }, [previewModeProp]);

  const changePreview = (mode) => {
    setPreviewModeLocal(mode);
    setPreviewModeProp?.(mode);
  };

  /* ---------- toggles ---------- */
  const [enabled, setEnabled] = useState({
    ...DEFAULT_ENABLED,
    ...(enabledMap || {}),
  });
  useEffect(() => {
    if (enabledMap) setEnabled((p) => ({ ...p, ...enabledMap }));
  }, [JSON.stringify(enabledMap)]);

  const toggle = (key) => {
    setEnabled((p) => ({ ...p, [key]: !p[key] }));
    onToggleItem?.(key);
  };

  /* ---------- custom html / css items ---------- */
  const [localCustomItems, setLocalCustomItems] = useState([]);
  const customItems = customItemsProp ?? localCustomItems;

  const addCustomItem = () => {
    const id = `custom-${Date.now()}`;
    if (!customItemsProp) {
      setLocalCustomItems((prev) => [
        ...prev,
        { key: id, label: "Custom HTML / CSS" },
      ]);
    }
    setEnabled((p) => ({ ...p, [id]: true })); // naya row default ON
    setActiveTab?.(id); // add hote hi select
    onAddCustomItem?.(id);
  };

  /* ---------- row renderer ---------- */
  const renderRow = (item) => {
    const active = activeTab === item.key;
    const text = item.label ?? item.key;
    return (
      <div
        key={item.key}
        className="sb-row"
        role="button"
        tabIndex={0}
        onClick={() => setActiveTab?.(item.key)}
        onKeyDown={(e) => e.key === "Enter" && setActiveTab?.(item.key)}
      >
        <Box
          background={active ? "bg-surface-selected" : undefined}
          borderRadius="200"
          paddingBlock="150"
          paddingInline="200"
        >
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            {!item.root && (
              <span className="sb-slot">
                {item.drag && <Icon source={DragHandleIcon} tone="subdued" />}
              </span>
            )}
            <span className="sb-slot">
              <Icon source={item.icon} />
            </span>
            <div className="sb-grow">
              <Text as="span" variant="bodySm" fontWeight="medium">
                {text}
              </Text>
            </div>
            {item.toggle && (
              <Switch
                checked={!!enabled[item.key]}
                onChange={() => toggle(item.key)}
                label={`Toggle ${text}`}
              />
            )}
          </InlineStack>
        </Box>
      </div>
    );
  };

  return (
    <Box
      background="bg-surface"
      borderRadius="300"
      borderWidth="025"
      borderColor="border"
      padding="300"
      overflowX="hidden"
    >
      <BlockStack gap="300">
        {/* Previewing items & market */}
        <BlockStack gap="300">
          <Select
            label="Previewing items"
            options={
              previewProducts.length
                ? previewProducts
                : [{ label: "No products", value: "" }]
            }
            value={productValue}
            onChange={changeProduct}
          />
          <Select
            label="Previewing market"
            options={markets}
            value={marketValue}
            onChange={changeMarket}
          />
        </BlockStack>

        <Divider />

        {/* Item in cart / Empty */}
        <ButtonGroup variant="segmented" fullWidth>
          <Button
            size="slim"
            pressed={previewMode === "cart"}
            onClick={() => changePreview("cart")}
          >
            Item in cart
          </Button>
          <Button
            size="slim"
            pressed={previewMode === "empty"}
            onClick={() => changePreview("empty")}
          >
            Empty
          </Button>
        </ButtonGroup>

        {/* Template */}
        <BlockStack gap="050">
          {renderRow({ key: "Template", icon: AppsIcon, root: true })}
        </BlockStack>

        {/* Header / Body / Footer */}
        {SECTIONS.map((section) => (
          <BlockStack key={section.title} gap="100">
            <SectionTitle>{section.title}</SectionTitle>
            <BlockStack gap="050">{section.items.map(renderRow)}</BlockStack>
          </BlockStack>
        ))}

        {/* Custom HTML / CSS rows */}
        {customItems.length > 0 && (
          <BlockStack gap="050">
            {customItems.map((c) =>
              renderRow({
                key: c.key,
                label: c.label,
                icon: CodeIcon,
                toggle: true,
                drag: true,
              }),
            )}
          </BlockStack>
        )}

        <Divider />

        {/* Add Custom html / css */}
        <div
          className="sb-row"
          role="button"
          tabIndex={0}
          onClick={addCustomItem}
          onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
        >
          <Box borderRadius="200" paddingBlock="150" paddingInline="200">
            <InlineStack gap="200" blockAlign="center" wrap={false}>
              <span className="sb-slot">
                <Icon source={PlusCircleIcon} />
              </span>
              <Text as="span" variant="bodySm" fontWeight="medium">
                Add Custom html / css
              </Text>
            </InlineStack>
          </Box>
        </div>

        {/* Advanced */}
        <BlockStack gap="100">
          <SectionTitle>Advanced</SectionTitle>
          <BlockStack gap="050">{ADVANCED.map(renderRow)}</BlockStack>
        </BlockStack>
      </BlockStack>
    </Box>
  );
});

export default Sidebar;

// import { LegacyCard, ActionList, Icon } from "@shopify/polaris";

// import {
//   HideIcon,
//   PaintBrushFlatIcon,      // Design
//   LayoutHeaderIcon,                 // Header
//   MegaphoneIcon,            // Announcements
//   GiftCardIcon,             // Tiered rewards
//   AutomationIcon,           // Triggered rewards
//   StarIcon,                 // Recommendations
//   CartIcon,                 // Cart items
//   RefreshIcon,              // Subscription upgrades
//   PlusCircleIcon,           // Upsells
//   NoteIcon,                 // Additional notes
//   AppsIcon,          // Add-ons
//   DiscountIcon,             // Discount codes
//   ReceiptIcon,              // Cart summary
//   CreditCardIcon,           // Express payments
//   ShieldCheckMarkIcon,      // Trust badges
//   SettingsIcon,             // Settings
// } from "@shopify/polaris-icons";

// import { memo, useState } from "react";

// const Sidebar = memo(function Sidebar({
//   activeTab,
//   setActiveTab,
//   announcementSettings,
//   rewardsSettings,
//   recommendationsSettings,
//   subscriptionUpgradesSettings,
//   upsellsSettings,
//   additionalNotesSettings,
//   addonsSettings,
//   discountCodesSettings,
//   expressPaymentsSettings,
//   trustBadgesSettings,
// }) {
//   const [visibility, setVisibility] = useState({});

//   const toggle = (key) => {
//     setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const isItemEnabled = (label) => {
//     const map = {
//       Announcements: announcementSettings?.enabled,
//       "Tiered Offers": rewardsSettings?.enabled,
//       "Recommended Products": recommendationsSettings?.enabled,
//       "Upgrade subscription": subscriptionUpgradesSettings?.enabled,
//       "Upsells": upsellsSettings?.enabled,
//       "Add Notes": additionalNotesSettings?.enabled,
//       "Add ons": addonsSettings?.enabled,
//       "Discount code": discountCodesSettings?.enabled,
//       "Quick Checkout": expressPaymentsSettings?.enabled,
//       "Security Badges": trustBadgesSettings?.enabled,
//     };
//     return map[label] !== undefined ? map[label] : true;
//   };

//   const clickable = (label, icon) => ({
//     content: label,
//     prefix: <Icon source={icon} />,
//     active: activeTab === label,
//     onAction: () => setActiveTab(label),
//   });

//   const item = (label, icon, hasToggle = true) => ({
//     content: label,
//     prefix: <Icon source={icon} />,
//     active: activeTab === label,
//     onAction: () => setActiveTab(label),
//     suffix: hasToggle && isItemEnabled(label) ? (
//       <span
//         onClick={(e) => {
//           e.stopPropagation();
//           toggle(label);
//         }}
//         style={{ cursor: "pointer" }}
//       >
//         <Icon source={HideIcon} />
//       </span>
//     ) : null,
//   });

//   return (
//     <div className="sidebar">
//       <LegacyCard>
//         <ActionList
//           sections={[
//             {
//               title: "General",
//               items: [
//                 clickable("Appearance", PaintBrushFlatIcon),
//                 clickable("Header", LayoutHeaderIcon),
//               ],
//             },
//             {
//               title: "Body",
//               items: [
//                 item("Announcements", MegaphoneIcon),
//                 item("Tiered Offers", GiftCardIcon),
//                 item("Triggered Rewards", AutomationIcon, false),
//                 item("Recommended Products", StarIcon),
//                 item("Items in Cart", CartIcon, false),
//                 item("Upgrade subscription", RefreshIcon),
//                 item("Upsells", PlusCircleIcon),
//                 item("Add Notes", NoteIcon),
//               ],
//             },
//             {
//               title: "Footer",
//               items: [
//                 item("Add ons", AppsIcon),
//                 item("Discount code", DiscountIcon),
//                 // item("Order Summary", ReceiptIcon, false),
//                 // item("Quick Checkout", CreditCardIcon),
//                 item("Security Badges", ShieldCheckMarkIcon),
//               ],
//             },
//             {
//               items: [clickable("Preferences", SettingsIcon)],
//             },
//           ]}
//         />
//       </LegacyCard>
//     </div>
//   );
// });

// export default Sidebar;
