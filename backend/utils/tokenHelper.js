import { shopConfigModel } from "../model/schema.js";
import { sessionStorage } from "../../app/shopify.server.js";

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
 * Loads the offline access token for a shop from Shopify's session storage.
 * Offline tokens do NOT expire but CAN be revoked (e.g. merchant uninstalls).
 * If the token is missing or later found invalid, throws InvalidTokenError.
 */
export async function getValidAccessToken(shop) {
  const sessionId = `offline_${shop}`;
  const session = await sessionStorage.loadSession(sessionId);

  if (!session?.accessToken) {
    console.error(`[TokenHelper] No session found for shop: ${shop}`);
    throw new InvalidTokenError(shop);
  }

  // Keep DB in sync (best-effort — do not block on failure)
  shopConfigModel
    .findOneAndUpdate(
      { shop },
      { accessToken: session.accessToken, updatedAt: new Date() },
      { upsert: true }
    )
    .catch((err) =>
      console.warn(`[TokenHelper] DB sync failed for ${shop}:`, err.message)
    );

  return session.accessToken;
}