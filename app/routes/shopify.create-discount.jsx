import { authenticate } from "../shopify.server";

const jsonResponse = (data, init) =>
    new Response(JSON.stringify(data), {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });

const FUNCTION_ID = "019f6068-b424-72b2-820c-959065879ed7";
const DISCOUNT_TITLE = "Cart Plus - Triggered Rewards";

const API_URL = process.env.PUBLIC_REACT_APP_API_URL;
const API_SECRET_KEY = process.env.VITE_API_SECRET_KEY || "";

// ══════════════════════════════════════════════════════════════════
// POST /api/create-discount
//
// Syncs ALL triggered rewards into ONE automatic app discount.
//   - Only the PUBLISHED cart is allowed to sync — otherwise saving
//     an unpublished cart's settings silently overwrites the live
//     discount that the published cart depends on.
//   - If existingDiscountId is provided → update its metafield only
//   - If not provided (or stale) → look up by title first, then
//     update if found, or create if truly missing
//   - If rewards/discountCombinations aren't sent in the body (e.g.
//     publish triggered from the carts list, not the editor), the
//     cart's real settings are fetched server-side by cartId so the
//     discount is never re-enabled with an empty/stale reward set.
//
// Body: { cartId, rewards?, discountCombinations?, existingDiscountId?, cartStatus, forceDisable? }
// ══════════════════════════════════════════════════════════════════

async function findExistingDiscountId(admin) {
    const query = `
        query FindExistingDiscount($query: String!) {
            discountNodes(first: 5, query: $query) {
                edges {
                    node {
                        id
                        discount {
                            __typename
                            ... on DiscountAutomaticApp {
                                title
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(query, {
            variables: { query: `title:'${DISCOUNT_TITLE}'` },
        });
        const data = await response.json();

        const match = data?.data?.discountNodes?.edges?.find(
            (e) =>
                e.node?.discount?.__typename === "DiscountAutomaticApp" &&
                e.node?.discount?.title === DISCOUNT_TITLE,
        );

        return match?.node?.id ?? null;
    } catch (error) {
        console.warn("[sync-discount] Lookup by title failed:", error?.message || error);
        return null;
    }
}

// 🔑 cartId से cart का असली triggeredRewardsSettings लाओ,
// ताकi publish flow कभी भी खाली rewards के साथ overwrite न करे
async function fetchCartRewardsData(cartId) {
    try {
        const res = await fetch(`${API_URL}/api/get-cart/${cartId}`, {
            headers: { "x-api-key": API_SECRET_KEY },
        });
        const data = await res.json();
        const cart = data?.data;

        return {
            rewards: cart?.triggeredRewardsSettings?.rewards || [],
            discountCombinations: cart?.triggeredRewardsSettings?.discountCombinations || {},
            existingDiscountId: cart?.triggeredRewardsSettings?.shopifyDiscountId || null,
        };
    } catch (error) {
        console.error("[sync-discount] Failed to fetch cart data:", error?.message || error);
        return { rewards: [], discountCombinations: {}, existingDiscountId: null };
    }
}

async function updateDiscount(admin, id, combinesWith, metafieldConfig) {
    const updateMutation = `
        mutation UpdateAppDiscount($id: ID!, $discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
                automaticAppDiscount { discountId }
                userErrors { field message }
            }
        }
    `;

    const response = await admin.graphql(updateMutation, {
        variables: {
            id,
            discount: {
                combinesWith,
                metafields: [
                    {
                        namespace: "$app:cart-plus-discount",
                        key: "config",
                        type: "json",
                        value: metafieldConfig,
                    },
                ],
            },
        },
    });

    return response.json();
}

async function createDiscount(admin, combinesWith, metafieldConfig) {
    const createMutation = `
        mutation CreateAppDiscount($discount: DiscountAutomaticAppInput!) {
            discountAutomaticAppCreate(automaticAppDiscount: $discount) {
                automaticAppDiscount { discountId }
                userErrors { field message }
            }
        }
    `;

    const response = await admin.graphql(createMutation, {
        variables: {
            discount: {
                title: DISCOUNT_TITLE,
                functionId: FUNCTION_ID,
                startsAt: new Date().toISOString(),
                combinesWith,
                discountClasses: ["PRODUCT", "SHIPPING", "ORDER"],
                metafields: [
                    {
                        namespace: "$app:cart-plus-discount",
                        key: "config",
                        type: "json",
                        value: metafieldConfig,
                    },
                ],
            },
        },
    });

    return response.json();
}

export const action = async ({ request }) => {
    console.log(" [sync-discount] ACTION CALLED");

    const { admin } = await authenticate.admin(request);

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
    }

    let {
        cartId,
        rewards = [],
        discountCombinations = {},
        existingDiscountId,
        cartStatus,
        forceDisable = false,
    } = body;

    if (!cartId) {
        return jsonResponse({ error: "cartId is required" }, { status: 400 });
    }

    // ── UNPUBLISH FLOW: discount ko disable karo, rewards empty ────
    if (forceDisable || cartStatus !== "published") {
        console.log(`[sync-discount] Cart "${cartId}" unpublished — disabling discount`);

        let targetId = existingDiscountId || (await findExistingDiscountId(admin));

        if (!targetId) {
            console.log("[sync-discount] No discount exists yet — nothing to disable");
            return jsonResponse({ success: true, skipped: true });
        }

        try {
            const data = await updateDiscount(
                admin,
                targetId,
                { productDiscounts: false, orderDiscounts: false, shippingDiscounts: false },
                JSON.stringify({ cartId, rewards: [] }),
            );

            if (data.errors) {
                return jsonResponse({ error: data.errors[0].message }, { status: 500 });
            }

            const userErrors = data?.data?.discountAutomaticAppUpdate?.userErrors;
            if (userErrors?.length) {
                return jsonResponse({ error: userErrors[0].message }, { status: 422 });
            }

            console.log("[sync-discount] Discount disabled for unpublished cart:", cartId);
            return jsonResponse({ success: true, discountId: targetId, disabled: true });
        } catch (error) {
            console.error("[sync-discount] Disable exception:", error?.message || error);
            return jsonResponse({ error: error?.message || "Failed to disable discount" }, { status: 500 });
        }
    }

    // ── PUBLISH FLOW ─────────────────────────────────────────────
    // Agar caller (jaise carts list se publish button) rewards/combinations
    // nahi bhejta, to yahin cart ka asli data DB/API se fetch karo —
    // taaki discount kabhi bhi empty rewards ke saath re-enable na ho
    const noRewardsSent = rewards.length === 0;
    const noCombosSent = Object.keys(discountCombinations).length === 0;

    if (noRewardsSent && noCombosSent) {
        console.log(`[sync-discount] No rewards/combinations in request — fetching cart "${cartId}" data`);
        const fetched = await fetchCartRewardsData(cartId);
        rewards = fetched.rewards;
        discountCombinations = fetched.discountCombinations;
        existingDiscountId = existingDiscountId || fetched.existingDiscountId;
    }

    const combinesWith = {
        productDiscounts: !!discountCombinations.productDiscounts,
        orderDiscounts: !!discountCombinations.orderDiscounts,
        shippingDiscounts: !!discountCombinations.shippingDiscounts,
    };

    const metafieldConfig = JSON.stringify({ cartId, rewards });

    // ── Resolve which discount ID to target ─────────────────────
    let targetId = existingDiscountId || null;

    if (!targetId) {
        console.log("[sync-discount] No stored ID — looking up by title");
        targetId = await findExistingDiscountId(admin);
        if (targetId) {
            console.log("[sync-discount] Found existing discount via title lookup:", targetId);
        }
    }

    // ── UPDATE if we have a target ID (stored or found by title) ───
    if (targetId) {
        try {
            const data = await updateDiscount(admin, targetId, combinesWith, metafieldConfig);

            if (data.errors) {
                return jsonResponse({ error: data.errors[0].message }, { status: 500 });
            }

            const userErrors = data?.data?.discountAutomaticAppUpdate?.userErrors;
            if (userErrors?.length) {
                const isNotFound = userErrors.some((e) =>
                    e.message.toLowerCase().includes("does not exist"),
                );
                if (isNotFound) {
                    console.warn("[sync-discount] Stored discount no longer exists, will create a new one");
                    targetId = null; // fall through to create below
                } else {
                    return jsonResponse({ error: userErrors[0].message }, { status: 422 });
                }
            } else {
                console.log("[sync-discount] Discount updated successfully. Rewards synced:", rewards.length);
                return jsonResponse({ success: true, discountId: targetId });
            }
        } catch (error) {
            console.error("[sync-discount] Update exception:", error?.message || error);
            return jsonResponse({ error: error?.message || "Failed to update discount" }, { status: 500 });
        }
    }

    // ── CREATE new discount (only reached if truly no discount exists) ────
    console.log("[sync-discount] Creating new discount");

    try {
        const data = await createDiscount(admin, combinesWith, metafieldConfig);
        console.log("[sync-discount] Create response:", JSON.stringify(data, null, 2));

        if (data.errors) {
            return jsonResponse({ error: data.errors[0].message }, { status: 500 });
        }

        const userErrors = data?.data?.discountAutomaticAppCreate?.userErrors;
        if (userErrors?.length) {
            const isDuplicateTitle = userErrors.some((e) =>
                e.message.toLowerCase().includes("must be unique"),
            );

            if (isDuplicateTitle) {
                const foundId = await findExistingDiscountId(admin);
                if (foundId) {
                    const updateData = await updateDiscount(admin, foundId, combinesWith, metafieldConfig);
                    const updateErrors = updateData?.data?.discountAutomaticAppUpdate?.userErrors;
                    if (!updateErrors?.length) {
                        return jsonResponse({ success: true, discountId: foundId });
                    }
                }
            }
            return jsonResponse({ error: userErrors[0].message }, { status: 422 });
        }

        const discountId = data?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
        console.log("[sync-discount] Discount created! ID:", discountId);
        return jsonResponse({ success: true, discountId });
    } catch (error) {
        console.error("[sync-discount] Create exception:", error?.message || error);
        return jsonResponse({ error: error?.message || "Failed to create discount" }, { status: 500 });
    }
};