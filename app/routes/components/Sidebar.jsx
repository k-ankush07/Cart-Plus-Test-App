import { LegacyCard, ActionList, Icon } from "@shopify/polaris";
import {
  HideIcon,
  PaintBrushFlatIcon,      // Design
  LayoutHeaderIcon,                 // Header
  MegaphoneIcon,            // Announcements
  GiftCardIcon,             // Tiered rewards
  AutomationIcon,           // Triggered rewards
  StarIcon,                 // Recommendations
  CartIcon,                 // Cart items
  RefreshIcon,              // Subscription upgrades
  PlusCircleIcon,           // Upsells
  NoteIcon,                 // Additional notes
  AppsIcon,          // Add-ons
  DiscountIcon,             // Discount codes
  ReceiptIcon,              // Cart summary
  CreditCardIcon,           // Express payments
  ShieldCheckMarkIcon,      // Trust badges
  SettingsIcon,             // Settings
} from "@shopify/polaris-icons";

import { useState } from "react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  announcementSettings,
  rewardsSettings,
  recommendationsSettings,
  subscriptionUpgradesSettings,
  upsellsSettings,
  additionalNotesSettings,
  addonsSettings,
  discountCodesSettings,
  expressPaymentsSettings,
  trustBadgesSettings,
}) {
  const [visibility, setVisibility] = useState({});

  const toggle = (key) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemEnabled = (label) => {
    const map = {
      Announcements: announcementSettings?.enabled,
      "Tiered rewards": rewardsSettings?.enabled,
      Recommendations: recommendationsSettings?.enabled,
      "Subscription upgrades": subscriptionUpgradesSettings?.enabled,
      Upsells: upsellsSettings?.enabled,
      "Additional notes": additionalNotesSettings?.enabled,
      "Add-ons": addonsSettings?.enabled,
      "Discount codes": discountCodesSettings?.enabled,
      "Express payments": expressPaymentsSettings?.enabled,
      "Trust badges": trustBadgesSettings?.enabled,
    };
    return map[label] !== undefined ? map[label] : true;
  };

  const clickable = (label, icon) => ({
    content: label,
    prefix: <Icon source={icon} />,
    active: activeTab === label,
    onAction: () => setActiveTab(label),
  });

  const item = (label, icon, hasToggle = true) => ({
    content: label,
    prefix: <Icon source={icon} />,
    active: activeTab === label,
    onAction: () => setActiveTab(label),
    suffix: hasToggle && isItemEnabled(label) ? (
      <span
        onClick={(e) => {
          e.stopPropagation();
          toggle(label);
        }}
        style={{ cursor: "pointer" }}
      >
        <Icon source={HideIcon} />
      </span>
    ) : null,
  });

  return (
    <div className="sidebar">
      <LegacyCard>
        <ActionList
          sections={[
            {
              title: "General",
              items: [
                clickable("Design", PaintBrushFlatIcon),
                clickable("Header", LayoutHeaderIcon),
              ],
            },
            {
              title: "Body",
              items: [
                item("Announcements", MegaphoneIcon),
                item("Tiered rewards", GiftCardIcon),
                item("Triggered rewards", AutomationIcon, false),
                item("Recommendations", StarIcon),
                item("Cart items", CartIcon, false),
                item("Subscription upgrades", RefreshIcon),
                item("Upsells", PlusCircleIcon),
                item("Additional notes", NoteIcon),
              ],
            },
            {
              title: "Footer",
              items: [
                item("Add-ons", AppsIcon),
                item("Discount codes", DiscountIcon),
                item("Cart summary", ReceiptIcon, false),
                item("Express payments", CreditCardIcon),
                item("Trust badges", ShieldCheckMarkIcon),
              ],
            },
            {
              items: [clickable("Settings", SettingsIcon)],
            },
          ]}
        />
      </LegacyCard>
    </div>
  );
}