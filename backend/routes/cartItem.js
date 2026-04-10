import express from "express";
import { cartModels } from "../model/schema.js";
import crypto from "crypto";

const generateNewCartId = () => {
  return "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

const router = express.Router();

router.get("/get-carts", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: shop",
      });
    }
    const carts = await cartModels.find({ shop });

    return res.status(200).json({
      success: true,
      message: "Carts retrieved successfully",
      data: carts,
    });
  } catch (error) {
    console.error("GET CARTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/get-cart/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Missing cartId",
      });
    }

    const cart = await cartModels.findOne({ cartId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/create-cart", async (req, res) => {
  try {
    const { shop, shopEmail, storeOwner } = req.body;

    if (!shop || !shopEmail || !storeOwner) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const count = await cartModels.countDocuments({ shop });

    const cartName = `Untitled cart ${count + 1}`;

    const cartId = crypto.randomUUID();

    const newCart = await cartModels.create({
      shop,
      shopEmail,
      storeOwner,
      cartId,
      cartName,
      status: "unpublished",
    });

    return res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: newCart,
    });
  } catch (error) {
    console.error("CREATE CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put("/update-cart/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;

    const updateData = {};

    if (req.body.cartName) updateData.cartName = req.body.cartName;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.designSettings)
      updateData.designSettings = req.body.designSettings;
    if (req.body.headerSettings)
      updateData.headerSettings = req.body.headerSettings;
    if (req.body.announcementSettings)
      updateData.announcementSettings = req.body.announcementSettings;
    if (req.body.rewardsSettings)
      updateData.rewardsSettings = req.body.rewardsSettings;
    if (req.body.recommendationsSettings)
      updateData.recommendationsSettings = req.body.recommendationsSettings;
    if (req.body.subscriptionUpgradesSettings)
      updateData.subscriptionUpgradesSettings =
        req.body.subscriptionUpgradesSettings;
    if (req.body.upsellsSettings)
      updateData.upsellsSettings = req.body.upsellsSettings;
    if (req.body.additionalNotesSettings)
      updateData.additionalNotesSettings = req.body.additionalNotesSettings;
    if (req.body.addonsSettings)
      updateData.addonsSettings = req.body.addonsSettings;
    if (req.body.discountCodesSettings)
      updateData.discountCodesSettings = req.body.discountCodesSettings;
    if (req.body.expressPaymentsSettings)
      updateData.expressPaymentsSettings = req.body.expressPaymentsSettings;
  if (req.body.trustBadgesSettings)
      updateData.trustBadgesSettings = req.body.trustBadgesSettings;
   if (req.body.cartSettings)
      updateData.cartSettings = req.body.cartSettings;
  if (req.body.triggeredRewardsSettings)
      updateData.triggeredRewardsSettings = req.body.triggeredRewardsSettings;

    const updatedCart = await cartModels.findOneAndUpdate(
      { cartId },
      updateData,
      { new: true },
    );

    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.delete("/delete-cart", async (req, res) => {
  try {
    const { cartId } = req.body;
    const deletedCart = await cartModels.findOneAndDelete({ cartId });

    if (!deletedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      data: deletedCart,
    });
  } catch (error) {
    console.error("DELETE CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/toggle-publish", async (req, res) => {
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "cartId required",
      });
    }

    // current cart find karo
    const currentCart = await cartModels.findOne({ cartId });

    if (!currentCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (currentCart.status === "published") {
      await cartModels.updateOne(
        { cartId },
        { $set: { status: "unpublished" } }
      );

      return res.json({
        success: true,
        message: "Cart unpublished",
      });
    }

    await cartModels.updateMany(
      { shop: currentCart.shop, status: "published" },
      { $set: { status: "unpublished" } }
    );

    await cartModels.updateOne(
      { cartId },
      { $set: { status: "published" } }
    );

    return res.json({
      success: true,
      message: "Cart published",
    });

  } catch (error) {
    console.error("TOGGLE PUBLISH ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/duplicate-cart", async (req, res) => {
  try {
    const { cartId } = req.body;

    const existingCart = await cartModels.findOne({ cartId });

    if (!existingCart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const newCart = {
      ...existingCart._doc,
      _id: undefined, 
      cartId: generateNewCartId(), 
      cartName: `Copy of ${existingCart.cartName || "Untitled cart"}`,
      status: "unpublished",
      createdAt: new Date(),
    };

    const savedCart = await cartModels.create(newCart);

    res.json({
      success: true,
      data: savedCart,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

export default router;
