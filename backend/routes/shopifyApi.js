import express from "express";
import { shopConfigModel } from "../model/schema.js";

const router = express.Router();

const apiVersion = '2026-01';

router.get("/product-ratings", async (req, res) => {
  try {
    const { shop, ids } = req.query;
    const idList = ids?.split(",").filter(Boolean) ?? [];

    if (!shop || !idList.length) {
      return res.json({ ratings: {} });
    }

    const config = await shopConfigModel.findOne({ shop });
    if (!config?.accessToken) {
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

    const apiRes = await fetch(
      `https://${shop}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": config.accessToken,
        },
        body: JSON.stringify({ query: gql, variables: { ids: gids } }),
      },
    );

    const apiData = await apiRes.json();
    const ratings = {};

    for (const node of apiData?.data?.nodes ?? []) {
      if (!node?.legacyResourceId) continue;

      let ratingValue = null;
      if (node.rating?.value) {
        try {
          // Native Shopify reviews metafield: {"scale_max":"5.0","scale_min":"1.0","value":"4.5"}
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

  const config = await shopConfigModel.findOne({ shop });
  if (!config?.accessToken) {
    return res.json({ ratings: {} });
  }

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
            "X-Shopify-Access-Token": config.accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildQuery(cursor)),
        },
      );

      const discountData = await discountRes.json();

      if (discountData?.errors) {
        console.error(" Shopify GraphQL errors:", discountData.errors);
        break;
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

      const codes = discount.codes?.edges?.map((e) => e.node.code) || [];

      codes.forEach((code) => {
        const data = {
          code,
          title: discount.title,
          status: discount.status,
          startsAt: discount.startsAt,
          endsAt: discount.endsAt,
          type: discount.__typename,
        };

        allDiscountCodes.push(data);

        if (discount.status === "ACTIVE") {
          activeDiscountCodes.push(data);
        }
      });
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

export default router;
