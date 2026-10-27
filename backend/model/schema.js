import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true },
    shopEmail: { type: String, required: true },
    storeOwner: { type: String, required: true },
    cartId: { type: String, required: true, unique: true },
    cartName: { type: String, required: true },
    status: {
      type: String,
      enum: ["unpublished", "published"],
      default: "unpublished",
    },
    lastLiveDate: { type: Date, default: null },
    designSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    headerSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    announcementSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    rewardsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendationsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    subscriptionUpgradesSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    upsellsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    additionalNotesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    addonsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    discountCodesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    expressPaymentsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    trustBadgesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    cartSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    triggeredRewardsSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// get-carts queries by shop on every dashboard load.
cartSchema.index({ shop: 1 });

const POSITIONS = [
  // floating templates (bubble / pill / ring)
  "bottom-right",
  "center-right",
  "top-right",
  "bottom-left",
  "center-left",
  "top-left",
  // edge tab
  "right",
  "left",
  // bottom bar
  "bottom",
];
 
const stickyCartSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  cartId: { type: String, required: true, unique: true },
 
  enabled: { type: Boolean, default: true },
 
  // NEW: which design is used
  template: {
    type: String,
    enum: ["bubble", "pill", "ring", "tab", "bar"],
    default: "bubble",
  },
 
  // Desktop + mobile positioning (valid values depend on the template)
  position: { type: String, enum: POSITIONS, default: "bottom-right" },
  mobilePosition: { type: String, enum: POSITIONS, default: "bottom-right" }, // NEW
  displayOnMobile: { type: Boolean, default: true }, // NEW (replaces device)
  device: { type: String, default: "all" }, // kept for older readers: "all" | "desktop"
 
  // Icon
  selectedIcon: { type: String, default: "bag" }, // cart | basket | basket-2 | bag | bag-2 | tote | custom
  customIconUrl: { type: String, default: null },
  iconColor: { type: String, default: "#ffffff" },
  iconSize: { type: Number, min: 16, max: 40, default: 24 }, // was 24–72, default 45
 
  // Button
  bgColor: { type: String, default: "#000000" }, // template colour
  buttonSize: { type: Number, min: 40, max: 100, default: 60 }, // was 56–120, default 82
 
  // Count badge
  enableCount: { type: Boolean, default: true }, // NEW
  qBgColor: { type: String, default: "#6d3bff" },
  qTextColor: { type: String, default: "#ffffff" },
 
  hideOnEmptyCart: { type: Boolean, default: false },
  customCss: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
 
// Stores the offline Admin API access token per shop so the backend
// can call Shopify Admin API without requiring an embedded session.
const shopConfigSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  email: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const shopPlanSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  price: { type: Number, required: true },
  subscriptionId: { type: String, default: null },
  status: {
    type: String,
    enum: ["active", "pending", "cancelled"],
    default: "active",
  },

  isDev: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const analyticsSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  cartId: { type: String },

  eventType: {
    type: String,
    enum: ["cart_impression", "checkout_initiated", "checkout_completed"],
    required: true,
  },

  sessionId: { type: String, required: true },

  userAgent: { type: String },

  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  createdAt: { type: Date, default: Date.now },
});

// Indexes: cart-stats / revenue-stats filter Analytics by shop + createdAt
// (and often eventType / cartId). Without these, every dashboard load does a
// full collection scan of Analytics — the main cause of multi-second loads.
analyticsSchema.index({ shop: 1, createdAt: 1 });
analyticsSchema.index({ shop: 1, cartId: 1, createdAt: 1 });
analyticsSchema.index({ shop: 1, eventType: 1, createdAt: 1 });

const orderRevenueSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  cartId: { type: String },
  orderId: { type: String, required: true, unique: true },
  orderNumber: { type: Number },
  currency: { type: String, default: "USD" },
  totalRevenue: { type: Number, default: 0 },
  baseRevenue: { type: Number, default: 0 },
  upsellRevenue: { type: Number, default: 0 },
  addonRevenue: { type: Number, default: 0 },
  subscriptionRevenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// OrderRevenue is aggregated by shop + createdAt (and cartId) in cart-stats /
// revenue-stats. Only orderId was indexed before, forcing full scans.
orderRevenueSchema.index({ shop: 1, createdAt: 1 });
orderRevenueSchema.index({ shop: 1, cartId: 1, createdAt: 1 });

const cartOrderCountSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  cartId: { type: String, required: true },
  date: { type: String, required: true },
  totalOrders: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cartOrderCountSchema.index({ shop: 1, cartId: 1, date: 1 }, { unique: true });

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String,},
  email:{ type: String, required: true },
  phone: { type: String,},
  address: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

contactSchema.index({ createdAt: -1 });

const cartModels =
  mongoose.models["carts"] || mongoose.model("carts", cartSchema);
const stickyCartModel =
  mongoose.models["stickyCart"] ||
  mongoose.model("stickyCart", stickyCartSchema);
const shopConfigModel =
  mongoose.models["shopConfig"] ||
  mongoose.model("shopConfig", shopConfigSchema);
const shopPlanModel =
  mongoose.models["Plans"] || mongoose.model("Plans", shopPlanSchema);
const analyticsModel =
  mongoose.models["Analytics"] || mongoose.model("Analytics", analyticsSchema);
const orderRevenueModel =
  mongoose.models["OrderRevenue"] ||
  mongoose.model("OrderRevenue", orderRevenueSchema);
const cartOrderCountModel =
  mongoose.models["CartOrderCount"] ||
  mongoose.model("CartOrderCount", cartOrderCountSchema);

const contactModel =
  mongoose.models["Contact"] || mongoose.model("Contact", contactSchema);
 
export {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
  cartOrderCountModel,
  contactModel
};
