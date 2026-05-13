import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, price } = body;

  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  const PRODUCT_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/shipping-protection.png";

  try {
    const pubRes = await admin.graphql(`
      {
        publications(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `);

    const pubData = await pubRes.json();
    const publicationId =
      pubData?.data?.publications?.edges?.[0]?.node?.id;

    if (!publicationId) {
      console.error(" Publication ID not found");
      return json({ error: "Publication ID missing" }, { status: 400 });
    }

    const existingRes = await admin.graphql(`
      query {
        products(first: 1, query: "product_type:hub-app") {
          edges {
            node {
              id
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `);

    const existingData = await existingRes.json();
    const existingProduct = existingData?.data?.products?.edges?.[0]?.node;

    let productId;
    let variantId;

    // =========================================================
    //  UPDATE EXISTING PRODUCT
    // =========================================================
    if (existingProduct) {
      productId = existingProduct.id;
      variantId = existingProduct.variants.edges[0]?.node?.id;

      // UPDATE PRODUCT
      await admin.graphql(
        `mutation ($product: ProductUpdateInput!) {
          productUpdate(product: $product) {
            userErrors { message }
          }
        }`,
        {
          variables: {
            product: {
              id: productId,
              title,
              descriptionHtml: description || "",
              status: "ACTIVE",
            },
          },
        }
      );

      //  UPDATE VARIANT
      if (variantId) {
        await admin.graphql(
          `mutation ($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              userErrors { message }
            }
          }`,
          {
            variables: {
              productId,
              variants: [
                {
                  id: variantId,
                  price: String(price || "0.00"),
                  inventoryPolicy: "CONTINUE", //  IMPORTANT
                },
              ],
            },
          }
        );
      }

      console.log(" Updated existing product");
    }

    // =========================================================
    // CREATE NEW PRODUCT
    // =========================================================
    else {
      const productRes = await admin.graphql(
        `mutation ($input: ProductCreateInput!) {
          productCreate(product: $input) {
            product {
              id
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
            userErrors { message }
          }
        }`,
        {
          variables: {
            input: {
              title,
              descriptionHtml: description || "",
              productType: "hub-app",
              status: "ACTIVE",
            },
          },
        }
      );

      const productData = await productRes.json();
      const product = productData?.data?.productCreate?.product;

      if (!product) {
        return json({ error: "Product creation failed" }, { status: 400 });
      }

      productId = product.id;
      variantId = product.variants.edges[0]?.node?.id;

      //  ADD IMAGE
      await admin.graphql(
        `mutation ($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media { ... on MediaImage { id } }
          }
        }`,
        {
          variables: {
            productId,
            media: [
              {
                originalSource: PRODUCT_IMAGE_URL,
                mediaContentType: "IMAGE",
              },
            ],
          },
        }
      );

      //  UPDATE VARIANT
      await admin.graphql(
        `mutation ($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { message }
          }
        }`,
        {
          variables: {
            productId,
            variants: [
              {
                id: variantId,
                price: String(price || "0.00"),
                inventoryPolicy: "CONTINUE", 
              },
            ],
          },
        }
      );

      console.log(" Created new product");
    }

    // =========================================================
    // STEP 3: PUBLISH TO ONLINE STORE
    // =========================================================
    if (publicationId && productId) {
      await admin.graphql(
        `mutation ($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            userErrors { message }
          }
        }`,
        {
          variables: {
            id: productId,
            input: [
              {
                publicationId,
              },
            ],
          },
        }
      );

      console.log(" Published to Online Store");
    }

    return json({
      success: true,
      productId,
      variantId,
    });

  } catch (error) {
    console.error(" FINAL ERROR:", error);
    return json({ error: error.message }, { status: 500 });
  }
};