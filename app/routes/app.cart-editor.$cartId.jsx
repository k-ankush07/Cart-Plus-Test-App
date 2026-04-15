import { AppProvider, Page } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import "../index.css";
import { json } from "@remix-run/node";
import Sidebar from "./components/Sidebar";
import CartPreview from "./components/CartPreview";
import MainContent from "./components/MainContent";
import CartLayout from "./components/CartLayout";
import { shopLoader } from "./components/shop.server";
import { useLoaderData } from "react-router-dom";
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
  const { shop, apiUrl, accessToken, currency } = await shopLoader(request);
  const cartId = params.cartId;

  let cart = null;

  try {
    const data = await getCart(apiUrl, cartId);
    cart = data.data;
  } catch (err) {
    console.error("GET CART ERROR:", err);
  }

  return json({
    shop,
    apiUrl,
    cart,
    accessToken,
    currency,
  });
};

export default function CartEditor() {
  const { shop, apiUrl, cart, accessToken, currency } = useLoaderData();

  const [activeTab, setActiveTab] = useState("Design");

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

  const handleSave = async () => {
    try {
      const cartId = window.location.pathname.split("/").pop();

      // Sync all triggered rewards into ONE Shopify discount
      const rewards = triggeredRewardsSettings?.rewards || [];
      const discountCombinations = triggeredRewardsSettings?.discountCombinations || {};
      const existingDiscountId = triggeredRewardsSettings?.shopifyDiscountId || null;

      let shopifyDiscountId = existingDiscountId;

      if (rewards.length > 0) {
        const syncRes = await fetch("/api/create-discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewards, discountCombinations, existingDiscountId }),
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

      await updateCart(apiUrl, cartId, {
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
      });

      setTriggeredRewardsSettings(updatedTriggeredRewardsSettings);

      initialSettingsRef.current = {
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
        triggeredRewards: updatedTriggeredRewardsSettings,
      };
      setIsDirty(false);

      console.log("Saved successfully");
    } catch (error) {
      console.error("Save error:", error);
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

  return (
    <AppProvider>
      <ui-save-bar id="my-save-bar">
        <button variant="primary" onClick={handleSave}>
          Save
        </button>
        <button onClick={handleDiscard}>Discard</button>
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
      />
    </AppProvider>
  );
} 