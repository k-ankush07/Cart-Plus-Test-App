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

const defaultSettings = {
  inheritFonts: true,
  showStrikethrough: true,
  enableSubtotal: false,
  desktopWidth: "default",
  mobileWidth: "full",
  backgroundColor: "#FFFFFF",
  accentColor: "#f6f6f7",
  textColor: "#000000",
  savingsColor: "#2ea818",
  subtotalColor: "#000000",
  buttonRadius: "0",
  buttonColor: "#000000",
  buttonTextColor: "#FFFFFF",
  buttonHoverColor: "#e9e9e9",
};

const defaultHeaderSettings = {
  height: "tall",
  border: "thin",
  backgroundColor: "#ffffff",
  titleType: "inherit",
  titleText: "Cart • {{cart_quantity}}",
  alignment: "side",
  heading: "h4",
  logo: "",
  logoSize: 24,
  textColor: "#000000",
  fontWeight: "semibold",
  fontSize: 16,
  closePosition: "right",
  iconBgColor: "#ffffff",
  iconbgHoverColor: "#00000014",
  iconSize: "medium",
  iconThickNess: "normal",
  iconColor: "#637381",
  iconHoverColor: "#637381",
  iconBorder: "none",
  iconBorderColor: "#000000",
  borderHoverColor: "#000000",
  iconHoverEnabled: false,
  borderHoverEnabled: false
};

const defaultAnnouncementSettings = {
  enabled: false,
  height: "normal",
  position: "before",
  timer: "00:00",
  text: "Your products are reserved for {TIMER}!",
  fontSize: 16,
  backgroundColor: "#f6f6f7",
  borderColor: "#e8e8e8",
};

export const loader = async ({ request, params }) => {
  const { shop, apiUrl, accessToken } = await shopLoader(request);
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
    accessToken
  });
};

export default function CartEditor() {
  const { shop, apiUrl, cart, accessToken } = useLoaderData();

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

  const initialSettingsRef = useRef({
    design: designSettings,
    header: headerSettings,
    announcement: announcementSettings,
  });

  const [isDirty, setIsDirty] = useState(false);

  const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const handleChange = (type, updater) => {
    const setters = {
      design: setDesignSettings,
      header: setHeaderSettings,
      announcement: setAnnouncementSettings,
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

      initialSettingsRef.current = {
        design: cart.designSettings || defaultSettings,
        header: cart.headerSettings || defaultHeaderSettings,
        announcement: cart.announcementSettings || defaultAnnouncementSettings
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
      });

      initialSettingsRef.current = {
        design: designSettings,
        header: headerSettings,
        announcement: announcementSettings,
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
        handleChange={handleChange}
        shop={shop}
        accessToken={accessToken}
        apiUrl={apiUrl}
        Sidebar={Sidebar}
        MainContent={MainContent}
        CartPreview={CartPreview}
      />
    </AppProvider>
  );
}