import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

const transformProduct = (node) => {
  const allVariants = node.variants.edges.map((v) => v.node);
  if (!allVariants.length) return null;

  const minPrice = Math.min(...allVariants.map((v) => parseFloat(v.price)));
  const maxCompareAt = Math.max(
    ...allVariants.map((v) => parseFloat(v.compareAtPrice || 0)),
  );

  return {
    id: node.id,
    title: node.title,
    image: node.images.edges[0]?.node?.url,
    price: minPrice.toFixed(2),
    compareAtPrice: maxCompareAt > 0 ? maxCompareAt.toFixed(2) : null,
    rating: (Math.random() * (5 - 4) + 4).toFixed(1),
    reviewCount: Math.floor(Math.random() * 200) + 20,
    variants: allVariants.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      available: v.availableForSale,
      image: v.image?.url,
    })),
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();

  const variantIds = body.variantIds || [];
  const collectionIds = body.collectionIds || [];
  const anyProducts = body.anyProducts === true;
  const limit = Math.min(Math.max(parseInt(body.limit, 10) || 10, 1), 50);

  // ── 1) Kuch select nahi / AI recommended -> store ke koi bhi real products ──
  if (anyProducts || (!variantIds.length && !collectionIds.length)) {
    if (!anyProducts) {
      return json({ products: [] });
    }

    const query = `
      query ($first: Int!) {
        products(first: $first, sortKey: CREATED_AT, reverse: true, query: "status:active") {
          edges {
            node {
              id
              title
              images(first: 1) {
                edges { node { url } }
              }
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
            }
          }
        }
      }
    `;

    const res = await admin.graphql(query, { variables: { first: limit } });
    const data = await res.json();

    const edges = data?.data?.products?.edges || [];
    const finalProducts = edges
      .map(({ node }) => transformProduct(node))
      .filter(Boolean);

    return json({ products: finalProducts });
  }

  // ── 2) Collection se products ──────────────────────────────────────────────
  if (collectionIds.length) {
    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const query = `
  query ($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true, query: "status:active") {
      edges {
        node {
          id
          title
          images(first: 1) {
            edges { node { url } }
          }
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
        }
      }
    }
  }
`;

      const res = await admin.graphql(query, {
        variables: {
          id: collectionIds[0],
          cursor,
        },
      });

      const data = await res.json();
      const products = data?.data?.collection?.products;

      if (!products) break;

      allProducts.push(...products.edges);

      hasNextPage = products.pageInfo.hasNextPage;

      if (hasNextPage) {
        cursor = products.edges[products.edges.length - 1].cursor;
      }
    }

    const finalProducts = allProducts
      .map(({ node }) => transformProduct(node))
      .filter(Boolean);

    return json({ products: finalProducts });
  }

  // ── 3) Selected variants se products ───────────────────────────────────────
  const query = `
  {
    nodes(ids: ${JSON.stringify(variantIds)}) {
      ... on ProductVariant {
        id
        title
        price
        compareAtPrice
        availableForSale
        image { url }
        product {
          id
          title
          images(first: 1) {
            edges { node { url } }
          }
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
        }
      }
    }
  }
  `;

  const res = await admin.graphql(query);
  const data = await res.json();

  const productMap = {};

  (data?.data?.nodes || []).forEach((variantNode) => {
    if (!variantNode?.product) return;

    const product = variantNode.product;

    if (!productMap[product.id]) {
      const base = transformProduct(product);
      if (!base) return;
      productMap[product.id] = { ...base, variants: [] };
    }

    productMap[product.id].variants.push({
      id: variantNode.id,
      title: variantNode.title,
      price: variantNode.price,
      compareAtPrice: variantNode.compareAtPrice,
      available: variantNode.availableForSale,
      image: variantNode.image?.url,
    });
  });

  return json({ products: Object.values(productMap) });
};
