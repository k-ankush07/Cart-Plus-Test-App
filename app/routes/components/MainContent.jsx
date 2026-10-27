import { Card, Text } from "@shopify/polaris";
import { memo, useMemo } from "react";
import TopSection from "./ui-cart-options/Header";
import BannerImage from "./ui-cart-options/BannerImage";
import TimerSettings from "./ui-cart-options/Timer";
import Notices from "./ui-cart-options/Announcements";
import TemplateSettings from "./ui-cart-options/TemplateSettings";
import TieredOffers from "./ui-cart-options/TieredOffers";
import OneTickUpsell from "./ui-cart-options/OneTickUpsell";
import SectionBackground from "./ui-cart-options/SectionBackground";
import BackgroundInput from "./ui/BackgroundInput";
import { getCartItemOptions, patchCartItem } from "./utils/cartItemOptions";
import { SECTION_BG_KEYS, sectionBgId } from "./utils/sectionBackground";
import SmartOffers from "./ui-cart-options/SmartOffers";
import Recommended from "./ui-cart-options/RecommendedProduct";
import SubscriptionUpgrades from "./ui-cart-options/SubscriptionUpgrades";
import UpsellsSettings from "./ui-cart-options/UpsellsSettings";
import AddNotes from "./ui-cart-options/AddNotes";
import AddOns from "./ui-cart-options/AddOns";
import DiscountCode from "./ui-cart-options/DiscountCode";
import QuickCheckout from "./ui-cart-options/QuickCheckout";
import SecurityBadges from "./ui-cart-options/SecurityBadges";
import Preferences from "./ui-cart-options/Preferences";
import CartItem from "./ui-cart-options/CartItems";
import CartSummary from "./ui-cart-options/CartSummary";
import "../../index.css";

const MainContent = memo(function MainContent({ activeTab, designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
    announcementSettings, rewardsSettings, currency, recommendationsSettings, subscriptionUpgradesSettings, upsellsSettings,
    additionalNotesSettings, addonsSettings, discountCodesSettings, expressPaymentsSettings, trustBadgesSettings, cartSettings,
    triggeredRewardsSettings, cartStatus, cartId
}) {

    const componentMap = useMemo(() => ({
        Template: (
            <TemplateSettings
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
        "Banner Image": <BannerImage
            headerSettings={headerSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
        />,
        Timer: <TimerSettings
            headerSettings={headerSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
        />,
        Announcement: <Notices
            announcementSettings={announcementSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
        />,
        "Progress Bar": (
            <TieredOffers
                rewardsSettings={rewardsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "One Tick Upsell": (
            <OneTickUpsell
                cartSettings={cartSettings}
                handleChange={handleChange}
                currency={currency}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Triggered Rewards": (
            <SmartOffers
                triggeredRewardsSettings={triggeredRewardsSettings}
                handleChange={handleChange}
                currency={currency}
                cartStatus={cartStatus}
                cartId={cartId}
            />
        ),
        "Recommended Products": (
            <Recommended
                recommendationsSettings={recommendationsSettings}
                handleChange={handleChange}
                currency={currency}
            />
        ),
        "Subscription Upgrade": (
            <SubscriptionUpgrades
                subscriptionUpgradesSettings={subscriptionUpgradesSettings}
                handleChange={handleChange}
            />
        ),
        "Cross-sell": (
            <UpsellsSettings
                upsellsSettings={upsellsSettings}
                handleChange={handleChange}
                currency={currency}
                shop={shop}
                accessToken={accessToken}
                apiUrl={apiUrl}
            />
        ),
        "Order notes": (
            <AddNotes
                additionalNotesSettings={additionalNotesSettings}
                handleChange={handleChange}
            />
        ),
        "Add ons": (
            <AddOns
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
        "Products in cart": (
            <CartItem
                handleChange={handleChange}
                cartSettings={cartSettings}
                currency={currency}
            />
        ),
        "Order Summary": (
            <CartSummary />
        )
    }), [designSettings, headerSettings, handleChange, accessToken, shop, apiUrl,
        announcementSettings, rewardsSettings, currency, recommendationsSettings,
        subscriptionUpgradesSettings, upsellsSettings, additionalNotesSettings,
        addonsSettings, discountCodesSettings, expressPaymentsSettings,
        trustBadgesSettings, cartSettings, triggeredRewardsSettings]);

    return (
        <div className="mainContent">

            {componentMap[activeTab] || (
                <Card>
                    <Text variant="headingMd">{activeTab} Settings</Text>
                </Card>
            )}

            {/* Cross-sell: the same Background color that fills the cart body (.cart-app__body) */}
            {activeTab === "Cross-sell" && (
                <div style={{ marginTop: 16 }}>
                    <BackgroundInput
                        title="Background color"
                        value={getCartItemOptions(cartSettings).sectionBackground || { type: "plain", color: "#ffffff" }}
                        onChange={(bg) => handleChange("cartSettings", patchCartItem({ sectionBackground: bg }))}
                    />
                </div>
            )}

            {/* every section's options end with its Background color */}
            {SECTION_BG_KEYS.includes(sectionBgId(activeTab)) && componentMap[activeTab] && (
                <div style={{ marginTop: 16 }}>
                    <SectionBackground
                        sectionKey={sectionBgId(activeTab)}
                        cartSettings={cartSettings}
                        handleChange={handleChange}
                    />
                </div>
            )}

        </div>
    );
});

export default MainContent;