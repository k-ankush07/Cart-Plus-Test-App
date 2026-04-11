import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

const FUNCTION_ID = "019d7a2b-43f5-7e17-b7dd-594ab755c24d";

export const action = async ({ request }) => {
    console.log("===========================================");
    console.log("🚀 [create-discount] ACTION CALLED");
    console.log("===========================================");

    const { admin } = await authenticate.admin(request);
    console.log("✅ [create-discount] Admin authenticated");

    let body;
    try {
        body = await request.json();
        console.log("📦 [create-discount] Raw request body:", JSON.stringify(body, null, 2));
    } catch {
        console.error("❌ [create-discount] Failed to parse JSON body");
        return json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
        code,
        value,
        type,
        rewardType,
        discountCombinations = {},
        items,
        minimumSubtotal,
    } = body;

    console.log("📋 [create-discount] Destructured values:");
    console.log("  → code:", code);
    console.log("  → value:", value);
    console.log("  → type:", type);
    console.log("  → rewardType:", rewardType);
    console.log("  → discountCombinations:", JSON.stringify(discountCombinations));
    console.log("  → items:", JSON.stringify(items, null, 2));
    console.log("  → minimumSubtotal:", minimumSubtotal);

    // ✅ CombinesWith
    let combinesWith;
    if (rewardType === "free_shipping") {
        combinesWith = {
            productDiscounts: true,
            orderDiscounts: true,
            shippingDiscounts: false,
        };
    } else {
        combinesWith = {
            productDiscounts: !!discountCombinations.productDiscounts,
            orderDiscounts: !!discountCombinations.orderDiscounts,
            shippingDiscounts: !!discountCombinations.shippingDiscounts,
        };
    }

    // ✅ Normalize value
    const numericValue = Number(value);
    let normalizedValue;
    if (rewardType === "free_gift") {
        normalizedValue = 1;
    } else if (type === "percentage") {
        normalizedValue = numericValue > 1 ? numericValue / 100 : numericValue;
    } else {
        normalizedValue = numericValue;
    }
    console.log("🔢 normalizedValue:", normalizedValue);

    // ══════════════════════════════════════════════════
    // ✅ FREE SHIPPING — code discount mutation
    // ══════════════════════════════════════════════════
    if (rewardType === "free_shipping") {
        console.log("🚚 [create-discount] Routing to FREE SHIPPING mutation");

        let minimumRequirement;
        if (minimumSubtotal && Number(minimumSubtotal) > 0) {
            minimumRequirement = {
                subtotal: {
                    greaterThanOrEqualToSubtotal: String(Number(minimumSubtotal)),
                },
            };
        }

        const freeShippingMutation = `
            mutation CreateFreeShipping($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
                discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
                    codeDiscountNode { id }
                    userErrors { field message }
                }
            }
        `;

        const freeShippingVariables = {
            freeShippingCodeDiscount: {
                title: code,
                code: code,
                startsAt: new Date().toISOString(),
                appliesOncePerCustomer: false,
                combinesWith,
                destination: { all: true },
                ...(minimumRequirement ? { minimumRequirement } : {}),
            },
        };

        console.log("📤 Free shipping variables:", JSON.stringify(freeShippingVariables, null, 2));

        try {
            const response = await admin.graphql(freeShippingMutation, { variables: freeShippingVariables });
            const data = await response.json();
            console.log("📥 Free shipping Shopify response:", JSON.stringify(data, null, 2));

            if (data.errors) {
                console.error("❌ Free shipping GraphQL errors:", data.errors);
                return json({ error: data.errors[0].message }, { status: 500 });
            }

            const userErrors = data?.data?.discountCodeFreeShippingCreate?.userErrors;
            if (userErrors?.length) {
                console.error("❌ Free shipping userErrors:", userErrors[0].message);
                return json({ error: userErrors[0].message }, { status: 422 });
            }

            const discountId = data?.data?.discountCodeFreeShippingCreate?.codeDiscountNode?.id;
            console.log("✅ Free shipping discount created! ID:", discountId);
            return json({ success: true, discountId });

        } catch (error) {
            console.error("❌ Free shipping exception:", error?.message || error);
            return json({ error: error?.message || "Failed to create free shipping discount" }, { status: 500 });
        }
    }

    // ══════════════════════════════════════════════════
    // ✅ CART DISCOUNT / FREE GIFT — App Function mutation
    // ══════════════════════════════════════════════════
    console.log("💰 [create-discount] Routing to APP FUNCTION mutation");

    if (rewardType === "cart_discount" && (value === undefined || value === null)) {
        return json({ error: "Discount value is required" }, { status: 400 });
    }

    // ✅ Metafield config jo function padega
    const metafieldConfig = JSON.stringify({
        rewardType,
        value: normalizedValue,
        type,
        items,
        minimumSubtotal: minimumSubtotal ?? null,
    });

    console.log("📦 metafieldConfig:", metafieldConfig);

    const mutation = `
        mutation CreateAppDiscount($discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $discount) {
                automaticAppDiscount {
                    discountId
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        discount: {
            title: code,
            functionId: FUNCTION_ID,
            startsAt: new Date().toISOString(),
            combinesWith,
            discountClasses: ["ORDER"], 
            metafields: [
                {
                    namespace: "$app:cart-drawer-discount",
                    key: "config",
                    type: "json",
                    value: metafieldConfig,
                },
            ],
        },
    };

    console.log("📤 Final GraphQL variables:", JSON.stringify(variables, null, 2));

    try {
        console.log("📡 Sending GraphQL mutation...");
        const response = await admin.graphql(mutation, { variables });
        const data = await response.json();
        console.log("📥 Shopify raw response:", JSON.stringify(data, null, 2));

        if (data.errors) {
            console.error("❌ GraphQL body errors:", JSON.stringify(data.errors, null, 2));
            return json({ error: data.errors[0].message }, { status: 500 });
        }

        const userErrors = data?.data?.discountAutomaticAppCreate?.userErrors;
        console.log("🔍 userErrors:", JSON.stringify(userErrors, null, 2));

        if (userErrors?.length) {
            console.error("❌ Shopify userErrors:", userErrors[0].message);
            return json({ error: userErrors[0].message }, { status: 422 });
        }

        const discountId = data?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
        console.log("✅ Discount created successfully! ID:", discountId);
        return json({ success: true, discountId });

    } catch (error) {
        console.error("❌ Caught exception:", error?.message || error);
        return json({ error: error?.message || "Failed to create discount" }, { status: 500 });
    }
};