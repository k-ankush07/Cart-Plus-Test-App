import { authenticate } from "../shopify.server";

const jsonResponse = (data, init) =>
    new Response(JSON.stringify(data), {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });

const FUNCTION_ID = "019f6060-3098-7009-a1ed-df98f6ab4c6a";

// ══════════════════════════════════════════════════════════════════
// POST /api/create-discount
//
// Syncs ALL triggered rewards into ONE automatic app discount.
//   - If existingDiscountId is provided → update its metafield only
//   - Otherwise → create a new discount and return the id
//
// Body: { rewards, discountCombinations, existingDiscountId? }
// ══════════════════════════════════════════════════════════════════

export const action = async ({ request }) => {
    console.log(" [sync-discount] ACTION CALLED");

    const { admin } = await authenticate.admin(request);

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { rewards = [], discountCombinations = {}, existingDiscountId } = body;

    const combinesWith = {
        productDiscounts: !!discountCombinations.productDiscounts,
        orderDiscounts: !!discountCombinations.orderDiscounts,
        shippingDiscounts: !!discountCombinations.shippingDiscounts,
    };

    // Build the config that the Shopify Function will read
    const metafieldConfig = JSON.stringify({ rewards });

    // ── UPDATE existing discount's metafield ──────────────────────
    if (existingDiscountId) {
    
        const updateMutation = `
            mutation UpdateAppDiscount($id: ID!, $discount: DiscountAutomaticAppInput!) {
                discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
                    automaticAppDiscount { discountId }
                    userErrors { field message }
                }
            }
        `;

        try {
            const response = await admin.graphql(updateMutation, {
                variables: {
                    id: existingDiscountId,
                    discount: {
                        combinesWith,
                        metafields: [
                            {
                                namespace: "$app:cart-drawer-discount",
                                key: "config",
                                type: "json",
                                value: metafieldConfig,
                            },
                        ],
                    },
                },
            });

            const data = await response.json();
          
            if (data.errors) {
                return jsonResponse({ error: data.errors[0].message }, { status: 500 });
            }

            const userErrors = data?.data?.discountAutomaticAppUpdate?.userErrors;
            if (userErrors?.length) {
                const isNotFound = userErrors.some(e => e.message.toLowerCase().includes("does not exist"));
                if (isNotFound) {
                    console.warn(" [sync-discount] Stored discount no longer exists in Shopify, will create a new one");
                    // fall through to create below
                } else {
                    return jsonResponse({ error: userErrors[0].message }, { status: 422 });
                }
            } else {
                console.log("[sync-discount] Discount updated successfully");
                return jsonResponse({ success: true, discountId: existingDiscountId });
            }

        } catch (error) {
            console.error(" [sync-discount] Update exception:", error?.message || error);
            return jsonResponse({ error: error?.message || "Failed to update discount" }, { status: 500 });
        }
    }

    // ── CREATE new discount (first time or after stale id) ────────
    console.log(" [sync-discount] Creating new discount");

    const createMutation = `
        mutation CreateAppDiscount($discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $discount) {
                automaticAppDiscount { discountId }
                userErrors { field message }
            }
        }
    `;

    try {
        const response = await admin.graphql(createMutation, {
            variables: {
                discount: {
                    title: "Cart Drawer - Triggered Rewards",
                    functionId: FUNCTION_ID,
                    startsAt: new Date().toISOString(),
                    combinesWith,
                    discountClasses: ["PRODUCT", "SHIPPING", "ORDER"],
                    metafields: [
                        {
                            namespace: "$app:cart-drawer-discount",
                            key: "config",
                            type: "json",
                            value: metafieldConfig,
                        },
                    ],
                },
            },
        });

        const data = await response.json();
        console.log(" [sync-discount] Create response:", JSON.stringify(data, null, 2));

        if (data.errors) {
            return jsonResponse({ error: data.errors[0].message }, { status: 500 });
        }

        const userErrors = data?.data?.discountAutomaticAppCreate?.userErrors;
        if (userErrors?.length) {
            return jsonResponse({ error: userErrors[0].message }, { status: 422 });
        }

        const discountId = data?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
        console.log(" [sync-discount] Discount created! ID:", discountId);
        return jsonResponse({ success: true, discountId });

    } catch (error) {
        console.error(" [sync-discount] Create exception:", error?.message || error);
        return jsonResponse({ error: error?.message || "Failed to create discount" }, { status: 500 });
    }
};
