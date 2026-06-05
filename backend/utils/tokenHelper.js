import { shopConfigModel } from "../model/schema.js";

// ─── Custom Error ────────────────────────────────────────────────────────────

export class InvalidTokenError extends Error {
  constructor(shop) {
    super("INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.shop = shop;
  }
}

// ─── Token Helper ────────────────────────────────────────────────────────────

/**
 * Resolves the offline Admin API access token for a shop.
 *
 * The standalone Express backend runs as a separate process from the Shopify
 * embedded app and does NOT share the app's Prisma/SQLite session store. The
 * embedded app pushes fresh tokens into MongoDB (`shopConfig`) on every load
 * via POST /api/save-shop-token, so MongoDB is the single source of truth here.
 */
export async function getValidAccessToken(shop) {
  const config = await shopConfigModel.findOne({ shop }).lean();

  if (!config?.accessToken) {
    console.error(`[TokenHelper] No access token in shopConfig for shop: ${shop}`);
    throw new InvalidTokenError(shop);
  }

  return config.accessToken;
}