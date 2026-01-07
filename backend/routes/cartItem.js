import express from "express";
import { cartModels } from "../model/cartModels.js";
const router = express.Router();

router.get("/api/get-cart", async (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ message: "Shop missing!" });

  try {
    const cart = await cartModels.findOne({ shop });
    res.json({ message: "Cart settings retrieved successfully!", data: cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/api/save-cart", async (req, res) => {
  const {
    shop,
    product,
    announcement,
    checkoutStyle,
    discount,
    cartItem,
    trustBages,
    checkoutSection,
    vipProduct,
    shippingProduct,
    progressBar,
    additionalNote,
    confirmationBox
  } = req.body;

  if (!shop) {
    return res.status(400).json({ message: "Shop info is missing!" });
  }

  let cleanedTrustBages = {};
  if (trustBages) {
    let selectedImages = trustBages.selectedImages || [];

    if (typeof selectedImages === "string") {
      try {
        selectedImages = JSON.parse(selectedImages);
      } catch (err) {
        selectedImages = [];
      }
    }

    if (!Array.isArray(selectedImages)) selectedImages = [];

    cleanedTrustBages = {
      selectedImages,
      isTrustVisible: trustBages.isTrustVisible || "false",
    };
  }

  try {
    const existingCart = await cartModels.findOne({ shop });

    if (existingCart) {
      existingCart.product = product;
      existingCart.announcement = announcement;
      existingCart.checkoutStyle = checkoutStyle;
      existingCart.discount = discount;
      existingCart.cartItem = cartItem;
      existingCart.trustBages = cleanedTrustBages;
      existingCart.checkoutSection = checkoutSection;
      existingCart.vipProduct = vipProduct;
      existingCart.shippingProduct = shippingProduct;
      existingCart.progressBar = progressBar;
      existingCart.additionalNote = additionalNote;
      existingCart.confirmationBox = confirmationBox;

      await existingCart.save();

      return res.json({
        message: "Cart settings updated successfully!",
        data: existingCart,
      });
    } else {
      const newCart = await cartModels.create({
        shop,
        product,
        announcement,
        checkoutStyle,
        discount,
        cartItem,
        trustBages: cleanedTrustBages,
        checkoutSection,
        vipProduct,
        shippingProduct,
        progressBar,
        additionalNote,
        confirmationBox
      });

      return res.json({
        message: "Cart settings saved successfully!",
        data: newCart,
      });
    }
  } catch (err) {
    console.error("Error saving cart:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

export default router;
