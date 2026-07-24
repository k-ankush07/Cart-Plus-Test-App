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

const CLEANUP_DELAY_MS = 48 * 60 * 60 * 1000;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildUninstallEmail = (shop, owner) => {
  const safeShop = escapeHtml(shop);
  const safeOwner = escapeHtml(owner || "there");

  return {
    subject: "You uninstalled Cart Plus — reinstall within 48 hours to restore your settings",
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Congratulations – Cart Plus</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
      body { font-family: 'Outfit', Arial, sans-serif; }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#ffffff; font-family:'Outfit',Arial,sans-serif;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; overflow: hidden; border-radius: 10px; border:1px solid #E7C5FF">

            <!-- ===================== HEADER IMAGE ===================== -->
            <tr>
              <td
                width="600"
                height="400"
                bgcolor="#1a1a1a"
                background="https://cartplus.io/cartplus-img/Rectangle%201.svg"
                style="
                  padding:50px;
                  width:100%; max-width:600px; height:400px;
                  background-color:#1a1a1a;
                  background-image:url('https://cartplus.io/cartplus-img/Rectangle%201.svg');
                  background-repeat:no-repeat;
                  background-position:center center;
                  background-size:cover;
                  text-align:center;
                "
              >
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:400px;">
                  <tr>
                    <td align="center" valign="top" style="text-align:center; vertical-align:top;">
                      <div style="text-align:center;">
                   <img
                      src="https://cartplus.io/cartplus-img/Layer_1.png"
                      alt="Cart Plus Logo"
                      width="250"
                      style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
                 />
                 </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" valign="bottom" style="text-align:center; vertical-align:center;">
                      <img src="https://cartplus.io/cartplus-img/uninstall-cart.png"
                           style="display:inline-block; vertical-align:middle; border:0;" />

                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; padding-top:20px; font-size:40px; font-weight:200; line-height:1.6;">
                       Your Account Has Been
                      </p>
                      <h1 style="font-family:'Outfit',Arial,sans-serif; margin:0; font-size:68px; font-weight:600; color:#500088; line-height:1.1; letter-spacing:-1px;">
                       Uninstalled
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ===================== BODY TEXT ===================== -->
            <tr>
              <td bgcolor="#ffffff" style="background-color:#F8EEFF; padding:50px; text-align:center; font-family:'Outfit',Arial,sans-serif; font-size:18px; line-height:28px; font-weight:400; color:#1a1a1a;">
                <p style="margin:0 0 12px; font-size: 18px; font-weight: 400;">Hi <strong>${safeOwner}</strong>,</p>
                <p style="margin:0 0 12px; font-size: 18px; font-weight: 400;">We noticed that you uninstalled <strong>Cart Plus</strong> from <strong>${safeShop}</strong>.</p>
                <p style="margin:0 0 30px; font-size: 18px; font-weight: 400;">Thank you for giving us the opportunity to support your business. If this wasn't intentional, you can reinstall the app within <strong>48 hours</strong> and restore your settings and preferences.</p>

                <!-- What Happens Next? -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border:1px solid #e0e0e0; border-radius:12px; margin-bottom:20px; text-align:left; background:#F9FAFC">
                  <tr>
                    <td style="padding:28px 28px 20px;">
                      <p style="margin:0 0 16px; font-family:'Outfit',Arial,sans-serif; font-size:20px; font-weight:700; color:#1a1a1a;">
                        What Happens Next?
                      </p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:4px 0; font-family:'Outfit',Arial,sans-serif; font-size:15px; color:#3c3c3c; line-height:22px;">
                            <span style="margin-right:8px;">&#8226;</span> App features will no longer be available in your store.
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0; font-family:'Outfit',Arial,sans-serif; font-size:15px; color:#3c3c3c; line-height:22px;">
                            <span style="margin-right:8px;">&#8226;</span> Saved settings and configurations will remain available for a limited period.
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0; font-family:'Outfit',Arial,sans-serif; font-size:15px; color:#3c3c3c; line-height:22px;">
                            <span style="margin-right:8px;">&#8226;</span> Analytics and app-related data may be removed after the retention period expires.
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0; font-family:'Outfit',Arial,sans-serif; font-size:15px; color:#3c3c3c; line-height:22px;">
                            <span style="margin-right:8px;">&#8226;</span> You can reinstall the app at any time and continue where you left off.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Need Help? -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border:1px solid #e0e0e0; border-radius:12px; text-align:left; background:#F9FAFC">
                  <tr>
                    <td style="padding:28px 28px 24px;">
                      <p style="margin:0 0 12px; font-family:'Outfit',Arial,sans-serif; font-size:20px; font-weight:700; color:#1a1a1a;">
                        Need Help?
                      </p>
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:15px; color:#3c3c3c; line-height:22px;">
                        If you experienced any issues or have questions, our support team would love to help. Your feedback helps us improve and build a better experience for merchants like you.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- ===================== Reinstall Cart Plus ===================== -->
            <tr>
              <td style="background-image:url('https://cartplus.io/cartplus-img/Rectangle%202.svg'); padding:50px 30px; background-repeat:no-repeat; background-position:center center; background-size:cover;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="text-align:center;">
                      <p style="margin:0 0 15px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:700; color:#ffffff;">
                       Reinstall Cart Plus
                      </p>
                      <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:18px; color:#ffffff;">
                       Get back to creating a higher-converting cart experience for your customers.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                        style="border:1px solid rgba(255,255,255,0.2); border-radius:26px; background:transparent;">
                        <tr>
                          <td style="padding:5px 28px 5px 5px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:42px; height:42px; text-align:center; vertical-align:middle;">
                                  <img
                                    src="https://cartplus.io/cartplus-img/download-cart.png"
                                    alt="" width="42" height="42"
                                    style="display:inline-block; vertical-align:middle; border:0;"
                                  />
                                </td>
                                <td style="padding-left:40px; vertical-align:middle;">
                                  <a href="mailto:Info@customcart.com"
                                    style="font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:500; color:#ffffff; text-decoration:none;">
                                   Install App
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ===================== FOOTER ===================== -->
           <!-- ===================== FOOTER ===================== -->
            <tr>
              <td bgcolor="#f7f7f7" style="background-color:#F8EEFF; border-top:1px solid #eeeeee; padding:30px; text-align:center;">

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; color:#1a1a1a;">
                  Follow us
                </p>

                <!-- Social icons -->
               <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td style="padding:0 6px;">
                     <div style="width:34px; height:34px;">
                     <a href="https://www.facebook.com/people/Cart-Plus/61591767910161" style="display:block;">
                       <img src="https://cartplus.io/cartplus-img/facebook-cart.png"
                        alt="Facebook"
                        style="display:block; width:100%; height:100%; border:0;">
                    </a>
                    </div>
                    </td>
                    <td style="padding:0 6px;">
                      <div style="width:34px; height:34px;">
                        <a href="https://www.instagram.com/cart__plus/" style="display:block;">
                          <img src="https://cartplus.io/cartplus-img/instagram-cart.png" alt="Instagram"  style="display:block; width:100%; height:100%; border:0;" />
                        </a>
                      </div>
                    </td>
                    <td style="padding:0 6px;">
                      <div style="width:34px; height:34px;">
                        <a href="https://www.linkedin.com/in/cart-plus-2375a5422/" style="display:block;">
                          <img src="https://cartplus.io/cartplus-img/linkdin-cart.png" alt="LinkedIn"  style="display:block; width:100%; height:100%; border:0;" />
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
               <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; color:#888888;">
                  <a href="mailto:support@cartplus.io" style="color:#000000; font-size:18px; font-weight:300; text-decoration:none;">support@cartplus.io</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.cartplus.io" style="color:#000000; font-size:18px; font-weight:300; text-decoration:none;">www.cartplus.io</a>
                </p>

                <hr style="border:none; border-top:1px solid #dddddd; margin:20px 0;" />

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border-bottom:1px solid #dddddd; padding-bottom:20px; margin-bottom:20px;">
                  <tr>
                    <td align="left" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#000000;">
                      &copy; 2026 Cart Plus. All rights reserved.
                    </td>
                    <td align="right" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#000000;">
                      <a href="#" style="color:#000000; font-weight:700; font-size:14px; text-decoration:none;">Preference</a>
                      &nbsp;|&nbsp;
                      <a href="#" style="color:#000000; font-weight:700; font-size:14px; text-decoration:none;">Unsubscription</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#000000; line-height:20px;">
                 Thank you for choosing Cart Plus
                </p>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </body>
</html>`,
  };
};

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
    await db.session.deleteMany({ where: { shop } });
  } catch (e) {
    console.warn(`[uninstall] session delete warning:`, e);
  }

  try {
    await connectMongo();
    const config = await shopConfigModel.findOne({ shop }).lean();
    const uninstalledAt = new Date();

    if (config?.email) {
      const owner = config?.shopOwner || config?.name || config?.ownerName;
      const { subject, html } = buildUninstallEmail(shop, owner);
      try {
        await sendEmail(config.email, subject, html);
      } catch (emailErr) {
        console.error(`[uninstall] sendEmail threw:`, emailErr);
      }
    } else {
      const cart = await cartModels.findOne({ shop }).lean();
      const fallbackEmail = cart?.shopEmail;
      if (fallbackEmail) {
        const owner = cart?.shopOwner || cart?.ownerName;
        const { subject, html } = buildUninstallEmail(shop, owner);
        try {
          await sendEmail(fallbackEmail, subject, html);
        } catch (emailErr) {
          console.error(`[uninstall] fallback sendEmail threw:`, emailErr);
        }
      }
    }

    scheduleCleanup(shop, uninstalledAt);
  } catch (err) {
    console.error(`[uninstall] handler error for ${shop}:`, err);
  }

  return new Response();
};