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

    const gql = `
      query ProductRatings($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            legacyResourceId
            rating: metafield(namespace: "reviews", key: "rating") { value }
            ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
          }
        }
      }
    `;

    const data = await makeShopifyGraphQL(shop, gql, { ids: gids });
    const ratings = {};

    for (const node of data?.data?.nodes ?? []) {
      if (!node?.legacyResourceId) continue;

      let ratingValue = null;
      if (node.rating?.value) {
        try {
          const parsed = JSON.parse(node.rating.value);
          ratingValue = parseFloat(parsed.value ?? parsed);
        } catch {
          ratingValue = parseFloat(node.rating.value);
        }
      }

      ratings[node.legacyResourceId] = {
        rating: ratingValue,
        count: node.ratingCount?.value
          ? parseInt(node.ratingCount.value, 10)
          : null,
      };
    }

    return res.json({ ratings });
  } catch (err) {
    next(err);
  }
});

// ─── Discounts ───────────────────────────────────────────────────────────────

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

              ... on DiscountAutomaticApp {
                title
                startsAt
                endsAt
                status
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

    // Normalize edges into flat discount records
    const allDiscountCodes = [];
    const activeDiscountCodes = [];

    for (const item of allEdges) {
      const discount = item.node?.discount;
      if (!discount) continue;

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

      const codes = discount.codes?.edges?.map((e) => e.node.code) ?? [];

      if (codes.length > 0) {
        for (const code of codes) {
          const record = { ...baseData, code };
          allDiscountCodes.push(record);
          if (discount.status === "ACTIVE") activeDiscountCodes.push(record);
        }
      } else {
        // Automatic discounts have no codes
        const record = { ...baseData, code: null };
        allDiscountCodes.push(record);
        if (discount.status === "ACTIVE") activeDiscountCodes.push(record);
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

// ─── Shipping Zones ───────────────────────────────────────────────────────────

router.get("/shipping-zones", async (req, res, next) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: "shop is required" });
    }

    // Fetch in parallel — both are independent REST calls
    const [shippingZonesData, countriesData] = await Promise.all([
      makeShopifyREST(shop, "shipping_zones.json"),
      makeShopifyREST(shop, "countries.json"),
    ]);

    const shippingZones = shippingZonesData.shipping_zones ?? [];
    const countries = countriesData.countries ?? [];

    const shippingZonesWithProvinces = shippingZones.map((zone) => ({
      ...zone,
      countries: (zone.countries ?? []).map((country) => {
        const fullCountry = countries.find((c) => c.code === country.code);
        return {
          name: country.name,
          code: country.code,
          provinces: fullCountry?.provinces ?? [],
          price_based_shipping_rates: zone.price_based_shipping_rates ?? [],
          weight_based_shipping_rates: zone.weight_based_shipping_rates ?? [],
        };
      }),
    }));

    // Deduplicated flat country list
    const allCountries = shippingZonesWithProvinces.flatMap((zone) =>
      zone.countries.map((country) => ({
        name: country.name,
        code: country.code,
        provinces: country.provinces,
        price_based_shipping_rates: country.price_based_shipping_rates,
        weight_based_shipping_rates: country.weight_based_shipping_rates,
      }))
    );

    const uniqueCountries = Array.from(
      new Map(allCountries.map((c) => [c.code, c])).values()
    );

    return res.json({
      shipping: shippingZonesWithProvinces,
      countries: uniqueCountries,
    });
  } catch (err) {
    next(err);
  }
});

export default router;