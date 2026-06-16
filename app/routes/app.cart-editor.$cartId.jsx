import { AppProvider, Page, Spinner } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import "../index.css";
import Sidebar from "./components/Sidebar";
import CartPreview from "./components/CartPreview";
import MainContent from "./components/MainContent";
import CartLayout from "./components/CartLayout";
import { shopLoader } from "./components/shop.server";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { getCart, updateCart } from "../services/apiRoutes";
import { useState, useEffect, useRef } from "react";
import {
  defaultSettings,
  defaultHeaderSettings,
  defaultAnnouncementSettings,
  defaultRewardsSettings,
  defaultRecommendationsSettings,
  defaultSubscriptionUpgradesSettings,
  defaultUpsellsSettings,
  defaultAdditionalNotesSettings,
  defaultAddonsSettings,
  defaultDiscountCodesSettings,
  defaultExpressPaymentsSettings,
  defaultTrustBadgesSettings,
  defaultCartSettings,
  defaultTriggeredRewardsSettings,
} from "../routes/components/constants/cartDefaults";

export const loader = async ({ request, params }) => {
  const cartId = params.cartId;
  const apiUrl = process.env.PUBLIC_REACT_APP_API_URL;

  const [{ shop, accessToken, currency }, cartResult] = await Promise.all([
    shopLoader(request),
    getCart(apiUrl, cartId).catch((err) => {
      console.error("GET CART ERROR:", err);
      return { data: null };
    }),
  ]);

  return Response.json({
    shop,
    apiUrl,
    cart: cartResult?.data || null,
    accessToken,
    currency,
  });
};

export default function CartEditor() {
  const { shop, apiUrl, cart, accessToken, currency } = useLoaderData();

  const [searchParams] = useSearchParams();

  const MODULE_TAB_MAP = {
    recommendations: "Recommended Products",
    rewards: "Tiered Offers",
    "triggered-rewards": "Smart Offers",
    upsells: "Upsells",
    addons: "Extras",
    announcements: "Notices",
    "subscription-upgrades": "Subscription Options",
    "additional-notes": "Order Notes",
    "discount-codes": "Promo Codes",
    "express-payments": "Quick Checkout",
    "trust-badges": "Security Badges",
    header: "Top Section",
    design: "Appearance",
    settings: "Preferences",
  };

  const [activeTab, setActiveTab] = useState(
    () => MODULE_TAB_MAP[searchParams.get("module")] || "Appearance"
  );

  const [designSettings, setDesignSettings] = useState(
    cart?.designSettings || defaultSettings
  );

  const [headerSettings, setHeaderSettings] = useState(
    cart?.headerSettings || defaultHeaderSettings
  );

  const [announcementSettings, setAnnouncementSettings] = useState(
    cart?.announcementSettings || defaultAnnouncementSettings
  );

  const [rewardsSettings, setRewardsSettings] = useState(
    cart?.rewardsSettings || defaultRewardsSettings
  );

  const [recommendationsSettings, setRecommendationsSettings] = useState(
    cart?.recommendationsSettings || defaultRecommendationsSettings
  );

  const [subscriptionUpgradesSettings, setSubscriptionUpgradesSettings] = useState(
    cart?.subscriptionUpgradesSettings || defaultSubscriptionUpgradesSettings
  );

  const [upsellsSettings, setUpsellsSettings] = useState(
    cart?.upsellsSettings || defaultUpsellsSettings
  );

  const [additionalNotesSettings, setAdditionalNotesSettings] = useState(
    cart?.additionalNotesSettings || defaultAdditionalNotesSettings
  );

  const [addonsSettings, setAddonsSettings] = useState(
    cart?.addonsSettings || defaultAddonsSettings
  );

  const [discountCodesSettings, setDiscountCodesSettings] = useState(
    cart?.discountCodesSettings || defaultDiscountCodesSettings
  );

  const [expressPaymentsSettings, setExpressPaymentsSettings] = useState(
    cart?.expressPaymentsSettings || defaultExpressPaymentsSettings
  );

  const [trustBadgesSettings, setTrustBadgesSettings] = useState(
    cart?.trustBadgesSettings || defaultTrustBadgesSettings
  );

  const [cartSettings, setCartSettings] = useState(
    cart?.cartSettings || defaultCartSettings
  );

  const [triggeredRewardsSettings, setTriggeredRewardsSettings] = useState(
    cart?.triggeredRewardsSettings || defaultTriggeredRewardsSettings
  );

  const initialSettingsRef = useRef({
    design: designSettings,
    header: headerSettings,
    announcement: announcementSettings,
    rewardsSettings: rewardsSettings,
    recommendationsSettings: recommendationsSettings,
    subscriptionUpgradesSettings: subscriptionUpgradesSettings,
    upsellsSettings: upsellsSettings,
    additionalNotesSettings: additionalNotesSettings,
    addonsSettings: addonsSettings,
    discountCodesSettings: discountCodesSettings,
    expressPaymentsSettings: expressPaymentsSettings,
    trustBadgesSettings: trustBadgesSettings,
    cartSettings: cartSettings,
    triggeredRewards: triggeredRewardsSettings,
  });

  const [isDirty, setIsDirty] = useState(false);

  const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const handleChange = (type, updater) => {
    const setters = {
      design: setDesignSettings,
      header: setHeaderSettings,
      announcement: setAnnouncementSettings,
      rewardsSettings: setRewardsSettings,
      recommendationsSettings: setRecommendationsSettings,
      subscriptionUpgradesSettings: setSubscriptionUpgradesSettings,
      upsellsSettings: setUpsellsSettings,
      additionalNotesSettings: setAdditionalNotesSettings,
      addonsSettings: setAddonsSettings,
      discountCodesSettings: setDiscountCodesSettings,
      expressPaymentsSettings: setExpressPaymentsSettings,
      trustBadgesSettings: setTrustBadgesSettings,
      cartSettings: setCartSettings,
      triggeredRewards: setTriggeredRewardsSettings,
    };

    const setter = setters[type];
    if (!setter) return;

    setter((prev) => {
      const updated =
        typeof updater === "function" ? updater(prev) : updater;

      const isSame = isEqual(initialSettingsRef.current[type], updated);
      setIsDirty(!isSame);

      return updated;
    });
  };

  useEffect(() => {
    if (!window.shopify) return;

    if (isDirty) {
      window.shopify.saveBar.show("my-save-bar");
    } else {
      window.shopify.saveBar.hide("my-save-bar");
    }
  }, [isDirty]);

  useEffect(() => {
    if (!cart) return;

    // Always reset ALL settings to the new cart's values (or defaults).
    // Using `if (cart.X)` guards caused the previous cart's data to persist
    // when switching to a cart that had no saved settings for that field.
    setDesignSettings(cart.designSettings || defaultSettings);
    setHeaderSettings(cart.headerSettings || defaultHeaderSettings);
    setAnnouncementSettings(cart.announcementSettings || defaultAnnouncementSettings);
    setRewardsSettings(cart.rewardsSettings || defaultRewardsSettings);
    setRecommendationsSettings(cart.recommendationsSettings || defaultRecommendationsSettings);
    setSubscriptionUpgradesSettings(cart.subscriptionUpgradesSettings || defaultSubscriptionUpgradesSettings);
    setUpsellsSettings(cart.upsellsSettings || defaultUpsellsSettings);
    setAdditionalNotesSettings(cart.additionalNotesSettings || defaultAdditionalNotesSettings);
    setAddonsSettings(cart.addonsSettings || defaultAddonsSettings);
    setDiscountCodesSettings(cart.discountCodesSettings || defaultDiscountCodesSettings);
    setExpressPaymentsSettings(cart.expressPaymentsSettings || defaultExpressPaymentsSettings);
    setTrustBadgesSettings(cart.trustBadgesSettings || defaultTrustBadgesSettings);
    setCartSettings(cart.cartSettings || defaultCartSettings);
    setTriggeredRewardsSettings(cart.triggeredRewardsSettings || defaultTriggeredRewardsSettings);

    initialSettingsRef.current = {
      design: cart.designSettings || defaultSettings,
      header: cart.headerSettings || defaultHeaderSettings,
      announcement: cart.announcementSettings || defaultAnnouncementSettings,
      rewardsSettings: cart.rewardsSettings || defaultRewardsSettings,
      recommendationsSettings: cart.recommendationsSettings || defaultRecommendationsSettings,
      subscriptionUpgradesSettings: cart.subscriptionUpgradesSettings || defaultSubscriptionUpgradesSettings,
      upsellsSettings: cart.upsellsSettings || defaultUpsellsSettings,
      additionalNotesSettings: cart.additionalNotesSettings || defaultAdditionalNotesSettings,
      addonsSettings: cart.addonsSettings || defaultAddonsSettings,
      discountCodesSettings: cart.discountCodesSettings || defaultDiscountCodesSettings,
      expressPaymentsSettings: cart.expressPaymentsSettings || defaultExpressPaymentsSettings,
      trustBadgesSettings: cart.trustBadgesSettings || defaultTrustBadgesSettings,
      cartSettings: cart.cartSettings || defaultCartSettings,
      triggeredRewards: cart.triggeredRewardsSettings || defaultTriggeredRewardsSettings,
    };

    setIsDirty(false);
  }, [cart?.cartId]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const saveBtn = document.getElementById("save-btn");

    try {
      setIsSaving(true);

      saveBtn.setAttribute("loading", "");

      const cartId = window.location.pathname.split("/").pop();

      const rewards = triggeredRewardsSettings?.rewards || [];
      const discountCombinations =
        triggeredRewardsSettings?.discountCombinations || {};

      const existingDiscountId =
        triggeredRewardsSettings?.shopifyDiscountId || null;

      let shopifyDiscountId = existingDiscountId;

      if (rewards.length > 0) {
        const syncRes = await fetch("/shopify/create-discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rewards,
            discountCombinations,
            existingDiscountId,
          }),
        });

        const syncData = await syncRes.json();

        if (syncData.discountId) {
          shopifyDiscountId = syncData.discountId;
        }
      }

      const updatedTriggeredRewardsSettings = {
        ...triggeredRewardsSettings,
        shopifyDiscountId,
      };

      await Promise.all([
        updateCart(apiUrl, cartId, {
          designSettings,
          headerSettings,
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
          cartSettings,
          triggeredRewardsSettings: updatedTriggeredRewardsSettings,
        }),

        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      setTriggeredRewardsSettings(updatedTriggeredRewardsSettings);

      initialSettingsRef.current = {
        design: designSettings,
        header: headerSettings,
        announcement: announcementSettings,
        rewardsSettings,
        recommendationsSettings,
        subscriptionUpgradesSettings,
        upsellsSettings,
        additionalNotesSettings,
        addonsSettings,
        discountCodesSettings,
        expressPaymentsSettings,
        trustBadgesSettings,
        cartSettings,
        triggeredRewards: updatedTriggeredRewardsSettings,
      };

      setIsDirty(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
      saveBtn.removeAttribute("loading");
    }
  };

  const handleDiscard = () => {
    setDesignSettings(initialSettingsRef.current.design);
    setHeaderSettings(initialSettingsRef.current.header);
    setAnnouncementSettings(initialSettingsRef.current.announcement);
    setRewardsSettings(initialSettingsRef.current.rewardsSettings);
    setRecommendationsSettings(initialSettingsRef.current.recommendationsSettings);
    setSubscriptionUpgradesSettings(initialSettingsRef.current.subscriptionUpgradesSettings);
    setUpsellsSettings(initialSettingsRef.current.upsellsSettings);
    setAdditionalNotesSettings(initialSettingsRef.current.additionalNotesSettings);
    setAddonsSettings(initialSettingsRef.current.addonsSettings);
    setDiscountCodesSettings(initialSettingsRef.current.discountCodesSettings);
    setExpressPaymentsSettings(initialSettingsRef.current.expressPaymentsSettings);
    setTrustBadgesSettings(initialSettingsRef.current.trustBadgesSettings);
    setCartSettings(initialSettingsRef.current.cartSettings);
    setTriggeredRewardsSettings(initialSettingsRef.current.triggeredRewards);
    setIsDirty(false);
  };

  const [isResetting, setIsResetting] = useState(false);

  // Restores every section to the shipped defaults and persists immediately.
  // Destructive (no undo) — CartLayout gates this behind a confirmation modal.
  const handleResetToDefault = async () => {
    try {
      setIsResetting(true);

      const cartId = window.location.pathname.split("/").pop();

      // Defaults wipe all triggered rewards, but keep the synced Shopify
      // discount reference so it can be re-synced if rewards are re-added,
      // rather than being orphaned with no way to look it up.
      const resetTriggeredRewardsSettings = {
        ...defaultTriggeredRewardsSettings,
        shopifyDiscountId: triggeredRewardsSettings?.shopifyDiscountId || null,
      };

      const res = await updateCart(apiUrl, cartId, {
        designSettings: defaultSettings,
        headerSettings: defaultHeaderSettings,
        announcementSettings: defaultAnnouncementSettings,
        rewardsSettings: defaultRewardsSettings,
        recommendationsSettings: defaultRecommendationsSettings,
        subscriptionUpgradesSettings: defaultSubscriptionUpgradesSettings,
        upsellsSettings: defaultUpsellsSettings,
        additionalNotesSettings: defaultAdditionalNotesSettings,
        addonsSettings: defaultAddonsSettings,
        discountCodesSettings: defaultDiscountCodesSettings,
        expressPaymentsSettings: defaultExpressPaymentsSettings,
        trustBadgesSettings: defaultTrustBadgesSettings,
        cartSettings: defaultCartSettings,
        triggeredRewardsSettings: resetTriggeredRewardsSettings,
      });

      if (!res.ok) throw new Error(`Reset failed with status ${res.status}`);

      setDesignSettings(defaultSettings);
      setHeaderSettings(defaultHeaderSettings);
      setAnnouncementSettings(defaultAnnouncementSettings);
      setRewardsSettings(defaultRewardsSettings);
      setRecommendationsSettings(defaultRecommendationsSettings);
      setSubscriptionUpgradesSettings(defaultSubscriptionUpgradesSettings);
      setUpsellsSettings(defaultUpsellsSettings);
      setAdditionalNotesSettings(defaultAdditionalNotesSettings);
      setAddonsSettings(defaultAddonsSettings);
      setDiscountCodesSettings(defaultDiscountCodesSettings);
      setExpressPaymentsSettings(defaultExpressPaymentsSettings);
      setTrustBadgesSettings(defaultTrustBadgesSettings);
      setCartSettings(defaultCartSettings);
      setTriggeredRewardsSettings(resetTriggeredRewardsSettings);

      initialSettingsRef.current = {
        design: defaultSettings,
        header: defaultHeaderSettings,
        announcement: defaultAnnouncementSettings,
        rewardsSettings: defaultRewardsSettings,
        recommendationsSettings: defaultRecommendationsSettings,
        subscriptionUpgradesSettings: defaultSubscriptionUpgradesSettings,
        upsellsSettings: defaultUpsellsSettings,
        additionalNotesSettings: defaultAdditionalNotesSettings,
        addonsSettings: defaultAddonsSettings,
        discountCodesSettings: defaultDiscountCodesSettings,
        expressPaymentsSettings: defaultExpressPaymentsSettings,
        trustBadgesSettings: defaultTrustBadgesSettings,
        cartSettings: defaultCartSettings,
        triggeredRewards: resetTriggeredRewardsSettings,
      };

      setIsDirty(false);
      window.shopify?.toast?.show("Cart reset to default settings");
    } catch (error) {
      console.error("Reset error:", error);
      window.shopify?.toast?.show("Failed to reset settings", { isError: true });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AppProvider>
      <ui-save-bar id="my-save-bar">
        <button variant="primary" id="save-btn" onClick={handleSave}>
          Save
        </button>

        <button onClick={handleDiscard}>
          Discard
        </button>
      </ui-save-bar>

      <CartLayout
        cart={cart}
        cartName={cart?.cartName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        designSettings={designSettings}
        headerSettings={headerSettings}
        announcementSettings={announcementSettings}
        rewardsSettings={rewardsSettings}
        recommendationsSettings={recommendationsSettings}
        subscriptionUpgradesSettings={subscriptionUpgradesSettings}
        upsellsSettings={upsellsSettings}
        additionalNotesSettings={additionalNotesSettings}
        addonsSettings={addonsSettings}
        discountCodesSettings={discountCodesSettings}
        expressPaymentsSettings={expressPaymentsSettings}
        trustBadgesSettings={trustBadgesSettings}
        cartSettings={cartSettings}
        triggeredRewardsSettings={triggeredRewardsSettings}
        handleChange={handleChange}
        shop={shop}
        accessToken={accessToken}
        apiUrl={apiUrl}
        currency={currency}
        Sidebar={Sidebar}
        MainContent={MainContent}
        CartPreview={CartPreview}
        isDirty={isDirty}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onResetToDefault={handleResetToDefault}
        isResetting={isResetting}
      />
    </AppProvider>
  );
} 