import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();

  const variantIds = body.variantIds || [];

  if (!variantIds.length) {
    return json({ products: [] });
  }

  const query = `
  {
    nodes(ids: ${JSON.stringify(variantIds)}) {
      ... on ProductVariant {
        id
        title
        price
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

  data.data.nodes.forEach((variantNode) => {
    if (!variantNode?.product) return;

    const product = variantNode.product;

    if (!productMap[product.id]) {
      productMap[product.id] = {
        id: product.id,
        title: product.title,
        image: product.images.edges[0]?.node?.url,
        variants: [],
      };
    }

    productMap[product.id].variants.push({
      id: variantNode.id,
      title: variantNode.title,
      price: variantNode.price,
      available: variantNode.availableForSale,
      image: variantNode.image?.url,
    });
  });

  return json({ products: Object.values(productMap) });
};