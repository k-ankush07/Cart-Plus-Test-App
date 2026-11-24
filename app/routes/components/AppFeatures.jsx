import {
  Badge,
  BlockStack,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from "@shopify/polaris";
import {
  CartIcon,
  DiscountIcon,
  MegaphoneIcon,
  PlusCircleIcon,
  ReceiptIcon,
  TargetIcon,
} from "@shopify/polaris-icons";
import { useNavigate, useRevalidator } from "react-router-dom";
import { useState } from "react";
import {
  createCart,
  togglePublishCart,
  updateCart,
} from "../../services/apiRoutes";
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
} from "./constants/cartDefaults";

const FEATURES = [
  {
    title: "Announcements",
    subtitle: "Show messages in your cart",
    icon: MegaphoneIcon,
    module: "announcements",
    isActive: (cart) => cart?.announcementSettings?.enabled === false,
  },
  {
    title: "Progress Bar",
    subtitle: "Free shipping & reward goals",
    icon: TargetIcon,
    module: "rewards",
    isActive: (cart) => cart?.rewardsSettings?.enabled === false,
  },
  {
    title: "One Click Upsell",
    subtitle: "Add products in a single tap",
    icon: CartIcon,
    module: "one-tick-upsell",
    isActive: (cart) => !!cart?.cartSettings?.oneTick?.enabled,
  },
  {
    title: "Discount Code",
    subtitle: "Apply discounts in cart",
    icon: DiscountIcon,
    module: "discount-codes",
    isActive: (cart) => cart?.discountCodesSettings?.enabled === false,
  },
  {
    title: "Add-ons",
    subtitle: "Gift wrap, insurance & more",
    icon: PlusCircleIcon,
    module: "addons",
    isActive: (cart) => cart?.addonsSettings?.enabled === false,
  },
  {
    title: "Summary",
    subtitle: "Order summary in your cart",
    icon: ReceiptIcon,
    module: "summary",
    isActive: (cart) => !!cart?.cartSettings?.summary?.enabled,
  },
];

const getFeatureUpdate = (module, cart) => {
  const cartSettings = { ...(cart?.cartSettings || {}) };

  switch (module) {
    case "announcements":
      return {
        announcementSettings: {
          ...(cart?.announcementSettings || defaultAnnouncementSettings),
          enabled: false,
        },
      };
    case "rewards":
      return {
        rewardsSettings: {
          ...(cart?.rewardsSettings || defaultRewardsSettings),
          enabled: false,
        },
      };
    case "one-tick-upsell":
      return {
        cartSettings: {
          ...cartSettings,
          oneTick: { ...(cartSettings.oneTick || {}), enabled: true },
        },
      };
    case "discount-codes":
      return {
        discountCodesSettings: {
          ...(cart?.discountCodesSettings || defaultDiscountCodesSettings),
          enabled: false,
        },
      };
    case "addons":
      return {
        addonsSettings: {
          ...(cart?.addonsSettings || defaultAddonsSettings),
          enabled: false,
        },
      };
    case "summary":
      return {
        cartSettings: {
          ...cartSettings,
          summary: { ...(cartSettings.summary || {}), enabled: true },
        },
      };
    default:
      return {};
  }
};

function createCartPayload(shop, cartId, module) {
  const cartSettings = { ...defaultCartSettings };
  if (module === "one-tick-upsell") {
    cartSettings.oneTick = { enabled: true };
  }
  if (module === "summary") {
    cartSettings.summary = { enabled: true };
  }

  return {
    shop: shop.myshopifyDomain,
    shopEmail: shop.email,
    storeOwner: shop.name,
    cartId,
    cartName: "My Cart",
    designSettings: defaultSettings,
    headerSettings: defaultHeaderSettings,
    announcementSettings:
      module === "announcements"
        ? { ...defaultAnnouncementSettings, enabled: false }
        : defaultAnnouncementSettings,
    rewardsSettings:
      module === "rewards"
        ? { ...defaultRewardsSettings, enabled: false }
        : defaultRewardsSettings,
    recommendationsSettings: defaultRecommendationsSettings,
    subscriptionUpgradesSettings: defaultSubscriptionUpgradesSettings,
    upsellsSettings: defaultUpsellsSettings,
    additionalNotesSettings: defaultAdditionalNotesSettings,
    addonsSettings:
      module === "addons"
        ? { ...defaultAddonsSettings, enabled: false }
        : defaultAddonsSettings,
    discountCodesSettings:
      module === "discount-codes"
        ? { ...defaultDiscountCodesSettings, enabled: false }
        : defaultDiscountCodesSettings,
    expressPaymentsSettings: defaultExpressPaymentsSettings,
    trustBadgesSettings: defaultTrustBadgesSettings,
    cartSettings,
    triggeredRewardsSettings: defaultTriggeredRewardsSettings,
  };
}

export default function AppFeatures({ apiUrl, shop, carts = [], from = "home" }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [configuringModule, setConfiguringModule] = useState(null);

  const publishedCart = [...carts]
    .filter((cart) => cart.status === "published")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const handleConfigureFeature = async (module) => {
    if (configuringModule) return;

    setConfiguringModule(module);
    const existingCart =
      publishedCart ||
      [...carts].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      )[0];
    let targetCartId = existingCart?.cartId;

    try {
      if (existingCart) {
        const updateResponse = await updateCart(
          apiUrl,
          targetCartId,
          getFeatureUpdate(module, existingCart),
        );
        if (!updateResponse.ok) {
          throw new Error(
            `Feature update failed with status ${updateResponse.status}`,
          );
        }

        if (existingCart.status !== "published") {
          const publishResult = await togglePublishCart(apiUrl, targetCartId);
          if (!publishResult.success) {
            throw new Error(publishResult.message || "Cart publish failed");
          }
        }
      } else {
        targetCartId =
          "cart_" +
          Date.now() +
          "_" +
          Math.random().toString(36).slice(2, 11);

        const createResult = await createCart(
          apiUrl,
          createCartPayload(shop, targetCartId, module),
        );
        if (!createResult.success) {
          throw new Error(createResult.message || "Cart creation failed");
        }

        const publishResult = await togglePublishCart(apiUrl, targetCartId);
        if (!publishResult.success) {
          throw new Error(publishResult.message || "Cart publish failed");
        }
      }

      shopify.toast.show(
        existingCart
          ? "Feature enabled"
          : "Cart created and feature enabled",
      );
      navigate(
        `/app/carts/editor/${targetCartId}?from=${from}&module=${module}`,
      );
      revalidator.revalidate();
    } catch (error) {
      console.error("AUTO CREATE/ENABLE FEATURE ERROR:", error);
      shopify.toast.show("Unable to enable this feature");
    } finally {
      setConfiguringModule(null);
    }
  };

  return (
    <BlockStack gap="300">
      <Text variant="headingMd" as="h3">
        App Features 🔥
      </Text>

      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
        {FEATURES.map((feature) => (
          <Card key={feature.title} padding="400">
            <BlockStack gap="300">
              <InlineStack gap="300" wrap={false}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "#f1f2f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon source={feature.icon} />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Text variant="bodyMd" as="p">
                    {feature.title}
                  </Text>
                  <Text variant="headingSm" as="p">
                    {feature.subtitle}
                  </Text>
                </div>

                {feature.isActive(publishedCart) && (
                  <div style={{ flexShrink: 0 }}>
                    <Badge tone="success">Active</Badge>
                  </div>
                )}
              </InlineStack>

              <Button
                fullWidth
                loading={configuringModule === feature.module}
                disabled={!!configuringModule && configuringModule !== feature.module}
                onClick={() => handleConfigureFeature(feature.module)}
              >
                Configure
              </Button>
            </BlockStack>
          </Card>
        ))}
      </InlineGrid>
    </BlockStack>
  );
}
