import { unauthenticated } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const key = request.headers.get("x-internal-key");

  if (key !== process.env.INTERNAL_SYNC_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!shop) return new Response("Missing shop", { status: 400 });

  const { session } = await unauthenticated.admin(shop);
  return Response.json({ accessToken: session.accessToken });
};