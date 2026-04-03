import { authenticate } from "../../shopify.server";

export const shopLoader = async (request) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const accessToken = session?.accessToken;
    console.log(session)

    const response = await admin.graphql(`
      {
        shop {
          name
          email
          myshopifyDomain
          plan {
            displayName
          }
        }
      }
    `);

    const data = await response.json();

    return {
      shop: data?.data?.shop || null,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken
    };

  } catch (error) {
    console.error("Shop Loader Error:", error);

    return {
      shop: null,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken: null
    };
  }
};