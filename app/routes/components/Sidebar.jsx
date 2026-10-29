import { memo, useState, useEffect, Fragment } from "react";
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
import PreviewProductPicker from "./ui/PreviewProductPicker";

/*
  root: true      -> fixed item, drag nahi hota (section ke top par rehta hai)
  drag: true      -> section ke andar reorder ho sakta hai
  attachTo: "key" -> us item ke saath attached, parent ke saath hi move hota hai
*/
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
      {
        key: "Subscription Upgrade",
        icon: RefreshIcon,
        toggle: true,
        attachTo: "Products in cart",
      },
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

// pseudo section for custom rows that are not inside Header / Body / Footer
const UNPLACED = "unplaced";

const ADVANCED = [
  { key: "Settings", icon: SettingsIcon, root: true },
  { key: "Cart Visibility", icon: GlobeIcon, root: true },
];

/* ---------- derived lookups (module level, ek baar) ---------- */
const ITEM_MAP = {};
const CHILDREN = {}; // parentKey -> [attached items]
SECTIONS.forEach((s) =>
  s.items.forEach((i) => {
    ITEM_MAP[i.key] = i;
    if (i.attachTo) (CHILDREN[i.attachTo] ||= []).push(i);
  }),
);

// Reorder hone wale heads (root aur attached items nahi)
const DEFAULT_ORDER = Object.fromEntries(
  SECTIONS.map((s) => [
    s.title,
    s.items.filter((i) => !i.root && !i.attachTo).map((i) => i.key),
  ]),
);

// sidebar rows shown while the "Empty" cart tab is selected
const EMPTY_ITEMS = [
  { key: "Empty Settings", label: "Settings", icon: SettingsIcon, root: true },
  { key: "Empty Cross-sell", label: "Cross-sell", icon: PlusCircleIcon, toggle: true, drag: true },
  { key: "Empty Login", label: "Login", icon: PersonIcon, toggle: true, drag: true },
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

/* Reusable card wrapper */
const Card = ({ children }) => (
  <Box
    background="bg-surface"
    borderRadius="300"
    borderWidth="025"
    borderColor="border"
    padding="300"
    overflowX="hidden"
  >
    {children}
  </Box>
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

  // section ke andar reorder
  initialOrder, // optional: { Header: [...], Body: [...], Footer: [...] }
  onReorder, // (sectionTitle, newKeys, fullOrder) => void

  // custom html / css rows
  customItems: customItemsProp, // optional: [{ key, label }]
  onAddCustomItem,

  // previewing items (products picked from the store) & market
  selectedPreviewProducts = [],
  onPreviewProductsChange,
  onPreviewLoading,
  markets = DEFAULT_MARKETS, // [{ label, value }]
  market,
  onMarketChange,
}) {
  /* ---------- previewing market ---------- */
  const [localMarket, setLocalMarket] = useState(markets[0]?.value ?? "");

  const marketValue = market ?? localMarket;

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

  // keep the selected row valid when switching between the two cart views
  useEffect(() => {
    const onEmptyRow = String(activeTab).startsWith("Empty ");
    if (previewMode === "empty" && !onEmptyRow) setActiveTab?.("Empty Settings");
    if (previewMode !== "empty" && onEmptyRow) setActiveTab?.("Template");
  }, [previewMode]);

  /* ---------- toggles ---------- */
  const [enabled, setEnabled] = useState({
    ...DEFAULT_ENABLED,
    ...(enabledMap || {}),
  });
  useEffect(() => {
    if (enabledMap) setEnabled((p) => ({ ...p, ...enabledMap }));
  }, [JSON.stringify(enabledMap)]);

  const toggle = (key) => {
    // enabling an item also opens its settings page
    if (!enabled[key]) setActiveTab?.(key);
    setEnabled((p) => ({ ...p, [key]: !p[key] }));
    onToggleItem?.(key);
  };

  /* ---------- drag & drop (sirf apne section ke andar) ---------- */
  const [order, setOrder] = useState({ ...DEFAULT_ORDER, ...(initialOrder || {}) });
  const [drag, setDrag] = useState(null); // { section, key }
  const [overKey, setOverKey] = useState(null);

  // follows the saved order, so Discard / loading another cart resets it too
  useEffect(() => {
    setOrder({ ...DEFAULT_ORDER, ...(initialOrder || {}) });
  }, [JSON.stringify(initialOrder)]);

  const resetDrag = () => {
    setDrag(null);
    setOverKey(null);
  };

  const [localCustomItems, setLocalCustomItems] = useState([]);
  const customItems = customItemsProp ?? localCustomItems;

  // Custom HTML / CSS rows can be dragged into any section (or back to "end of cart")
  const customRows = customItems.map((c) => ({
    key: c.key,
    label: c.label,
    icon: CodeIcon,
    toggle: true,
    drag: true,
  }));
  const customMap = Object.fromEntries(customRows.map((r) => [r.key, r]));
  const placedKeys = new Set(Object.values(order).flat());
  const unplacedRows = customRows.filter((r) => !placedKeys.has(r.key));

  const canDropOn = (section) =>
    !!drag && !!section && (drag.section === section || drag.custom);

  const moveCustom = (key, to, targetKey) => {
    const stripped = Object.fromEntries(
      Object.entries(order).map(([s, list]) => [s, list.filter((k) => k !== key)]),
    );
    let fullOrder = stripped;
    if (to !== UNPLACED) {
      const list = [...(stripped[to] || [])];
      const at = targetKey ? list.indexOf(targetKey) : -1;
      if (at === -1) list.push(key);
      else list.splice(at, 0, key); // lands just above the row it is dropped on
      fullOrder = { ...stripped, [to]: list };
    }
    setOrder(fullOrder);
    onReorder?.(to, fullOrder[to] || [], fullOrder);
  };

  // targetKey: the row dropped on (null = end of the section)
  const dropOn = (section, targetKey) => {
    if (!canDropOn(section)) return;
    if (drag.section === section) {
      if (section !== UNPLACED && targetKey) moveItem(section, drag.key, targetKey);
    } else {
      moveCustom(drag.key, section, targetKey);
    }
    resetDrag();
  };

  const moveItem = (section, fromKey, toKey) => {
    if (fromKey === toKey) return;
    const list = order[section];
    const from = list.indexOf(fromKey);
    const to = list.indexOf(toKey);
    if (from === -1 || to === -1) return;

    const next = list.filter((k) => k !== fromKey);
    let at = next.indexOf(toKey);
    if (from < to) at += 1; // neeche drag -> target ke baad, upar drag -> target ke pehle
    next.splice(at, 0, fromKey);

    const fullOrder = { ...order, [section]: next };
    setOrder(fullOrder);
    onReorder?.(section, next, fullOrder);
  };

  /* ---------- custom html / css items ---------- */
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
  // section: kis section ka row hai (null = drag zone ke bahar)
  const renderRow = (item, section = null) => {
    const active = activeTab === item.key;
    const text = item.label ?? item.key;
    const headKey = item.attachTo ?? item.key; // attached row ka drop target = uska parent
    const canDrag = !!item.drag && !!section;

    const isDragging = drag && drag.section === section && drag.key === headKey;
    const isOver =
      canDropOn(section) && overKey === headKey && drag.key !== headKey;

    return (
      <div
        key={item.key}
        className="sb-row"
        role="button"
        tabIndex={0}
        draggable={canDrag}
        style={{
          opacity: isDragging ? 0.4 : 1,
          outline: isOver ? "2px dashed var(--p-color-border-focus)" : "none",
          outlineOffset: -2,
          borderRadius: 8,
        }}
        onClick={() => setActiveTab?.(item.key)}
        onKeyDown={(e) => e.key === "Enter" && setActiveTab?.(item.key)}
        onDragStart={(e) => {
          if (!canDrag) return;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item.key);
          setDrag({ section, key: item.key, custom: !!customMap[item.key] });
        }}
        onDragOver={(e) => {
          // doosre section par drop sirf custom html / css rows ka allow hai
          if (!canDropOn(section)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          if (overKey !== headKey) setOverKey(headKey);
        }}
        onDrop={(e) => {
          if (!canDropOn(section)) return;
          e.preventDefault();
          e.stopPropagation();
          dropOn(section, headKey);
        }}
        onDragEnd={resetDrag}
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
                {item.drag && (
                  <span style={{ cursor: "grab", display: "inline-flex" }}>
                    <Icon source={DragHandleIcon} tone="subdued" />
                  </span>
                )}
              </span>
            )}
            <span className="sb-slot main">
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

  /* ---------- section renderer ---------- */
  const renderSection = (section) => {
    const roots = section.items.filter((i) => i.root);
    const heads = (order[section.title] || [])
      .map((k) => ITEM_MAP[k] || customMap[k])
      .filter(Boolean);

    // dropping on the section area (title / gap) puts a custom row at the end of it
    return (
      <BlockStack key={section.title} gap="100">
        <div
          onDragOver={(e) => {
            if (!canDropOn(section.title) || drag.section === section.title) return;
            e.preventDefault();
          }}
          onDrop={(e) => {
            if (!canDropOn(section.title) || drag.section === section.title) return;
            e.preventDefault();
            dropOn(section.title, null);
          }}
        >
          <SectionTitle>{section.title}</SectionTitle>
        </div>
        <BlockStack gap="050">
          {roots.map((i) => renderRow(i, section.title))}
          {heads.map((h) => (
            <Fragment key={h.key}>
              {renderRow(h, section.title)}
              {/* attached items parent ke saath hi move honge */}
              {(CHILDREN[h.key] || []).map((c) => renderRow(c, section.title))}
            </Fragment>
          ))}
        </BlockStack>
      </BlockStack>
    );
  };

  return (
    // fixed width so the sidebar keeps its size in both "Item in cart" and "Empty" views
    <div style={{ width: 300, minWidth: 300, flexShrink: 0 }}>
    <BlockStack gap="300">
      {/* ── Card 1: Previewing items & market ── */}
      <Card>
        <BlockStack gap="300">
          <PreviewProductPicker
            selected={selectedPreviewProducts}
            onChange={(list) => onPreviewProductsChange?.(list)}
            onInitialLoading={onPreviewLoading}
          />
          <Select
            label="Previewing market"
            options={markets}
            value={marketValue}
            onChange={changeMarket}
          />
        </BlockStack>
      </Card>

      {/* ── Card 2: Item in cart / Empty + sections ── */}
      <Card>
        <BlockStack gap="300">
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

          {previewMode === "empty" ? (
            <BlockStack gap="050">{EMPTY_ITEMS.map((i) => renderRow(i))}</BlockStack>
          ) : (
            <>
          {/* Template */}
          <BlockStack gap="050">
            {renderRow({ key: "Template", icon: AppsIcon, root: true })}
          </BlockStack>

          {/* Header / Body / Footer (har section apna drag zone) */}
          {SECTIONS.map(renderSection)}

          {/* Custom HTML / CSS rows */}
          {/* rows not dragged into a section: shown at the end of the cart */}
          {(unplacedRows.length > 0 || drag?.custom) && (
            <div
              onDragOver={(e) => {
                if (!canDropOn(UNPLACED)) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!canDropOn(UNPLACED)) return;
                e.preventDefault();
                dropOn(UNPLACED, null);
              }}
              style={{ minHeight: 8 }}
            >
              <BlockStack gap="050">
                {unplacedRows.map((r) => renderRow(r, UNPLACED))}
              </BlockStack>
            </div>
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
            <BlockStack gap="050">
              {ADVANCED.map((i) => renderRow(i))}
            </BlockStack>
          </BlockStack>
            </>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
    </div>
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
