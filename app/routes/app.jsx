import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
<<<<<<< HEAD
import { AppProvider } from "@shopify/shopify-app-react-router/react";
=======
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
<<<<<<< HEAD

  // eslint-disable-next-line no-undef
=======
>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

<<<<<<< HEAD
  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
=======
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
        <s-app-nav>
          <s-link href="/app" rel="home">
            Home
          </s-link>
          <s-link href="/app/additional">Additional page</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

<<<<<<< HEAD
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
=======
export const headers = (headersArgs) => boundary.headers(headersArgs);
>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
