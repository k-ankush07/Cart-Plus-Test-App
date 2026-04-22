import express from "express";
import { shopConfigModel } from "../model/schema.js";
import { getValidAccessToken } from "../utils/tokenHelper.js";

const router = express.Router();

const apiVersion = "2026-01";

router.get("/product-ratings", async (req, res) => {
  try {
    const { shop, ids } = req.query;
    const idList = ids?.split(",").filter(Boolean) ?? [];

    if (!shop || !idList.length) {
      return res.json({ ratings: {} });
    }

    let token = await getValidAccessToken(shop);

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

    const makeRequest = async (accessToken) => {
      const res = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query: gql, variables: { ids: gids } }),
        },
      );

      return {
        status: res.status,
        data: await res.json(),
      };
    };

    let response = await makeRequest(token);

    if (
      response.status === 401 ||
      response.data?.errors?.some(
        (e) =>
          e.message.includes("Invalid API key") ||
          e.message.includes("access token"),
      )
    ) {
      token = await getValidAccessToken(shop);
      response = await makeRequest(token);
    }

    const apiData = response.data;
    const ratings = {};

    for (const node of apiData?.data?.nodes ?? []) {
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
  } catch (error) {
    console.error("PRODUCT RATINGS ERROR:", error);
    return res.json({ ratings: {} });
  }
});

router.post("/discounts", async (req, res) => {
  const { shop } = req.body;

  let token = await getValidAccessToken(shop);

  const buildQuery = (cursor) => ({
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

  try {
    let allEdges = [];
    let cursor = null;
    let hasNextPage = true;

    // Paginate through all discount nodes
    while (hasNextPage) {
      const discountRes = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildQuery(cursor)),
        },
      );

      let discountData = await discountRes.json();

      if (discountData?.errors) {
        const isAuthError = discountData.errors.some(
          (err) =>
            err.message.includes("Invalid API key") ||
            err.message.includes("access token"),
        );

        if (isAuthError) {
          console.log("🔁 Token expired, retrying...");

          token = await getValidAccessToken(shop);

          const retryRes = await fetch(
            `https://${shop}/admin/api/${apiVersion}/graphql.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(buildQuery(cursor)),
            },
          );

          const retryData = await retryRes.json();

          if (retryData?.errors) {
            console.error(" Retry also failed:", retryData.errors);
            break;
          }

          discountData = retryData;
        } else {
          console.error("Shopify GraphQL errors:", discountData.errors);
          break;
        }
      }

      const page = discountData?.data?.discountNodes;
      allEdges = allEdges.concat(page?.edges || []);
      hasNextPage = page?.pageInfo?.hasNextPage || false;
      cursor = page?.pageInfo?.endCursor || null;
    }

    let allDiscountCodes = [];
    let activeDiscountCodes = [];

    allEdges.forEach((item) => {
      const discount = item.node.discount;
      if (!discount) return;

      // Extract discount value (percentage or fixed amount)
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

      // Extract applies-to items (products or collections)
      const itemsNode = discount.customerGets?.items;
      const appliesToProducts =
        itemsNode?.products?.edges?.map((e) => e.node.id) || [];
      const appliesToCollections =
        itemsNode?.collections?.edges?.map((e) => e.node.id) || [];

      // Extract minimum requirement
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

      const codes = discount.codes?.edges?.map((e) => e.node.code) || [];

      if (codes.length > 0) {
        codes.forEach((code) => {
          const data = { ...baseData, code };
          allDiscountCodes.push(data);
          if (discount.status === "ACTIVE") activeDiscountCodes.push(data);
        });
      } else {
        // Automatic discounts have no codes
        const data = { ...baseData, code: null };
        allDiscountCodes.push(data);
        if (discount.status === "ACTIVE") activeDiscountCodes.push(data);
      }
    });

    res.json({
      total: allDiscountCodes.length,
      activeCount: activeDiscountCodes.length,
      allDiscountCodes,
      activeDiscountCodes,
    });
  } catch (err) {
    console.error(
      "Failed to fetch discounts:",
      err?.response?.data || err.message || err,
    );
    res.json({ discounts: [] });
  }
});

const fetchWithRetry = async (url, headers, retries = 3, delay = 1000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429) {
        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw err;
    }
  }
  throw new Error("Max retries reached due to rate limiting.");
};

router.get("/shipping-zones", async (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: "Shop is required" });
  }

  try {
    let token = await getValidAccessToken(shop);

    const makeRequest = async (accessToken) => {
      const headers = {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      };

      const shippingZonesData = await fetch(
        `https://${shop}/admin/api/${apiVersion}/shipping_zones.json`,
        { headers },
      );

      const countriesData = await fetch(
        `https://${shop}/admin/api/${apiVersion}/countries.json`,
        { headers },
      );

      return {
        shippingZonesData: await shippingZonesData.json(),
        countriesData: await countriesData.json(),
        status: shippingZonesData.status,
      };
    };

    let response = await makeRequest(token);

    if (response?.shippingZonesData?.errors || response?.status === 401) {

      token = await getValidAccessToken(shop);
      response = await makeRequest(token);
    }

    const shippingZones = response.shippingZonesData.shipping_zones || [];
    const countries = response.countriesData.countries || [];

    const shippingZonesWithProvinces = shippingZones.map((zone) => ({
      ...zone,
      countries: (zone.countries || []).map((country) => {
        const fullCountry = countries.find((c) => c.code === country.code);
        return {
          name: country.name,
          code: country.code,
          provinces: fullCountry?.provinces || [],
          price_based_shipping_rates: zone.price_based_shipping_rates || [],
          weight_based_shipping_rates: zone.weight_based_shipping_rates || [],
        };
      }),
    }));

    const allCountries = shippingZonesWithProvinces.flatMap((zone) =>
      zone.countries.map((country) => ({
        name: country.name,
        code: country.code,
        provinces: country.provinces,
        price_based_shipping_rates: country.price_based_shipping_rates,
        weight_based_shipping_rates: country.weight_based_shipping_rates,
      })),
    );

    const uniqueCountries = Array.from(
      new Map(allCountries.map((c) => [c.code, c])).values(),
    );

    res.json({
      shipping: shippingZonesWithProvinces,
      countries: uniqueCountries,
    });
  } catch (err) {
    console.error("Shipping Zones Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
