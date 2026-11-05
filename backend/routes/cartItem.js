import express from "express";
import {
  query,
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

// ─── SQL helpers ─────────────────────────────────────────────────────────────
const rows = async (text, params) => (await query(text, params)).rows;

const dateSql = (params, start, end, col = '"createdAt"') => {
  let s = "";
  if (start) {
    params.push(start);
    s += ` AND ${col} >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    s += ` AND ${col} <= $${params.length}`;
  }
  return s;
};

const REV_SUM = `SUM(COALESCE("totalRevenue",0) + COALESCE("baseRevenue",0))::float`;
const DAY = `to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

const cleanShopDomain = (shop) =>
  String(shop || "")
    .replace("https://", "")
    .replace("http://", "")
    .replace(/\/$/, "");

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
  return cartOrderCountModel.monthTotal(shop, monthStart, monthEnd);
};

const CART_SETTING_KEYS = [
  "designSettings",
  "headerSettings",
  "announcementSettings",
  "rewardsSettings",
  "recommendationsSettings",
  "subscriptionUpgradesSettings",
  "upsellsSettings",
  "additionalNotesSettings",
  "addonsSettings",
  "discountCodesSettings",
  "expressPaymentsSettings",
  "trustBadgesSettings",
  "cartSettings",
  "triggeredRewardsSettings",
];

const pick = (obj, keys) =>
  Object.fromEntries(keys.map((k) => [k, obj?.[k]]));

// ─── Carts ───────────────────────────────────────────────────────────────────

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
      cartModels.findByShop(shop),
      shopPlanModel.findByShop(shop),
    ]);

    return res.status(200).json({
      success: true,
      message: "Carts retrieved successfully",
      data: carts,
      entitled: isFreeShop(shop) || isEntitled(shopPlan),
    });
  } catch (error) {
    console.error("GET CARTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/get-cart/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    if (!cartId) {
      return res.status(400).json({ success: false, message: "Missing cartId" });
    }

    const cart = await cartModels.findByCartId(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
    } = req.body;

    if (!shop || !shopEmail || !storeOwner) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const count = await cartModels.countByShop(shop);
    const cartName = clientCartName?.trim() || `My Cart ${count + 1}`;
    const cartId = clientCartId || crypto.randomUUID();

    const newCart = await cartModels.create({
      shop,
      shopEmail,
      storeOwner,
      cartId,
      cartName,
      status: "unpublished",
      ...pick(req.body, CART_SETTING_KEYS),
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
    CART_SETTING_KEYS.forEach((key) => {
      if (req.body[key]) updateData[key] = req.body[key];
    });

    const updatedCart = await cartModels.update(cartId, updateData);

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
    const cart = await cartModels.findByCartId(cartId);
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
      rows(
        `SELECT "variantId", ${REV_SUM} AS revenue, COUNT(*)::int AS "completedOrders"
         FROM order_revenue
         WHERE shop = $1 AND "cartId" = $2
           AND "variantId" = ANY($3::text[])
           AND "createdAt" >= $4 AND "createdAt" <= $5
         GROUP BY "variantId"`,
        [cart.shop, cartId, activeVariantIds, startedAt, endedAt],
      ),
      rows(
        `SELECT meta->>'variantId' AS "variantId", COUNT(*)::int AS impressions
         FROM analytics
         WHERE shop = $1 AND "cartId" = $2 AND "eventType" = 'cart_impression'
           AND "createdAt" >= $4 AND "createdAt" <= $5
           AND meta->>'variantId' = ANY($3::text[])
         GROUP BY meta->>'variantId'`,
        [cart.shop, cartId, activeVariantIds, startedAt, endedAt],
      ),
    ]);

    const revenueByKey = Object.fromEntries(
      revenueByVariant.map(({ variantId, revenue, completedOrders }) => [
        variantIdToKey[String(variantId)],
        { revenue, completedOrders },
      ]),
    );
    const impressionsByKey = Object.fromEntries(
      impressionsByVariant.map(({ variantId, impressions }) => [
        variantIdToKey[String(variantId)],
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
    const changes = {};
    Object.entries(snapshotFields).forEach(([snapshotKey, cartKey]) => {
      if (winnerSnapshot[snapshotKey] !== undefined) {
        changes[cartKey] = winnerSnapshot[snapshotKey];
      }
    });

    const { abTest: _activeAbTest, ...winnerCartSettings } =
      winnerSnapshot.cartSettings || {};
    changes.cartSettings = {
      ...winnerCartSettings,
      abTest: archivedAbTest,
    };
    const savedCart = await cartModels.update(cartId, changes);

    return res.json({
      success: true,
      message: winnerId
        ? `A/B test archived. Variant ${winnerId} had the highest revenue.`
        : "A/B test archived. No winner yet because no variant has recorded revenue.",
      data: { cart: savedCart, archiveRecord, abTest: archivedAbTest },
    });
  } catch (error) {
    console.error("ARCHIVE A/B TEST ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/delete-cart", async (req, res) => {
  try {
    const { cartId } = req.body;
    const deletedCart = await cartModels.deleteByCartId(cartId);

    if (!deletedCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      data: deletedCart,
    });
  } catch (error) {
    console.error("DELETE CART ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/toggle-publish", async (req, res) => {
  try {
    const { cartId } = req.body;

    const cart = await cartModels.findByCartId(cartId);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    const isPublishing = cart.status !== "published";

    if (isPublishing) {
      await cartModels.unpublishAllInShop(cart.shop);
    }

    const updatedCart = await cartModels.update(cartId, {
      status: isPublishing ? "published" : "unpublished",
      ...(isPublishing && { lastLiveDate: new Date() }),
    });

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

    const existingCart = await cartModels.findByCartId(cartId);
    if (!existingCart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const savedCart = await cartModels.create({
      shop: existingCart.shop,
      shopEmail: existingCart.shopEmail,
      storeOwner: existingCart.storeOwner,
      lastLiveDate: existingCart.lastLiveDate,
      ...pick(existingCart, CART_SETTING_KEYS),
      cartId: generateNewCartId(),
      cartName: `Copy of ${existingCart.cartName || "My Cart"}`,
      status: "unpublished",
    });

    res.json({ success: true, data: savedCart });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

// ─── Sticky cart ─────────────────────────────────────────────────────────────

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
  "barStyle",
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

    const updatedStickyCart = await stickyCartModel.upsertByShop({
      shop,
      ...fields,
      cartId: cartId || generateNewCartId(), // sirf insert pe use hota hai
    });

    res.json({ success: true, data: updatedStickyCart });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
});

router.get("/get-sticky-cart/:shop", async (req, res) => {
  try {
    const { shop } = req.params;
    const stickyCart = await stickyCartModel.findByShop(shop);

    if (!stickyCart) {
      return res
        .status(404)
        .json({ success: false, message: "Sticky cart not found" });
    }
    return res.status(200).json({ success: true, data: stickyCart });
  } catch (error) {
    console.error("GET STICKY CART ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Shop token ──────────────────────────────────────────────────────────────
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

    const existing = await shopConfigModel.findByShop(shop);
    const isNewStore = !existing;

    const tokenChanged = existing?.accessToken !== accessToken;
    const emailChanged = (existing?.email ?? null) !== (email ?? null);

    if (!isNewStore && !tokenChanged && !emailChanged) {
      return res.json({ success: true, updated: false });
    }

    await shopConfigModel.upsertByShop({
      shop,
      accessToken,
      email,
      updatedAt: new Date(),
    });

    if (isNewStore) {
      const existingPlan = await shopPlanModel.findByShop(shop);

      if (!existingPlan) {
        await shopPlanModel.create({
          shop,
          plan: "free",
          price: 0,
          status: "active",
          isDev: true,
        });
      }

      try {
        const cart = await cartModels.findAnyByShop(shop);
        const storeOwner = cart?.storeOwner || "there";

        const subject = "Welcome to Cart Plus 🎉";
        const html = buildWelcomeEmailHtml({ storeOwner, shop });

        if (email) {
          await sendEmail(email, subject, html);
        }
      } catch (emailError) {
        console.error("[hub] Welcome email error:", emailError);
      }
    }

    return res.json({
      success: true,
      updated: true,
      isNewStore,
    });

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

    const plan = await shopPlanModel.findByShop(shop);

    if (isFreeShop(shop)) {
      return res.status(200).json({
        success: true,
        data: {
          ...(plan || {}),
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
    const previousPlan = await shopPlanModel.findByShop(shop);

    // 2. Save. isDev tabhi overwrite hota hai jab caller bheje.
    const update = {
      shop,
      plan,
      price,
      subscriptionId,
      status: status || "active",
      updatedAt: new Date(),
    };
    if (isDev !== undefined) update.isDev = isDev;

    const updated = await shopPlanModel.upsertByShop(update);

    const finalStatus = status || "active";
    const isNowPaidAndActive = plan !== "free" && finalStatus === "active";
    const wasPreviouslyDifferent =
      !previousPlan ||
      previousPlan.plan !== plan ||
      previousPlan.status !== "active";

    if (isNowPaidAndActive && wasPreviouslyDifferent) {
      try {
        const [shopConfig, cart] = await Promise.all([
          shopConfigModel.findByShop(shop),
          cartModels.findAnyByShop(shop),
        ]);

        const toEmail = shopConfig?.email || cart?.shopEmail;
        const storeOwner = cart?.storeOwner || "there";

        if (toEmail) {
          const subject = "Your Cart Plus plan has been upgraded";
          const html = buildPlanUpgradeEmailHtml({ storeOwner, shop, plan });
          await sendEmail(toEmail, subject, html);
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

    await shopPlanModel.deleteByShop(shop);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE SHOP PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Analytics events ────────────────────────────────────────────────────────

router.post("/cart-impression", async (req, res) => {
  try {
    const { shop, cartId, sessionId, userAgent, variantId, variantKey } =
      req.body;

    if (!shop || !sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shop or sessionId" });
    }

    const exists = await analyticsModel.impressionExists({
      shop,
      sessionId,
      cartId,
      variantId,
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
      .filter((e) => e && ["added", "removed"].includes(e.action))
      .map((e) => ({
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

    const SHOW_ALL_ACTIVITY = false;
    const includeAll = SHOW_ALL_ACTIVITY && req.query.type === "all";

    // cart_activity query
    const params = [cleanShop];
    let where = `shop = $1`;
    where += dateSql(
      params,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
    );
    if (before) {
      params.push(new Date(before));
      where += ` AND "createdAt" < $${params.length}`;
    }
    if (action === "added" || action === "removed") {
      params.push(action);
      where += ` AND action = $${params.length}`;
    } else if (!includeAll) {
      where += ` AND action IN ('added','removed')`;
    }
    params.push(limit + 1);
    const cartRowsP = rows(
      `SELECT * FROM cart_activity WHERE ${where}
       ORDER BY "createdAt" DESC LIMIT $${params.length}`,
      params,
    );

    // analytics events (sirf type=all me)
    let eventRowsP = Promise.resolve([]);
    if (includeAll) {
      const p2 = [cleanShop];
      let w2 = `shop = $1`;
      w2 += dateSql(
        p2,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
      );
      if (before) {
        p2.push(new Date(before));
        w2 += ` AND "createdAt" < $${p2.length}`;
      }
      p2.push(limit + 1);
      eventRowsP = rows(
        `SELECT "_id","eventType","sessionId","createdAt","userAgent"
         FROM analytics WHERE ${w2}
         ORDER BY "createdAt" DESC LIMIT $${p2.length}`,
        p2,
      );
    }

    const [cartRows, eventRows] = await Promise.all([cartRowsP, eventRowsP]);

    const all = [
      ...cartRows.map((r) => ({ ...r, kind: "cart" })),
      ...eventRows.map((r) => ({ ...r, kind: "event" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const hasMore = all.length > limit;
    const events = all.slice(0, limit);
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

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const p1 = [cleanShop];
    const d1 = dateSql(p1, start, end);
    const p2 = [cleanShop];
    const d2 = dateSql(p2, start, end, 'o."createdAt"');

    const latest = (col) => `(array_agg(${col} ORDER BY "createdAt" DESC))[1]`;

    const [mostAdded, bestSelling] = await Promise.all([
      rows(
        `SELECT COALESCE("productId","productTitle") AS "_id",
                ${latest('"productId"')} AS "productId",
                ${latest('"productTitle"')} AS "productTitle",
                ${latest("handle")} AS handle,
                ${latest("image")} AS image,
                ${latest("price")} AS price,
                ${latest("currency")} AS currency,
                SUM(quantity)::int AS "addedQty",
                COUNT(*)::int AS "addCount"
         FROM cart_activity
         WHERE shop = $1 AND action = 'added'${d1}
         GROUP BY COALESCE("productId","productTitle")
         ORDER BY "addedQty" DESC
         LIMIT 5`,
        p1,
      ),
      rows(
        `SELECT item->>'productId' AS "productId",
                MAX(item->>'title') AS title,
                MAX(o.currency) AS currency,
                SUM(COALESCE((item->>'quantity')::numeric,0))::float AS quantity,
                SUM(COALESCE((item->>'revenue')::numeric,0))::float AS revenue
         FROM order_revenue o
         CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
         WHERE o.shop = $1${d2}
         GROUP BY item->>'productId'
         ORDER BY quantity DESC, revenue DESC
         LIMIT 5`,
        p2,
      ),
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
          id: String(p.productId || "unknown"),
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
      rows(
        `SELECT * FROM cart_activity
         WHERE shop = $1 AND "sessionId" = $2 ORDER BY "createdAt" ASC`,
        [cleanShop, sessionId],
      ),
      rows(
        `SELECT "eventType","createdAt","cartId",meta,"userAgent"
         FROM analytics
         WHERE shop = $1 AND "sessionId" = $2 ORDER BY "createdAt" ASC`,
        [cleanShop, sessionId],
      ),
    ]);

    const timeline = [
      ...activity.map((a) => ({
        type:
          a.action === "added"
            ? "item_added"
            : a.action === "removed"
              ? "item_removed"
              : a.action,
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

    const publishedCart = await cartModels.findPublishedByShop(shop);
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
    const shopPlan = await shopPlanModel.findByShop(shop);
    const planName = shopPlan?.plan || "free";
    const enforceLimit = !shopPlan?.isDev && !isFreeShop(shop);
    const monthlyLimit = PLAN_ORDER_LIMITS[planName] ?? PLAN_ORDER_LIMITS.free;
    const monthlyOrderCount = await getMonthlyOrderCount(shop);

    const sendLimitReachedEmail = async () => {
      try {
        const [shopConfig, cart] = await Promise.all([
          shopConfigModel.findByShop(shop),
          cartModels.findAnyByShop(shop),
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
          await sendEmail(toEmail, subject, html);
        }
      } catch (emailError) {
        console.error("[hub] Limit reached email error:", emailError);
      }
    };

    if (enforceLimit && monthlyOrderCount >= monthlyLimit) {
      await cartModels.update(publishedCart.cartId, { status: "unpublished" });
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

    // Shopify orders/paid ek order ke liye multiple baar aa sakta hai.
    // Order sirf tab count hota hai jab uska revenue record pehli baar bane.
    const alreadyCounted = await orderRevenueModel.existsByOrderId(cartToken);

    const today = new Date().toISOString().slice(0, 10);
    if (!alreadyCounted) {
      await cartOrderCountModel.increment(shop, publishedCart.cartId, today);
    }

    // ─── Re-check after incrementing ────────────────────────────────────────
    const newMonthlyCount = monthlyOrderCount + 1;
    if (enforceLimit && newMonthlyCount >= monthlyLimit) {
      await cartModels.update(publishedCart.cartId, { status: "unpublished" });
      await sendLimitReachedEmail();
    }

    const revenueRecord = {
      shop,
      cartId:
        attributedCartId === publishedCart.cartId
          ? attributedCartId
          : publishedCart.cartId,
      orderId: cartToken,
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

    await orderRevenueModel.upsertByOrderId(revenueRecord);

    return res.json({ success: true, counted: true, revenueSaved: true });
  } catch (error) {
    console.error("ORDER REVENUE ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: error?.message, code: error?.code });
  }
});

// ─── Cart stats ──────────────────────────────────────────────────────────────

router.get("/cart-stats", async (req, res) => {
  try {
    const { shop, startDate, endDate, cartIds } = req.query;
    if (!shop)
      return res.status(400).json({ success: false, message: "Missing shop" });

    const cleanShop = cleanShopDomain(shop);

    const cartIdFilter =
      cartIds && cartIds.trim() !== ""
        ? cartIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : null;

    const start = startDate ? new Date(startDate) : null;
    let end = null;
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const toDateStr = (d) => new Date(d).toISOString().slice(0, 10);
    const startStr = startDate ? toDateStr(startDate) : null;
    const endStr = endDate ? toDateStr(endDate) : null;

    const publishedCart = await cartModels.findPublishedByShop(cleanShop);
    const activeAbTest = publishedCart?.cartSettings?.abTest;
    const activeVariantIds =
      activeAbTest?.enabled && activeAbTest.variantIds
        ? Object.values(activeAbTest.variantIds).filter(Boolean)
        : [];

    const NOT_EMPTY_CART = `"cartId" IS NOT NULL AND "cartId" <> ''`;

    // Har query ke liye (sql, params) banane wale chhote builders
    const withRange = (sqlFn) => {
      const params = [cleanShop];
      const range = dateSql(params, start, end);
      return { range, params, sql: sqlFn(range, params) };
    };

    const run = ({ sql, params }) => rows(sql, params);

    // 1. revenue by cart
    const q1 = withRange(
      (r) => `SELECT "cartId", ${REV_SUM} AS "totalRevenue"
              FROM order_revenue WHERE shop = $1 AND ${NOT_EMPTY_CART}${r}
              GROUP BY "cartId"`,
    );
    // 2. analytics by cart + event
    const q2 = withRange(
      (r) => `SELECT "cartId", "eventType", COUNT(*)::int AS count
              FROM analytics WHERE shop = $1 AND ${NOT_EMPTY_CART}${r}
              GROUP BY "cartId","eventType"`,
    );
    // 3. shop level analytics
    const q3 = withRange(
      (r) => `SELECT "eventType", COUNT(*)::int AS count
              FROM analytics WHERE shop = $1${r} GROUP BY "eventType"`,
    );
    // 4. shop revenue breakdown (optionally cartIds filter)
    const q4 = (() => {
      const params = [cleanShop];
      let r = dateSql(params, start, end);
      if (cartIdFilter) {
        params.push(cartIdFilter);
        r += ` AND "cartId" = ANY($${params.length}::text[])`;
      }
      return {
        params,
        sql: `SELECT COALESCE(SUM("addonRevenue"),0)::float AS "addonRevenue",
                     COALESCE(SUM("upsellRevenue"),0)::float AS "upsellRevenue",
                     COALESCE(SUM("subscriptionRevenue"),0)::float AS "subscriptionRevenue",
                     COALESCE(SUM("baseRevenue"),0)::float AS "baseRevenue",
                     COALESCE(${REV_SUM},0)::float AS "totalRevenue"
              FROM order_revenue WHERE shop = $1${r}`,
      };
    })();
    // 5. orders by cart by date (cart_order_counts, date TEXT)
    const q5 = (() => {
      const params = [cleanShop];
      const r = dateSql(params, startStr, endStr, '"date"');
      return {
        params,
        sql: `SELECT "cartId", "date", SUM("totalOrders")::int AS "totalOrders"
              FROM cart_order_counts WHERE shop = $1${r}
              GROUP BY "cartId","date" ORDER BY "date" ASC`,
      };
    })();
    // 6. impressions by cart by date
    const q6 = withRange(
      (r) => `SELECT "cartId", ${DAY} AS date, COUNT(*)::int AS count
              FROM analytics
              WHERE shop = $1 AND ${NOT_EMPTY_CART}
                AND "eventType" = 'cart_impression'${r}
              GROUP BY "cartId", ${DAY} ORDER BY date ASC`,
    );
    // 7. revenue by cart by date
    const q7 = withRange(
      (r) => `SELECT "cartId", ${DAY} AS date, ${REV_SUM} AS "totalRevenue"
              FROM order_revenue WHERE shop = $1 AND ${NOT_EMPTY_CART}${r}
              GROUP BY "cartId", ${DAY} ORDER BY date ASC`,
    );

    // 8 & 9. A/B variants (sirf jab published cart + active variants ho)
    const hasVariants = !!publishedCart && activeVariantIds.length > 0;
    const q8 = hasVariants
      ? (() => {
          const params = [cleanShop];
          const r = dateSql(params, start, end);
          params.push(publishedCart.cartId, activeVariantIds);
          const n = params.length;
          return {
            params,
            sql: `SELECT "cartId", "variantKey",
                         MAX("variantId") AS "variantId",
                         ${REV_SUM} AS revenue,
                         COUNT(*)::int AS "completedOrders"
                  FROM order_revenue
                  WHERE shop = $1${r}
                    AND "cartId" = $${n - 1}
                    AND "variantId" = ANY($${n}::text[])
                    AND "variantKey" IS NOT NULL AND "variantKey" <> ''
                  GROUP BY "cartId","variantKey"`,
          };
        })()
      : null;
    const q9 = hasVariants
      ? (() => {
          const params = [cleanShop];
          const r = dateSql(params, start, end);
          params.push(publishedCart.cartId, activeVariantIds);
          const n = params.length;
          return {
            params,
            sql: `SELECT "cartId", meta->>'variantKey' AS "variantKey",
                         MAX(meta->>'variantId') AS "variantId",
                         COUNT(*)::int AS impressions
                  FROM analytics
                  WHERE shop = $1${r}
                    AND "cartId" = $${n - 1}
                    AND "eventType" = 'cart_impression'
                    AND meta->>'variantId' = ANY($${n}::text[])
                    AND COALESCE(meta->>'variantKey','') <> ''
                  GROUP BY "cartId", meta->>'variantKey'`,
          };
        })()
      : null;

    const [
      revenueByCart,
      analyticsByCart,
      shopAnalytics,
      shopRevenueRows,
      ordersByCartByDate,
      impressionsByCartByDate,
      revenueByCartByDate,
      revenueByVariant,
      impressionsByVariant,
    ] = await Promise.all([
      run(q1),
      run(q2),
      run(q3),
      run(q4),
      run(q5),
      run(q6),
      run(q7),
      q8 ? run(q8) : [],
      q9 ? run(q9) : [],
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
    const get = (cartId) => (stats[cartId] ||= emptyStat());

    revenueByCart.forEach(({ cartId, totalRevenue }) => {
      get(cartId).revenue = totalRevenue;
    });

    analyticsByCart.forEach(({ cartId, eventType, count }) => {
      const s = get(cartId);
      if (eventType === "cart_impression") s.impressions = count;
      if (eventType === "checkout_initiated") s.checkouts = count;
    });

    ordersByCartByDate.forEach(({ cartId, date, totalOrders }) => {
      const s = get(cartId);
      s.completedOrders += totalOrders;
      s.ordersByDate[date] = (s.ordersByDate[date] || 0) + totalOrders;
    });

    impressionsByCartByDate.forEach(({ cartId, date, count }) => {
      const s = get(cartId);
      s.impressionsByDate[date] = (s.impressionsByDate[date] || 0) + count;
    });

    revenueByCartByDate.forEach(({ cartId, date, totalRevenue }) => {
      const s = get(cartId);
      s.revenueByDate[date] = (s.revenueByDate[date] || 0) + totalRevenue;
    });

    revenueByVariant.forEach(
      ({ cartId, variantKey, variantId, revenue, completedOrders }) => {
        const s = get(cartId);
        s.variants ||= {};
        s.variants[variantKey] = {
          variantId,
          revenue,
          completedOrders,
          impressions: 0,
          conversionRate: 0,
        };
      },
    );

    impressionsByVariant.forEach(
      ({ cartId, variantKey, variantId, impressions }) => {
        const s = get(cartId);
        s.variants ||= {};
        if (!s.variants[variantKey]) {
          s.variants[variantKey] = {
            variantId,
            revenue: 0,
            completedOrders: 0,
            impressions: 0,
            conversionRate: 0,
          };
        }
        s.variants[variantKey].variantId ||= variantId;
        s.variants[variantKey].impressions = impressions;
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
          shopAnalytics.find((e) => e.eventType === "cart_impression")?.count ||
          0;
        const shopCheckouts =
          shopAnalytics.find((e) => e.eventType === "checkout_initiated")
            ?.count || 0;

        get(pid).impressions = shopImpressions;
        get(pid).checkouts = shopCheckouts;
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

    const breakdown = shopRevenueRows[0] || {};

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
    const cleanShop = cleanShopDomain(shop);

    if (!cleanShop) {
      return res.status(400).json({ success: false, message: "Missing shop" });
    }

    // Date range (default: last 30 days)
    const rangeStart = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let rangeEnd;
    if (endDate) {
      rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      rangeEnd = new Date();
    }
    const P = [cleanShop, rangeStart, rangeEnd];
    const RANGE = `shop = $1 AND "createdAt" >= $2 AND "createdAt" <= $3`;

    const [
      totalsRows,
      uniqueSessionStats,
      topProductsRaw,
      recentOrdersRaw,
      dailyRevenue,
      analyticsStats,
      dailyAnalytics,
      cartOrderCounts,
    ] = await Promise.all([
      // Revenue totals
      rows(
        `SELECT MAX(currency) AS currency,
                COALESCE(${REV_SUM},0)::float AS "totalRevenue",
                COALESCE(SUM("upsellRevenue"),0)::float AS "upsellRevenue",
                COALESCE(SUM("addonRevenue"),0)::float AS "addonRevenue",
                COALESCE(SUM("subscriptionRevenue"),0)::float AS "subscriptionRevenue",
                COALESCE(SUM("baseRevenue"),0)::float AS "baseRevenue",
                COUNT(*)::int AS "orderCount",
                (COUNT(*) FILTER (WHERE COALESCE("upsellRevenue",0) > 0))::int AS "upsellOrderCount"
         FROM order_revenue WHERE ${RANGE}`,
        P,
      ),
      // Unique sessions per event
      rows(
        `SELECT "eventType" AS _id, COUNT(DISTINCT "sessionId")::int AS count
         FROM analytics WHERE ${RANGE} GROUP BY "eventType"`,
        P,
      ),
      // Best-performing products
      rows(
        `SELECT item->>'title' AS title, item->>'module' AS module,
                MAX(item->>'productId') AS "productId",
                SUM(COALESCE((item->>'quantity')::numeric,0))::float AS quantity,
                SUM(COALESCE((item->>'revenue')::numeric,0))::float AS revenue
         FROM order_revenue o
         CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
         WHERE o.shop = $1 AND o."createdAt" >= $2 AND o."createdAt" <= $3
         GROUP BY item->>'title', item->>'module'
         ORDER BY revenue DESC LIMIT 5`,
        P,
      ),
      // Recent orders
      rows(
        `SELECT * FROM order_revenue WHERE ${RANGE}
         ORDER BY "createdAt" DESC LIMIT 5`,
        P,
      ),
      // Daily revenue
      rows(
        `SELECT ${DAY} AS "_id",
                COALESCE(SUM("upsellRevenue"),0)::float AS "upsellRevenue",
                COALESCE(SUM("addonRevenue"),0)::float AS "addonRevenue",
                COALESCE(SUM("subscriptionRevenue"),0)::float AS "subscriptionRevenue",
                COALESCE(SUM("baseRevenue"),0)::float AS "baseRevenue",
                ${REV_SUM} AS total
         FROM order_revenue WHERE ${RANGE}
         GROUP BY ${DAY} ORDER BY "_id" ASC`,
        P,
      ),
      // Analytics totals
      rows(
        `SELECT "eventType" AS _id, COUNT(*)::int AS count
         FROM analytics WHERE ${RANGE} GROUP BY "eventType"`,
        P,
      ),
      // Daily analytics
      rows(
        `SELECT ${DAY} AS date, "eventType", COUNT(*)::int AS count
         FROM analytics WHERE ${RANGE}
         GROUP BY ${DAY}, "eventType" ORDER BY date ASC`,
        P,
      ),
      // Checkouts completed (cart_order_counts, date TEXT)
      rows(
        `SELECT * FROM cart_order_counts
         WHERE shop = $1 AND "date" >= $2 AND "date" <= $3`,
        [
          cleanShop,
          rangeStart.toISOString().slice(0, 10),
          rangeEnd.toISOString().slice(0, 10),
        ],
      ),
    ]);

    const totals = totalsRows[0];

    const uniqueSessions = {};
    uniqueSessionStats.forEach((item) => {
      uniqueSessions[item._id] = item.count;
    });

    const topProducts = topProductsRaw.map((p) => ({
      name: p.title,
      productId: p.productId || null,
      module: p.module,
      quantity: p.quantity,
      revenue: p.revenue,
    }));

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
      items: (o.items || []).map((i) => ({
        title: i.title,
        productId: i.productId || null,
        quantity: i.quantity || 1,
      })),
    }));

    const analyticsFormatted = {};
    analyticsStats.forEach((item) => {
      analyticsFormatted[item._id] = item.count;
    });

    const dailyAnalyticsMap = {};
    dailyAnalytics.forEach(({ date, eventType, count }) => {
      if (!dailyAnalyticsMap[date]) dailyAnalyticsMap[date] = {};
      dailyAnalyticsMap[date][eventType] = count;
    });

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
        revenue: { totals, daily: dailyRevenue },
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

    const orderCounts = await cartOrderCountModel.find(shop, cartId);

    if (!orderCounts || orderCounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order count data found",
      });
    }

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

    const dateWise = Object.entries(byDate)
      .map(([date, count]) => ({ date, totalOrders: count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return res.status(200).json({
      success: true,
      data: { breakdown: orderCounts, totalOrders, dateWise },
    });
  } catch (error) {
    console.error("CART ORDER COUNT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Contact Form ─────────────────────────────────────────────────────────────

router.post("/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, email",
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
      const subject = `New contact form submission — ${firstName} ${lastName || ""}`.trim();
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