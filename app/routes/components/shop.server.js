import { authenticate } from "../../shopify.server";

export const shopLoader = async (request) => {
  try {
    const authResponse = await authenticate.admin(request);

    if (authResponse instanceof Response) {
      return authResponse; 
    }

    const { admin, session } = authResponse;
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

    return {
      shop: shopData?.data?.shop || null,
      currency: shopData?.data?.shop?.currencyCode || "",
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken,
      admin,
    };
  } catch (error) {
    console.error("Shop Loader Error:", error);

    return {
      shop: null,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken: null,
    };
  }
};