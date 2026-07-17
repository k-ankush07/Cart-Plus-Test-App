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
    console.error(`[TokenRefresh] Failed for ${shop}: HTTP ${res.status} — ${text.slice(0, 300)}`);
    throw new Error(`Refresh failed for ${shop}: HTTP ${res.status}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[TokenRefresh] Non-JSON response for ${shop}: ${text.slice(0, 300)}`);
    throw new Error(`Refresh returned non-JSON for ${shop}`);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

export async function ensureFreshAccessToken(shop, sessionRecord, saveFn) {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;
  const expiresAtMs = sessionRecord.expires ? new Date(sessionRecord.expires).getTime() : 0;

  const needsRefresh = !expiresAtMs || expiresAtMs - now < bufferMs;

  if (!needsRefresh) {
    return { accessToken: sessionRecord.accessToken };
  }

  if (!sessionRecord.refreshToken) {
    throw new Error(
      `[TokenRefresh] No refresh_token stored for ${shop} — cannot refresh. Reinstall required.`,
    );
  }

  const refreshed = await refreshAccessToken(shop, sessionRecord.refreshToken);
  const newExpires = new Date(now + refreshed.expiresIn * 1000);

  await saveFn(shop, {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expires: newExpires,
  });

  console.log(`[TokenRefresh] Refreshed token for ${shop}, new expiry: ${newExpires.toISOString()}`);

  return { accessToken: refreshed.accessToken };
}