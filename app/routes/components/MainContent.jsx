import { Card, Text } from "@shopify/polaris";
import HeaderSettings from "./ui-cart-options/HeaderSettings";
import AnnouncementsSettings from "./ui-cart-options/AnnouncementsSettings";
import DesignSettings from "./ui-cart-options/DesignSettings";
import TieredRewards from "./ui-cart-options/TieredRewardSetting";

export default function MainContent({ activeTab, designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
    announcementSettings, rewardsSettings, products, hasNextPage, nextCursor, currency
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
                products={products}
                hasNextPage={hasNextPage}
                nextCursor={nextCursor}
                currency={currency}
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