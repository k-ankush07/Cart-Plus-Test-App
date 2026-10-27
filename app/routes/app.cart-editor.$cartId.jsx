import { AppProvider, Page, Spinner } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import "../index.css";
import Sidebar from "./components/Sidebar";
import CartPreview from "./components/CartPreview";
import MainContent from "./components/MainContent";
import CartLayout from "./components/CartLayout";
import { requireShopData  } from "./components/shop.server";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { getCart, updateCart } from "../services/apiRoutes";
import { TEMPLATE_DEFAULTS } from "./components/utils/templateTheme";
import {
  DEFAULT_PREVIEW_PRODUCT_QUERY,
  normalizePreviewProduct,
  pickDefaultPreviewProduct,
} from "./components/utils/previewProduct";
import { useState, useEffect, useRef, useCallback } from "react";
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

const isSettingsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") {
    return a === b;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => isSettingsEqual(value, b[index]));
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => isSettingsEqual(a[key], b[key]));
};

// ---- A/B testing -------------------------------------------------------
// Every variant is a full copy of the cart settings. The variant on screen is the live state;
// the other variants are parked in a ref. The control (first variant) is what the cart's normal
// fields hold when saved; the rest go to cartSettings.abTest.data.
const AB_SNAP_KEYS = [
  "design",
  "header",
  "announcement",
  "rewardsSettings",
  "recommendationsSettings",
  "subscriptionUpgradesSettings",
  "upsellsSettings",
  "additionalNotesSettings",
  "addonsSettings",
  "discountCodesSettings",
  "expressPaymentsSettings",
  "trustBadgesSettings",
  "cartSettings",
];

const cloneJson = (v) => JSON.parse(JSON.stringify(v ?? null));

// cartSettings.abTest.data is parked variant data, not something the editor edits
const splitAbData = (cs) => {
  if (!cs?.abTest) return { settings: cs, data: {} };
  const { data, ...config } = cs.abTest;
  return { settings: { ...cs, abTest: config }, data: data || {} };
};

const cartToSnapshot = (cart) => ({
  design: cart?.designSettings || defaultSettings,
  header: cart?.headerSettings || defaultHeaderSettings,
  announcement: cart?.announcementSettings || defaultAnnouncementSettings,
  rewardsSettings: cart?.rewardsSettings || defaultRewardsSettings,
  recommendationsSettings: cart?.recommendationsSettings || defaultRecommendationsSettings,
  subscriptionUpgradesSettings:
    cart?.subscriptionUpgradesSettings || defaultSubscriptionUpgradesSettings,
  upsellsSettings: cart?.upsellsSettings || defaultUpsellsSettings,
  additionalNotesSettings: cart?.additionalNotesSettings || defaultAdditionalNotesSettings,
  addonsSettings: cart?.addonsSettings || defaultAddonsSettings,
  discountCodesSettings: cart?.discountCodesSettings || defaultDiscountCodesSettings,
  expressPaymentsSettings: cart?.expressPaymentsSettings || defaultExpressPaymentsSettings,
  trustBadgesSettings: cart?.trustBadgesSettings || defaultTrustBadgesSettings,
  cartSettings: (({ abTest: _ab, ...rest }) => rest)(
    splitAbData(cart?.cartSettings).settings || defaultCartSettings,
  ),
});

// what a saved cart says about its A/B test
const readAb = (cart) => {
  const { settings, data } = splitAbData(cart?.cartSettings);
  const config = settings?.abTest?.enabled ? settings.abTest : null;
  const control = cart?.cartSettings?.abTest?.controlId || config?.variants?.[0] || "A";
  return { settings, data, config, control };
};

export const loader = async ({ request, params }) => {
  const cartId = params.cartId;
  const apiUrl = process.env.PUBLIC_REACT_APP_API_URL;

  const shopPromise = requireShopData(request);

  // first store product for the preview, fetched alongside the cart so it is
  // already there on first paint (no loading flash)
  const previewProductPromise = shopPromise
    .then(async ({ admin }) => {
      const res = await admin.graphql(DEFAULT_PREVIEW_PRODUCT_QUERY);
      const data = await res.json();
      const products = (data?.data?.products?.edges || []).map((e) =>
        normalizePreviewProduct(e.node),
      );
      return pickDefaultPreviewProduct(products);
    })
    .catch((err) => {
      console.error("PREVIEW PRODUCT ERROR:", err);
      return null;
    });

  const [{ shop, accessToken, currency }, cartResult, initialPreviewProduct] =
    await Promise.all([
      shopPromise,
      getCart(apiUrl, cartId).catch((err) => {
        console.error("GET CART ERROR:", err);
        return { data: null };
      }),
      previewProductPromise,
    ]);

  return Response.json({
    shop,
    apiUrl,
    cart: cartResult?.data || null,
    accessToken,
    currency,
    initialPreviewProduct,
  });
};

export default function CartEditor() {
  const { shop, apiUrl, cart, accessToken, currency, initialPreviewProduct } =
    useLoaderData();

  const [searchParams] = useSearchParams();

  const MODULE_TAB_MAP = {
    recommendations: "Recommended Products",
    rewards: "Tiered Offers",
    "triggered-rewards": "Triggered Rewards",
    upsells: "Upsells",
    addons: "Extras",
    announcements: "Notices",
    "subscription-upgrades": "Subscription Options",
    "additional-notes": "Order Notes",
    "discount-codes": "Promo Codes",
    "express-payments": "Quick Checkout",
    "trust-badges": "Security Badges",
    header: "Top Section",
    design: "Template",
    settings: "Preferences",
  };

  const [activeTab, setActiveTab] = useState(
    () => MODULE_TAB_MAP[searchParams.get("module")] || "Template"
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
    cart?.cartSettings
      ? splitAbData(cart.cartSettings).settings
      : defaultCartSettings
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

  /* ---------- A/B testing ---------- */
  const liveRef = useRef(null);
  liveRef.current = {
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
  };

  const takeSnapshot = () => {
    const snap = {};
    AB_SNAP_KEYS.forEach((k) => {
      snap[k] = liveRef.current[k];
    });
    const { abTest: _ab, ...rest } = snap.cartSettings || {};
    snap.cartSettings = rest;
    return cloneJson(snap);
  };

  const initialAb = useRef(null);
  if (!initialAb.current) initialAb.current = readAb(cart);
  const abStoreRef = useRef(cloneJson(initialAb.current.data)); // parked variants
  const abActiveRef = useRef(initialAb.current.control); // variant on screen
  const abBaselineRef = useRef({
    active: initialAb.current.control,
    config: initialAb.current.config,
    snaps: {
      ...cloneJson(initialAb.current.data),
      [initialAb.current.control]: cartToSnapshot(cart),
    },
  });
  const [, setAbTick] = useState(0); // re-render once the saved A/B baseline changes
  const [abKey, setAbKey] = useState(0); // remounts the A/B control after Discard / Reset

  // put a snapshot on screen. `ab` is the A/B config kept in cartSettings: left out, the
  // newest one is kept (read from state itself, not from the last render), null drops it
  const loadSnapshot = (snap, ab) => {
    const pick = (k, fallback) => cloneJson(snap[k] ?? fallback);
    setDesignSettings(pick("design", defaultSettings));
    setHeaderSettings(pick("header", defaultHeaderSettings));
    setAnnouncementSettings(pick("announcement", defaultAnnouncementSettings));
    setRewardsSettings(pick("rewardsSettings", defaultRewardsSettings));
    setRecommendationsSettings(pick("recommendationsSettings", defaultRecommendationsSettings));
    setSubscriptionUpgradesSettings(
      pick("subscriptionUpgradesSettings", defaultSubscriptionUpgradesSettings),
    );
    setUpsellsSettings(pick("upsellsSettings", defaultUpsellsSettings));
    setAdditionalNotesSettings(pick("additionalNotesSettings", defaultAdditionalNotesSettings));
    setAddonsSettings(pick("addonsSettings", defaultAddonsSettings));
    setDiscountCodesSettings(pick("discountCodesSettings", defaultDiscountCodesSettings));
    setExpressPaymentsSettings(pick("expressPaymentsSettings", defaultExpressPaymentsSettings));
    setTrustBadgesSettings(pick("trustBadgesSettings", defaultTrustBadgesSettings));
    setCartSettings((prev) => {
      const keep = ab === undefined ? prev?.abTest : ab;
      return {
        ...pick("cartSettings", defaultCartSettings),
        ...(keep ? { abTest: keep } : {}),
      };
    });
  };

  // the dirty check compares against the saved copy of whichever variant is on screen
  const setBaselineFor = (snap, ab) => {
    initialSettingsRef.current = {
      ...cloneJson(snap),
      cartSettings: { ...cloneJson(snap.cartSettings), ...(ab ? { abTest: ab } : {}) },
      triggeredRewards: initialSettingsRef.current.triggeredRewards,
    };
  };

  const switchVariant = (to) => {
    const from = abActiveRef.current;
    if (from === to) return;
    if (from) abStoreRef.current[from] = takeSnapshot();
    // a variant that was never saved starts as a copy of what is on screen
    const snap = abStoreRef.current[to] || takeSnapshot();
    delete abStoreRef.current[to];
    loadSnapshot(snap);
    abActiveRef.current = to;
    const base = abBaselineRef.current;
    setBaselineFor(base.snaps[to] || snap, base.config);
  };

  const stopAbTest = () => {
    const control = (liveRef.current.cartSettings?.abTest?.variants || [])[0] || "A";
    // keep the control variant, drop the rest
    if (abActiveRef.current !== control && abStoreRef.current[control]) {
      loadSnapshot(abStoreRef.current[control]);
    }
    abStoreRef.current = {};
    abActiveRef.current = "A";
    handleChange("cartSettings", (prev) => {
      const { abTest: _ab, ...rest } = prev || {};
      return rest;
    });
  };

  const abTesting = {
    resetKey: abKey,
    defaultValue: cartSettings?.abTest
      ? {
          ...cartSettings.abTest,
          activeVariant: abActiveRef.current || cartSettings.abTest.variants?.[0] || "A",
        }
      : undefined,
    onChange: (state) => {
      if (!state.enabled) return; // stopping is handled by onStopTest
      const config = {
        enabled: true,
        variants: state.variants,
        allocation: state.allocation,
        weights: state.weights,
      };
      const current = liveRef.current.cartSettings?.abTest;
      const same =
        current &&
        Object.keys(config).every((k) => isSettingsEqual(current[k], config[k]));
      if (same) return; // just a variant switch
      handleChange("cartSettings", (prev) => ({
        ...prev,
        abTest: { ...(prev?.abTest || {}), ...config },
      }));
    },
    onActiveVariantChange: switchVariant,
    onVariantAdd: (newId, copiedFrom) => {
      const store = abStoreRef.current;
      store[newId] =
        copiedFrom === abActiveRef.current || !store[copiedFrom]
          ? takeSnapshot()
          : cloneJson(store[copiedFrom]);
    },
    onVariantRemove: (id) => {
      if (id === abActiveRef.current) abActiveRef.current = null;
      else delete abStoreRef.current[id];
    },
    onStopTest: stopAbTest,
  };

  const handleChange = useCallback((type, updater) => {
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

      const isSame = isSettingsEqual(initialSettingsRef.current[type], updated);
      setIsDirty(!isSame);

      return updated;
    });
  }, []);

  // The A/B test setup (which variants exist, how traffic is split) counts as an unsaved change
  // on its own: "isDirty" only follows the last edit, so adding a variant and touching nothing
  // else could lose the Save button.
  const abShape = (c) =>
    c?.enabled
      ? JSON.stringify([c.variants, c.allocation, c.allocation === "custom" ? c.weights : null])
      : "";
  const abChanged =
    abShape(cartSettings?.abTest) !== abShape(abBaselineRef.current.config);
  const hasUnsaved = isDirty || abChanged;

  useEffect(() => {
    if (!window.shopify) return;

    if (hasUnsaved) {
      window.shopify.saveBar.show("my-save-bar");
    } else {
      window.shopify.saveBar.hide("my-save-bar");
    }
  }, [hasUnsaved]);

  useEffect(() => {
    if (!cart) return;

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
    const ab = readAb(cart);
    setCartSettings(ab.settings || defaultCartSettings);
    setTriggeredRewardsSettings(cart.triggeredRewardsSettings || defaultTriggeredRewardsSettings);

    abStoreRef.current = cloneJson(ab.data);
    abActiveRef.current = ab.control;
    abBaselineRef.current = {
      active: ab.control,
      config: ab.config,
      snaps: { ...cloneJson(ab.data), [ab.control]: cartToSnapshot(cart) },
    };
    setAbKey((k) => k + 1);

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
      cartSettings: ab.settings || defaultCartSettings,
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
            cartId,
            rewards,
            discountCombinations,
            existingDiscountId,
            cartStatus: cart?.status,
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

      const designToSave = { ...TEMPLATE_DEFAULTS, ...designSettings };

      // With an A/B test running, the control variant fills the normal fields and the
      // other variants travel inside cartSettings.abTest.data
      const ab = liveRef.current.cartSettings?.abTest;
      let allSnaps = null;
      let savePayload = {
        designSettings: designToSave,
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
      };

      if (ab?.enabled) {
        const liveSnap = takeSnapshot();
        allSnaps = { ...abStoreRef.current };
        if (abActiveRef.current) allSnaps[abActiveRef.current] = liveSnap;
        const control = ab.variants[0];
        const controlSnap = allSnaps[control] || liveSnap;
        const data = {};
        ab.variants.forEach((id) => {
          if (id !== control) data[id] = allSnaps[id] || controlSnap;
        });
        savePayload = {
          designSettings: { ...TEMPLATE_DEFAULTS, ...controlSnap.design },
          headerSettings: controlSnap.header,
          announcementSettings: controlSnap.announcement,
          rewardsSettings: controlSnap.rewardsSettings,
          recommendationsSettings: controlSnap.recommendationsSettings,
          subscriptionUpgradesSettings: controlSnap.subscriptionUpgradesSettings,
          upsellsSettings: controlSnap.upsellsSettings,
          additionalNotesSettings: controlSnap.additionalNotesSettings,
          addonsSettings: controlSnap.addonsSettings,
          discountCodesSettings: controlSnap.discountCodesSettings,
          expressPaymentsSettings: controlSnap.expressPaymentsSettings,
          trustBadgesSettings: controlSnap.trustBadgesSettings,
          cartSettings: {
            ...controlSnap.cartSettings,
            abTest: { ...ab, controlId: control, data },
          },
          triggeredRewardsSettings: updatedTriggeredRewardsSettings,
        };
      }

      await Promise.all([
        updateCart(apiUrl, cartId, savePayload),

        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      setTriggeredRewardsSettings(updatedTriggeredRewardsSettings);
      setDesignSettings(designToSave);

      initialSettingsRef.current = {
        design: designToSave,
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

      // what is saved now is what Discard goes back to
      abBaselineRef.current = ab?.enabled
        ? {
            active: abActiveRef.current || ab.variants[0],
            config: ab,
            snaps: cloneJson(allSnaps),
          }
        : {
            active: "A",
            config: null,
            snaps: { A: takeSnapshot() },
          };
      setAbTick((t) => t + 1);

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

    // A/B test: every variant goes back to its saved copy, and the A/B control is rebuilt
    const base = abBaselineRef.current;
    const ids = base.config?.variants?.length ? base.config.variants : [base.active];
    const active = ids.includes(abActiveRef.current) ? abActiveRef.current : base.active;
    const snaps = cloneJson(base.snaps);
    const activeSnap = snaps[active] || snaps[base.active];
    if (activeSnap) {
      delete snaps[active];
      abStoreRef.current = snaps;
      abActiveRef.current = base.config ? active : "A";
      loadSnapshot(activeSnap, base.config);
      setBaselineFor(activeSnap, base.config);
      setAbKey((k) => k + 1);
    }
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

      // no A/B test any more
      abStoreRef.current = {};
      abActiveRef.current = "A";
      abBaselineRef.current = {
        active: "A",
        config: null,
        snaps: { A: cartToSnapshot(null) },
      };
      setAbKey((k) => k + 1);

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
        isDirty={hasUnsaved}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onResetToDefault={handleResetToDefault}
        isResetting={isResetting}
        cartStatus={cart?.status}
        cartId={cart?.cartId}
        initialPreviewProduct={initialPreviewProduct}
        abTesting={abTesting}
      />
    </AppProvider>
  );
} 