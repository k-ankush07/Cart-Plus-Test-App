import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

// Shared product fields so every query returns the same shape
const PRODUCT_FIELDS = `
  id
  title
  status
  featuredImage { url }
  variants(first: 100) {
    edges {
      node {
        id
        title
        price
        compareAtPrice
        availableForSale
        image { url }
      }
    }
  }
`;

const buildProduct = (node, variants) => {
  if (!variants.length) return null;

  const minPrice = Math.min(...variants.map((v) => parseFloat(v.price)));
  const maxCompareAt = Math.max(
    ...variants.map((v) => parseFloat(v.compareAtPrice || 0)),
  );
  const fallbackImage = node.featuredImage?.url || null;

  return {
    id: node.id,
    title: node.title,
    image: fallbackImage,
    price: minPrice.toFixed(2),
    compareAtPrice: maxCompareAt > 0 ? maxCompareAt.toFixed(2) : null,
    // No fake reviews. Plug in a review app here if you have one.
    rating: null,
    reviewCount: 0,
    variants: variants.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      available: v.availableForSale,
      image: v.image?.url || fallbackImage,
    })),
  };
};

const transformProduct = (node) =>
  buildProduct(
    node,
    (node.variants?.edges || []).map((v) => v.node),
  );

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();

  const variantIds = body.variantIds || [];
  const collectionIds = body.collectionIds || [];
  const limit = Math.min(Math.max(parseInt(body.limit, 10) || 10, 1), 50);

  // ── 1) Nothing selected -> latest active products from the store ──────────
  if (!variantIds.length && !collectionIds.length) {
    const query = `
      query ($first: Int!) {
        products(first: $first, sortKey: CREATED_AT, reverse: true, query: "status:active") {
          edges { node { ${PRODUCT_FIELDS} } }
        }
      }
    `;

    const res = await admin.graphql(query, { variables: { first: limit } });
    const data = await res.json();

    const finalProducts = (data?.data?.products?.edges || [])
      .map(({ node }) => transformProduct(node))
      .filter(Boolean);

    return json({ products: finalProducts });
  }

  // ── 2) Products from the selected collection(s) ───────────────────────────
  if (collectionIds.length) {
    const query = `
      query ($id: ID!, $first: Int!, $cursor: String) {
        collection(id: $id) {
          products(first: $first, after: $cursor) {
            pageInfo { hasNextPage }
            edges {
              cursor
              node { ${PRODUCT_FIELDS} }
            }
          }
        }
      }
    `;

    const allProducts = [];

    for (const collectionId of collectionIds) {
      let cursor = null;
      let hasNextPage = true;

      while (hasNextPage && allProducts.length < limit) {
        const res = await admin.graphql(query, {
          variables: { id: collectionId, first: Math.min(limit, 50), cursor },
        });
        const data = await res.json();
        const products = data?.data?.collection?.products;
        if (!products) break;

        allProducts.push(
          ...products.edges.filter(({ node }) => node.status === "ACTIVE"),
        );

        hasNextPage = products.pageInfo.hasNextPage;
        if (hasNextPage) {
          cursor = products.edges[products.edges.length - 1].cursor;
        }
      }
    }

    // Remove duplicates when collections overlap
    const seen = new Set();
    const finalProducts = allProducts
      .map(({ node }) => transformProduct(node))
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .slice(0, limit);

    return json({ products: finalProducts });
  }

  // ── 3) Products from the selected variants ────────────────────────────────
  const query = `
    query ($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          title
          price
          compareAtPrice
          availableForSale
          image { url }
          product { ${PRODUCT_FIELDS} }
        }
      }
    }
  `;

  const res = await admin.graphql(query, { variables: { ids: variantIds } });
  const data = await res.json();

  // Group the selected variants by their parent product
  const grouped = new Map();

  (data?.data?.nodes || []).forEach((variantNode) => {
    if (!variantNode?.product) return;
    if (variantNode.product.status !== "ACTIVE") return;

    const { product, ...variant } = variantNode;

    if (!grouped.has(product.id)) {
      grouped.set(product.id, { product, variants: [] });
    }
    grouped.get(product.id).variants.push(variant);
  });

  const finalProducts = [...grouped.values()]
    .map(({ product, variants }) => buildProduct(product, variants))
    .filter(Boolean)
    .slice(0, limit);

  return json({ products: finalProducts });
};