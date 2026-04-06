import { Card, Text, ActionList, Icon, BlockStack } from "@shopify/polaris";
import {
  ViewIcon,
  HideIcon,
  CartIcon,
  NotificationIcon,
  GiftCardIcon,
  CashDollarIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import MenuSection from "./MenuSection";

export default function Sidebar({ activeTab, setActiveTab, announcementSettings, rewardsSettings, recommendationsSettings,
  subscriptionUpgradesSettings
}) {

  const [visibility, setVisibility] = useState({});

  const toggle = (key) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const createClickableItem = (label, icon) => ({
    content: label,
    prefix: <Icon source={icon} />,
    active: activeTab === label,
    onAction: () => setActiveTab(label),
  });

  const createItem = (label, icon, hasToggle = true) => {
    const isEnabled =
      (label !== "Announcements" || announcementSettings.enabled) &&
      (label !== "Tiered rewards" || rewardsSettings.enabled) &&
      (label !== "Recommendations" || recommendationsSettings?.enabled) &&
      (label !== "Subscription upgrades" || subscriptionUpgradesSettings.enabled)

    return {
      content: label,
      prefix: <Icon source={icon} />,
      active: activeTab === label,
      onAction: () => setActiveTab(label),
      suffix: hasToggle && isEnabled ? (
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
    };
  };

  return (
    <div className="sidebar">

      {/* GENERAL */}
      <Card>
        <BlockStack gap="200">
          <Text variant="headingSm">General</Text>

          <ActionList
            items={[
              createClickableItem("Design", SettingsIcon),
              createClickableItem("Header", SettingsIcon),
            ]}
          />
        </BlockStack>
      </Card>

      {/* BODY */}
      <MenuSection
        title="Body"
        items={[
          createItem("Announcements", NotificationIcon),
          createItem("Tiered rewards", GiftCardIcon),
          createItem("Triggered rewards", GiftCardIcon),
          createItem("Recommendations", CartIcon),
          createItem("Cart items", CartIcon, false),
          createItem("Subscription upgrades", CartIcon),
          createItem("Upsells", CartIcon),
          createItem("Additional notes", CartIcon),
        ]}
      />

      {/* FOOTER */}
      <MenuSection
        title="Footer"
        items={[
          createItem("Add-ons", CartIcon),
          createItem("Discount codes", CashDollarIcon),
          createItem("Cart summary", CartIcon, false),
          createItem("Express payments", CartIcon),
          createItem("Trust badges", CartIcon),
        ]}
      />

      {/* SETTINGS */}
      <Card>
        <ActionList
          items={[
            createClickableItem("Settings", SettingsIcon),
          ]}
        />
      </Card>
    </div>
  );
}