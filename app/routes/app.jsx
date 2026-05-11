import { Outlet, useLoaderData, useRouteError, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate, sessionStorage } from "../shopify.server";

const _lastSentToken = new Map();


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
              width: 300,
              height: 8,
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
