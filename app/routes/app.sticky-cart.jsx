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
  Banner, Collapsible,
  AppProvider,
} from "@shopify/polaris";
import "../index.css";

import ColorInput from "./components/ui/ColorInput";
import HtmlEditor from "./components/ui-cart-options/HtmlEditor";
import { shopLoader } from "./components/shop.server";
import { useLoaderData } from "react-router-dom";
import { createStickyCart, getStickyCart } from "../services/apiRoutes";

function scopeCss(css, scope) {
  if (!css) return "";
  let result = css.replace(/([^{}@][^{}]*)\{/g, (_match, selectors) => {
    const scoped = selectors.split(",").map(s => {
      const t = s.trim();
      if (!t) return t;
      return `${scope} ${t}`;
    }).join(", ");
    return `${scoped} {`;
  });
  result = result.replace(/([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g, (_m, prop, val, semi) => {
    return `${prop}${val.trim()} !important${semi}`;
  });
  return result;
}

export const loader = async ({ request }) => {
  const { shop, apiUrl, accessToken, currency } = await shopLoader(request);

  let stickyCart = null;

  try {
    const res = await getStickyCart(apiUrl, shop.myshopifyDomain);
    stickyCart = res?.data || null;
  } catch (err) {
    console.error("GET STICKY CART ERROR:", err);
  }

  return Response.json({ shop, apiUrl, accessToken, currency, stickyCart });
};

const ICONS = [
  {
    id: "bag",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    id: "tote",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="7" width="16" height="14" rx="2" />
        <path d="M8 7V5a4 4 0 018 0v2" />
      </svg>
    ),
  },
  {
    id: "cart",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L23 6H6" />
      </svg>
    ),
  },
];

const ICON_SVGS = {
  bag: (color) => (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  tote: (color) => (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M8 7V5a4 4 0 018 0v2" />
    </svg>
  ),
  cart: (color) => (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L23 6H6" />
    </svg>
  ),
};

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
  return {
    enabled: data?.enabled ?? true,
    selectedIcon: data?.selectedIcon ?? "bag",
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
  const { shop, apiUrl, stickyCart } = useLoaderData();

  const initial = buildSettings(stickyCart);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [saved, setSaved] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(initial.selectedIcon);
  const [bgColor, setBgColor] = useState(initial.bgColor);
  const [iconColor, setIconColor] = useState(initial.iconColor);
  const [qBgColor, setQBgColor] = useState(initial.qBgColor);
  const [qTextColor, setQTextColor] = useState(initial.qTextColor);
  const [position, setPosition] = useState(initial.position);
  const [device, setDevice] = useState(initial.device);
  const [cssListOpen, setCssListOpen] = useState(false);
  const skipDirtyCheck = useRef(false);
  const [loading, setLoading] = useState(false);

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

  // Sync all state when loader data changes (e.g. navigating via s-link)
  useEffect(() => {
    const s = buildSettings(stickyCart);
    skipDirtyCheck.current = true;
    setEnabled(s.enabled);
    setSelectedIcon(s.selectedIcon);
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
    try {
      setLoading(true);
      const payload = {
        shop: Storeshop,
        enabled,
        selectedIcon,
        bgColor,
        iconColor,
        qBgColor,
        qTextColor,
        position,
        device,
        customCss: cartSettings.customCss,
      };

      const res = await createStickyCart(apiUrl, payload);

      if (res?.success) {
        initialSettingsRef.current = res.data;

        setIsDirty(false);
        setSaved(true);

        setTimeout(() => setSaved(false), 3000);
      }

    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    skipDirtyCheck.current = true;

    const initial = initialSettingsRef.current;

    setEnabled(initial.enabled);
    setSelectedIcon(initial.selectedIcon);
    setBgColor(initial.bgColor);
    setIconColor(initial.iconColor);
    setQBgColor(initial.qBgColor);
    setQTextColor(initial.qTextColor);
    setPosition(initial.position);
    setDevice(initial.device);

    setCartSettings({
      customCss: initial.customCss,
    });

    setIsDirty(false);

    if (window.shopify) {
      window.shopify.saveBar.hide("my-save-bar");
    }

    setTimeout(() => {
      skipDirtyCheck.current = false;
    }, 0);
  };

  return (
    <AppProvider>
      <ui-save-bar id="my-save-bar">
        <button variant="primary" onClick={handleSave}>
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
            <Button
              variant={isDirty ? "primary" : "secondary"}
              onClick={handleSave}
              tone={saved ? "success" : undefined}
              loading={loading}
              disabled={loading}
              className={isDirty ? "black-btn" : ""}
            >
              {saved ? "Saved!" : "Save"}
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

                  <Divider />

                  {/* Cart Icon */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="label" fontWeight="medium">Cart Icon</Text>
                    <InlineStack gap="200">
                      {ICONS.map((icon) => (
                        <div
                          key={icon.id}
                          onClick={() => setSelectedIcon(icon.id)}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            border: selectedIcon === icon.id
                              ? "1.5px solid #2c7be5"
                              : "1px solid #e1e3e5",
                            background: selectedIcon === icon.id
                              ? "rgba(44,123,229,0.06)"
                              : "#fff",
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
                    </InlineStack>
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
                      {ICON_SVGS[selectedIcon](iconColor)}
                      <div
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
    </AppProvider>
  );
}