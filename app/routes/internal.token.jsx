import prisma from "../db.server";
import { ensureFreshAccessToken } from "./components/utils/refreshShopifyToken";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const key = request.headers.get("x-internal-key");

  if (key !== process.env.INTERNAL_SYNC_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!shop) return new Response("Missing shop", { status: 400 });

  const sessionId = `offline_${shop}`;
  const sessionRecord = await prisma.session.findUnique({ where: { id: sessionId } });

  if (!sessionRecord) {
    return new Response("No session found", { status: 500 });
  }

  try {
    const { accessToken } = await ensureFreshAccessToken(shop, sessionRecord, async (shop, updated) => {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          accessToken: updated.accessToken,
          refreshToken: updated.refreshToken,
          expires: updated.expires,
        },
      });
    });

    return Response.json({ accessToken });
  } catch (err) {
    console.error(`[internal/token] Refresh failed for ${shop}:`, err.message);
    return new Response("Token refresh failed", { status: 500 });
  }
};