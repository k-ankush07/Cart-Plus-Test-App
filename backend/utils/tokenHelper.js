export class InvalidTokenError extends Error {
  constructor(shop) {
    super("INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.shop = shop;
  }
}

export async function getValidAccessToken(shop) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  const key = process.env.INTERNAL_SYNC_KEY;

  if (!appUrl || !key) {
    throw new Error("[TokenHelper] Missing SHOPIFY_APP_URL or INTERNAL_SYNC_KEY env vars");
  }

  const res = await fetch(
    `${appUrl}/internal/token?shop=${encodeURIComponent(shop)}`,
    { headers: { "x-internal-key": key } },
  );

  if (!res.ok) {
    console.error(`[TokenHelper] Failed to fetch live token for ${shop}: HTTP ${res.status}`);
    throw new InvalidTokenError(shop);
  }

  const { accessToken } = await res.json();

  if (!accessToken) {
    throw new InvalidTokenError(shop);
  }

  return accessToken;
}