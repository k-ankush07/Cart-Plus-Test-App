import { Card, Text } from "@shopify/polaris";
import HeaderSettings from "./ui-cart-options/HeaderSettings";
import AnnouncementsSettings from "./ui-cart-options/AnnouncementsSettings";
import DesignSettings from "./ui-cart-options/DesignSettings";
import TieredRewards from "./ui-cart-options/TieredRewardSetting";
import Recommendations from "./ui-cart-options/Recommendations";
import SubscriptionUpgrades from "./ui-cart-options/SubscriptionUpgrades";
import UpsellsSettings from "./ui-cart-options/UpsellsSettings";
import AdditionalNotes from "./ui-cart-options/AdditionalNotes";

export default function MainContent({ activeTab, designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
    announcementSettings, rewardsSettings, currency, recommendationsSettings, subscriptionUpgradesSettings, upsellsSettings,
    additionalNotesSettings
}) {

    const COMPONENT_MAP = {
        Design: (
            <DesignSettings
                designSettings={designSettings}
                setDesignSettings={(updater) =>
                    handleChange("design", updater)
                }
            />
        ),
        Header: <HeaderSettings
            headerSettings={headerSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
        />,
        Announcements: <AnnouncementsSettings
            announcementSettings={announcementSettings}
            handleChange={handleChange}
        />,
        "Tiered rewards": (
            <TieredRewards
                rewardsSettings={rewardsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        Recommendations: (
            <Recommendations
                recommendationsSettings={recommendationsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "Subscription upgrades": (
            <SubscriptionUpgrades
                subscriptionUpgradesSettings={subscriptionUpgradesSettings}
                handleChange={handleChange}
            />
        ),
        "Upsells": (
            <UpsellsSettings
                upsellsSettings={upsellsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "Additional notes": (
            <AdditionalNotes
                additionalNotesSettings={additionalNotesSettings}
                handleChange={handleChange}
            />
        ),
    };

    return (
        <div className="mainContent">

            {COMPONENT_MAP[activeTab] || (
                <Card>
                    <Text variant="headingMd">{activeTab} Settings</Text>
                </Card>
            )}

        </div>
    );
}