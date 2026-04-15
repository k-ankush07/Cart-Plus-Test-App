import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate, sessionStorage } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  // Runs only during app install / OAuth — save offline token to Express backend
  try {
    const offlineSession = await sessionStorage.loadSession(`offline_${session.shop}`);
    const token = offlineSession?.accessToken;

    if (token) {
      const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
      console.log("[hub] Sending token to:", `${apiUrl}/api/save-shop-token`);
      const res = await fetch(`${apiUrl}/api/save-shop-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: session.shop, accessToken: token }),
      });
      const data = await res.json();
      console.log("[hub] save-shop-token response:", data);
    }
  } catch (err) {
    console.warn("[hub] Could not save shop token:", err.message);
  }

  return null;
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
