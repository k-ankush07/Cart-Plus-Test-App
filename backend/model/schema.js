import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
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
  designSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  headerSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  announcementSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  rewardsSettings : {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: { type: Date, default: Date.now },
});

const cartModels = mongoose.model("cartItems", cartSchema);

export { cartModels };
