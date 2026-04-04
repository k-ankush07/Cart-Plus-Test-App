import { authenticate } from "../../shopify.server";

export const shopLoader = async (request) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const accessToken = session?.accessToken;

    const shopRes = await admin.graphql(`
      {
        shop {
          name
          email
          myshopifyDomain
          currencyCode
          plan {
            displayName
          }
        }
      }
    `);

    const shopData = await shopRes.json();

    const productRes = await admin.graphql(`
      {
        products(first: 10) {
          edges {
            cursor
            node {
              id
              title

              images(first: 250) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                    availableForSale
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `);

    const productData = await productRes.json();

    const edges = productData?.data?.products?.edges || [];

    const products = edges.map((p) => ({
      id: p.node.id,
      title: p.node.title,
      image: p.node.images.edges[0]?.node?.url || "",

      price: p.node.variants.edges[0]?.node?.price || "0",

      variants: p.node.variants.edges.map((v) => ({
        id: v.node.id,
        title: v.node.title,
        price: v.node.price,
        sku: v.node.sku,
        available: v.node.availableForSale,
        image: v.node.image
          ? {
              url: v.node.image.url,
              altText: v.node.image.altText,
            }
          : null,
      })),
    }));

    const nextCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    return {
      shop: shopData?.data?.shop || null,
      currency: shopData?.data?.shop?.currencyCode || "",
      products,
      nextCursor,
      hasNextPage: productData?.data?.products?.pageInfo?.hasNextPage || false,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken,
    };
  } catch (error) {
    console.error("Shop Loader Error:", error);

    return {
      shop: null,
      products: [],
      nextCursor: null,
      hasNextPage: false,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken: null,
    };
  }
};
