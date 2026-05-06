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
      Notices: announcementSettings?.enabled,
      "Tiered Offers": rewardsSettings?.enabled,
      "Suggested Products": recommendationsSettings?.enabled,
      "Subscription Options": subscriptionUpgradesSettings?.enabled,
      "Upgrade Offers": upsellsSettings?.enabled,
      "Order Notes": additionalNotesSettings?.enabled,
      "Extras": addonsSettings?.enabled,
      "Promo Codess": discountCodesSettings?.enabled,
      "Quick Checkout": expressPaymentsSettings?.enabled,
      "Security Badges": trustBadgesSettings?.enabled,
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
                clickable("Appearance", PaintBrushFlatIcon),
                clickable("Top Section", LayoutHeaderIcon),
              ],
            },
            {
              title: "Body",
              items: [
                item("Notices", MegaphoneIcon),
                item("Tiered Offers", GiftCardIcon),
                item("Smart Offers", AutomationIcon, false),
                item("Suggested Products", StarIcon),
                item("Items in Cart", CartIcon, false),
                item("Subscription Options", RefreshIcon),
                item("Upgrade Offers", PlusCircleIcon),
                item("Order Notes", NoteIcon),
              ],
            },
            {
              title: "Footer",
              items: [
                item("Extras", AppsIcon),
                item("Promo Codes", DiscountIcon),
                item("Order Summary", ReceiptIcon, false),
                item("Quick Checkout", CreditCardIcon),
                item("Security Badges", ShieldCheckMarkIcon),
              ],
            },
            {
              items: [clickable("Preferences", SettingsIcon)],
            },
          ]}
        />
      </LegacyCard>
    </div>
  );
}