// app/components/utils/refreshShopifyToken.js
import fetch from "node-fetch";

/**
 * Refresh expiring offline access token using refresh token.
 * Docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens#token-refresh
 */
export async function refreshAccessToken(shop, refreshToken) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(
      `[TokenRefresh] Failed for ${shop}: HTTP ${res.status} — ${text.slice(
        0,
        300,
      )}`,
    );
    throw new Error(`Refresh failed for ${shop}: HTTP ${res.status}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      `[TokenRefresh] Non-JSON response for ${shop}: ${text.slice(
        0,
        300,
      )}`,
    );
    throw new Error(`Refresh returned non-JSON for ${shop}`);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

const refreshLocks = new Map();

export async function ensureFreshAccessToken(shop, sessionRecord, saveFn) {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;

  const expiresAtMs = sessionRecord.expires
    ? new Date(sessionRecord.expires).getTime()
    : null;

  const hasRefreshToken = !!sessionRecord.refreshToken;

  if (!hasRefreshToken) {
    console.error(
      `[TokenRefresh] No refresh_token for ${shop}. This session is using an old non-expiring token, which the Admin API no longer accepts. Reinstall / re-auth the app for this shop.`,
    );
    throw new Error(
      `[TokenRefresh] Missing refresh_token for ${shop}. Needs expiring offline token migration.`
    );
  }

  // Agar expires set hi nahi hai, to abhi ke liye current access token use karo
  // (naya rotating token aane ke baad yeh set hoga)
  if (!expiresAtMs) {
    return { accessToken: sessionRecord.accessToken };
  }

  const needsRefresh = expiresAtMs - now < bufferMs;

  if (!needsRefresh) {
    return { accessToken: sessionRecord.accessToken };
  }

  // Agar kisi aur request ne already refresh start kar diya hai, to uska wait karo
  if (refreshLocks.has(shop)) {
    return refreshLocks.get(shop);
  }

  const refreshPromise = (async () => {
    const refreshed = await refreshAccessToken(shop, sessionRecord.refreshToken);
    const newExpires = new Date(Date.now() + refreshed.expiresIn * 1000);

    await saveFn(shop, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expires: newExpires,
    });

    console.log(
      `[TokenRefresh] Refreshed token for ${shop}, new expiry: ${newExpires.toISOString()}`,
    );

    return { accessToken: refreshed.accessToken };
  })();

  refreshLocks.set(shop, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    refreshLocks.delete(shop);
  }
}