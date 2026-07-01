import { useState, useRef, useEffect } from "react";
import {
  Page,
  Card,
  Layout,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Button,
  Select,
  Divider,
  Banner,
  Collapsible,
  AppProvider,
  Modal,
} from "@shopify/polaris";
import "../index.css";

import ColorInput from "./components/ui/ColorInput";
import HtmlEditor from "./components/ui-cart-options/HtmlEditor";
import { shopLoader } from "./components/shop.server";
import { useLoaderData } from "react-router";
import { createStickyCart, getStickyCart } from "../services/apiRoutes";
import { uploadImage } from "../services/apiRoutes";

const spinnerStyleTag = (
  <style>{`
    @keyframes stickyCartIconSpin {
      to { transform: rotate(360deg); }
    }
  `}</style>
);

function scopeCss(css, scope) {
  if (!css) return "";

  let result = css.replace(
    /(@[\w-]+(?:\s+[\w-]+)?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})|([^{}@]+)\{([^{}]*)\}/g,
    (match, atRule, selectors, declarations) => {
      if (atRule) return atRule;

      const scoped = selectors.split(",").map(s => {
        const t = s.trim();
        if (!t) return t;
        return `${scope} ${t}`;
      }).join(", ");

      const important = declarations.replace(
        /([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g,
        (_m, prop, val, semi) => `${prop}${val.trim()} !important${semi}`
      );

      return `${scoped} { ${important} }`;
    }
  );

  return result;
}

export const loader = async ({ request }) => {
  try {
    const { shop, apiUrl, accessToken, currency } =
      await shopLoader(request);

    let stickyCart = null;

    try {
      const res = await getStickyCart(
        apiUrl,
        shop?.myshopifyDomain || ""
      );

      stickyCart = res?.data || null;

    } catch (err) {
      console.error("GET STICKY CART ERROR:", err);
    }

    return Response.json({
      shop,
      apiUrl,
      accessToken,
      currency,
      stickyCart,
    });

  } catch (error) {
    console.error("Shop Loader Error:", error);

    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Loader failed", {
      status: 500,
    });
  }
};

const ICONS = [
  {
    id: "bag",
    svg: (
      <img
        src="https://hubsyntax.com/cart-images/roundedBag.svg"
        alt="Bag icon"
        style={{ display: "block" }}
        className="styles_IconSelectionField__J7Jzm"
      />
    ),
  },
  {
    id: "tote",
    svg: (
      <img
        src="https://hubsyntax.com/cart-images/squareBag.svg"
        alt="Tote icon"
        style={{ display: "block" }}
        className="styles_IconSelectionField__J7Jzm"
      />
    ),
  },
  {
    id: "cart",
    svg: (
      <img
        src="https://hubsyntax.com/cart-images/cart_major.svg"
        alt="Cart icon"
        style={{ display: "block" }}
        className="styles_IconSelectionField__J7Jzm"
      />
    ),
  },
];

const ICON_SVGS = {
  bag: (color) => (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Shopping bag"
    >
      <title>Shopping bag</title>
      <path
        d="M15.9348 18.7484C15.9348 22.3743 18.8741 25.3136 22.5 25.3136V25.3136C26.1259 25.3136 29.0652 22.3743 29.0652 18.7484"
        stroke={color}
        strokeWidth="2.8125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.9348 13.121V12.1832C15.9348 8.55728 18.8741 5.61792 22.5 5.61792V5.61792C26.1259 5.61792 29.0652 8.55728 29.0652 12.1832V13.121"
        stroke={color}
        strokeWidth="2.8125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1158 13.1211C10.1347 13.1211 8.49519 14.6615 8.37161 16.6386L7.51063 30.4145C7.36528 32.7401 8.18772 35.0223 9.78313 36.7205C11.3785 38.4188 13.605 39.382 15.9351 39.382H29.0649C31.395 39.382 33.6215 38.4188 35.2169 36.7206C36.8124 35.0223 37.6348 32.7401 37.4895 30.4145L36.6285 16.6386C36.5049 14.6615 34.8653 13.1211 32.8843 13.1211H12.1158Z"
        stroke={color}
        strokeWidth="2.8125"
        strokeLinecap="round"
        strokeLinejoin="round"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  ),

  tote: (color) => (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Shopping bag"
    >
      <title>Shopping bag</title>
      <path
        d="M7.4937 7.49365H37.5062C38.5422 7.49365 39.382 8.33347 39.382 9.36943V35.6304C39.382 37.7023 37.7023 39.3819 35.6304 39.3819H9.36948C7.29755 39.3819 5.61792 37.7023 5.61792 35.6304V9.36943C5.61792 8.33347 6.45774 7.49365 7.4937 7.49365Z"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
      />
      <path
        d="M5.61792 14.059H39.382Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="white"
      />
      <path
        d="M5.61792 14.059H39.382"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30.0031 20.6245C30.0031 24.7684 26.6438 28.1276 22.5 28.1276C18.3561 28.1276 14.9968 24.7684 14.9968 20.6245"
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
      />
      <path
        d="M30.0031 20.6245C30.0031 24.7684 26.6438 28.1276 22.5 28.1276C18.3561 28.1276 14.9968 24.7684 14.9968 20.6245"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  cart: (color) => (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Shopping cart"
    >
      <title>Shopping cart</title>
      <path
        d="M2.25 2.25C2.25 1.00736 3.26096 0 4.50805 0H7.89512C9.76575 0 11.2822 1.51104 11.2822 3.375V4.63623L39.5737 6.67839C41.5465 6.80125 42.995 8.57431 42.7154 10.5241L40.7687 24.1023C40.5304 25.765 39.1013 27 37.4157 27H11.2822V31.5H33.8788C37.6201 31.5 40.6529 34.5221 40.6529 38.25C40.6529 41.9779 37.6201 45 33.8788 45C30.1375 45 27.1046 41.9779 27.1046 38.25C27.1046 37.4611 27.2405 36.7037 27.4901 36H15.4128C15.6625 36.7037 15.7983 37.4611 15.7983 38.25C15.7983 41.9779 12.7654 45 9.02415 45C5.28289 45 2.25 41.9779 2.25 38.25C2.25 35.311 4.13504 32.8107 6.7661 31.8841V6.77078C6.766 6.75838 6.766 6.74596 6.7661 6.73352V4.5H4.50805C3.26096 4.5 2.25 3.49264 2.25 2.25ZM11.2822 9.14501V22.5H36.4365L38.0718 11.0936L11.2822 9.14501ZM31.6207 38.25C31.6207 37.0074 32.6317 36 33.8788 36C35.1259 36 36.1368 37.0074 36.1368 38.25C36.1368 39.4926 35.1259 40.5 33.8788 40.5C32.6317 40.5 31.6207 39.4926 31.6207 38.25ZM6.7661 38.25C6.7661 37.0074 7.77706 36 9.02415 36C10.2712 36 11.2822 37.0074 11.2822 38.25C11.2822 39.4926 10.2712 40.5 9.02415 40.5C7.77706 40.5 6.7661 39.4926 6.7661 38.25Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
      />
    </svg>
  ),
};

function renderCartIcon(selectedIcon, customIconUrl, iconColor) {
  if (selectedIcon === "custom" && customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt="Custom cart icon"
        style={{ width: 45, height: 45, objectFit: "contain", display: "block" }}
      />
    );
  }

  const renderer = ICON_SVGS[selectedIcon] ?? ICON_SVGS.bag;
  return renderer(iconColor);
}

const CSS_CLASSES = [
  "custom-cart-sticky-widget",
  "custom-cart-sticky-cart-quantity-icon",
  "custom-cart-sticky-cart-quantity-icon-text",
  "custom-cart-sticky-cart-icon",
];

const POSITION_OPTIONS = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Center Right", value: "center-right" },
  { label: "Top Right", value: "top-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Center Left", value: "center-left" },
  { label: "Top Left", value: "top-left" },
];

const DEVICE_OPTIONS = [
  { label: "Show on all devices", value: "all" },
  { label: "Mobile only", value: "mobile" },
  { label: "Desktop only", value: "desktop" },
];

const positionStyles = {
  "bottom-right": { bottom: 5, right: 5 },
  "center-right": { top: "50%", right: 5, transform: "translateY(-50%)" },
  "top-right": { top: 5, right: 5 },
  "bottom-left": { bottom: 5, left: 5 },
  "center-left": { top: "50%", left: 5, transform: "translateY(-50%)" },
  "top-left": { top: 5, left: 5 },
};

function buildSettings(data) {
  const selectedIcon = data?.selectedIcon ?? "bag";
  const customIconUrl = data?.customIconUrl ?? null;

  return {
    enabled: data?.enabled ?? false,
    selectedIcon: selectedIcon === "custom" && !customIconUrl ? "bag" : selectedIcon,
    customIconUrl,
    bgColor: data?.bgColor ?? "#000000",
    iconColor: data?.iconColor ?? "#ffffff",
    qBgColor: data?.qBgColor ?? "#e42626",
    qTextColor: data?.qTextColor ?? "#ffffff",
    position: data?.position ?? "bottom-right",
    device: data?.device ?? "all",
    customCss: data?.customCss ?? "",
  };
}

export default function StickyCart() {
  const { shop, apiUrl, accessToken, stickyCart } = useLoaderData();

  const initial = buildSettings(stickyCart);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [saved, setSaved] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(initial.selectedIcon);
  const [customIconUrl, setCustomIconUrl] = useState(initial.customIconUrl); // NEW
  const [uploadingIcon, setUploadingIcon] = useState(false); // NEW
  const fileInputRef = useRef(null); // NEW
  const [bgColor, setBgColor] = useState(initial.bgColor);
  const [iconColor, setIconColor] = useState(initial.iconColor);
  const [qBgColor, setQBgColor] = useState(initial.qBgColor);
  const [qTextColor, setQTextColor] = useState(initial.qTextColor);
  const [position, setPosition] = useState(initial.position);
  const [device, setDevice] = useState(initial.device);
  const [cssListOpen, setCssListOpen] = useState(false);
  const skipDirtyCheck = useRef(false);
  const [loading, setLoading] = useState(false);

  // ── Reset modal state ──
  const [resetModal, setResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const Storeshop = shop?.myshopifyDomain;

  const [isDirty, setIsDirty] = useState(false);

  const initialSettingsRef = useRef(initial);

  const [cartSettings, setCartSettings] = useState({
    customCss: initial.customCss,
  });

  const fabPos = positionStyles[position];

  const update = (key, value) => {
    setCartSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ── Custom icon upload handler ── NEW
  const handleIconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic guardrails
    if (!file.type.startsWith("image/")) {
      console.error("Please choose an image file for the cart icon.");
      e.target.value = "";
      return;
    }

    try {
      setUploadingIcon(true);
      const res = await uploadImage(apiUrl, file, shop, accessToken);

      if (res?.success && res?.imageUrl) {
        setCustomIconUrl(res.imageUrl);
        setSelectedIcon("custom");
      } else {
        console.error("Icon upload failed:", res);
      }
    } catch (err) {
      console.error("Icon upload error:", err);
    } finally {
      setUploadingIcon(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  };

  const triggerIconUpload = () => {
    if (uploadingIcon) return;
    fileInputRef.current?.click();
  };

  // Sync all state when loader data changes (e.g. navigating via s-link)
  useEffect(() => {
    const s = buildSettings(stickyCart);
    skipDirtyCheck.current = true;
    setEnabled(s.enabled);
    setSelectedIcon(s.selectedIcon);
    setCustomIconUrl(s.customIconUrl); // NEW
    setBgColor(s.bgColor);
    setIconColor(s.iconColor);
    setQBgColor(s.qBgColor);
    setQTextColor(s.qTextColor);
    setPosition(s.position);
    setDevice(s.device);
    setCartSettings({ customCss: s.customCss });
    initialSettingsRef.current = s;
    setIsDirty(false);
    setTimeout(() => { skipDirtyCheck.current = false; }, 0);
  }, [stickyCart]);

  useEffect(() => {
    if (skipDirtyCheck.current) return;

    const current = {
      enabled,
      selectedIcon,
      customIconUrl, // NEW
      bgColor,
      iconColor,
      qBgColor,
      qTextColor,
      position,
      device,
      customCss: cartSettings.customCss,
    };

    const isSame =
      JSON.stringify(current) ===
      JSON.stringify(initialSettingsRef.current);

    setIsDirty(!isSame);
  }, [
    enabled,
    selectedIcon,
    customIconUrl, // NEW
    bgColor,
    iconColor,
    qBgColor,
    qTextColor,
    position,
    device,
    cartSettings.customCss,
  ]);

  useEffect(() => {
    if (!window.shopify) return;

    if (isDirty) {
      window.shopify.saveBar.show("my-save-bar");
    } else {
      window.shopify.saveBar.hide("my-save-bar");
    }
  }, [isDirty]);

  const handleSave = async () => {
    const saveBtn = document.getElementById("save-btn");

    try {
      setLoading(true);
      saveBtn.setAttribute("loading", "");

      const payload = {
        shop: Storeshop,
        enabled,
        selectedIcon,
        customIconUrl, // NEW
        bgColor,
        iconColor,
        qBgColor,
        qTextColor,
        position,
        device,
        customCss: cartSettings.customCss,
      };

      const [res] = await Promise.all([
        createStickyCart(apiUrl, payload),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      if (res?.success) {
        initialSettingsRef.current = {
          enabled,
          selectedIcon,
          customIconUrl, // NEW
          bgColor,
          iconColor,
          qBgColor,
          qTextColor,
          position,
          device,
          customCss: cartSettings.customCss,
        };
        setIsDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }

    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
      saveBtn.removeAttribute("loading");
    }
  };

  const handleDiscard = () => {
    skipDirtyCheck.current = true;

    const initial = initialSettingsRef.current;

    setEnabled(initial.enabled);
    setSelectedIcon(initial.selectedIcon);
    setCustomIconUrl(initial.customIconUrl); // NEW
    setBgColor(initial.bgColor);
    setIconColor(initial.iconColor);
    setQBgColor(initial.qBgColor);
    setQTextColor(initial.qTextColor);
    setPosition(initial.position);
    setDevice(initial.device);
    setCartSettings({ customCss: initial.customCss });
    setIsDirty(false);

    if (window.shopify) {
      window.shopify.saveBar.hide("my-save-bar");
    }

    setTimeout(() => { skipDirtyCheck.current = false; }, 0);
  };

  // ── Reset to default handler ──
  const handleResetToDefault = async () => {
    setIsResetting(true);
    skipDirtyCheck.current = true;

    const defaults = buildSettings(null);

    setEnabled(defaults.enabled);
    setSelectedIcon(defaults.selectedIcon);
    setCustomIconUrl(defaults.customIconUrl); // NEW
    setBgColor(defaults.bgColor);
    setIconColor(defaults.iconColor);
    setQBgColor(defaults.qBgColor);
    setQTextColor(defaults.qTextColor);
    setPosition(defaults.position);
    setDevice(defaults.device);
    setCartSettings({ customCss: defaults.customCss });

    const payload = { shop: Storeshop, ...defaults };

    try {
      const res = await createStickyCart(apiUrl, payload);

      if (res?.success) {
        initialSettingsRef.current = defaults;
        setIsDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        if (window.shopify) {
          window.shopify.saveBar.hide("my-save-bar");
        }
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
      setTimeout(() => { skipDirtyCheck.current = false; }, 0);
    }
  };

  return (
    <AppProvider>
      {spinnerStyleTag}
      <ui-save-bar id="my-save-bar">
        <button variant="primary" id="save-btn" onClick={handleSave}>
          Save
        </button>
        <button onClick={handleDiscard}>Discard</button>
      </ui-save-bar>

      <Page
        title="Sticky Cart"
        primaryAction={
          <InlineStack gap="300" align="center" blockAlign="center">
            <InlineStack gap="200" align="center" blockAlign="center">
              <Text variant="bodyMd" as="span" fontWeight="medium">
                Sticky cart button enabled
              </Text>
              {/* Toggle */}
              <div
                onClick={() => setEnabled((v) => !v)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: enabled ? "#1a1a1a" : "#d1d5db",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background .2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    top: 3,
                    left: enabled ? 23 : 3,
                    transition: "left .2s",
                  }}
                />
              </div>
            </InlineStack>

            {/* Reset to default button */}
            <Button
              variant="secondary"
              tone="critical"
              onClick={() => setResetModal(true)}
              disabled={loading || isResetting}
            >
              Reset to default
            </Button>

            <Button
              variant="secondary"
              onClick={handleSave}
              loading={loading}
              disabled={loading || !isDirty}
              className={isDirty ? "black-btn" : ""}
            >
              Save
            </Button>
          </InlineStack>
        }
      >
        <BlockStack gap="400">
          <Layout>
            {/* Left: Settings */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text variant="headingSm" as="h2">Button Design Settings</Text>
                    <Text variant="bodySm" tone="subdued">Perfect your Sticky Cart Design</Text>
                  </BlockStack>

                  {/* Cart Icon */}
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="label">Cart Icon</Text>
                    <InlineStack gap="50" blockAlign="center">
                      {ICONS.map((icon) => (
                        <div
                          key={icon.id}
                          className="icon-selector"
                          onClick={() => setSelectedIcon(icon.id)}
                          style={{
                            borderRadius: 6,
                            padding: 6,
                            border: selectedIcon === icon.id ? "2px solid #4da6a6" : "2px solid #FFFFFF",
                            background: selectedIcon === icon.id ? "rgba(77, 166, 166, .15)" : undefined,
                            color: selectedIcon === icon.id ? "#2c7be5" : "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                        >
                          {icon.svg}
                        </div>
                      ))}

                      {/* Custom uploaded icon thumbnail, selectable like the presets — NEW */}
                      {customIconUrl && (
                        <div
                          className="icon-selector"
                          onClick={() => setSelectedIcon("custom")}
                          title="Custom icon"
                          style={{
                            borderRadius: 6,
                            padding: 6,
                            border: selectedIcon === "custom" ? "2px solid #4da6a6" : "2px solid #FFFFFF",
                            background: selectedIcon === "custom" ? "rgba(77, 166, 166, .15)" : undefined,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all .15s",
                            width: 45,
                            height: 45,
                          }}
                        >
                          <img
                            src={customIconUrl}
                            alt="Custom cart icon"
                            style={{ width: 32, height: 32, objectFit: "contain", display: "block" }}
                          />
                        </div>
                      )}

                      {/* Upload tile — NEW */}
                      <div
                        onClick={triggerIconUpload}
                        title="Upload custom icon"
                        style={{
                          borderRadius: 6,
                          padding: 6,
                          border: "2px dashed #d1d5db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: uploadingIcon ? "not-allowed" : "pointer",
                          opacity: uploadingIcon ? 0.6 : 1,
                          width: 45,
                          height: 45,
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#6b7280",
                          transition: "all .15s",
                        }}
                      >
                        {uploadingIcon ? (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              border: "2px solid #d1d5db",
                              borderTopColor: "#6b7280",
                              animation: "stickyCartIconSpin 0.7s linear infinite",
                            }}
                          />
                        ) : (
                          "+"
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIconFileChange}
                        style={{ display: "none" }}
                      />
                    </InlineStack>

                    {selectedIcon === "custom" && customIconUrl && (
                      <InlineStack gap="150" blockAlign="center">
                        <Text variant="bodySm" tone="subdued">Using custom icon</Text>
                        <Button
                          variant="plain"
                          tone="critical"
                          onClick={() => {
                            setCustomIconUrl(null);
                            setSelectedIcon("bag");
                          }}
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    )}
                  </BlockStack>

                  {/* Background Color */}
                  <ColorInput
                    label="Background Color"
                    value={bgColor}
                    onChange={setBgColor}
                  />

                  {/* Icon Color */}
                  <ColorInput
                    label="Icon Color"
                    value={iconColor}
                    onChange={setIconColor}
                  />

                  {/* Quantity Background Color */}
                  <ColorInput
                    label="Quantity Background Color"
                    value={qBgColor}
                    onChange={setQBgColor}
                  />

                  {/* Quantity Text Color */}
                  <ColorInput
                    label="Quantity Text Color"
                    value={qTextColor}
                    onChange={setQTextColor}
                  />

                  {/* Position */}
                  <Select
                    label="Sticky Cart Position"
                    options={POSITION_OPTIONS}
                    value={position}
                    onChange={setPosition}
                  />

                  {/* Device */}
                  <Select
                    label="Device Settings"
                    options={DEVICE_OPTIONS}
                    value={device}
                    onChange={setDevice}
                  />
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Right: Preview */}
            <Layout.Section variant="oneThird">
              <Card padding="0">
                {/* Browser bar */}
                <Box
                  padding="300"
                  borderBlockEndWidth="025"
                  borderColor="border"
                  background="bg-surface-secondary"
                >
                  <InlineStack gap="150" blockAlign="center">
                    {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                      <div
                        key={c}
                        style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
                      />
                    ))}
                    <div
                      style={{
                        flex: 1,
                        height: 10,
                        borderRadius: 4,
                        background: "#e5e7eb",
                        marginLeft: 6,
                      }}
                    />
                  </InlineStack>
                </Box>

                {/* Preview viewport */}
                <div style={{ position: "relative", height: 340, background: "#f3f4f6" }} className="sticky-cart">
                  {cartSettings?.customCss && (
                    <style dangerouslySetInnerHTML={{ __html: scopeCss(cartSettings.customCss, ".sticky-cart") }} />
                  )}
                  {enabled && (
                    <div
                      className="styles_CartQuantityIcon__ upcart-sticky-cart-quantity-icon"
                      style={{
                        position: "absolute",
                        ...fabPos,
                        width: 82,
                        height: 82,
                        borderRadius: "50%",
                        background: bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        transition: "all .3s",
                        zIndex: 2147483638,
                        cursor: "pointer",
                      }}
                    >
                      {renderCartIcon(selectedIcon, customIconUrl, iconColor)}
                      <div
                        className="styles_CartQuantityIconText__ upcart-sticky-cart-quantity-icon-text"
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 0,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: qBgColor,
                          color: qTextColor,
                          fontSize: 14,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        1
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>
          </Layout>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Custom CSS</Text>

              <Banner tone="info">
                <BlockStack gap="100">
                  <Text variant="bodyMd">
                    Start by typing a dot "." to see a list of all available CSS classes.
                    Or view the full list below.
                  </Text>
                  <InlineStack align="start">
                    <Button variant="plain" onClick={() => setCssListOpen((o) => !o)}>
                      {cssListOpen ? "Hide list" : "Show list"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Banner>

              <Collapsible open={cssListOpen} id="css-class-list">
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.8,
                    padding: "8px 0",
                  }}
                >
                  {CSS_CLASSES.join(", ")}
                </div>
              </Collapsible>

              <HtmlEditor
                value={cartSettings.customCss}
                onChange={(v) => update("customCss", v)}
                language="css"
              />
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>

      {/* ── Reset to default confirmation modal ── */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Reset to default settings?"
        size="small"
        primaryAction={{
          content: "Reset to default",
          tone: "critical",
          loading: isResetting,
          onAction: async () => {
            await handleResetToDefault();
            setResetModal(false);
          },
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setResetModal(false) },
        ]}
      >
        <Modal.Section>
          This restores every section of this cart — appearance, header, and
          all modules — to the app's default settings and saves immediately.
          Your current customizations for this cart will be lost and this
          can't be undone.
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}