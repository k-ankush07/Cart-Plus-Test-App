import { TEMPLATE_DEFAULTS } from "../utils/templateTheme";

export const defaultSettings = {
  ...TEMPLATE_DEFAULTS,
  inheritFonts: true,
  showStrikethrough: true,
  enableSubtotal: true,
  enableShipping:true,
  desktopWidth: "default",
  mobileWidth: "full",
  backgroundColor: "#FFFFFF",
  accentColor: "#f6f6f7",
  textColor: "#000000",
  savingsColor: "#2ea818",
  subtotalColor: "#000000",
  discountBageColor:"#1e7e34",
  buttonRadius: "0",
  buttonColor: "#000000",
  buttonTextColor: "#FFFFFF",
  buttonHoverColor: "#e9e9e9",
  iconColor:"#ABABAB",
  continueshopping: false,
};

export const defaultHeaderSettings = {
  height: "slim",
  border: "thin",
  backgroundColor: "#ffffff00",
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
  iconBgColor: "#00000000",
  iconbgHoverColor: "#00000000",
  iconSize: "small",
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
  text: "Free shipping on $50 | Free gift on $60",
  fontSize: 15,
  backgroundColor: "#f6f6f7",
  borderColor: "#e8e8e8",
  borderRadius :6,
  showClose :true
};

export const defaultRewardsSettings = {
  enabled: true,
  showOnEmptyCart: true,
  backgroundColor: "#E2E2E2",
  textColor: "#000000",
  completeIconColor: "#ffffff",
  incompleteIconColor: "#4D4949",
  successText: "Free shipping unlocked!",
  barLength: 5,
  barGap: 0,
  calculationType: "total",
  usePreDiscount: true,
  barStyle: "icon", // "icon" | "reward" | "nextReward" | "milestone" | "threshold"
  rewardTicketLabel: "REWARD TICKET",
  nextRewardLabel: "NEXT REWARD",
  milestoneDoneLabel: "DONE",
  barBackground: null, // BackgroundInput value, null = backgroundColor
  barProgress: null, // BackgroundInput value, null = textColor

  tiers: [
    {
      id: 1,
      type: "shipping",
      minAmount: 500,
      minQuantity: 1,
      description: "Free Shipping",
      title: "You're {AMOUNT} away from free shipping!",
      showIcon: false,
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
  maxRecommendations: 3,
  layout: "block",
  showReviews: false,
  carouselIndicator: "progressBar",
  reviewCountText: "({{review_count}} reviews)",
};

export const defaultUpsellsSettings = {
  enabled: true,
  useAiRecommended: false,
  recommendationAlgorithm: "related",
  useSmartVariantMatching: true,
  sourceType: "products",
  showIfAlreadyInCart: false,
  limitUpsellsInCart: false,
  maxUpsellsInCart: 3,
  showSuggestedProduct: false,
  suggestedProduct: null,
  showReviews: false,
  reviewCountText: "({{review_count}} reviews)",
  title: "You'll love these",
  buttonText: "Add",
  position: "bottom",
  direction: "carousel",
  layout: "carousel", // "row" | "list" | "carousel" (row/list are the block direction)
  trigger: "button", // "button" | "checkbox" | "toggle"
  carouselIndicator: "none",
  // Cross-sell offer + styles (null = the cart's own look)
  icon: { type: "icon", name: "star" }, // title icon from the icon library (null = none)
  iconColor: null,
  discountType: "none", // "none" | "percentage" | "amount"
  discountValue: 10,
  showLabel: true,
  labelText: "Save {{saved_percentage}}",
  imageSize: null,
  radius: null,
  primaryTextColor: null,
  secondaryTextColor: null,
  buttonRadius: null,
  buttonFontSize: null,
  buttonBackground: null,
  buttonTextColor: null,
  cardBackground: null,
};

export const defaultAdditionalNotesSettings = {
  enabled: true,
  title: "Add special instructions",
  placeholder: "Special instructions for your order",
  placement: "below_items",
  customTemplate: "",
  expandable: true,
  collapsedByDefault: true,
  buttonLabel: "Note",
  heading: "Order note",
  saveLabel: "Save note",
  limitChars: true,
  noteButtonBackground: null, // BackgroundInput values, null = the cart's own look
  orderNoteBackground: null,
  saveNoteBackground: null,
};

export const defaultAddonsSettings = {
  enabled: true,
  type: "shipping_protection",
  title: "Shipping Protection",
  description:
    "Protect your order from damage, loss, or theft during shipping.",
  price: "2.50",
  compareAtPrice: "",
  showDescription: true,
  cardBackground: null, // BackgroundInput values, null = the cart's own look
  background: null,
  toggleColor: "#000000",
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
  showViewAllOffers: false,
  couponHeadingColor: "#000000", 
  viewAllOffersColor: "#000000",
  viewAllOffersBgColor: "#ffffff", 
  title:"Coupon Code",
  showTitle:true,
  showOfferBgColor:"#6C4DFF",
  invalidCodeMessage:
    "This discount code isn't valid. Please check the code and try again.",
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
  cartPosition: "slide_from_right",
  trafficAllocationPercent: 20,
  disableFixedFooter: false,
  openOnAddToCart: true,
  goToCartPageOnCheckout: true,
  showSavingsBelowPrices: true,
  enableLoadingPreview: true,
  viewCartName:"View Cart",
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
  deleteBehavior: "undo",
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
