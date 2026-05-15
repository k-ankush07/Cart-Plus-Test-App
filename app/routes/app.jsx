import {
  Outlet,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate, sessionStorage } from "../shopify.server";

const _lastSentToken = new Map();

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  try {
    const offlineSession = await sessionStorage.loadSession(
      `offline_${session.shop}`
    );
    const token = offlineSession?.accessToken;
    const response = await admin.graphql(`
      query {
        shop {
          email
          name
          myshopifyDomain
        }
      }
    `);
    const shopData = await response.json();
    const storeEmail = shopData?.data?.shop?.email;

    if (token && _lastSentToken.get(session.shop) !== token) {
      const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
      await fetch(`${apiUrl}/api/save-shop-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: session.shop,
          accessToken: token,
          email: storeEmail,
        }),
      });
      _lastSentToken.set(session.shop, token);
    }
  } catch (err) {
    console.warn("[hub] Could not save shop token:", err.message);
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

function PolarisWrapper({ children }) {
  return (
    <PolarisAppProvider i18n={enTranslations}>
      {children}
    </PolarisAppProvider>
  );
}

export default function App() {
  const { apiKey } = useLoaderData();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PolarisWrapper>
      <ShopifyAppProvider embedded apiKey={apiKey}>
        {isNavigating && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 21474836479,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f1f1f1",
            }}
          >
            <div
              style={{
                width: 300,
                height: 8,
                background: "#e1e3e5",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "40%",
                  background: "#111111",
                  borderRadius: 4,
                  animation: "upcart-slide 1.2s ease-in-out infinite",
                }}
              />
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
          <s-link href="/app/help&support">Help & Support</s-link>
        </s-app-nav>

        <Outlet />
      </ShopifyAppProvider>
    </PolarisWrapper>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <PolarisWrapper>
      {boundary.error(error)}
    </PolarisWrapper>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);