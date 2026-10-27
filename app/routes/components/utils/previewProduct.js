// Shared by the editor loader (server) and the "Previewing items" picker (client).
export const normalizePreviewProduct = (node) => ({
  id: node.id,
  title: node.title,
  image: node.images?.edges?.[0]?.node?.url,
  variants: (node.variants?.edges || []).map((v) => ({
    id: v.node.id,
    title: v.node.title,
    price: v.node.price,
    compareAtPrice: v.node.compareAtPrice,
    available: v.node.availableForSale,
    image: v.node.image?.url || null,
  })),
});

// Default preview product: first active product with an image and variants,
// skipping the app's own "Shipping Protection" product.
// Returned with a single variant so it shows as one cart line.
export const pickDefaultPreviewProduct = (products) => {
  const product = products.find(
    (p) =>
      p.variants.length && p.image && !/shipping protection/i.test(p.title),
  );
  if (!product) return null;
  const variant = product.variants.find((v) => v.available) || product.variants[0];
  return { ...product, variants: [variant] };
};

export const DEFAULT_PREVIEW_PRODUCT_QUERY = `
{
  products(first: 10, query: "status:active") {
    edges {
      node {
        id
        title
        images(first: 1) { edges { node { url } } }
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
