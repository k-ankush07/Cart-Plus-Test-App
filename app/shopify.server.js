import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server.js";

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
  // NOTE: `expiringOfflineAccessTokens` is intentionally NOT enabled.
  // The standalone Express backend reads a snapshot of the offline token from
  // MongoDB (shopConfig) and has no way to refresh a rotating token, so an
  // expiring/rotating offline token would go stale there → INVALID_TOKEN on
  // storefront-facing endpoints. Long-lived offline tokens keep the Mongo
  // snapshot valid for the lifetime of the install.
  hooks: {
    afterAuth: async ({ session, admin }) => {
      await shopify.registerWebhooks({ session });

      try {
        const offlineSession = await shopify.sessionStorage.loadSession(
          `offline_${session.shop}`
        );
        const accessToken = offlineSession?.accessToken;
        if (!accessToken) return;

        const graphqlResponse = await admin.graphql(
          `query ShopInfo { shop { email name myshopifyDomain } }`
        );
        const { data } = await graphqlResponse.json();

        const apiBaseUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
        if (!apiBaseUrl) {
          console.warn("[hub] PUBLIC_REACT_APP_API_URL not set — skipping.");
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        await fetch(`${apiBaseUrl}/api/save-shop-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop: session.shop,
            accessToken,
            email: data?.shop?.email ?? null,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        console.log(`[hub] Token synced for ${session.shop}`);
      } catch (err) {
        console.warn("[hub] Could not sync shop token:", err.message);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export const sessionStorage = shopify.sessionStorage;
export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;