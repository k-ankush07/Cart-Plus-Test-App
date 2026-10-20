export default function register({ analytics, browser }) {
    analytics.subscribe("checkout_completed", (event) => {
    const checkout = event.data?.checkout;
    if (!checkout) return;

    const shopDomain = event.context?.document?.location?.hostname;
    if (!shopDomain) return;

    let upsellRevenue = 0;
    let addonRevenue = 0;
    let subscriptionRevenue = 0;
    let baseRevenue = 0;

    for (const item of checkout.lineItems || []) {
      const price = parseFloat(item.finalLinePrice?.amount || 0);

      const attrs = (item.customAttributes || []).reduce((acc, a) => {
        acc[a.key] = a.value;
        return acc;
      }, {});

      if (attrs._hub_addon || attrs.__upcartAddon) {
        addonRevenue += price;
      } else if (attrs.__upcartRecommendation) {
        upsellRevenue += price;
      } else if (item.sellingPlanAllocation) {
        subscriptionRevenue += price;
      } else {
        baseRevenue += price;
      }
    }

    const totalRevenue =
      upsellRevenue + addonRevenue + subscriptionRevenue + baseRevenue;

    browser.sendBeacon(
      "https://" + shopDomain + "/apps/hub-track",
      JSON.stringify({
        cartToken: checkout.token,
        orderId: String(checkout.order?.id || checkout.token),
        orderNumber: checkout.order?.id,
        currency: checkout.currencyCode || "USD",
        totalRevenue,
        upsellRevenue,
        addonRevenue,
        subscriptionRevenue,
        baseRevenue,
      }),
    );
  });
}