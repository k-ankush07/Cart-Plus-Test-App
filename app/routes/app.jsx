import { Outlet, useLoaderData, useRouteError, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate, sessionStorage } from "../shopify.server";

const _lastSentToken = new Map();

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  try {
    const offlineSession = await sessionStorage.loadSession(`offline_${session.shop}`);
    const token = offlineSession?.accessToken;

    if (token && _lastSentToken.get(session.shop) !== token) {
      const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
      const res = await fetch(`${apiUrl}/api/save-shop-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: session.shop, accessToken: token }),
      });
      const data = await res.json();
      console.log(data.updated ? `[hub] Token saved for ${session.shop}` : `[hub] Token already up-to-date for ${session.shop}`);
      _lastSentToken.set(session.shop, token);
    }
  } catch (err) {
    console.warn("[hub] Could not save shop token:", err.message);
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading" && navigation.location != null;

  const i18n = {
    Polaris: {
      Common: {
        checkbox: "checkbox",
        select: "select",
      },
    },
  };

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={i18n}>
        {isNavigating && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f1f1",
          }}>
            <div style={{
              width: 200,
              height: 5,
              background: "#e1e3e5",
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: "40%",
                background: "#111111",
                borderRadius: 4,
                animation: "upcart-slide 1.2s ease-in-out infinite",
              }} />
            </div>
            <style>{`
              @keyframes upcart-slide {
                0%   { transform: translateX(-150%); }
                100% { transform: translateX(400%); }
              }
            `}</style>
          </div>
        )}
        <s-app-nav>
          <s-link href="/app" rel="home">Home</s-link>
          <s-link href="/app/carts">Carts</s-link>
          <s-link href="/app/sticky-cart">Sticky Cart</s-link>
          <s-link href="/app/pricing">Pricing</s-link>
          <s-link href="/app/analytics">Analytics</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
