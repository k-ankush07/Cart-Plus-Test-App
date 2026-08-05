import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      console.log(`Data request for shop: ${shop}`, payload);
      break;

    case "CUSTOMERS_REDACT":
      console.log(`Redact customer data for shop: ${shop}`, payload);
      break;

    case "SHOP_REDACT":
      console.log(`Redact shop data for shop: ${shop}`, payload);
      break;

    default:
      console.warn(`Unhandled webhook topic: ${topic}`);
  }

  return new Response(null, { status: 200 });
};