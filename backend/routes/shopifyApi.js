import express from "express";
import { makeShopifyGraphQL, makeShopifyREST } from "../utils/shopifyFetch.js";

const router = express.Router();

// ─── Product Ratings ─────────────────────────────────────────────────────────

router.get("/product-ratings", async (req, res, next) => {
  try {
    const { shop, ids } = req.query;
    const idList = ids?.split(",").filter(Boolean) ?? [];

    if (!shop || !idList.length) {
      return res.json({ ratings: {} });
    }

    const gids = idList.map((id) => `gid://shopify/Product/${id}`);

    const parseNumeric = (raw) => {
      if (raw === null || raw === undefined || raw === "") return null;
      try {
        const parsed = JSON.parse(raw);
        const num = parseFloat(parsed?.value ?? parsed);
        return Number.isNaN(num) ? null : num;
      } catch {
        const num = parseFloat(raw);
        return Number.isNaN(num) ? null : num;
      }
    };

    const RATING_KEY_PATTERNS = [
      /^rating$/i,
      /avg[_-]?rating/i,
      /rating[_-]?avg/i,
      /average[_-]?rating/i,
      /reviews?[_-]?avg/i,
      /reviews?_avg_score/i,
      /star[_-]?rating/i,
    ];

    const COUNT_KEY_PATTERNS = [
      /^rating[_-]?count$/i,
      /^review[_-]?count$/i,
      /^reviews?[_-]?count$/i,
      /num[_-]?reviews?/i,
      /total[_-]?reviews?/i,
      /count/i,
    ];

    const findByPatterns = (metafields, patterns) => {
      for (const pattern of patterns) {
        const match = metafields.find((m) => pattern.test(m.key));
        if (match) {
          const val = parseNumeric(match.value);
          if (val !== null) return val;
        }
      }
      return null;
    };

    const fetchAllMetafields = async (gid) => {
      let all = [];
      let cursor = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const gql = `
          query ProductMetafields($id: ID!, $cursor: String) {
            product(id: $id) {
              legacyResourceId
              metafields(first: 250, after: $cursor) {
                edges {
                  cursor
                  node { namespace key value }
                }
                pageInfo { hasNextPage }
              }
            }
          }
        `;

        const data = await makeShopifyGraphQL(shop, gql, { id: gid, cursor });
        const product = data?.data?.product;
        if (!product) break;

        const edges = product.metafields?.edges ?? [];
        all = all.concat(edges.map((e) => e.node));

        hasNextPage = product.metafields?.pageInfo?.hasNextPage ?? false;
        cursor = edges.length ? edges[edges.length - 1].cursor : null;

        if (!cursor) break;
      }

      return { legacyResourceId: gid, metafields: all };
    };

    const results = await Promise.all(
      gids.map((gid) => fetchAllMetafields(gid)),
    );

    const ratings = {};

    for (const result of results) {
      const legacyId = result.legacyResourceId.split("/").pop();
      const metafields = result.metafields;

      const rating = findByPatterns(metafields, RATING_KEY_PATTERNS);
      const count = findByPatterns(metafields, COUNT_KEY_PATTERNS);

      ratings[legacyId] = {
        rating,
        count: count !== null ? Math.round(count) : null,
      };
    }

    return res.json({ ratings });
  } catch (err) {
    next(err);
  }
});

// ─── Discounts ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "DiscountCodeBasic",
  "DiscountCodeFreeShipping",
  "DiscountAutomaticBasic",
  "DiscountAutomaticFreeShipping",
]);

const cleanCode = (c) =>
  (c ?? "").replace(/[\u200B-\u200F\u2060\uFEFF]/g, "").trim();

const buildDiscountQuery = (cursor) => ({
  query: `
    query GetDiscounts($cursor: String) {
      discountNodes(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            discount {
              __typename

              ... on DiscountCodeBasic {
                title
                startsAt
                endsAt
                status
                usageLimit
                appliesOncePerCustomer
                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal { amount currencyCode }
                  }
                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                }
                combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                customerGets {
                  value {
                    ... on DiscountPercentage { percentage }
                    ... on DiscountAmount { amount { amount currencyCode } }
                  }
                  items {
                    ... on DiscountProducts {
                      products(first: 10) { edges { node { id } } }
                    }
                    ... on DiscountCollections {
                      collections(first: 10) { edges { node { id } } }
                    }
                  }
                }
                customerSelection { __typename }
                codes(first: 10) { edges { node { code } } }
              }

              ... on DiscountCodeFreeShipping {
                title
                startsAt
                endsAt
                status
                customerSelection { __typename }
                codes(first: 10) { edges { node { code } } }
                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal { amount currencyCode }
                  }
                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                }
                combinesWith { orderDiscounts productDiscounts shippingDiscounts }
              }

              ... on DiscountAutomaticBasic {
                title
                startsAt
                endsAt
                status
                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal { amount currencyCode }
                  }
                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                }
                combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                customerGets {
                  value {
                    ... on DiscountPercentage { percentage }
                    ... on DiscountAmount { amount { amount currencyCode } }
                  }
                  items {
                    ... on DiscountProducts {
                      products(first: 10) { edges { node { id } } }
                    }
                    ... on DiscountCollections {
                      collections(first: 10) { edges { node { id } } }
                    }
                  }
                }
              }

              ... on DiscountAutomaticFreeShipping {
                title
                startsAt
                endsAt
                status
                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal { amount currencyCode }
                  }
                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                }
                combinesWith { orderDiscounts productDiscounts shippingDiscounts }
              }
            }
          }
        }
      }
    }
  `,
  variables: { cursor: cursor || null },
});

router.post("/discounts", async (req, res, next) => {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({ error: "shop is required" });
    }

    // Paginate through all discount nodes
    let allEdges = [];
    let cursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const { query, variables } = buildDiscountQuery(cursor);
      const data = await makeShopifyGraphQL(shop, query, variables);

      const page = data?.data?.discountNodes;
      allEdges = allEdges.concat(page?.edges ?? []);
      hasNextPage = page?.pageInfo?.hasNextPage ?? false;
      cursor = page?.pageInfo?.endCursor ?? null;
    }

    const allDiscountCodes = [];
    const activeDiscountCodes = [];

    for (const item of allEdges) {
      const discount = item.node?.discount;
      if (!discount) continue;

      // App / BXGY / unknown types skip
      if (!ALLOWED_TYPES.has(discount.__typename)) continue;
      const selectionType = discount.customerSelection?.__typename;
      if (selectionType && selectionType !== "DiscountCustomerAll") continue;

      const valueNode = discount.customerGets?.value;
      const discountValue =
        valueNode?.percentage != null
          ? { type: "percentage", value: valueNode.percentage * 100 }
          : valueNode?.amount
            ? {
                type: "fixed_amount",
                value: parseFloat(valueNode.amount.amount),
                currencyCode: valueNode.amount.currencyCode,
              }
            : null;

      // FastBundle jaise zero-value discounts skip
      if (discountValue?.value === 0) continue;

      const itemsNode = discount.customerGets?.items;
      const appliesToProducts =
        itemsNode?.products?.edges?.map((e) => e.node.id) ?? [];
      const appliesToCollections =
        itemsNode?.collections?.edges?.map((e) => e.node.id) ?? [];

      const minReq = discount.minimumRequirement;
      const minimumRequirement = minReq?.greaterThanOrEqualToSubtotal
        ? {
            type: "subtotal",
            value: parseFloat(minReq.greaterThanOrEqualToSubtotal.amount),
            currencyCode: minReq.greaterThanOrEqualToSubtotal.currencyCode,
          }
        : minReq?.greaterThanOrEqualToQuantity
          ? { type: "quantity", value: minReq.greaterThanOrEqualToQuantity }
          : null;

      const baseData = {
        id: item.node.id,
        title: discount.title,
        status: discount.status,
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
        type: discount.__typename,
        discountValue,
        minimumRequirement,
        appliesToProducts,
        appliesToCollections,
        usageLimit: discount.usageLimit ?? null,
        appliesOncePerCustomer: discount.appliesOncePerCustomer ?? false,
        combinesWith: discount.combinesWith ?? null,
        customerSelection: discount.customerSelection?.__typename ?? null,
      };

      const isAutomatic = discount.__typename.startsWith("DiscountAutomatic");

      const codes = (
        discount.codes?.edges?.map((e) => e.node.code) ?? []
      ).filter((c) => cleanCode(c) !== "");

      const pushRecord = (record) => {
        allDiscountCodes.push(record);
        if (discount.status === "ACTIVE") activeDiscountCodes.push(record);
      };

      if (isAutomatic) {
        pushRecord({ ...baseData, code: null });
      } else {
        // code wale discounts: valid code na ho to skip
        for (const code of codes) {
          pushRecord({ ...baseData, code });
        }
      }
    }

    return res.json({
      total: allDiscountCodes.length,
      activeCount: activeDiscountCodes.length,
      allDiscountCodes,
      activeDiscountCodes,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Shipping Zones (GraphQL) ───────────────────────────────────────────────

router.get("/shipping-zones", async (req, res, next) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({
        error: "shop is required",
      });
    }

    // ─── GraphQL Query ──────────────────────────────────────────────────────

    const query = `
      {
        deliveryProfiles(first: 10) {
          edges {
            node {
              id
              name

              profileLocationGroups {
                locationGroup {
                  locations(first: 10) {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }

                locationGroupZones(first: 20) {
                  edges {
                    node {
                      zone {
                        id
                        name

                        countries {
                          code {
                            countryCode
                          }
                          name
                        }
                      }

                      methodDefinitions(first: 20) {
                        edges {
                          node {
                            id
                            name
                            active

                            rateProvider {
                              ... on DeliveryRateDefinition {
                                price {
                                  amount
                                  currencyCode
                                }
                              }
                            }

                            methodConditions {
                              field
                              operator

                              conditionCriteria {
                                ... on MoneyV2 {
                                  amount
                                  currencyCode
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // ─── Shopify GraphQL Request ───────────────────────────────────────────

    const graphqlData = await makeShopifyGraphQL(shop, query);

    const profiles = graphqlData?.data?.deliveryProfiles?.edges ?? [];

    const shipping = profiles.map((profileEdge) => {
      const profile = profileEdge.node;

      const locations =
        profile.profileLocationGroups?.flatMap(
          (group) =>
            group.locationGroup?.locations?.edges?.map((loc) => ({
              id: loc.node.id,
              name: loc.node.name,
            })) || [],
        ) || [];

      const zones =
        profile.profileLocationGroups?.flatMap(
          (group) =>
            group.locationGroupZones?.edges?.map((zoneEdge) => {
              const zoneNode = zoneEdge.node;

              const countries =
                zoneNode.zone.countries?.map((country) => ({
                  name: country.name,
                  code: country.code.countryCode,
                })) || [];

              const shipping_rates =
                zoneNode.methodDefinitions?.edges?.map((method) => {
                  const node = method.node;

                  return {
                    id: node.id,
                    name: node.name,
                    active: node.active,

                    price: node.rateProvider?.price?.amount || "0",

                    currency: node.rateProvider?.price?.currencyCode || "INR",

                    conditions:
                      node.methodConditions?.map((condition) => ({
                        field: condition.field,
                        operator: condition.operator,

                        amount: condition.conditionCriteria?.amount || null,

                        currency:
                          condition.conditionCriteria?.currencyCode || null,
                      })) || [],
                  };
                }) || [];

              // ─── Check India or International ─────────────────────────────

              const isIndia = countries.some(
                (country) => country.code === "IN",
              );

              // ─── Console Logs ────────────────────────────────────────────

              shipping_rates.forEach((rate) => {
                // ─── Conditions ─────────────────────────────────────────

                if (rate.conditions.length > 0) {
                  rate.conditions.forEach((condition) => {});
                } else {
                }
              });

              return {
                zone_id: zoneNode.zone.id,
                zone_name: zoneNode.zone.name,
                countries,
                shipping_rates,
              };
            }) || [],
        ) || [];

      return {
        profile_id: profile.id,
        profile_name: profile.name,
        locations,
        zones,
      };
    });

    return res.json({
      success: true,
      shipping,
    });
  } catch (err) {
    console.error("Error in /shipping-zones:", err);
    next(err);
  }
});

export default router;
