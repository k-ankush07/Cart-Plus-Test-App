import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <PolarisAppProvider i18n={enTranslations}>
        <HydratedRouter />
      </PolarisAppProvider>
    </StrictMode>
  );
});