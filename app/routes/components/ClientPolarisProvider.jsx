// app/components/ClientPolarisProvider.jsx
import { useState, useEffect } from "react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

export default function ClientPolarisProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!document.getElementById("polaris-portal-root")) {
      const el = document.createElement("div");
      el.id = "polaris-portal-root";
      document.body.appendChild(el);
    }
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <PolarisAppProvider
      i18n={enTranslations}
      portalsContainerSelector="#polaris-portal-root"
    >
      {children}
    </PolarisAppProvider>
  );
}