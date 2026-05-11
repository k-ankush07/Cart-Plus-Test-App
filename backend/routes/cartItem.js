import express from "express";
import {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
  cartOrderCountModel,
} from "../model/schema.js";

import crypto from "crypto";

const generateNewCartId = () => {
  return "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
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
    const {
      shop, shopEmail, storeOwner, cartId: clientCartId,
      designSettings, headerSettings, announcementSettings,
      rewardsSettings, recommendationsSettings, subscriptionUpgradesSettings,
      upsellsSettings, additionalNotesSettings, addonsSettings,
      discountCodesSettings, expressPaymentsSettings, trustBadgesSettings,
      cartSettings, triggeredRewardsSettings,
    } = req.body;

    if (!shop || !shopEmail || !storeOwner) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const count = await cartModels.countDocuments({ shop });
    const cartName = `Untitled cart ${count + 1}`;
    const cartId = clientCartId || crypto.randomUUID();

    const newCart = await cartModels.create({
      shop, shopEmail, storeOwner, cartId, cartName,
      status: "unpublished",
      designSettings,
      headerSettings,
      announcementSettings,
      rewardsSettings,
      recommendationsSettings,
      subscriptionUpgradesSettings,
      upsellsSettings,
      additionalNotesSettings,
      addonsSettings,
      discountCodesSettings,
      expressPaymentsSettings,
      trustBadgesSettings,
      cartSettings,
      triggeredRewardsSettings,
    });

    return res.status(201).json({ success: true, message: "Cart created successfully", data: newCart });
  } catch (error) {
    console.error("CREATE CART ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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

    const cart = await cartModels.findOne({ cartId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const isPublishing = cart.status !== "published";

    if (isPublishing) {
      await cartModels.updateMany(
        { shop: cart.shop, status: "published" },
        { $set: { status: "unpublished" } }
      );
    }

    const updateData = {
      status: isPublishing ? "published" : "unpublished",
      ...(isPublishing && { lastLiveDate: new Date() }),
    };

    const updatedCart = await cartModels.findOneAndUpdate(
      { cartId },
      { $set: updateData },
      { new: true }
    );

    return res.json({
      success: true,
      data: updatedCart,
      message: isPublishing ? "Cart published successfully" : "Cart unpublished successfully",
    });
  } catch (error) {
    console.error("TOGGLE PUBLISH ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
    const { shop, cartId, sessionId, userAgent } = req.body;

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
      cartId: cartId || null,
      sessionId,
      userAgent,
      eventType: "cart_impression",
      createdAt: new Date(),
      meta: { source: "cart_drawer" },
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
    const { shop, cartId, sessionId, eventType, userAgent, meta } = req.body;

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
      cartId: cartId || null,
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

    // Always count the order against the published cart when the app is enabled.
    await cartOrderCountModel.findOneAndUpdate(
      { shop, cartId: publishedCart.cartId },
      { $inc: { totalOrders: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true },
    );

    // Only persist a revenue record when the cart drawer actually contributed
    // upsell / addon / subscription revenue. Pure base-revenue orders are
    // counted above but skipped here.
    const hasHubRevenue =
      Number(upsellRevenue) > 0 ||
      Number(addonRevenue) > 0 ||
      Number(subscriptionRevenue) > 0;

    if (!hasHubRevenue) {
      return res.json({ success: true, counted: true, revenueSaved: false });
    }

    await orderRevenueModel.findOneAndUpdate(
      { orderId: cartToken },
      {
        shop,
        cartId: publishedCart.cartId,
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

    return res.json({ success: true, counted: true, revenueSaved: true });
  } catch (error) {
    console.error("ORDER REVENUE ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

router.get("/cart-stats", async (req, res) => {
    try {
        const { shop, startDate, endDate } = req.query;
        if (!shop) return res.status(400).json({ success: false, message: "Missing shop" });

        const cleanShop = shop.replace("https://", "").replace("http://", "").replace(/\/$/, "");

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // include full end day
            dateFilter.$lte = end;
        }
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        const revenueMatch = {
            shop: cleanShop,
            cartId: { $exists: true, $nin: [null, ""] },
            ...(hasDateFilter && { createdAt: dateFilter }),
        };

        const analyticsMatch = {
            shop: cleanShop,
            cartId: { $exists: true, $nin: [null, ""] },
            ...(hasDateFilter && { createdAt: dateFilter }),
        };

        const shopAnalyticsMatch = {
            shop: cleanShop,
            ...(hasDateFilter && { createdAt: dateFilter }),
        };

        const shopRevenueMatch = {
            shop: cleanShop,
            ...(hasDateFilter && { createdAt: dateFilter }),
        };

        const [revenueByCart, analyticsByCart, shopAnalytics, publishedCart, shopRevenueBreakdown] = await Promise.all([
            orderRevenueModel.aggregate([
                { $match: revenueMatch },
                { $group: { _id: "$cartId", totalRevenue: { $sum: "$totalRevenue" } } },
            ]),
            analyticsModel.aggregate([
                { $match: analyticsMatch },
                { $group: { _id: { cartId: "$cartId", eventType: "$eventType" }, count: { $sum: 1 } } },
            ]),
            analyticsModel.aggregate([
                { $match: shopAnalyticsMatch },
                { $group: { _id: "$eventType", count: { $sum: 1 } } },
            ]),
            cartModels.findOne({ shop: cleanShop, isPublished: true }).lean(),
            orderRevenueModel.aggregate([
                { $match: shopRevenueMatch },
                {
                    $group: {
                        _id: null,
                        addonRevenue: { $sum: "$addonRevenue" },
                        upsellRevenue: { $sum: "$upsellRevenue" },
                        subscriptionRevenue: { $sum: "$subscriptionRevenue" },
                    },
                },
            ]),
        ]);

        const stats = {};

        revenueByCart.forEach(({ _id, totalRevenue }) => {
            if (!stats[_id]) stats[_id] = { revenue: 0, impressions: 0, checkouts: 0 };
            stats[_id].revenue = totalRevenue;
        });

        analyticsByCart.forEach(({ _id: { cartId, eventType }, count }) => {
            if (!stats[cartId]) stats[cartId] = { revenue: 0, impressions: 0, checkouts: 0 };
            if (eventType === "cart_impression") stats[cartId].impressions = count;
            if (eventType === "checkout_initiated") stats[cartId].checkouts = count;
        });

        if (publishedCart?.cartId) {
            const pid = publishedCart.cartId;
            const hasPerCartAnalytics =
                stats[pid] && (stats[pid].impressions > 0 || stats[pid].checkouts > 0);

            if (!hasPerCartAnalytics) {
                const shopImpressions = shopAnalytics.find((e) => e._id === "cart_impression")?.count || 0;
                const shopCheckouts = shopAnalytics.find((e) => e._id === "checkout_initiated")?.count || 0;

                if (!stats[pid]) stats[pid] = { revenue: 0, impressions: 0, checkouts: 0 };
                stats[pid].impressions = shopImpressions;
                stats[pid].checkouts = shopCheckouts;
            }
        }

        const result = {};
        Object.entries(stats).forEach(([cartId, { revenue, impressions, checkouts }]) => {
            result[cartId] = {
                revenue,
                conversionRate: impressions > 0 ? Math.min((checkouts / impressions) * 100, 100) : 0,
            };
        });

        const breakdown = shopRevenueBreakdown[0] || { addonRevenue: 0, upsellRevenue: 0, subscriptionRevenue: 0 };

        return res.json({
            success: true,
            data: result,
            shopRevenue: {
                addonRevenue: breakdown.addonRevenue || 0,
                upsellRevenue: breakdown.upsellRevenue || 0,
                subscriptionRevenue: breakdown.subscriptionRevenue || 0,
            },
        });
    } catch (error) {
        console.error("CART STATS ERROR:", error);
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
          currency: { $first: "$currency" },
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

   const cartOrderCounts = await cartOrderCountModel.find({ shop: cleanShop }).lean();
   const checkoutsCompleted = cartOrderCounts.reduce((sum, doc) => sum + (doc.totalOrders || 0), 0);

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

// ─── Cart Order Count ─────────────────────────────────────────────────────────

router.get("/cart-order-count", async (req, res) => {
  try {
    const { shop, cartId } = req.query;

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: shop",
      });
    }

    const filter = { shop };
    if (cartId) filter.cartId = cartId;

    const orderCounts = await cartOrderCountModel.find(filter).lean();

    if (!orderCounts || orderCounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order count data found",
      });
    }

    // Aggregate total across all carts if no specific cartId given
    const totalOrders = orderCounts.reduce((sum, doc) => sum + (doc.totalOrders || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        breakdown: orderCounts,   
        totalOrders,              
      },
    });
  } catch (error) {
    console.error("CART ORDER COUNT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
