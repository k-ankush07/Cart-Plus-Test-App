import { authenticate } from "../shopify.server";
import db from "../db.server";
import { connectMongo } from "../mongo.server";
import {
  cartModels,
  stickyCartModel,
  shopConfigModel,
  shopPlanModel,
  analyticsModel,
  orderRevenueModel,
  cartOrderCountModel,
} from "../../backend/model/schema.js";
import { sendEmail } from "../../backend/routes/sendEmail.js";

const CLEANUP_DELAY_MS = 24 * 60 * 60 * 1000;

const buildUninstallEmail = (shop) => ({
  subject: "You uninstalled CustomCart — your data will be deleted in 24 hours",
  html: `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <p>Hi,</p>
      <p>We noticed that the <strong>CustomCart</strong> app was uninstalled from <strong>${shop}</strong>.</p>
      <p>All data associated with your store (carts, sticky cart, plan, analytics and revenue records) will be
      <strong>permanently deleted in 24 hours</strong>.</p>
      <p>If this was a mistake, simply reinstall the app within the next 24 hours and your data will be preserved.</p>
      <p>— The CustomCart Team</p>
    </div>
  `,
});

const wasReinstalled = async (shop, uninstalledAt) => {
  // A fresh Prisma session row appears the moment OAuth completes on reinstall.
  const sessionCount = await db.session.count({ where: { shop } });
  if (sessionCount > 0) return true;

  // Fallback: token refreshed via tokenHelper after the uninstall timestamp.
  const config = await shopConfigModel.findOne({ shop }).lean();
  return !!(config?.updatedAt && new Date(config.updatedAt) > uninstalledAt);
};

const purgeShopData = async (shop) => {
  await Promise.all([
    cartModels.deleteMany({ shop }),
    stickyCartModel.deleteMany({ shop }),
    shopPlanModel.deleteMany({ shop }),
    analyticsModel.deleteMany({ shop }),
    orderRevenueModel.deleteMany({ shop }),
    cartOrderCountModel.deleteMany({ shop }),
  ]);
};

const scheduleCleanup = (shop, uninstalledAt) => {
  setTimeout(async () => {
    try {
      await connectMongo();
      if (await wasReinstalled(shop, uninstalledAt)) {
        console.log(`[uninstall] ${shop} reinstalled within grace period — keeping data`);
        return;
      }
      await purgeShopData(shop);
      console.log(`[uninstall] purged all data for ${shop}`);
    } catch (err) {
      console.error(`[uninstall] cleanup failed for ${shop}:`, err);
    }
  }, CLEANUP_DELAY_MS).unref?.();
};

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  try {
    await connectMongo();
    const config = await shopConfigModel.findOne({ shop }).lean();
    const uninstalledAt = new Date();

    if (config?.email) {
      const { subject, html } = buildUninstallEmail(shop);
      sendEmail(config.email, subject, html).catch((err) =>
        console.error(`[uninstall] email failed for ${shop}:`, err.message),
      );
    } else {
      console.warn(`[uninstall] no shopConfig/email for ${shop} — skipping notification`);
    }

    scheduleCleanup(shop, uninstalledAt);
  } catch (err) {
    console.error(`[uninstall] handler error for ${shop}:`, err);
  }

  return new Response();
};
