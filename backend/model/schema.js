import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
});

const cartModels = mongoose.model("cartItems", cartSchema);
export { cartModels };
