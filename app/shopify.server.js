import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server.js";

const TOKEN_SYNC_TIMEOUT_MS = 10_000;

async function syncShopTokenToHub({ session, admin }) {
  try {
    const offlineSession = await sessionStorage.loadSession(
      `offline_${session.shop}`
    );
    const accessToken = offlineSession?.accessToken;
    if (!accessToken) return;

    const graphqlResponse = await admin.graphql(
      `query ShopInfo { shop { email name myshopifyDomain } }`
    );
    const { data } = await graphqlResponse.json();
    const storeEmail = data?.shop?.email ?? null;

    const apiBaseUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
    if (!apiBaseUrl) {
      console.warn("[hub] PUBLIC_REACT_APP_API_URL is not set — skipping token sync.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOKEN_SYNC_TIMEOUT_MS);

    await fetch(`${apiBaseUrl}/api/save-shop-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop: session.shop,
        accessToken,
        email: storeEmail,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    console.log(`[hub] Token synced for ${session.shop}`);
  } catch (err) {
    console.warn("[hub] Could not sync shop token:", err.message);
  }
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  useOnlineTokens: true,
  future: {
    expiringOfflineAccessTokens: true,
  },

  hooks: {
    afterAuth: async ({ session, admin }) => {
      await shopify.registerWebhooks({ session });
      await syncShopTokenToHub({ session, admin });
    },
  },

  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

const sessionStorage = shopify.sessionStorage;

export default shopify;
export { sessionStorage };
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;