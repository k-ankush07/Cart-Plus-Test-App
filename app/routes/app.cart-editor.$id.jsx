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
  defaultSubscriptionUpgradesSettings
} from "../routes/components/constants/cartDefaults";

export const loader = async ({ request, params }) => {
  const { shop, apiUrl, accessToken, currency } = await shopLoader(request);
  const cartId = params.id;

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

  const initialSettingsRef = useRef({
    design: designSettings,
    header: headerSettings,
    announcement: announcementSettings,
    rewardsSettings: rewardsSettings,
    recommendationsSettings: recommendationsSettings,
    subscriptionUpgradesSettings: subscriptionUpgradesSettings
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
    if (cart) {
      if (cart.designSettings) {
        setDesignSettings(cart.designSettings);
      }

      if (cart.headerSettings) {
        setHeaderSettings(cart.headerSettings);
      }

      if (cart.announcementSettings) {
        setAnnouncementSettings(cart.announcementSettings);
      }

      if (cart.rewardsSettings) {
        setRewardsSettings(cart.rewardsSettings);
      }

      if (cart.recommendationsSettings) {
        setRecommendationsSettings(cart.recommendationsSettings);
      }

      if (cart.subscriptionUpgradesSettings) {
        setSubscriptionUpgradesSettings(cart.subscriptionUpgradesSettings);
      }

      initialSettingsRef.current = {
        design: cart.designSettings || defaultSettings,
        header: cart.headerSettings || defaultHeaderSettings,
        announcement: cart.announcementSettings || defaultAnnouncementSettings,
        rewardsSettings: cart.rewardsSettings || defaultRewardsSettings,
        recommendationsSettings: cart.recommendationsSettings || defaultRecommendationsSettings,
        subscriptionUpgradesSettings: cart.subscriptionUpgradesSettings || defaultSubscriptionUpgradesSettings
      };
    }
  }, [cart]);

  const handleSave = async () => {
    try {
      const cartId = window.location.pathname.split("/").pop();

      await updateCart(apiUrl, cartId, {
        designSettings,
        headerSettings,
        announcementSettings,
        rewardsSettings,
        recommendationsSettings,
        subscriptionUpgradesSettings
      });

      initialSettingsRef.current = {
        design: designSettings,
        header: headerSettings,
        announcement: announcementSettings,
        rewardsSettings: rewardsSettings,
        recommendationsSettings: recommendationsSettings,
        subscriptionUpgradesSettings: subscriptionUpgradesSettings
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
        cartName={cart?.cartName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        designSettings={designSettings}
        headerSettings={headerSettings}
        announcementSettings={announcementSettings}
        rewardsSettings={rewardsSettings}
        recommendationsSettings={recommendationsSettings}
        subscriptionUpgradesSettings={subscriptionUpgradesSettings}
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