import { useAppBridge } from "@shopify/app-bridge-react";

export function useAuthenticatedFetch() {
  const shopify = useAppBridge();
  return async (url, options = {}) => {
    const token = await shopify?.idToken?.();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };
}