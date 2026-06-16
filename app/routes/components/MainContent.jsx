import { Card, Text } from "@shopify/polaris";
import TopSection from "./ui-cart-options/Header";
import Notices from "./ui-cart-options/Announcements";
import Appearance from "./ui-cart-options/Appearance";
import TieredOffers from "./ui-cart-options/TieredOffers";
import SmartOffers from "./ui-cart-options/SmartOffers";
import Recommended from "./ui-cart-options/RecommendedProduct";
import SubscriptionUpgrades from "./ui-cart-options/SubscriptionUpgrades";
import UpsellsSettings from "./ui-cart-options/UpsellsSettings";
import AddNotes from "./ui-cart-options/AddNotes";
import Extras from "./ui-cart-options/Extras";
import DiscountCode from "./ui-cart-options/DiscountCode";
import QuickCheckout from "./ui-cart-options/QuickCheckout";
import SecurityBadges from "./ui-cart-options/SecurityBadges";
import Preferences from "./ui-cart-options/Preferences";
import CartItem from "./ui-cart-options/CartItems";
import CartSummary from "./ui-cart-options/CartSummary";
import "../../index.css";

export default function MainContent({ activeTab, designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
    announcementSettings, rewardsSettings, currency, recommendationsSettings, subscriptionUpgradesSettings, upsellsSettings,
    additionalNotesSettings, addonsSettings, discountCodesSettings, expressPaymentsSettings, trustBadgesSettings, cartSettings,
    triggeredRewardsSettings
}) {

    const COMPONENT_MAP = {
        Appearance: (
            <Appearance
                designSettings={designSettings}
                setDesignSettings={(updater) =>
                    handleChange("design", updater)
                }
            />
        ),
        "Header": <TopSection
            headerSettings={headerSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
        />,
        Announcements: <Notices
            announcementSettings={announcementSettings}
            handleChange={handleChange}
        />,
        "Tiered Offers": (
            <TieredOffers
                rewardsSettings={rewardsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "Smart Offers": (
            <SmartOffers
                triggeredRewardsSettings={triggeredRewardsSettings}
                handleChange={handleChange}
            />
        ),
        "Recommended Products": (
            <Recommended
                recommendationsSettings={recommendationsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "Upgrade subscription": (
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
        "Add Notes": (
            <AddNotes
                additionalNotesSettings={additionalNotesSettings}
                handleChange={handleChange}
            />
        ),
        "Extras": (
            <Extras
                addonsSettings={addonsSettings}
                handleChange={handleChange}
                currency={currency}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Discount code": (
            <DiscountCode
                discountCodesSettings={discountCodesSettings}
                handleChange={handleChange}
            />
        ),
        "Quick Checkout": (
            <QuickCheckout
                expressPaymentsSettings={expressPaymentsSettings}
                handleChange={handleChange}
            />
        ),
        "Security Badges": (
            <SecurityBadges
                trustBadgesSettings={trustBadgesSettings}
                handleChange={handleChange}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Preferences": (
            <Preferences
                cartSettings={cartSettings}
                handleChange={handleChange}
            />
        ),
        "Items in Cart": (
            <CartItem
                handleChange={handleChange}
                cartSettings={cartSettings}
            />
        ),
        "Order Summary": (
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