import { Card, Text } from "@shopify/polaris";
import HeaderSettings from "./ui-cart-options/HeaderSettings";
import AnnouncementsSettings from "./ui-cart-options/AnnouncementsSettings";
import DesignSettings from "./ui-cart-options/DesignSettings";
import TieredRewards from "./ui-cart-options/TieredRewardSetting";
import TriggeredReward from "./ui-cart-options/TriggeredReward";
import Recommendations from "./ui-cart-options/Recommendations";
import SubscriptionUpgrades from "./ui-cart-options/SubscriptionUpgrades";
import UpsellsSettings from "./ui-cart-options/UpsellsSettings";
import AdditionalNotes from "./ui-cart-options/AdditionalNotes";
import AddonsSettings from "./ui-cart-options/Add-onsSettings";
import DiscountCodes from "./ui-cart-options/DiscountCodes";
import Expresspayments from "./ui-cart-options/Express-payments";
import Trustbadges from "./ui-cart-options/Trustbadges";
import CartSettings from "./ui-cart-options/CartSettings";
import CartItem from "./ui-cart-options/CartItems";
import CartSummary from "./ui-cart-options/CartSummary";
import "../../index.css";

export default function MainContent({ activeTab, designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
    announcementSettings, rewardsSettings, currency, recommendationsSettings, subscriptionUpgradesSettings, upsellsSettings,
    additionalNotesSettings, addonsSettings, discountCodesSettings, expressPaymentsSettings, trustBadgesSettings, cartSettings,
    triggeredRewardsSettings
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
        "Triggered rewards": (
            <TriggeredReward
                triggeredRewardsSettings={triggeredRewardsSettings}
                handleChange={handleChange}
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
        "Add-ons": (
            <AddonsSettings
                addonsSettings={addonsSettings}
                handleChange={handleChange}
                currency={currency}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Discount codes": (
            <DiscountCodes
                discountCodesSettings={discountCodesSettings}
                handleChange={handleChange}
            />
        ),
        "Express payments": (
            <Expresspayments
                expressPaymentsSettings={expressPaymentsSettings}
                handleChange={handleChange}
            />
        ),
        "Trust badges": (
            <Trustbadges
                trustBadgesSettings={trustBadgesSettings}
                handleChange={handleChange}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Settings": (
            <CartSettings
                cartSettings={cartSettings}
                handleChange={handleChange}
            />
        ),
        "Cart items": (
            <CartItem
                handleChange={handleChange}
                cartSettings={cartSettings}
            />
        ),
        "Cart summary": (
            <CartSummary />
        )
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