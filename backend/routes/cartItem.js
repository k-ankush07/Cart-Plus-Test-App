import express from "express";
import {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
  cartOrderCountModel,
  contactModel
} from "../model/schema.js";
import { sendEmail } from "./sendEmail.js";
import { buildPlanUpgradeEmailHtml, buildPlanLimitReachedEmailHtml, buildWelcomeEmailHtml } from "./emailTemplates.js";
import crypto from "crypto";

const generateNewCartId = () => {
  return "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
};

const router = express.Router();

// ─── Plan order limits (monthly) ─────────────────────────────────────────────
const PLAN_ORDER_LIMITS = {
  free: 50,
  starter: 200,
  growth: 500,
  advance: 1000,
};

// ─── Plan entitlement ────────────────────────────────────────────────────────
// A shop is entitled to the cart drawer + all features when it is a Shopify
// development / partner store (free forever) OR on an active paid plan.
// Live stores on the free plan are NOT entitled — the storefront drawer is
// suppressed for them.
const isEntitled = (shopPlan) => {
  if (!shopPlan) return false;
  if (shopPlan.isDev) return true;
  return shopPlan.plan !== "free" && shopPlan.status === "active";
};

const getMonthlyOrderCount = async (shop) => {
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const result = await cartOrderCountModel.aggregate([
    {
      $match: {
        shop,
        date: { $gte: monthStart, $lt: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalOrders" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

router.get("/get-carts", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: shop",
      });
    }
    const [carts, shopPlan] = await Promise.all([
      cartModels.find({ shop }),
      shopPlanModel.findOne({ shop }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Carts retrieved successfully",
      data: carts,
      entitled: isEntitled(shopPlan),
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
      shop,
      shopEmail,
      storeOwner,
      cartId: clientCartId,
      cartName: clientCartName,
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
    } = req.body;

    if (!shop || !shopEmail || !storeOwner) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const count = await cartModels.countDocuments({ shop });
    const cartName = clientCartName?.trim() || `Untitled cart ${count + 1}`;
    const cartId = clientCartId || crypto.randomUUID();
    
    const newCart = await cartModels.create({
      shop,
      shopEmail,
      storeOwner,
      cartId,
      cartName,
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

    return res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: newCart,
    });
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
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    const isPublishing = cart.status !== "published";

    if (isPublishing) {
      await cartModels.updateMany(
        { shop: cart.shop, status: "published" },
        { $set: { status: "unpublished" } },
      );
    }

    const updateData = {
      status: isPublishing ? "published" : "unpublished",
      ...(isPublishing && { lastLiveDate: new Date() }),
    };

    const updatedCart = await cartModels.findOneAndUpdate(
      { cartId },
      { $set: updateData },
      { new: true },
    );

    return res.json({
      success: true,
      data: updatedCart,
      message: isPublishing
        ? "Cart published successfully"
        : "Cart unpublished successfully",
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
      customIconUrl,
      bgColor,
      iconColor,
      iconSize,
      buttonSize,
      qBgColor,
      qTextColor,
      device,
      hideOnEmptyCart,
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
        customIconUrl,
        bgColor,
        iconColor,
        iconSize,
        buttonSize,
        qBgColor,
        qTextColor,
        device,
        hideOnEmptyCart,
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
    const { shop, accessToken, email } = req.body;

    if (!shop || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Missing shop or accessToken",
      });
    }

    const existing = await shopConfigModel.findOne({ shop });

    const isNewStore = !existing;
    const tokenChanged = existing?.accessToken !== accessToken;
    const emailChanged = existing?.email !== email;

    if (!isNewStore && !tokenChanged && !emailChanged) {
      return res.json({ success: true, updated: false });
    }

    await shopConfigModel.findOneAndUpdate(
      { shop },
      {
        accessToken,
        email,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    try {
      const cart = await cartModels.findOne({ shop });
      const storeOwner = cart?.storeOwner || "there";

      const subject = "Welcome to Cart Plus 🎉";
      const html = buildWelcomeEmailHtml({ storeOwner, shop });

      const tasks = [
        sendEmail("sahil@hubsyntax.com", subject, html),
      ];

      if (email) {
        tasks.push(sendEmail(email, subject, html));
      }

      await Promise.all(tasks);

    } catch (emailError) {
      console.error("[hub] Email error:", emailError);
    }

    return res.json({
      success: true,
      updated: true,
      isNewStore,
    });

  } catch (error) {
    console.error("SAVE SHOP TOKEN ERROR:", error);
    return res.status(500).json({
      success: false,
    });
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
    const { shop, plan, price, subscriptionId, status, isDev } = req.body;

    if (!shop || !plan || price === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 1. Read previous plan BEFORE updating
    const previousPlan = await shopPlanModel.findOne({ shop });

    // 2. Save to DB first. Only overwrite isDev when the caller provides it
    //    (the billing action omits it and must not wipe the stored value).
    const update = {
      shop,
      plan,
      price,
      subscriptionId,
      status: status || "active",
      updatedAt: new Date(),
    };
    if (isDev !== undefined) update.isDev = isDev;

    const updated = await shopPlanModel.findOneAndUpdate(
      { shop },
      update,
      { upsert: true, new: true }
    );

    const finalStatus = status || "active";
    const isNowPaidAndActive = plan !== "free" && finalStatus === "active";
    const wasPreviouslyDifferent =
      !previousPlan ||
      previousPlan.plan !== plan ||
      previousPlan.status !== "active"; 

    if (isNowPaidAndActive && wasPreviouslyDifferent) {
      try {
        const [shopConfig, cart] = await Promise.all([
          shopConfigModel.findOne({ shop }),
          cartModels.findOne({ shop }),
        ]);

        const toEmail = shopConfig?.email || cart?.shopEmail;
        const storeOwner = cart?.storeOwner || "there";

        if (toEmail) {
          const subject = "Your Cart Plus plan has been upgraded";
          const html = buildPlanUpgradeEmailHtml({ storeOwner, shop, plan });
          await Promise.all([
            sendEmail(toEmail, subject, html),
            sendEmail("sahil@hubsyntax.com", subject, html),
          ]);
        } else {
          console.warn(`[hub] Plan upgrade email skipped — no email on file for shop: ${shop}`);
        }
      } catch (emailError) {
        console.error("[hub] Plan upgrade email error:", emailError);
      }
    }

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
      cartId,
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

    const publishedCart = await cartModels.findOne({
      shop,
      status: "published",
    });
    if (!publishedCart) {
      return res
        .status(403)
        .json({ success: false, message: "No active cart for shop" });
    }

    // ─── Plan limit check ────────────────────────────────────────────────────
    const shopPlan = await shopPlanModel.findOne({ shop });
    const planName = shopPlan?.plan || "free";
    // Dev / partner stores are entitled to everything for free → no cap.
    const enforceLimit = !shopPlan?.isDev;
    const monthlyLimit = PLAN_ORDER_LIMITS[planName] ?? PLAN_ORDER_LIMITS.free;
    const monthlyOrderCount = await getMonthlyOrderCount(shop);

    // ─── Helper: send limit-reached email ───────────────────────────────────
    const sendLimitReachedEmail = async () => {
      try {
        const [shopConfig, cart] = await Promise.all([
          shopConfigModel.findOne({ shop }),
          cartModels.findOne({ shop }),
        ]);

        const toEmail = shopConfig?.email || cart?.shopEmail;
        const storeOwner = cart?.storeOwner || "there";

        if (toEmail) {
          const subject = "You've reached your monthly order limit – Cart Plus";
          const html = buildPlanLimitReachedEmailHtml({ storeOwner, shop, plan: planName });
          await Promise.all([
            sendEmail(toEmail, subject, html),
            sendEmail("sahil@hubsyntax.com", subject, html),
          ]);
        }
      } catch (emailError) {
        console.error("[hub] Limit reached email error:", emailError);
      }
    };
    // ────────────────────────────────────────────────────────────────────────

    if (enforceLimit && monthlyOrderCount >= monthlyLimit) {
      await cartModels.findOneAndUpdate(
        { cartId: publishedCart.cartId },
        { $set: { status: "unpublished" } },
      );

      // Send limit-reached email
      await sendLimitReachedEmail();

      return res.status(403).json({
        success: false,
        message: "Monthly order limit reached for your plan. Cart has been unpublished.",
        planName,
        monthlyLimit,
        monthlyOrderCount,
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const today = new Date().toISOString().slice(0, 10);
    await cartOrderCountModel.findOneAndUpdate(
      { shop, cartId: publishedCart.cartId, date: today },
      {
        $inc: { totalOrders: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true },
    );

    // ─── Re-check after incrementing ────────────────────────────────────────
    const newMonthlyCount = monthlyOrderCount + 1;
    if (enforceLimit && newMonthlyCount >= monthlyLimit) {
      await cartModels.findOneAndUpdate(
        { cartId: publishedCart.cartId },
        { $set: { status: "unpublished" } },
      );

      // Send limit-reached email
      await sendLimitReachedEmail();
    }
    // ────────────────────────────────────────────────────────────────────────

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
    return res
      .status(500)
      .json({ success: false, message: error?.message, code: error?.code });
  }
});

router.get("/cart-stats", async (req, res) => {
  try {
    const { shop, startDate, endDate, cartIds } = req.query;
    if (!shop)
      return res.status(400).json({ success: false, message: "Missing shop" });

    const cleanShop = shop
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");

    // Parse cartIds filter
    const cartIdFilter =
      cartIds && cartIds.trim() !== ""
        ? cartIds.split(",").map((id) => id.trim()).filter(Boolean)
        : null;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const revenueMatch = {
      shop: cleanShop,
      cartId: { $exists: true, $nin: [null, ""] },
      ...(hasDateFilter && { createdAt: dateFilter }),
    };

    const toDateStr = (d) => new Date(d).toISOString().slice(0, 10);
    const orderCountDateFilter = {};
    if (startDate) orderCountDateFilter.$gte = toDateStr(startDate);
    if (endDate) orderCountDateFilter.$lte = toDateStr(endDate);
    const orderCountMatch = {
      shop: cleanShop,
      ...(Object.keys(orderCountDateFilter).length && {
        date: orderCountDateFilter,
      }),
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

    // ← KEY CHANGE: filter shopRevenue to published cartIds only
    const shopRevenueMatch = {
      shop: cleanShop,
      ...(hasDateFilter && { createdAt: dateFilter }),
      ...(cartIdFilter ? { cartId: { $in: cartIdFilter } } : {}),
    };

    const [
      revenueByCart,
      analyticsByCart,
      shopAnalytics,
      publishedCart,
      shopRevenueBreakdown,
      ordersByCartByDate,
      impressionsByCartByDate,
      revenueByCartByDate,
    ] = await Promise.all([
      orderRevenueModel.aggregate([
        { $match: revenueMatch },
        { $group: { _id: "$cartId", totalRevenue: { $sum: "$totalRevenue" } } },
      ]),
      analyticsModel.aggregate([
        { $match: analyticsMatch },
        {
          $group: {
            _id: { cartId: "$cartId", eventType: "$eventType" },
            count: { $sum: 1 },
          },
        },
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
      cartOrderCountModel.aggregate([
        { $match: orderCountMatch },
        {
          $group: {
            _id: { cartId: "$cartId", date: "$date" },
            totalOrders: { $sum: "$totalOrders" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      analyticsModel.aggregate([
        { $match: { ...analyticsMatch, eventType: "cart_impression" } },
        {
          $group: {
            _id: {
              cartId: "$cartId",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      orderRevenueModel.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: {
              cartId: "$cartId",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
            totalRevenue: { $sum: "$totalRevenue" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
    ]);

    const emptyStat = () => ({
      revenue: 0,
      impressions: 0,
      checkouts: 0,
      completedOrders: 0,
      ordersByDate: {},
      impressionsByDate: {},
      revenueByDate: {},
    });

    const stats = {};

    revenueByCart.forEach(({ _id, totalRevenue }) => {
      if (!stats[_id]) stats[_id] = emptyStat();
      stats[_id].revenue = totalRevenue;
    });

    analyticsByCart.forEach(({ _id: { cartId, eventType }, count }) => {
      if (!stats[cartId]) stats[cartId] = emptyStat();
      if (eventType === "cart_impression") stats[cartId].impressions = count;
      if (eventType === "checkout_initiated") stats[cartId].checkouts = count;
    });

    ordersByCartByDate.forEach(({ _id: { cartId, date }, totalOrders }) => {
      if (!stats[cartId]) stats[cartId] = emptyStat();
      stats[cartId].completedOrders += totalOrders;
      stats[cartId].ordersByDate[date] =
        (stats[cartId].ordersByDate[date] || 0) + totalOrders;
    });

    impressionsByCartByDate.forEach(({ _id: { cartId, date }, count }) => {
      if (!stats[cartId]) stats[cartId] = emptyStat();
      stats[cartId].impressionsByDate[date] =
        (stats[cartId].impressionsByDate[date] || 0) + count;
    });

    revenueByCartByDate.forEach(({ _id: { cartId, date }, totalRevenue }) => {
      if (!stats[cartId]) stats[cartId] = emptyStat();
      stats[cartId].revenueByDate[date] =
        (stats[cartId].revenueByDate[date] || 0) + totalRevenue;
    });

    if (publishedCart?.cartId) {
      const pid = publishedCart.cartId;
      const hasPerCartAnalytics =
        stats[pid] && (stats[pid].impressions > 0 || stats[pid].checkouts > 0);

      if (!hasPerCartAnalytics) {
        const shopImpressions =
          shopAnalytics.find((e) => e._id === "cart_impression")?.count || 0;
        const shopCheckouts =
          shopAnalytics.find((e) => e._id === "checkout_initiated")?.count || 0;

        if (!stats[pid])
          stats[pid] = { revenue: 0, impressions: 0, checkouts: 0 };
        stats[pid].impressions = shopImpressions;
        stats[pid].checkouts = shopCheckouts;
      }
    }

    const result = {};
    Object.entries(stats).forEach(
      ([cartId, { revenue, impressions, checkouts, completedOrders, ordersByDate, impressionsByDate, revenueByDate }]) => {
        const numerator = completedOrders > 0 ? completedOrders : checkouts;
        const ordersByDateArr = Object.entries(ordersByDate)
          .map(([date, count]) => ({ date, totalOrders: count }))
          .sort((a, b) => (a.date < b.date ? 1 : -1));

        result[cartId] = {
          revenue,
          revenueByDate: Object.entries(revenueByDate)
            .map(([date, total]) => ({ date, revenue: total }))
            .sort((a, b) => (a.date < b.date ? 1 : -1)),
          impressions,
          impressionsByDate: Object.entries(impressionsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => (a.date < b.date ? 1 : -1)),
          conversionRate:
            impressions > 0
              ? Math.min((numerator / impressions) * 100, 100)
              : 0,
          completedOrders,
          ordersByDate: ordersByDateArr,
        };
      }
    );

    const breakdown = shopRevenueBreakdown[0] || {
      addonRevenue: 0,
      upsellRevenue: 0,
      subscriptionRevenue: 0,
    };

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
    const { shop, startDate, endDate } = req.query;

    const cleanShop = shop
      ?.replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");

    if (!cleanShop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    // Build date filter from query params; fall back to last 30 days
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    } else {
      dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    } else {
      dateFilter.$lte = new Date();
    }

    const rangeStart = dateFilter.$gte;

    // ───── Revenue Totals (scoped to date range) ─────
    const [totals] = await orderRevenueModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
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

    // ───── Daily revenue (scoped to date range) ─────
    const dailyRevenue = await orderRevenueModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
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

    // ───── Analytics Totals (scoped to date range) ─────
    const analyticsStats = await analyticsModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]);

    const analyticsFormatted = {};
    analyticsStats.forEach((item) => {
      analyticsFormatted[item._id] = item.count;
    });

    // ───── Daily Analytics (scoped to date range) ─────
    const dailyAnalytics = await analyticsModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            eventType: "$eventType",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const dailyAnalyticsMap = {};
    dailyAnalytics.forEach(({ _id, count }) => {
      const { date, eventType } = _id;
      if (!dailyAnalyticsMap[date]) dailyAnalyticsMap[date] = {};
      dailyAnalyticsMap[date][eventType] = count;
    });

    // ───── Checkouts Completed (scoped to date range) ─────
    const rangeStartDate = rangeStart.toISOString().slice(0, 10);
    const rangeEndDate = dateFilter.$lte.toISOString().slice(0, 10);

    const cartOrderCounts = await cartOrderCountModel
      .find({
        shop: cleanShop,
        date: { $gte: rangeStartDate, $lte: rangeEndDate },
      })
      .lean();

    let checkoutsCompleted = 0;
    const checkoutsByDate = {};

    cartOrderCounts.forEach((doc) => {
      const count = doc.totalOrders || 0;
      checkoutsCompleted += count;

      const bucketDate =
        doc.date ||
        (doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : null);
      if (!bucketDate) return;

      checkoutsByDate[bucketDate] = (checkoutsByDate[bucketDate] || 0) + count;
      if (!dailyAnalyticsMap[bucketDate]) dailyAnalyticsMap[bucketDate] = {};
      dailyAnalyticsMap[bucketDate].checkout_completed =
        (dailyAnalyticsMap[bucketDate].checkout_completed || 0) + count;
    });

    analyticsFormatted.checkout_completed = checkoutsCompleted;

    return res.json({
      success: true,
      data: {
        revenue: {
          totals: totals || {
            totalRevenue: 0, upsellRevenue: 0, addonRevenue: 0,
            subscriptionRevenue: 0, baseRevenue: 0, orderCount: 0,
          },
          daily: dailyRevenue,
        },
        analytics: analyticsFormatted,
        dailyAnalytics: dailyAnalyticsMap,
        checkoutsCompleted,
        checkoutsByDate,
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

    const orderCounts = await cartOrderCountModel
      .find(filter)
      .sort({ date: -1 })
      .lean();

    if (!orderCounts || orderCounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order count data found",
      });
    }

    // Aggregate across the filtered docs
    let totalOrders = 0;
    const byDate = {};
    orderCounts.forEach((doc) => {
      const count = doc.totalOrders || 0;
      totalOrders += count;

      const bucket =
        doc.date ||
        (doc.createdAt
          ? new Date(doc.createdAt).toISOString().slice(0, 10)
          : "unknown");
      byDate[bucket] = (byDate[bucket] || 0) + count;
    });

    // Sorted [{ date, totalOrders }] for easy charting (most recent first)
    const dateWise = Object.entries(byDate)
      .map(([date, count]) => ({ date, totalOrders: count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return res.status(200).json({
      success: true,
      data: {
        breakdown: orderCounts,
        totalOrders,
        dateWise,
      },
    });
  } catch (error) {
    console.error("CART ORDER COUNT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Contact Form ─────────────────────────────────────────────────────────────
// Handles submissions from the public "Let's Discuss Your Goals" contact
// form: saves them to Mongo and notifies the team by email.
 
router.post("/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email, phone",
      });
    }

    const newContact = await contactModel.create({
      firstName,
      lastName,
      email,
      phone,
      address: address || "",
    });

    try {
      const subject = `New contact form submission — ${firstName} ${lastName}`;
      const html = `
        <div style="background-color:#F3E8FF; padding:40px 20px; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://cartplus.io/cartplus-img/CartLogo.svg" alt="Cart Plus" width="140" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td style="background-color:#FFFFFF; border:1px solid #E5D4FA; border-radius:16px; padding:32px;">
                <h2 style="margin:0 0 24px; text-align:center; font-size:20px; color:#1A1A1A;">
                  New Contact Form Submission
                </h2>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#7A5AA0; width:130px;">First Name</td>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#1A1A1A;">${firstName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#7A5AA0;">Last Name</td>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#1A1A1A;">${lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#7A5AA0;">Email</td>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#1A1A1A;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#7A5AA0;">Phone</td>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#1A1A1A;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#7A5AA0; vertical-align:top;">Address</td>
                    <td style="padding:10px 0; border-bottom:1px solid #F0E4FF; font-size:14px; color:#1A1A1A;">${address || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; font-size:14px; color:#7A5AA0;">Submitted At</td>
                    <td style="padding:10px 0; font-size:14px; color:#1A1A1A;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:20px; font-size:12px; color:#9B8AAE;">
                This is an automated notification from Cart Plus.
              </td>
            </tr>
          </table>
        </div>
      `;
      await sendEmail("noreply.cartplus@gmail.com", subject, html);
    } catch (emailError) {
      console.error("[hub] Contact form email error:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Contact submitted successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("CONTACT FORM ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
