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
        themes(first: 5, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);

    const shopData = await shopRes.json();
    const rawThemeId = shopData?.data?.themes?.nodes?.[0]?.id || "";
    const mainThemeId = rawThemeId.split("/").pop() || "current";

    return {
      shop: shopData?.data?.shop || null,
      currency: shopData?.data?.shop?.currencyCode || "",
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken,
      admin,
      mainThemeId,
    };
  } catch (error) {
    console.error("Shop Loader Error:", error);

    return {
      shop: null,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken: null,
      mainThemeId: "current",
    };
  }
};