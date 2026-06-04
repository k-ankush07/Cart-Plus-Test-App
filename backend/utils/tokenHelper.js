import { shopConfigModel } from "../model/schema.js";
import prisma from "../../app/db.server.js";

// ─── Custom Error ────────────────────────────────────────────────────────────

export class InvalidTokenError extends Error {
  constructor(shop) {
    super("INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.shop = shop;
  }
}

// ─── Token Helper ────────────────────────────────────────────────────────────

export async function getValidAccessToken(shop) {
  const sessionId = `offline_${shop}`;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session?.accessToken) {
    console.error(`[TokenHelper] No session found for shop: ${shop}`);
    throw new InvalidTokenError(shop);
  }

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