const API_KEY = import.meta.env.VITE_API_SECRET_KEY || "";

const authHeaders = (extra = {}) => ({
  "x-api-key": API_KEY,
  ...extra,
});

// GET with a timeout + one retry: a stale connection/cold backend would
// otherwise leave the page on its loading skeleton until a manual refresh.
const fetchJsonRetry = async (url, options = {}, { timeoutMs = 12000, retries = 1 } = {}) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const t0 = Date.now();
    const label = url.split("?")[0].replace(/^https?:\/\/[^/]+/, "");
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const body = await res.json();
      const ms = Date.now() - t0;
      if (ms > 2000 || !res.ok) {
        console.warn(`[api] ${label} -> ${res.status} in ${ms}ms (attempt ${attempt + 1})`);
      }
      return body;
    } catch (err) {
      lastErr = err;
      console.warn(`[api] ${label} FAILED after ${Date.now() - t0}ms (attempt ${attempt + 1}): ${err?.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
};

export const getCartStats = async (apiUrl, shop, startDate, endDate, cartIds = []) => {
  const params = new URLSearchParams({ shop });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (cartIds.length > 0) params.append("cartIds", cartIds.join(","));

  return fetchJsonRetry(`${apiUrl}/api/cart-stats?${params}`, {
    credentials: "include",
    headers: authHeaders(),
  });
};

export const getCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/get-cart/${cartId}`, {
    credentials: "include",
    headers: authHeaders(),
  });
  return res.json();
};

export const createCart = async (apiUrl, data) => {
  const res = await fetch(`${apiUrl}/api/create-cart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const updateCart = async (apiUrl, cartId, data) => {
  return fetch(`${apiUrl}/api/update-cart/${cartId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
};

export const archiveAbTest = async (apiUrl, cartId, winnerId) => {
  const res = await fetch(`${apiUrl}/api/archive-ab-test/${cartId}`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(winnerId ? { winnerId } : {}),
  });
  return res.json();
};
  
export const getCarts = async (apiUrl, shop) => {
  return fetchJsonRetry(`${apiUrl}/api/get-carts?shop=${shop}`, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });
};

export const deleteCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/delete-cart`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const uploadImage = async (apiUrl, file, shop, accessToken) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("shop", shop.myshopifyDomain);
  formData.append("accessToken", accessToken);

    console.log(accessToken, shop, apiUrl)

  const res = await fetch(`${apiUrl}/api/upload-image`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: formData,
  });

  return res.json();
};

export const togglePublishCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/toggle-publish`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const renameCart = async (apiUrl, cartId, cartName) => {
  const res = await fetch(`${apiUrl}/api/update-cart/${cartId}`, {
    method: "PUT",
    credentials: "include",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ cartName }),
  });
  return res.json();
};

export const duplicateCart = async (apiUrl, cartId) => {
  const res = await fetch(`${apiUrl}/api/duplicate-cart`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ cartId }),
  });

  return res.json();
};

export const createStickyCart = async (apiUrl, data) => {
  const res = await fetch(`${apiUrl}/api/save-sticky-cart`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getStickyCart = async (apiUrl, shop) => {
  const res = await fetch(`${apiUrl}/api/get-sticky-cart/${shop}`, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });
  return res.json();
};

export async function syncDiscountStatus(apiUrl, { cartId, cartStatus }) {
    const res = await fetch(`/shopify/create-discount`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cartId,
            cartStatus,
            forceDisable: cartStatus !== "published", 
        }),
    });
    return res.json();
}