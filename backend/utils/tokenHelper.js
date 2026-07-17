// backend/utils/tokenHelper.js

import prisma from "../../app/db.server.js";
import { ensureFreshAccessToken } from "../../app/routes/components/utils/refreshShopifyToken.js";

/**
 * Custom error type for token-related failures.
 * Reason can be:
 *  - "no_offline_session"   → Prisma me offline_{shop} session hi nahi mila
 *  - "missing_access_token" → ensureFreshAccessToken ke baad bhi token null
 *  - "refresh_failed"       → refresh flow me koi exception
 */
export class InvalidTokenError extends Error {
  /**
   * @param {string} shop   - normalized shop domain (e.g. "himayush.myshopify.com")
   * @param {string} reason - short code explaining what went wrong
   */
  constructor(shop, reason) {
    super(reason ? `INVALID_TOKEN: ${reason}` : "INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.shop = shop;
    this.reason = reason;
  }
}

/**
 * Hamesha valid access token return karega:
 * - Prisma session se offline_{shop} session padhega
 * - ensureFreshAccessToken se refresh karega (agar needed)
 * - DB me accessToken + refreshToken + expires update karega
 * - Latest accessToken return karega
 *
 * @param {string} shop - normalized shop, e.g. "himayush.myshopify.com"
 * @returns {Promise<string>} accessToken
 */
export async function getValidAccessToken(shop) {
  const sessionId = `offline_${shop}`;

  // 1) Prisma se offline session load karo
  const sessionRecord = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!sessionRecord) {
    console.error(`[TokenHelper] No offline session for ${shop}`);
    throw new InvalidTokenError(shop, "no_offline_session");
  }

  // 2) ensureFreshAccessToken se refresh / validate karo
  try {
    const { accessToken } = await ensureFreshAccessToken(
      shop,
      sessionRecord,
      async (_shop, updated) => {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            accessToken: updated.accessToken,
            refreshToken: updated.refreshToken,
            expires: updated.expires,
          },
        });
      },
    );

    if (!accessToken) {
      console.error(
        `[TokenHelper] No accessToken after ensureFreshAccessToken for ${shop} (sessionId=${sessionId})`,
      );
      throw new InvalidTokenError(shop, "missing_access_token");
    }

    return accessToken;
  } catch (err) {
    console.error(
      `[TokenHelper] Failed to ensure fresh access token for ${shop}: ${err.message}`,
    );
    throw new InvalidTokenError(shop, "refresh_failed");
  }
}