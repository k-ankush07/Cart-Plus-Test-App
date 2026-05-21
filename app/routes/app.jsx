import { useRef } from "react";
import {
  Outlet,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate, sessionStorage } from "../shopify.server";

const TOKEN_SYNC_TIMEOUT_MS = 10_000;

const PROGRESS_BAR_KEYFRAMES = `
  @keyframes upcart-slide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(150%); }
    100% { transform: translateX(-100%); }
  }
`;

const NAV_LINKS = [
  { href: "/app", label: "Home" },
  { href: "/app/carts", label: "Carts" },
  { href: "/app/sticky-cart", label: "Sticky Cart" },
  { href: "/app/pricing", label: "Pricing" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/help&support", label: "Help & Support" },
];

const _lastSentToken = new Map();

/**
 * Saves the shop's offline access token to the external API hub.
 * Failures are intentionally swallowed — this must never block the loader.
 *
 * @param {import("@shopify/shopify-api").Session} session  Online session.
 * @param {object} admin  Shopify Admin API client.
 */
async function syncShopToken(session, admin) {
  try {
    const offlineSession = await sessionStorage.loadSession(
      `offline_${session.shop}`
    );
    const accessToken = offlineSession?.accessToken;

    if (!accessToken || _lastSentToken.get(session.shop) === accessToken) {
      return;
    }

    const graphqlResponse = await admin.graphql(
      `query ShopInfo { shop { email name myshopifyDomain } }`
    );
    const { data } = await graphqlResponse.json();
    const storeEmail = data?.shop?.email ?? null;

    const apiBaseUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
    if (!apiBaseUrl) {
      console.warn("[hub] PUBLIC_REACT_APP_API_URL is not set — skipping token sync.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOKEN_SYNC_TIMEOUT_MS);

    await fetch(`${apiBaseUrl}/api/save-shop-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop: session.shop,
        accessToken,
        email: storeEmail,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    _lastSentToken.set(session.shop, accessToken);
  } catch (err) {
    console.warn("[hub] Could not sync shop token:", err.message);
  }
}

export const ssr = false;

export async function loader({ request }) {
  const { session, admin } = await authenticate.admin(request);
  syncShopToken(session, admin);

  return {
    apiKey: process.env.SHOPIFY_API_KEY ?? "",
  };
}

function PolarisProvider({ children }) {
  return (
    <PolarisAppProvider i18n={enTranslations}>
      {children}
    </PolarisAppProvider>
  );
}

function NavigationProgressBar() {
  return (
    <>
      <style>{PROGRESS_BAR_KEYFRAMES}</style>
      <div
        role="progressbar"
        aria-label="Page loading"
        aria-busy="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2_147_483_647,
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
      </div>
    </>
  );
}

function AppNav() {
  return (
    <s-app-nav>
      {NAV_LINKS.map(({ href, label }, index) => (
        <s-link
          key={href}
          href={href}
          {...(index === 0 ? { rel: "home" } : {})}
        >
          {label}
        </s-link>
      ))}
    </s-app-nav>
  );
}

export default function App() {
  const { apiKey } = useLoaderData();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const initialLoadDoneRef = useRef(false);

  if (!isNavigating) {
    initialLoadDoneRef.current = true;
  }

  const showInitialLoader = isNavigating && !initialLoadDoneRef.current;

  return (
    <PolarisProvider>
      <ShopifyAppProvider embedded apiKey={apiKey}>
        {showInitialLoader && <NavigationProgressBar />}
        <AppNav />
        <Outlet />
      </ShopifyAppProvider>
    </PolarisProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <PolarisProvider>
      {boundary.error(error)}
    </PolarisProvider>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);