import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

<<<<<<< HEAD
  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
=======
>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
