import express from "express";
import {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
} from "../model/schema.js";
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
    if (req.body.cartSettings) updateData.cartSettings = req.body.cartSettings;
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
        { $set: { status: "unpublished" } },
      );

      return res.json({
        success: true,
        message: "Cart unpublished",
      });
    }

    await cartModels.updateMany(
      { shop: currentCart.shop, status: "published" },
      { $set: { status: "unpublished" } },
    );

    await cartModels.updateOne({ cartId }, { $set: { status: "published" } });

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

router.post("/save-sticky-cart", async (req, res) => {
  try {
    let {
      shop,
      cartId,
      position,
      enabled,
      selectedIcon,
      bgColor,
      iconColor,
      qBgColor,
      qTextColor,
      device,
      customCss,
    } = req.body;

    if (!cartId) {
      cartId = generateNewCartId();
    }

    const updatedStickyCart = await stickyCartModel.findOneAndUpdate(
      { shop },
      {
        shop,
        cartId,
        position,
        enabled,
        selectedIcon,
        bgColor,
        iconColor,
        qBgColor,
        qTextColor,
        device,
        customCss,
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.json({
      success: true,
      data: updatedStickyCart,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

router.get("/get-sticky-cart/:shop", async (req, res) => {
  try {
    const { shop } = req.params;
    const stickyCart = await stickyCartModel.findOne({ shop });

    if (!stickyCart) {
      return res.status(404).json({
        success: false,
        message: "Sticky cart not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: stickyCart,
    });
  } catch (error) {
    console.error("GET STICKY CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Called by the Remix app after OAuth to persist the offline Admin token.
// Only updates the DB if the token has changed.
router.post("/save-shop-token", async (req, res) => {
  try {
    const { shop, accessToken } = req.body;
    if (!shop || !accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shop or accessToken" });
    }

    const existing = await shopConfigModel.findOne({ shop });

    if (existing?.accessToken === accessToken) {
      return res.json({ success: true, updated: false });
    }

    await shopConfigModel.findOneAndUpdate(
      { shop },
      { accessToken, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return res.json({ success: true, updated: true });
  } catch (error) {
    console.error("SAVE SHOP TOKEN ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

// ─── Shop Plan Routes ─────────────────────────────────────────────────────────

router.get("/shop-plan", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop)
      return res.status(400).json({ success: false, message: "Missing shop" });

    const plan = await shopPlanModel.findOne({ shop });
    return res.status(200).json({ success: true, data: plan || null });
  } catch (error) {
    console.error("GET SHOP PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/shop-plan", async (req, res) => {
  try {
    const { shop, plan, price, subscriptionId, status } = req.body;
    if (!shop || !plan || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const updated = await shopPlanModel.findOneAndUpdate(
      { shop },
      {
        shop,
        plan,
        price,
        subscriptionId,
        status: status || "active",
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("UPSERT SHOP PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/shop-plan", async (req, res) => {
  try {
    const { shop } = req.body;
    if (!shop)
      return res.status(400).json({ success: false, message: "Missing shop" });

    await shopPlanModel.deleteMany({ shop });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE SHOP PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/cart-impression", async (req, res) => {
  try {
    const { shop, sessionId, userAgent } = req.body;

    if (!shop || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Missing shop or sessionId",
      });
    }

    const exists = await analyticsModel.findOne({
      shop,
      sessionId,
      eventType: "cart_impression",
    });

    if (exists) {
      return res.json({ success: true, duplicate: true });
    }

    await analyticsModel.create({
      shop,
      sessionId,
      userAgent,
      eventType: "cart_impression",
      createdAt: new Date(),
      meta: {
        source: "cart_drawer",
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("CART IMPRESSION ERROR:", error);
    res.status(500).json({ success: false });
  }
});

// ── Track checkout events (checkout_initiated / checkout_completed) ──────────
router.post("/track-event", async (req, res) => {
  try {
    const { shop, sessionId, eventType, userAgent, meta } = req.body;

    if (!shop || !sessionId || !eventType) {
      return res.status(400).json({
        success: false,
        message: "Missing shop, sessionId, or eventType",
      });
    }

    const allowed = ["checkout_initiated", "checkout_completed"];
    if (!allowed.includes(eventType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid eventType" });
    }

    await analyticsModel.create({
      shop,
      sessionId,
      userAgent: userAgent || "",
      eventType,
      meta: meta || {},
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("TRACK EVENT ERROR:", error);
    res.status(500).json({ success: false });
  }
});

// ─── Order Revenue Tracking ───────────────────────────────────────────────────

router.post("/order-revenue", async (req, res) => {
  try {
    const {
      shop,
      cartToken,
      sessionId,
      currency,
      totalRevenue,
      upsellRevenue,
      addonRevenue,
      subscriptionRevenue,
      baseRevenue,
    } = req.body;

    if (!shop || !cartToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shop or cartToken" });
    }

    // Only save if shop has app installed AND has an active published cart
    const publishedCart = await cartModels.findOne({
      shop,
      status: "published",
    });
    if (!publishedCart) {
      console.warn(
        `[order-revenue] Rejected: no published cart for shop: ${shop}`,
      );
      return res
        .status(403)
        .json({ success: false, message: "No active cart for shop" });
    }

    await orderRevenueModel.findOneAndUpdate(
      { orderId: cartToken },
      {
        shop,
        orderId: cartToken,
        sessionId: sessionId || "",
        currency: currency || "USD",
        totalRevenue: totalRevenue || 0,
        upsellRevenue: upsellRevenue || 0,
        addonRevenue: addonRevenue || 0,
        subscriptionRevenue: subscriptionRevenue || 0,
        baseRevenue: baseRevenue || 0,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("ORDER REVENUE ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

router.get("/revenue-stats", async (req, res) => {
  try {
    const { shop } = req.query;

    const cleanShop = shop
      ?.replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");

    if (!shop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    // ───── Revenue Totals ─────
    const [totals] = await orderRevenueModel.aggregate([
      { $match: { shop: cleanShop } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalRevenue" },
          upsellRevenue: { $sum: "$upsellRevenue" },
          addonRevenue: { $sum: "$addonRevenue" },
          subscriptionRevenue: { $sum: "$subscriptionRevenue" },
          baseRevenue: { $sum: "$baseRevenue" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // ───── Last 30 days revenue ─────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyRevenue = await orderRevenueModel.aggregate([
      { $match: { shop: cleanShop, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          upsellRevenue: { $sum: "$upsellRevenue" },
          addonRevenue: { $sum: "$addonRevenue" },
          subscriptionRevenue: { $sum: "$subscriptionRevenue" },
          baseRevenue: { $sum: "$baseRevenue" },
          total: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ───── Analytics Data (NEW) ─────
    const analyticsStats = await analyticsModel.aggregate([
      { $match: { shop: cleanShop } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object
    const analyticsFormatted = {};
    analyticsStats.forEach((item) => {
      analyticsFormatted[item._id] = item.count;
    });

    const checkoutsCompleted = await orderRevenueModel.countDocuments({
      shop: cleanShop,
    });

    // ───── FINAL RESPONSE ─────
    return res.json({
      success: true,
      data: {
        revenue: {
          totals: totals || {
            totalRevenue: 0,
            upsellRevenue: 0,
            addonRevenue: 0,
            subscriptionRevenue: 0,
            baseRevenue: 0,
            orderCount: 0,
          },
          daily: dailyRevenue,
        },
        analytics: analyticsFormatted,
        checkoutsCompleted,
      },
    });
  } catch (error) {
    console.error("REVENUE STATS ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

export default router;
