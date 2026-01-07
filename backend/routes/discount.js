import express from "express";
const router = express.Router();
import fetch from "node-fetch";

router.post("/api/create-shopify-discount", async (req, res) => {
  try {
    const { shop, accessToken, tiers } = req.body;

    if (!shop || !accessToken || !tiers || !tiers.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const createdDiscounts = [];

    for (const tier of tiers) {
      if (!tier.rewardType || !tier.rewardDescription) continue;

      if (tier.rewardType === "Product" && !tier.productId) {
        console.warn(
          `Skipping Product tier "${tier.rewardDescription}" - productId missing`
        );
        continue;
      }

      const priceRuleData = {
        price_rule: {
          title: tier.rewardDescription,
          target_type: "line_item",
          target_selection:
            tier.rewardType === "Discount" ? "all" : "entitled",
          allocation_method:
            tier.rewardType === "Discount" ? "across" : "each",
          value_type:
            tier.discountMode === "percentage" ? "percentage" : "fixed_amount",
          value:
            tier.rewardType === "Discount"
              ? -(tier.discountValue || 0)
              : 0,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
          usage_limit: 1,
     
          ...(tier.rewardType === "Discount"
            ? {
                combines_with: {
                  order_discounts: true,
                  product_discounts: true,
                  shipping_discounts: true,
                },
              }
            : {}),
          ...(tier.rewardType === "Product"
            ? { entitled_product_ids: [tier.productId] }
            : {}),
        },
      };

      const priceRuleResponse = await fetch(
        `https://${shop}/admin/api/2025-10/price_rules.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
            Accept: "application/json",
          },
          body: JSON.stringify(priceRuleData),
        }
      );

      const priceRuleResult = await priceRuleResponse.json();
      const priceRuleId = priceRuleResult.price_rule?.id;

      if (!priceRuleId) {
        console.error(
          `Failed to create price rule for tier "${tier.rewardDescription}":`,
          priceRuleResult
        );
        continue;
      }

      const discountCodeData = {
        discount_code: {
          code: `${tier.rewardDescription
            .replace(/\s+/g, "_")
            .toUpperCase()}_${Date.now()}`,
        },
      };

      const discountCodeResponse = await fetch(
        `https://${shop}/admin/api/2025-10/price_rules/${priceRuleId}/discount_codes.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
            Accept: "application/json",
          },
          body: JSON.stringify(discountCodeData),
        }
      );

      const discountCodeResult = await discountCodeResponse.json();

      createdDiscounts.push({
        tier,
        priceRule: priceRuleResult,
        discountCode: discountCodeResult,
      });

      console.log(`Created discount for tier "${tier.rewardDescription}"`);
    }

    if (!createdDiscounts.length) {
      return res.status(400).json({
        message: "No valid discounts were created. Check tiers data.",
      });
    }

    res.status(200).json({
      message: "Discounts created successfully",
      createdDiscounts,
    });
  } catch (err) {
    console.error("Error creating Shopify discounts:", err);
    res.status(500).json({
      message: "Error creating Shopify discounts",
      error: err.message,
    });
  }
});

export default router;