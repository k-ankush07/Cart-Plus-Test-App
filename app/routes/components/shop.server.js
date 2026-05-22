import { authenticate } from "../../shopify.server";

const _shopCache = new Map();

export const shopLoader = async (request) => {
  try {
    const authResponse = await authenticate.admin(request);

    if (authResponse instanceof Response) {
      return authResponse;
    }

    const { admin, session } = authResponse;
    const accessToken = session?.accessToken;
    const shopDomain = session?.shop;

    // ── Return cached static data immediately if available ─────────────────
    if (_shopCache.has(shopDomain)) {
      return {
        ..._shopCache.get(shopDomain),
        accessToken, // always fresh from the current session
        admin,       // always fresh — not safe to cache
      };
    }

    // ── First load: fetch from Shopify ─────────────────────────────────────
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

    const cached = {
      shop: shopData?.data?.shop || null,
      currency: shopData?.data?.shop?.currencyCode || "",
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      mainThemeId,
    };

    _shopCache.set(shopDomain, cached);

    return {
      ...cached,
      accessToken,
      admin,
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Shop Loader Error:", error);

    return {
      shop: null,
      apiUrl: process.env.PUBLIC_REACT_APP_API_URL,
      accessToken: null,
      mainThemeId: "current",
    };
  }
};