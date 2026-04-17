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
  continueshopping:false
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

export const defaultUpsellsSettings = {
  enabled: true,
  useAiRecommended: true,
  recommendationAlgorithm: "related",
  useSmartVariantMatching: true,
  sourceType: "products",
  showIfAlreadyInCart: false,
  limitUpsellsInCart: false,
  maxUpsellsInCart: 3,
  showReviews: false,
  title: "You'll love these",
  buttonText: "Add",
  position: "bottom",
  direction: "block",
};

export const defaultAdditionalNotesSettings = {
  enabled: true,
  title: "Add special instructions",
  placeholder: "Special instructions for your order",
  placement: "below_items",
  customTemplate: "",
};

export const defaultAddonsSettings = {
  enabled: true,
  type: "shipping_protection",
  title: "Shipping Protection",
  description: "Protect your order from damage, loss, or theft during shipping.",
  price: "2.50",
  sourceType: "products",
  dynamicPricing: false,
  includeInItemCount: true,
  autoFulfill: true,
  includeTracking: true,
  customShippingProduct: null,
  saveShippingProtectionWithOrder: false,
};

export const defaultDiscountCodesSettings = {
  enabled: true,
  placeholder: "Discount code",
  buttonText: "Apply",
  customTemplate: "",
};

export const defaultExpressPaymentsSettings = {
  enabled: true,
  defaultButtonHeight: 42,
  mobileButtonHeight: 38,
  alignment: "center",
  rowGap: 8,
  hideBuyerConsent: true,
  renderInShadowDom: true,
};

export const defaultTrustBadgesSettings = {
  enabled: true,
  customImage: "",
  presetImage: "",
  position: "top",
  customTemplate: "",
};

export const defaultCartSettings = {
  // Cart settings
  cartPosition: "slide_from_left",
  trafficAllocationPercent: 20,
  disableFixedFooter: false,
  openOnAddToCart: true,
  goToCartPageOnCheckout: true,
  showSavingsBelowPrices: true,
  enableLoadingPreview: true,
  // Advanced settings
  showDiscountsFromBasePrice: false,
  showCompareAtPriceSavingsInFooter: false,
  hideSingleUnderscoreProperties: true,
  enhancedAjaxCompatibility: false,
  forceRerenderCustomHtml: false,
  skipGoogleFonts: false,
  overrideScrollLocking: false,
  integrateYmqProductOptions: false,
  renderCartInShadowDom: false,
  trackCartEvents: true,
  // Button selectors
  openCartButtonSelector: "default",
  openCartButtonCustomSelector: "",
  addToCartButtonSelector: "default",
  addToCartButtonCustomSelector: "",
  accessCustomTemplates: false,
  // Edit copy
  savingsText: "Save",
  emptyCartMessage: "Your cart is empty",
  continueShoppingText: "Or continue shopping",
  discountsSavingsText: "Discounts",
  checkoutButtonText: "Checkout • {{total_price}}",
  showBundleSingular: "Show 1 item",
  showBundlePlural: "Show {NUMBER_OF_ITEMS} items",
  hideBundleSingular: "Hide 1 item",
  hideBundlePlural: "Hide {NUMBER_OF_ITEMS} items",
  // Custom HTML — one block per position
  customHtmlBlocks: {
    above_announcements: "",
    below_header: "",
    between_line_items: "",
    below_cart_items: "",
    above_footer: "",
    above_checkout: "",
    below_checkout: "",
    bottom_of_cart: "",
    empty_cart: "",
    scripts_before_load: "",
  },
  // Custom CSS
  customCss: "",
  // Cart item layout
  cartItemLayout: "classic",
};

export const defaultTriggeredRewardsSettings = {
  rewards: [],
  discountCombinations: {
    productDiscounts: true,
    orderDiscounts: true,
    shippingDiscounts: true,
  },
};

export const defaultSubscriptionUpgradesSettings = {
  enabled: true,
  buttonText: "Upgrade to {{selling_plan_group_name}}",
  overridePlanOptionsText: false,
  planOptionsText: "{{selling_plan_group_name}} / {{selling_plan_name}}",
  planOptionsOneTimePurchaseText: "One-time purchase",
  planFullPriceText: "Full price",
  planHeadingText: "Subscription plans",
  preventDowngrades: false,
};

