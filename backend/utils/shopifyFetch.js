// backend/utils/shopifyFetch.js
import { getValidAccessToken, InvalidTokenError } from "./tokenHelper.js";
import { normalizeShopDomain } from "./shopDomain.js";

const API_VERSION = "2026-01";

// Auth error detection
function isAuthError(status, errors = []) {
  if (status === 401 || status === 403) return true;
  return errors?.some(
    (e) =>
      typeof e?.message === "string" &&
      (e.message.includes("Invalid API key") ||
        e.message.includes("access token") ||
        e.message.includes("Unauthorized")),
  );
}

// ─── GraphQL helper ──────────────────────────────────────────────────────────

export async function makeShopifyGraphQL(shop, query, variables = {}) {
  const normalizedShop = normalizeShopDomain(shop);

  const token = await getValidAccessToken(normalizedShop);

  const res = await fetch(
    `https://${normalizedShop}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `[ShopifyFetch] Failed to parse GraphQL response for ${normalizedShop}`,
    );
  }

  if (isAuthError(res.status, data?.errors)) {
    console.error(
      `[ShopifyFetch] Auth error on GraphQL request for ${normalizedShop}:`,
      data?.errors ?? res.status,
    );
    throw new InvalidTokenError(normalizedShop);
  }

  if (data?.errors) {
    console.warn(
      `[ShopifyFetch] GraphQL errors for ${normalizedShop}:`,
      data.errors,
    );
  }

  return data;
}

// ─── REST helper ─────────────────────────────────────────────────────────────

export async function makeShopifyREST(shop, path, opts = {}) {
  const normalizedShop = normalizeShopDomain(shop);

  const token = await getValidAccessToken(normalizedShop);

  const res = await fetch(
    `https://${normalizedShop}/admin/api/${API_VERSION}/${path}`,
    {
      method: opts.method ?? "GET",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
        ...opts.headers,
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    },
  );

  if (isAuthError(res.status)) {
    console.error(
      `[ShopifyFetch] Auth error on REST request for ${normalizedShop}: HTTP ${res.status}`,
    );
    throw new InvalidTokenError(normalizedShop);
  }

  if (!res.ok) {
    throw new Error(
      `[ShopifyFetch] REST request failed for ${normalizedShop} — ${path}: HTTP ${res.status}`,
    );
  }

  try {
    return await res.json();
  } catch {
    throw new Error(
      `[ShopifyFetch] Failed to parse REST response for ${normalizedShop}`,
    );
  }
}