export const defaultSettings = {
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

export const defaultHeaderSettings = {
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
  borderHoverEnabled: false,
};

export const defaultAnnouncementSettings = {
  enabled: true,
  height: "normal",
  position: "before",
  timer: "00:00",
  text: "Your products are reserved for {TIMER}!",
  fontSize: 15,
  backgroundColor: "#f6f6f7",
  borderColor: "#e8e8e8",
};

export const defaultRewardsSettings = {
  enabled: true,
  showOnEmptyCart: true,
  backgroundColor: "#E2E2E2",
  textColor: "#000000",
  completeIconColor: "#ffffff",
  incompleteIconColor: "#4D4949",
  successText: "Free shipping unlocked!",

  calculationType: "total",
  usePreDiscount: true,

  tiers: [
    {
      id: 1,
      type: "shipping",
      minAmount: 1000,
      minQuantity: 1,
      description: "Free Shipping",
      title: "You're {AMOUNT} away from free shipping!",
      showIcon: true,
      products: [],
    },
  ],
  activeTier: 0,
};

export const defaultRecommendationsSettings = {
  enabled: true,
  headerText: "Add your favourite items to your cart.",
  productHeaderText: "You may also like",
  showShopNowButton: false,
  buttonText: "Shop Now",
  buttonUrl: "/collections",
  sourceType: "products",
  maxRecommendations: 10,
  layout: "block",
  showReviews: false,
};

export const defaultSubscriptionUpgradesSettings = {
  enabled: false,
  buttonText: "Upgrade to {{selling_plan_group_name}}",
  overridePlanOptionsText: true,
  planOptionsText: "{{selling_plan_group_name}} / {{selling_plan_name}}",
  planOptionsOneTimePurchaseText: "One-time purchase",
  planFullPriceText: "Full price",
  planHeadingText: "Subscription plans",
  preventDowngrades: false,
};