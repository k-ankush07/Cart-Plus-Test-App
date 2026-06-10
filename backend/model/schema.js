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
    subscriptionUpgradesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    upsellsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    additionalNotesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    addonsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    discountCodesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    expressPaymentsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    trustBadgesSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    cartSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    triggeredRewardsSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const stickyCartSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  cartId: { type: String, required: true, unique: true },
  position: {
    type: String,
    enum: ["bottom-right", "center-right", "top-right", "bottom-left", "center-left", "top-left"],
    default: "bottom-right",
  },
  enabled: { type: Boolean, default: true },
  selectedIcon: { type: String, default: "bag" },
  bgColor: { type: String, default: "#000000" },
  iconColor: { type: String, default: "#ffffff" },
  qBgColor: { type: String, default: "#e42626" },
  qTextColor: { type: String, default: "#ffffff" },
  device: { type: String, default: "all" },
  customCss: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// Stores the offline Admin API access token per shop so the backend
// can call Shopify Admin API without requiring an embedded session.
const shopConfigSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  email:{type:String},
  updatedAt: { type: Date, default: Date.now },
});

const shopPlanSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  price: { type: Number, required: true },
  subscriptionId: { type: String, default: null },
  emailSent: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "pending", "cancelled"], default: "active" },
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

const cartOrderCountSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  cartId: { type: String, required: true },
  date: { type: String, required: true },
  totalOrders: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cartOrderCountSchema.index({ shop: 1, cartId: 1, date: 1 }, { unique: true });

const cartModels          = mongoose.models["carts"]          || mongoose.model("carts", cartSchema);
const stickyCartModel     = mongoose.models["stickyCart"]     || mongoose.model("stickyCart", stickyCartSchema);
const shopConfigModel     = mongoose.models["shopConfig"]     || mongoose.model("shopConfig", shopConfigSchema);
const shopPlanModel       = mongoose.models["Plans"]          || mongoose.model("Plans", shopPlanSchema);
const analyticsModel      = mongoose.models["Analytics"]      || mongoose.model("Analytics", analyticsSchema);
const orderRevenueModel   = mongoose.models["OrderRevenue"]   || mongoose.model("OrderRevenue", orderRevenueSchema);
const cartOrderCountModel = mongoose.models["CartOrderCount"] || mongoose.model("CartOrderCount", cartOrderCountSchema);

export { cartModels, stickyCartModel, shopConfigModel, shopPlanModel, analyticsModel, orderRevenueModel, cartOrderCountModel };