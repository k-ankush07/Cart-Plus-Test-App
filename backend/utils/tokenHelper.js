export class InvalidTokenError extends Error {
  constructor(shop, reason) {
    super(reason ? `INVALID_TOKEN: ${reason}` : "INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.shop = shop;
  }
}

export async function getValidAccessToken(shop) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  const key = process.env.INTERNAL_SYNC_KEY;

  if (!appUrl || !key) {
    throw new Error(
      "[TokenHelper] Missing SHOPIFY_APP_URL or INTERNAL_SYNC_KEY env vars",
    );
  }

  const url = `${appUrl}/internal/token?shop=${encodeURIComponent(shop)}`;

  let res;
  try {
    // Abort if the tunnel/origin never responds, instead of hanging.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    res = await fetch(url, {
      headers: { "x-internal-key": key },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  } catch (networkErr) {
    // This branch fires for DNS failures, dead tunnels, ECONNREFUSED, timeouts.
    console.error(
      `[TokenHelper] Network error reaching ${url} — is the Remix app / tunnel running? ${networkErr.message}`,
    );
    throw new InvalidTokenError(shop, "network_error");
  }

  // Read raw text first so we can log it regardless of whether it's JSON.
  const raw = await res.text();

  if (!res.ok) {
    // Cloudflare tunnel errors (530/1033) and similar return HTML, not JSON.
    console.error(
      `[TokenHelper] HTTP ${res.status} from ${url}: ${raw.slice(0, 200)}`,
    );
    throw new InvalidTokenError(shop, `http_${res.status}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      `[TokenHelper] Non-JSON 200 response from ${url}: ${raw.slice(0, 200)}`,
    );
    throw new InvalidTokenError(shop, "non_json_response");
  }

  const { accessToken } = parsed;
  if (!accessToken) {
    console.error(
      `[TokenHelper] Response from ${url} had no accessToken field: ${raw.slice(0, 200)}`,
    );
    throw new InvalidTokenError(shop, "missing_access_token");
  }

  return accessToken;
}