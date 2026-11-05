import express from "express";
import {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
  cartOrderCountModel,
  cartActivityModel,
  contactModel,
} from "../model/schema.js";
import { sendEmail } from "./sendEmail.js";
import {
  buildPlanUpgradeEmailHtml,
  buildPlanLimitReachedEmailHtml,
  buildWelcomeEmailHtml,
  buildContactFormEmailHtml,
  buildContactFormThankYouEmailHtml,
  buildEmailHtml,
} from "./emailTemplates.js";
import crypto from "crypto";

const generateNewCartId = () => {
  return "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
};

const router = express.Router();

// ─── Plan order limits (monthly) ─────────────────────────────────────────────
const PLAN_ORDER_LIMITS = {
  free: 50,
  starter: 200,
  advance: 1000,
  unlimited: Infinity,
};

const FREE_SHOPS = (process.env.FREE_SHOPS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const isFreeShop = (shop) =>
  FREE_SHOPS.includes(String(shop || "").toLowerCase());

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
      entitled: isFreeShop(shop) || isEntitled(shopPlan),
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
    const cartName = clientCartName?.trim() || `My Cart ${count + 1}`;
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

router.post("/archive-ab-test/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    const { winnerId: requestedWinnerId } = req.body || {};
    const cart = await cartModels.findOne({ cartId });
    const abTest = cart?.cartSettings?.abTest;

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    if (!abTest?.enabled || !Array.isArray(abTest.variants)) {
      return res.status(400).json({
        success: false,
        message: "No active A/B test found for this cart",
      });
    }
    if (requestedWinnerId && !abTest.variants.includes(requestedWinnerId)) {
      return res.status(400).json({
        success: false,
        message: "Selected winner is not part of this A/B test",
      });
    }

    const variantKeys = abTest.variants;
    const startedAtValues = Object.values(abTest.variantMeta || {})
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()));
    const startedAt = startedAtValues.length
      ? new Date(Math.min(...startedAtValues.map((date) => date.getTime())))
      : cart.updatedAt || cart.createdAt || new Date(0);
    const endedAt = new Date();
    const variantIdToKey = Object.fromEntries(
      variantKeys
        .map((variantKey) => [
          String(abTest.variantIds?.[variantKey] || ""),
          variantKey,
        ])
        .filter(([variantId]) => variantId),
    );
    const activeVariantIds = Object.keys(variantIdToKey);
    const [revenueByVariant, impressionsByVariant] = await Promise.all([
      orderRevenueModel.aggregate([
        {
          $match: {
            shop: cart.shop,
            cartId,
            variantId: { $in: activeVariantIds },
            createdAt: { $gte: startedAt, $lte: endedAt },
          },
        },
        {
          $group: {
            _id: "$variantId",
            revenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$totalRevenue", 0] },
                  { $ifNull: ["$baseRevenue", 0] },
                ],
              },
            },
            completedOrders: { $sum: 1 },
          },
        },
      ]),
      analyticsModel.aggregate([
        {
          $match: {
            shop: cart.shop,
            cartId,
            eventType: "cart_impression",
            createdAt: { $gte: startedAt, $lte: endedAt },
            "meta.variantId": { $in: activeVariantIds },
          },
        },
        {
          $group: {
            _id: "$meta.variantId",
            impressions: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenueByKey = Object.fromEntries(
      revenueByVariant.map(({ _id, revenue, completedOrders }) => {
        const variantKey = variantIdToKey[String(_id)];
        return [variantKey, { revenue, completedOrders }];
      }),
    );
    const impressionsByKey = Object.fromEntries(
      impressionsByVariant.map(({ _id, impressions }) => [
        variantIdToKey[String(_id)],
        impressions,
      ]),
    );
    const variantStats = Object.fromEntries(
      variantKeys.map((variantKey) => {
        const { revenue = 0, completedOrders = 0 } =
          revenueByKey[variantKey] || {};
        const impressions = impressionsByKey[variantKey] || 0;
        return [
          variantKey,
          {
            revenue,
            completedOrders,
            impressions,
            conversionRate:
              impressions > 0
                ? Math.min((completedOrders / impressions) * 100, 100)
                : 0,
            revenuePerVisitor: impressions > 0 ? revenue / impressions : 0,
            aov: completedOrders > 0 ? revenue / completedOrders : 0,
          },
        ];
      }),
    );

    const winnerId =
      requestedWinnerId ||
      variantKeys.reduce(
        (winner, variantKey) =>
          variantStats[variantKey].revenue >
          (winner ? variantStats[winner].revenue : 0)
            ? variantKey
            : winner,
        variantKeys[0],
      );
    const archiveRecord = {
      id: crypto.randomUUID(),
      startedAt,
      endedAt,
      variants: variantKeys,
      weights: abTest.weights || {},
      controlId: abTest.controlId || variantKeys[0],
      variantIds: abTest.variantIds || {},
      winnerId,
      variantStats,
    };
    const archivedAbTest = {
      ...abTest,
      enabled: false,
      archived: true,
      winnerId,
      archive: [...(abTest.archive || []), archiveRecord],
    };

    const controlId = abTest.controlId || variantKeys[0];
    const winnerSnapshot =
      winnerId === controlId
        ? {
            design: cart.designSettings,
            header: cart.headerSettings,
            announcement: cart.announcementSettings,
            rewardsSettings: cart.rewardsSettings,
            recommendationsSettings: cart.recommendationsSettings,
            subscriptionUpgradesSettings: cart.subscriptionUpgradesSettings,
            upsellsSettings: cart.upsellsSettings,
            additionalNotesSettings: cart.additionalNotesSettings,
            addonsSettings: cart.addonsSettings,
            discountCodesSettings: cart.discountCodesSettings,
            expressPaymentsSettings: cart.expressPaymentsSettings,
            trustBadgesSettings: cart.trustBadgesSettings,
            cartSettings: cart.cartSettings,
          }
        : abTest.data?.[winnerId];

    if (!winnerSnapshot) {
      return res.status(400).json({
        success: false,
        message: `Settings for winning variant ${winnerId} were not found`,
      });
    }

    const snapshotFields = {
      design: "designSettings",
      header: "headerSettings",
      announcement: "announcementSettings",
      rewardsSettings: "rewardsSettings",
      recommendationsSettings: "recommendationsSettings",
      subscriptionUpgradesSettings: "subscriptionUpgradesSettings",
      upsellsSettings: "upsellsSettings",
      additionalNotesSettings: "additionalNotesSettings",
      addonsSettings: "addonsSettings",
      discountCodesSettings: "discountCodesSettings",
      expressPaymentsSettings: "expressPaymentsSettings",
      trustBadgesSettings: "trustBadgesSettings",
    };
    Object.entries(snapshotFields).forEach(([snapshotKey, cartKey]) => {
      if (winnerSnapshot[snapshotKey] !== undefined) {
        cart[cartKey] = winnerSnapshot[snapshotKey];
      }
    });

    const { abTest: _activeAbTest, ...winnerCartSettings } =
      winnerSnapshot.cartSettings || {};
    cart.cartSettings = {
      ...winnerCartSettings,
      abTest: archivedAbTest,
    };
    await cart.save();

    return res.json({
      success: true,
      message: winnerId
        ? `A/B test archived. Variant ${winnerId} had the highest revenue.`
        : "A/B test archived. No winner yet because no variant has recorded revenue.",
      data: { cart, archiveRecord, abTest: archivedAbTest },
    });
  } catch (error) {
    console.error("ARCHIVE A/B TEST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
      cartName: `Copy of ${existingCart.cartName || "My Cart"}`,
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

const STICKY_CART_FIELDS = [
  "enabled",
  "template",
  "position",
  "mobilePosition",
  "displayOnMobile",
  "device",
  "selectedIcon",
  "customIconUrl",
  "iconColor",
  "iconSize",
  "bgColor",
  "buttonSize",
  "barRadius",
  "enableCount",
  "qBgColor",
  "qTextColor",
  "hideOnEmptyCart",
  "customCss",
];

router.post("/save-sticky-cart", async (req, res) => {
  try {
    const { shop, cartId } = req.body;

    if (!shop) {
      return res.json({ success: false, message: "shop is required" });
    }

    const fields = Object.fromEntries(
      STICKY_CART_FIELDS.filter((key) => req.body[key] !== undefined).map(
        (key) => [key, req.body[key]],
      ),
    );

    const updatedStickyCart = await stickyCartModel.findOneAndUpdate(
      { shop },
      {
        $set: { shop, ...fields },
        $setOnInsert: { cartId: cartId || generateNewCartId() },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      success: true,
      data: updatedStickyCart,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
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
      },
    );

    if (isNewStore) {
      const existingPlan = await shopPlanModel.findOne({ shop });
      if (!existingPlan) {
        await shopPlanModel.create({
          shop,
          plan: "free",
          price: 0,
          status: "active",
          isDev: true,
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────
    try {
      const cart = await cartModels.findOne({ shop });
      const storeOwner = cart?.storeOwner || "there";
      const subject = "Welcome to Cart Plus 🎉";
      const html = buildWelcomeEmailHtml({ storeOwner, shop });
      if (email) {
        await sendEmail(email, subject, html);
      }
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

    if (isFreeShop(shop)) {
      return res.status(200).json({
        success: true,
        data: {
          ...(plan?.toObject?.() || {}),
          shop,
          plan: "unlimited",
          price: 0,
          status: "active",
          isDev: true,
        },
      });
    }

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
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
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

    const updated = await shopPlanModel.findOneAndUpdate({ shop }, update, {
      upsert: true,
      new: true,
    });

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
          await Promise.all([sendEmail(toEmail, subject, html)]);
        } else {
          console.warn(
            `[hub] Plan upgrade email skipped — no email on file for shop: ${shop}`,
          );
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
    const { shop, cartId, sessionId, userAgent, variantId, variantKey } =
      req.body;

    if (!shop || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Missing shop or sessionId",
      });
    }

    const impressionQuery = {
      shop,
      sessionId,
      cartId,
      eventType: "cart_impression",
      ...(variantId ? { "meta.variantId": variantId } : {}),
    };
    const exists = await analyticsModel.findOne(impressionQuery);

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
      meta: { source: "cart_drawer", variantId, variantKey },
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

// ─── Cart activity feed ───────────────────────────────────────────────────────

const cleanShopDomain = (shop) =>
  String(shop || "")
    .replace("https://", "")
    .replace("http://", "")
    .replace(/\/$/, "");

// Storefront posts one batch per cart mutation: { shop, sessionId, events: [...] }
router.post("/cart-activity", async (req, res) => {
  try {
    const {
      shop,
      sessionId,
      cartId,
      cartToken,
      customerId,
      timezone,
      userAgent,
      events,
    } = req.body || {};
    const cleanShop = cleanShopDomain(shop);

    if (
      !cleanShop ||
      !sessionId ||
      !Array.isArray(events) ||
      events.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shop, sessionId or events" });
    }

    const docs = events
      .slice(0, 50)
      .filter(
        (e) =>
          e &&
          // ["added", "removed", "product_viewed", "page_viewed"].includes(e.action),
          ["added", "removed"].includes(e.action),
      )
      .map((e) => ({
        // pageTitle: String(e.pageTitle || "").slice(0, 300),
        // url: String(e.url || "").slice(0, 1000),
        currency: String(e.currency || "").slice(0, 10),
        shop: cleanShop,
        cartId: cartId || null,
        sessionId: String(sessionId),
        cartToken: cartToken || null,
        action: e.action,
        quantity: Math.max(1, Math.abs(Number(e.quantity) || 1)),
        productTitle: String(e.productTitle || "").slice(0, 300),
        variantTitle: String(e.variantTitle || "").slice(0, 200),
        productId: e.productId ? String(e.productId) : null,
        variantId: e.variantId ? String(e.variantId) : null,
        handle: String(e.handle || "").slice(0, 300),
        image: String(e.image || "").slice(0, 1000),
        price: Number(e.price) || 0,
        customerId: customerId ? String(customerId) : null,
        timezone: String(timezone || "").slice(0, 80),
        userAgent: String(userAgent || "").slice(0, 400),
        createdAt: new Date(),
      }));
    if (docs.length) await cartActivityModel.insertMany(docs);
    return res.json({ success: true, saved: docs.length });
  } catch (error) {
    console.error("CART ACTIVITY SAVE ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

// Feed for the Activity page. Query: shop, startDate, endDate, action, before, limit
router.get("/cart-activity", async (req, res) => {
  try {
    const { shop, startDate, endDate, action, before } = req.query;
    const cleanShop = cleanShopDomain(shop);
    if (!cleanShop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 25, 1),
      100,
    );
    const createdAt = {};
    if (startDate) createdAt.$gte = new Date(startDate);
    if (endDate) createdAt.$lte = new Date(endDate);
    if (before) createdAt.$lt = new Date(before);

    const filter = { shop: cleanShop };
    if (Object.keys(createdAt).length) filter.createdAt = createdAt;
    if (action === "added" || action === "removed") filter.action = action;

    // type=cart (default): item added / removed only
    // type=all: also product / page views, plus cart opened + checkout events
    const SHOW_ALL_ACTIVITY = false;
    const includeAll = SHOW_ALL_ACTIVITY && req.query.type === "all";
    if (!includeAll && !filter.action)
      filter.action = { $in: ["added", "removed"] };

    const [cartRows, eventRows] = await Promise.all([
      cartActivityModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean(),
      includeAll
        ? analyticsModel
            .find({
              shop: cleanShop,
              ...(Object.keys(createdAt).length ? { createdAt } : {}),
            })
            .select("eventType sessionId createdAt userAgent")
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .lean()
        : [],
    ]);

    const rows = [
      ...cartRows.map((r) => ({ ...r, kind: "cart" })),
      ...eventRows.map((r) => ({ ...r, kind: "event" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const hasMore = rows.length > limit;
    const events = rows.slice(0, limit);
    return res.json({
      success: true,
      data: {
        events,
        hasMore,
        nextBefore: hasMore ? events[events.length - 1].createdAt : null,
      },
    });
  } catch (error) {
    console.error("CART ACTIVITY LIST ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

// Top 5 most-added (cart activity) + best-selling (order items). Query: shop, startDate, endDate
router.get("/cart-activity/top-products", async (req, res) => {
  try {
    const { shop, startDate, endDate } = req.query;
    const cleanShop = cleanShopDomain(shop);
    if (!cleanShop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    const createdAt = {};
    if (startDate) createdAt.$gte = new Date(startDate);
    if (endDate) createdAt.$lte = new Date(endDate);
    const dateMatch = Object.keys(createdAt).length ? { createdAt } : {};

    const [mostAdded, bestSelling] = await Promise.all([
      // Most-added: "added" events ki total quantity, product ke hisaab se
      cartActivityModel.aggregate([
        { $match: { shop: cleanShop, action: "added", ...dateMatch } },
        {
          $group: {
            _id: { $ifNull: ["$productId", "$productTitle"] },
            productId: { $first: "$productId" },
            productTitle: { $first: "$productTitle" },
            handle: { $first: "$handle" },
            image: { $first: "$image" },
            price: { $first: "$price" },
            currency: { $first: "$currency" },
            addedQty: { $sum: "$quantity" },
            addCount: { $sum: 1 },
          },
        },
        { $sort: { addedQty: -1 } },
        { $limit: 5 },
      ]),
      // Best-selling: order items ki quantity (orderRevenue.items se)

      orderRevenueModel.aggregate([
        { $match: { shop: cleanShop, ...dateMatch } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productId: { $first: "$items.productId" },
            title: { $first: "$items.title" },
            currency: { $first: "$currency" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.revenue" },
          },
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        mostAdded: mostAdded.map((p) => ({
          id: String(p._id),
          productId: p.productId,
          title: p.productTitle || "Product",
          handle: p.handle || "",
          image: p.image || "",
          price: p.price || 0,
          currency: p.currency || "",
          addedQty: p.addedQty,
          addCount: p.addCount,
        })),

        bestSelling: bestSelling.map((p) => ({
          id: String(p.productId || p._id),
          productId: p.productId,
          title: p.title || "Product",
          currency: p.currency || "",
          quantity: p.quantity || 0,
          revenue: p.revenue || 0,
        })),
      },
    });
  } catch (error) {
    console.error("TOP PRODUCTS ERROR:", error);
    return res.status(500).json({ success: false });
  }
});

// Timeline of one shopper session (the "View Cart" page). Query: shop, sessionId
router.get("/cart-activity/session", async (req, res) => {
  try {
    const { shop, sessionId } = req.query;
    const cleanShop = cleanShopDomain(shop);
    if (!cleanShop || !sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shop or sessionId" });
    }

    const [activity, analytics] = await Promise.all([
      cartActivityModel
        .find({ shop: cleanShop, sessionId })
        .sort({ createdAt: 1 })
        .lean(),
      analyticsModel
        .find({ shop: cleanShop, sessionId })
        .select("eventType createdAt cartId meta userAgent")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const timeline = [
      ...activity.map((a) => ({
        type:
          a.action === "added"
            ? "item_added"
            : a.action === "removed"
              ? "item_removed"
              : a.action, // product_viewed | page_viewed
        at: a.createdAt,
        productTitle: a.productTitle,
        pageTitle: a.pageTitle,
        variantTitle: a.variantTitle,
        handle: a.handle,
        image: a.image,
        url: a.url,
        price: a.price,
        currency: a.currency,
        quantity: a.quantity,
      })),
      ...analytics.map((a) => ({ type: a.eventType, at: a.createdAt })),
    ].sort((x, y) => new Date(x.at) - new Date(y.at));

    const first = activity[0] || null;
    return res.json({
      success: true,
      data: {
        sessionId,
        customerId: first?.customerId || null,
        timezone: first?.timezone || "",
        userAgent: first?.userAgent || analytics[0]?.userAgent || "",
        cartToken: first?.cartToken || null,
        startedAt: timeline[0]?.at || null,
        timeline,
      },
    });
  } catch (error) {
    console.error("CART ACTIVITY SESSION ERROR:", error);
    return res.status(500).json({ success: false });
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
      variantId,
      variantKey,
      attributedCartId,
      orderNumber,
      items,
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
    const activeAbTest = publishedCart.cartSettings?.abTest;
    const validVariantAssignment =
      attributedCartId === publishedCart.cartId &&
      activeAbTest?.enabled === true &&
      activeAbTest.variants?.includes(variantKey) &&
      String(activeAbTest.variantIds?.[variantKey] || "") ===
        String(variantId || "");

    // ─── Plan limit check ────────────────────────────────────────────────────
    const shopPlan = await shopPlanModel.findOne({ shop });
    const planName = shopPlan?.plan || "free";
    // Dev / partner stores are entitled to everything for free → no cap.
    const enforceLimit = !shopPlan?.isDev && !isFreeShop(shop);
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
          const html = buildPlanLimitReachedEmailHtml({
            storeOwner,
            shop,
            plan: planName,
          });
          await Promise.all([sendEmail(toEmail, subject, html)]);
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
        message:
          "Monthly order limit reached for your plan. Cart has been unpublished.",
        planName,
        monthlyLimit,
        monthlyOrderCount,
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    // Shopify can deliver orders/paid more than once for the same order.
    // Only count the order the first time its revenue record is created.
    const alreadyCounted = await orderRevenueModel.exists({
      orderId: cartToken,
    });

    const today = new Date().toISOString().slice(0, 10);
    if (!alreadyCounted) {
      await cartOrderCountModel.findOneAndUpdate(
        { shop, cartId: publishedCart.cartId, date: today },
        {
          $inc: { totalOrders: 1 },
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true },
      );
    }

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

    const revenueRecord = {
      shop,
      cartId:
        attributedCartId === publishedCart.cartId
          ? attributedCartId
          : publishedCart.cartId,
      orderId: cartToken,
      sessionId: sessionId || "",
      currency: currency || "USD",
      totalRevenue: totalRevenue || 0,
      upsellRevenue: upsellRevenue || 0,
      addonRevenue: addonRevenue || 0,
      subscriptionRevenue: subscriptionRevenue || 0,
      baseRevenue: baseRevenue || 0,
      ...(orderNumber ? { orderNumber } : {}),
      items: Array.isArray(items) ? items.slice(0, 100) : [],
      createdAt: new Date(),
      ...(validVariantAssignment ? { variantId, variantKey } : {}),
    };

    await orderRevenueModel.findOneAndUpdate(
      { orderId: cartToken },
      revenueRecord,
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
        ? cartIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
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

    const publishedCart = await cartModels
      .findOne({ shop: cleanShop, status: "published" })
      .lean();
    const activeAbTest = publishedCart?.cartSettings?.abTest;
    const activeVariantIds =
      activeAbTest?.enabled && activeAbTest.variantIds
        ? Object.values(activeAbTest.variantIds).filter(Boolean)
        : [];

    const [
      revenueByCart,
      analyticsByCart,
      shopAnalytics,
      shopRevenueBreakdown,
      ordersByCartByDate,
      impressionsByCartByDate,
      revenueByCartByDate,
      revenueByVariant,
      impressionsByVariant,
    ] = await Promise.all([
      orderRevenueModel.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: "$cartId",
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$totalRevenue", 0] },
                  { $ifNull: ["$baseRevenue", 0] },
                ],
              },
            },
          },
        },
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
      orderRevenueModel.aggregate([
        { $match: shopRevenueMatch },
        {
          $group: {
            _id: null,
            addonRevenue: { $sum: "$addonRevenue" },
            upsellRevenue: { $sum: "$upsellRevenue" },
            subscriptionRevenue: { $sum: "$subscriptionRevenue" },
            baseRevenue: { $sum: "$baseRevenue" },
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$totalRevenue", 0] },
                  { $ifNull: ["$baseRevenue", 0] },
                ],
              },
            },
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
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$totalRevenue", 0] },
                  { $ifNull: ["$baseRevenue", 0] },
                ],
              },
            },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      orderRevenueModel.aggregate([
        {
          $match: {
            ...revenueMatch,
            cartId: publishedCart?.cartId,
            variantId: { $in: activeVariantIds },
            variantKey: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { cartId: "$cartId", variantKey: "$variantKey" },
            variantId: { $first: "$variantId" },
            revenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$totalRevenue", 0] },
                  { $ifNull: ["$baseRevenue", 0] },
                ],
              },
            },
            completedOrders: { $sum: 1 },
          },
        },
      ]),
      analyticsModel.aggregate([
        {
          $match: {
            ...analyticsMatch,
            cartId: publishedCart?.cartId,
            eventType: "cart_impression",
            "meta.variantId": { $in: activeVariantIds },
            "meta.variantKey": { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { cartId: "$cartId", variantKey: "$meta.variantKey" },
            variantId: { $first: "$meta.variantId" },
            impressions: { $sum: 1 },
          },
        },
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

    revenueByVariant.forEach(
      ({
        _id: { cartId, variantKey },
        variantId,
        revenue,
        completedOrders,
      }) => {
        if (!stats[cartId]) stats[cartId] = emptyStat();
        if (!stats[cartId].variants) stats[cartId].variants = {};
        stats[cartId].variants[variantKey] = {
          variantId,
          revenue,
          completedOrders,
          impressions: 0,
          conversionRate: 0,
        };
      },
    );

    impressionsByVariant.forEach(
      ({ _id: { cartId, variantKey }, variantId, impressions }) => {
        if (!stats[cartId]) stats[cartId] = emptyStat();
        if (!stats[cartId].variants) stats[cartId].variants = {};
        if (!stats[cartId].variants[variantKey]) {
          stats[cartId].variants[variantKey] = {
            variantId,
            revenue: 0,
            completedOrders: 0,
            impressions: 0,
            conversionRate: 0,
          };
        }
        stats[cartId].variants[variantKey].variantId ||= variantId;
        stats[cartId].variants[variantKey].impressions = impressions;
      },
    );

    Object.values(stats).forEach((cartStats) => {
      Object.values(cartStats.variants || {}).forEach((variantStats) => {
        variantStats.conversionRate =
          variantStats.impressions > 0
            ? Math.min(
                (variantStats.completedOrders / variantStats.impressions) * 100,
                100,
              )
            : 0;
      });
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
      ([
        cartId,
        {
          revenue,
          impressions,
          checkouts,
          completedOrders,
          ordersByDate,
          impressionsByDate,
          revenueByDate,
          variants,
        },
      ]) => {
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
          aov: completedOrders > 0 ? revenue / completedOrders : 0,
          variants: Object.fromEntries(
            Object.entries(variants || {}).map(([variantKey, variantStats]) => [
              variantKey,
              {
                ...variantStats,
                revenuePerVisitor:
                  variantStats.impressions > 0
                    ? variantStats.revenue / variantStats.impressions
                    : 0,
                aov:
                  variantStats.completedOrders > 0
                    ? variantStats.revenue / variantStats.completedOrders
                    : 0,
              },
            ]),
          ),
          ordersByDate: ordersByDateArr,
        };
      },
    );

    const breakdown = shopRevenueBreakdown[0] || {
      addonRevenue: 0,
      upsellRevenue: 0,
      subscriptionRevenue: 0,
      baseRevenue: 0,
      totalRevenue: 0,
    };

    return res.json({
      success: true,
      data: result,
      shopRevenue: {
        addonRevenue: breakdown.addonRevenue || 0,
        upsellRevenue: breakdown.upsellRevenue || 0,
        subscriptionRevenue: breakdown.subscriptionRevenue || 0,
        baseRevenue: breakdown.baseRevenue || 0,
        totalRevenue: breakdown.totalRevenue || 0,
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
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ["$totalRevenue", 0] },
                { $ifNull: ["$baseRevenue", 0] },
              ],
            },
          },
          upsellRevenue: { $sum: "$upsellRevenue" },
          addonRevenue: { $sum: "$addonRevenue" },
          subscriptionRevenue: { $sum: "$subscriptionRevenue" },
          baseRevenue: { $sum: "$baseRevenue" },
          orderCount: { $sum: 1 },
          upsellOrderCount: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ["$upsellRevenue", 0] }, 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    // ───── Unique sessions per event (for Total Carts / Abandoned Carts) ─────
    const uniqueSessionStats = await analyticsModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
      { $group: { _id: { eventType: "$eventType", sessionId: "$sessionId" } } },
      { $group: { _id: "$_id.eventType", count: { $sum: 1 } } },
    ]);
    const uniqueSessions = {};
    uniqueSessionStats.forEach((item) => {
      uniqueSessions[item._id] = item.count;
    });

    // ───── Best-performing products (app-attributed lines, by revenue) ─────
    const topProductsRaw = await orderRevenueModel.aggregate([
      { $match: { shop: cleanShop, createdAt: dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { title: "$items.title", module: "$items.module" },
          productId: { $first: "$items.productId" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.revenue" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);
    const topProducts = topProductsRaw.map((p) => ({
      name: p._id.title,
      productId: p.productId || null,
      module: p._id.module,
      quantity: p.quantity,
      revenue: p.revenue,
    }));

    // ───── Most recent orders (scoped to date range) ─────
    const recentOrdersRaw = await orderRevenueModel
      .find({ shop: cleanShop, createdAt: dateFilter })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const recentOrders = recentOrdersRaw.map((o) => ({
      orderNumber: o.orderNumber ?? null,
      orderId: o.orderId,
      currency: o.currency || "USD",
      createdAt: o.createdAt,
      upsellRevenue: o.upsellRevenue || 0,
      addonRevenue: o.addonRevenue || 0,
      subscriptionRevenue: o.subscriptionRevenue || 0,
      totalRevenue: (o.totalRevenue || 0) + (o.baseRevenue || 0),
      itemCount: (o.items || []).reduce((n, i) => n + (i.quantity || 1), 0),
      // product ids/titles so the dashboard can show the product images
      items: (o.items || []).map((i) => ({
        title: i.title,
        productId: i.productId || null,
        quantity: i.quantity || 1,
      })),
    }));

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
          total: {
            $sum: {
              $add: [
                { $ifNull: ["$totalRevenue", 0] },
                { $ifNull: ["$baseRevenue", 0] },
              ],
            },
          },
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
        (doc.createdAt
          ? new Date(doc.createdAt).toISOString().slice(0, 10)
          : null);
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
            totalRevenue: 0,
            upsellRevenue: 0,
            addonRevenue: 0,
            subscriptionRevenue: 0,
            baseRevenue: 0,
            orderCount: 0,
            upsellOrderCount: 0,
          },
          daily: dailyRevenue,
        },
        analytics: analyticsFormatted,
        uniqueSessions,
        topProducts,
        recentOrders,
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
      const html = buildContactFormEmailHtml({
        firstName,
        lastName,
        email,
        phone,
        address,
      });

      const thankYouSubject = "Thanks for reaching out – Cart Plus";
      const thankYouHtml = buildContactFormThankYouEmailHtml({ firstName });
      await Promise.all([
        sendEmail("support@cartplus.io", subject, html),
        sendEmail(email, thankYouSubject, thankYouHtml),
      ]);
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

router.post("/portfolio-contact", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email and message are all required." });
    }

    const TO_EMAIL = "kankush7677@gmail.com";
    const subject = `New message from ${name} (via portfolio)`;
    const html = buildEmailHtml({ name, email, message });

    await sendEmail(TO_EMAIL, subject, html, "", [], "New Inquiry - AK");

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact form email error:", err);
    return res
      .status(500)
      .json({ error: "Could not send email. Please try again later." });
  }
});

export default router;
