import express from "express";
import { makeShopifyGraphQL, makeShopifyREST } from "../utils/shopifyFetch.js";
const MARKET_API_VERSION = "2026-07";
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

const LEGACY_QUERY = `
  {
    deliveryProfiles(first: 10) {
      edges {
        node {
          id
          name
          profileLocationGroups {
            locationGroup {
              locations(first: 10) {
                edges { node { id name } }
              }
            }
            locationGroupZones(first: 20) {
              edges {
                node {
                  zone {
                    id
                    name
                    countries {
                      code { countryCode }
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
                            price { amount currencyCode }
                          }
                        }
                        methodConditions {
                          field
                          operator
                          conditionCriteria {
                            ... on MoneyV2 { amount currencyCode }
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


const marketsQuery = (after) => `
  {
    markets(first: 50${after ? `, after: "${after}"` : ""}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        name
        conditions {
          regionsCondition {
            regions(first: 250) {
              nodes {
                ... on MarketRegionCountry { code name }
              }
            }
          }
        }
        delivery {
          shipping {
            isEnabled
            optionDefinitions(first: 20) {
              nodes {
                __typename
                currency
                isActive
                freeDeliveryMinimumValue { amount currencyCode }

                ... on DeliveryFlatRateOptionDefinition {
                  name
                  rateGroups(first: 10) {
                    nodes {
                      rate { price { amount currencyCode } }
                    }
                  }
                }

                ... on DeliveryValueBasedOptionDefinition {
                  name
                  rateGroups(first: 10) {
                    nodes {
                      rates {
                        price { amount currencyCode }
                        minValue { amount currencyCode }
                        maxValue { amount currencyCode }
                      }
                    }
                  }
                }

                ... on DeliveryWeightBasedOptionDefinition {
                  name
                  rateGroups(first: 10) {
                    nodes {
                      rates {
                        price { amount currencyCode }
                        minWeight { value unit }
                        maxWeight { value unit }
                      }
                    }
                  }
                }

                ... on DeliveryCarrierCalculatedOptionDefinition {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

const FEATURES_QUERY = `{ shop { features { marketDrivenShipping } } }`;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function isMarketDrivenShop(shop) {
  try {
    const res = await makeShopifyGraphQL(shop, FEATURES_QUERY, {}, MARKET_API_VERSION);
    if (res?.errors?.length) return false; 
    return res?.data?.shop?.features?.marketDrivenShipping === true;
  } catch (e) {
    return false;
  }
}

const money = (m) => (m ? { amount: m.amount, currency: m.currencyCode } : null);

function mapLegacy(graphqlData) {
  const profiles = graphqlData?.data?.deliveryProfiles?.edges ?? [];

  return profiles.map((profileEdge) => {
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
                  type: "legacy",
                  price: node.rateProvider?.price?.amount || "0",
                  currency: node.rateProvider?.price?.currencyCode || "INR",
                  conditions:
                    node.methodConditions?.map((condition) => ({
                      field: condition.field,
                      operator: condition.operator,
                      amount: condition.conditionCriteria?.amount || null,
                      currency: condition.conditionCriteria?.currencyCode || null,
                    })) || [],
                };
              }) || [];

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
}

// ─── Market mapper ──────────────────────────────────────────────────────────

function mapOptionToRates(opt, marketId, idx) {
  const rates = [];
  const active = opt.isActive !== false;
  const baseId = `${marketId}#opt${idx}`;
  const cur = opt.currency || "INR";

  const priceCond = (min, max) => {
    const c = [];
    if (min && Number(min.amount) > 0) {
      c.push({
        field: "TOTAL_PRICE",
        operator: "GREATER_THAN_OR_EQUAL_TO",
        amount: min.amount,
        currency: min.currencyCode,
      });
    }
    if (max) {
      c.push({
        field: "TOTAL_PRICE",
        operator: "LESS_THAN_OR_EQUAL_TO",
        amount: max.amount,
        currency: max.currencyCode,
      });
    }
    return c;
  };

  const weightCond = (min, max) => {
    const c = [];
    if (min && Number(min.value) > 0) {
      c.push({
        field: "TOTAL_WEIGHT",
        operator: "GREATER_THAN_OR_EQUAL_TO",
        amount: String(min.value),
        currency: min.unit,
      });
    }
    if (max) {
      c.push({
        field: "TOTAL_WEIGHT",
        operator: "LESS_THAN_OR_EQUAL_TO",
        amount: String(max.value),
        currency: max.unit,
      });
    }
    return c;
  };

  switch (opt.__typename) {
    case "DeliveryFlatRateOptionDefinition":
      (opt.rateGroups?.nodes || []).forEach((g, i) => {
        rates.push({
          id: `${baseId}-g${i}`,
          name: opt.name,
          active,
          type: "flat",
          price: g.rate?.price?.amount || "0",
          currency: g.rate?.price?.currencyCode || cur,
          conditions: [],
        });
      });
      break;

    case "DeliveryValueBasedOptionDefinition":
      (opt.rateGroups?.nodes || []).forEach((g, i) => {
        (g.rates || []).forEach((r, j) => {
          rates.push({
            id: `${baseId}-g${i}-r${j}`,
            name: opt.name,
            active,
            type: "value_based",
            price: r.price?.amount || "0",
            currency: r.price?.currencyCode || cur,
            conditions: priceCond(r.minValue, r.maxValue),
          });
        });
      });
      break;

    case "DeliveryWeightBasedOptionDefinition":
      (opt.rateGroups?.nodes || []).forEach((g, i) => {
        (g.rates || []).forEach((r, j) => {
          rates.push({
            id: `${baseId}-g${i}-r${j}`,
            name: opt.name,
            active,
            type: "weight_based",
            price: r.price?.amount || "0",
            currency: r.price?.currencyCode || cur,
            conditions: weightCond(r.minWeight, r.maxWeight),
          });
        });
      });
      break;

    case "DeliveryCarrierCalculatedOptionDefinition":
   
      rates.push({
        id: baseId,
        name: opt.name,
        active,
        type: "carrier_calculated",
        price: null,
        currency: cur,
        conditions: [],
      });
      break;

    default:
      break;
  }

  if (opt.freeDeliveryMinimumValue) {
    rates.push({
      id: `${baseId}-free`,
      name: `${opt.name || "Shipping"} (Free)`,
      active,
      type: "free_threshold",
      price: "0",
      currency: opt.freeDeliveryMinimumValue.currencyCode || cur,
      conditions: [
        {
          field: "TOTAL_PRICE",
          operator: "GREATER_THAN_OR_EQUAL_TO",
          amount: opt.freeDeliveryMinimumValue.amount,
          currency: opt.freeDeliveryMinimumValue.currencyCode,
        },
      ],
    });
  }

  return rates;
}

function mapMarkets(markets) {
  return markets.map((market) => {
    const countries = (market.conditions?.regionsCondition?.regions?.nodes || [])
      .filter((r) => r?.code)
      .map((r) => ({ name: r.name, code: r.code }));

    const shipping = market.delivery?.shipping; 
    const enabled = shipping ? shipping.isEnabled !== false : false;

    const shipping_rates = enabled
      ? (shipping.optionDefinitions?.nodes || []).flatMap((opt, idx) =>
          mapOptionToRates(opt, market.id, idx),
        )
      : [];

    return {
      profile_id: market.id,
      profile_name: market.name,
      locations: [],
      zones: [
        {
          zone_id: market.id,
          zone_name: market.name,
          countries,
          shipping_rates,
          shipping_enabled: enabled,
          inherits_parent: shipping === null, 
        },
      ],
    };
  });
}

async function fetchAllMarkets(shop) {
  const all = [];
  let after = null;
  for (let page = 0; page < 10; page++) {
    const res = await makeShopifyGraphQL(shop, marketsQuery(after), {}, MARKET_API_VERSION);
    if (res?.errors?.length) {
      throw new Error(`Markets query failed: ${JSON.stringify(res.errors)}`);
    }
    const conn = res?.data?.markets;
    all.push(...(conn?.nodes || []));
    if (!conn?.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return all;
}

// ─── Route ──────────────────────────────────────────────────────────────────

router.get("/shipping-zones", async (req, res, next) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: "shop is required" });
    }

    const marketDriven = await isMarketDrivenShop(shop);

    let shipping;
    if (marketDriven) {
      const markets = await fetchAllMarkets(shop);
      shipping = mapMarkets(markets);
    } else {
      const graphqlData = await makeShopifyGraphQL(shop, LEGACY_QUERY);
      shipping = mapLegacy(graphqlData);
    }

    return res.json({
      success: true,
      model: marketDriven ? "market_driven" : "legacy",
      shipping,
    });
  } catch (err) {
    console.error("Error in /shipping-zones:", err);
    next(err);
  }
});

export default router;
