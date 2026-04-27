import { getValidAccessToken, InvalidTokenError } from "./tokenHelper.js";

const API_VERSION = "2026-01";

// ─── Auth Error Detection ────────────────────────────────────────────────────

/**
 * Returns true if the HTTP status or GraphQL error list indicates an auth failure.
 */
function isAuthError(status, errors = []) {
  if (status === 401 || status === 403) return true;
  return errors?.some(
    (e) =>
      typeof e?.message === "string" &&
      (e.message.includes("Invalid API key") ||
        e.message.includes("access token") ||
        e.message.includes("Unauthorized"))
  );
}

// ─── GraphQL Helper ──────────────────────────────────────────────────────────

/**
 * Makes a Shopify Admin GraphQL request.
 * Automatically throws InvalidTokenError on auth failures so the
 * global error handler can return a clean 401 to the client.
 *
 * @param {string} shop      - e.g. "my-store.myshopify.com"
 * @param {string} query     - GraphQL query/mutation string
 * @param {object} variables - GraphQL variables (optional)
 * @returns {Promise<object>} Parsed JSON response body
 */
export async function makeShopifyGraphQL(shop, query, variables = {}) {
  const token = await getValidAccessToken(shop);

  const doFetch = (accessToken) =>
    fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

  let res = await doFetch(token);
  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error(`[ShopifyFetch] Failed to parse GraphQL response for ${shop}`);
  }

  if (isAuthError(res.status, data?.errors)) {
    console.error(
      `[ShopifyFetch] Auth error on GraphQL request for ${shop}:`,
      data?.errors ?? res.status
    );
    throw new InvalidTokenError(shop);
  }

  if (data?.errors) {
    console.warn(`[ShopifyFetch] GraphQL errors for ${shop}:`, data.errors);
  }

  return data;
}

// ─── REST Helper ─────────────────────────────────────────────────────────────

/**
 * Makes a Shopify Admin REST API request.
 * Throws InvalidTokenError on auth failures.
 *
 * @param {string} shop   - e.g. "my-store.myshopify.com"
 * @param {string} path   - REST path, e.g. "shipping_zones.json"
 * @param {object} opts   - Optional fetch options (method, body, etc.)
 * @returns {Promise<object>} Parsed JSON response body
 */
export async function makeShopifyREST(shop, path, opts = {}) {
  const token = await getValidAccessToken(shop);

  const doFetch = (accessToken) =>
    fetch(`https://${shop}/admin/api/${API_VERSION}/${path}`, {
      method: opts.method ?? "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
        ...opts.headers,
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    });

  let res = await doFetch(token);

  if (isAuthError(res.status)) {
    console.error(
      `[ShopifyFetch] Auth error on REST request for ${shop}: HTTP ${res.status}`
    );
    throw new InvalidTokenError(shop);
  }

  if (!res.ok) {
    throw new Error(
      `[ShopifyFetch] REST request failed for ${shop} — ${path}: HTTP ${res.status}`
    );
  }

  try {
    return await res.json();
  } catch {
    throw new Error(`[ShopifyFetch] Failed to parse REST response for ${shop}`);
  }
}

// ─── Rate-Limited Fetch ───────────────────────────────────────────────────────

/**
 * Retries a fetch with exponential backoff on 429 rate-limit responses.
 *
 * @param {string} url
 * @param {object} headers
 * @param {number} retries  - Max attempts (default: 3)
 * @param {number} delay    - Initial delay in ms (default: 1000)
 * @returns {Promise<object>} Parsed JSON
 */
export async function fetchWithRetry(url, headers, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay * (attempt + 1);
      console.warn(`[ShopifyFetch] Rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}/${retries}`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) throw new Error(`[ShopifyFetch] HTTP ${res.status} for ${url}`);

    return res.json();
  }

  throw new Error(`[ShopifyFetch] Max retries (${retries}) reached for ${url}`);
}