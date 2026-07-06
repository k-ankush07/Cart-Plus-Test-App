export const buildPlanUpgradeEmailHtml = ({ storeOwner, shop, plan }) => {
  const safeOwner = String(storeOwner || "there").replace(/</g, "&lt;");
  const safeShop = String(shop || "").replace(/</g, "&lt;");
  const safePlan = String(plan || "Premium").replace(/</g, "&lt;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Congratulations – Cart Plus</title>
    <!--[if mso]>
    <noscript>
      <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    </noscript>
    <![endif]-->
 
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
 
    <style>
      /* Kept only for clients that DO support <style> (Apple Mail, some webmail) */
      @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
 
      .cartThankyouImage {
        height: 390px;
        width: 600px;
      }
 
      body {
        font-family: 'Outfit', Arial, sans-serif;
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#ffffff; font-family:'Outfit',Arial,sans-serif;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

            <!-- ===================== HEADER ===================== -->
            <!-- Uses table rows instead of position:absolute so it works in all clients -->
            
            <!-- ===================== HEADER IMAGE ===================== -->
           <tr>
      <tr>
   <td
    width="600"
    height="390"
    bgcolor="#1a1a1a"
    background="https://cartplus.io/cartplus-img/Group%201707480303.png"
    style="
      padding:50px;
      width:100%; max-width:600px; height:390px;
      background-color:#1a1a1a;
      background-image:url('https://cartplus.io/cartplus-img/Group%201707480303.png');
      background-repeat:no-repeat;
      background-position:center center;
      background-size:cover;
      text-align:center;
    "
  >
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:390px;">

      <!-- TOP: Cart Plus logo -->
      <tr>
        <td align="center" valign="top" style="text-align:center; vertical-align:top;">
          <div style="text-align:center;">
                   <img
                      src="https://cartplus.io/cartplus-img/Layer_1.svg"
                      alt="Cart Plus Logo"
                      width="250"
                      style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
                 />
                 </div>
        </td>
      </tr>

      <!-- MIDDLE: Congratulations + subtitle -->
      <tr>
        <td align="center" valign="middle" style="text-align:center; vertical-align:bottom; padding:0 30px 40px;">
          <h1 style="font-family:'Outfit',Arial,sans-serif; font-size:68px; font-weight:600; color:#500088; line-height:1.1; letter-spacing:-1px; margin-bottom:20px;">
            Congratulations
          </h1>
          <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:30px; font-weight:200; color:#000; line-height:1.6;">
            Your plan has now been upgraded.
          </p>
        </td>
      </tr>

    </table>
  </td>
</tr>
            <!-- ===================== BODY TEXT ===================== -->
            <tr>
              <td bgcolor="#f7f7f7" style="background-color:#F8EEFF; padding:50px; text-align:center; font-family:'Outfit',Arial,sans-serif; font-size:18px; line-height:28px; font-weight:400; color:#1a1a1a;">
                <p style="margin:0 0 12px;">Hi <strong>${safeOwner}</strong>,</p>
                <p style="margin:0 0 12px;"><strong>${safeShop}</strong></p>
                 <p style="margin:0 0 12px;">
                  <strong>Congratulations on upgrading your account!</strong><br />
                    You now have access to your new plan, including increased limits, additional features, and more resources to help you get more conversions.
               </p>
            <p style="margin:0;">
             Thank you for choosing to grow with us. We're excited to support your continued success and look forward to helping you achieve even more.
        </p>
              </td>
            </tr>

            <!-- ===================== FEATURES STRIP ===================== -->
            <!-- background-image replaced with solid bgcolor fallback -->
            <tr>
              <td style="background-image:url('https://cartplus.io/cartplus-img/Rectangle%202.svg'); padding:50px 30px;
              background-repeat:no-repeat; background-position:center center;  background-size:cover;">

                <!-- Feature icons row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="width:100%; border:1px solid #ffffff; border-radius:20px; padding:20px 15px;">
                  <tr>
                    <!-- Premium Features -->
                    <td width="33%" style="text-align:center; vertical-align:top;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td>
                            <img
                              src="https://hubsyntax.com/cart-images/features8.png"
                              style="display:inline-block; vertical-align:middle; border:0;"
                            />
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Premium Features
                      </p>
                    </td>
                    <!-- Higher Limits -->
                    <td width="33%" style="text-align:center; vertical-align:top; border-left:1px solid #ffffff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td>
                            <img
                              src="https://hubsyntax.com/cart-images/features9.png"
                              style="display:inline-block; vertical-align:middle; border:0;"
                            />
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Higher Limits
                      </p>
                    </td>
                    <!-- Priority Support -->
                    <td width="34%" style="text-align:center; vertical-align:top; border-left:1px solid #ffffff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td>
                            <img
                              src="https://hubsyntax.com/cart-images/features10.png"
                              style="display:inline-block; vertical-align:middle; border:0;"
                            />
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Priority Support
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Need Help section -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="text-align:center;">
                      <p style="margin:0 0 15px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:700; color:#ffffff;">
                        Need Help?
                      </p>
                      <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:18px; color:#ffffff;">
                        Our support team is always here to help you.
                      </p>

                      <!-- Support button — table-based, no display:inline-table -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                        style="border:1px solid #ffffff; border-radius:26px; background:transparent;">
                        <tr>
                          <td style="padding:5px 28px 5px 5px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:42px; height:42px; text-align:center; vertical-align:middle;">
                                  <img
                                    src="https://cartplus.io/cartplus-img/Group%201707479635.svg"
                                    alt="" width="42" height="42"
                                    style="display:inline-block; vertical-align:middle; border:0;"
                                  />
                                </td>
                                <td style="padding-left:16px; vertical-align:middle;">
                                  <a href="mailto:Support@cartplus.io"
                                    style="font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:500; color:#ffffff; text-decoration:none;">
                                    Contact Support
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
            <tr>
              <td bgcolor="#f7f7f7" style="background-color:#F8EEFF; border-top:1px solid #eeeeee; padding:30px; text-align:center;">

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; color:#1a1a1a;">
                  Follow us
                </p>

                <!-- Social icons -->
               <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; ">
                        <img src="https://cartplus.io/cartplus-img/Frame%206113.png" alt="Facebook" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%206115.png" alt="Instagram" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%202121452813.png" alt="LinkedIn" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                  </tr>
                </table>

               <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; color:#888888;">
                  <a href="mailto:Support@cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">Support@cartplus.io</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">www.cartplus.io</a>
                </p>

                <hr style="border:none; border-top:1px solid #dddddd; margin:20px 0;" />

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border-bottom:1px solid #dddddd; padding-bottom:20px; margin-bottom:20px;">
                  <tr>
                    <td align="left" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      &copy; 2026 Cart Plus. All rights reserved.
                    </td>
                    <td align="right" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Preference</a>
                      &nbsp;|&nbsp;
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Unsubscription</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c; line-height:20px;">
                  Thank you for choosing Cart Plus! &#128156;<br />
                  The Cart Plus Team
                </p>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
</html>`;
};

export const buildPlanLimitReachedEmailHtml = ({ storeOwner, shop, plan }) => {
  const safeOwner = String(storeOwner || "there").replace(/</g, "&lt;");
  const safeShop = String(shop || "").replace(/</g, "&lt;");
  const safePlan = String(plan || "Free").replace(/</g, "&lt;");
  const shopHandle = safeShop.replace('.myshopify.com', '');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Limit Reached – Cart Plus</title>
    <!--[if mso]>
    <noscript>
      <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    </noscript>
    <![endif]-->

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">

    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');

      .cartThankyouImage {
        height: 390px;
        width: 600px;
      }

      body {
        font-family: 'Outfit', Arial, sans-serif;
      }

      .plan_descrition {
        border: 1px solid #EBEBEB;
        margin-top: 20px;
        border-radius: 10px;
        background: #F9FAFC;
        text-align: left;
        padding: 20px;
      }

      .plan_descrition h3 {
        font-size: 22px;
        font-weight: 600;
        margin: 0;
        padding-bottom: 12px;
      }

      .plan_descrition p {
        margin: 0;
        font-size: 14px;
        line-height: 18px;
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#ffffff; font-family:'Outfit',Arial,sans-serif;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

            <!-- ===================== HEADER IMAGE ===================== -->
            <tr>
              <td
                width="600"
                height="390"
                bgcolor="#1a1a1a"
                background="https://cartplus.io/cartplus-img/Frame%202121452821.png"
                style="
                  padding:50px;
                  width:100%; max-width:600px; height:390px;
                  background-color:#1a1a1a;
                  background-image:url('https://cartplus.io/cartplus-img/Frame%202121452821.png');
                  background-repeat:no-repeat;
                  background-position:center center;
                  background-size:cover;
                  text-align:center;
                "
              >
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:390px;">

                  <!-- TOP: Cart Plus logo -->
                  <tr>
                    <td align="center" valign="top" style="text-align:center; vertical-align:top;">
                      <div style="text-align:center;">
                   <img
                      src="https://cartplus.io/cartplus-img/Layer_1.svg"
                      alt="Cart Plus Logo"
                      width="250"
                      style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
                 />
                 </div>
                    </td>
                  </tr>

                  <!-- MIDDLE: Account Limit + subtitle -->
                  <tr>
                    <td align="center" valign="middle" style="text-align:center; vertical-align:bottom;">
                      <img src="https://cartplus.io/cartplus-img/Group%201707479984.png"
                        style="display:inline-block; vertical-align:middle; border:0;"/>
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:40px; font-weight:200; color:#000000; line-height:1.6;">
                        You've reached the
                      </p>

                      <h1 style="font-family:'Outfit',Arial,sans-serif; margin: 0; font-size:80px; font-weight:600; color:#500088; line-height:1.1; letter-spacing:-1px;">
                        Account Limit
                      </h1>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- ===================== BODY TEXT ===================== -->
            <tr>
              <td bgcolor="#ffffff" style="background-color:#F8EEFF; padding:50px; text-align:center; font-family:'Outfit',Arial,sans-serif; font-size:18px; line-height:28px; font-weight:400; color:#1a1a1a;">
                <p style="margin:0 0 12px;">Hi <strong>${safeOwner}</strong>,</p>
                <p style="margin:0 0 12px;"><strong>${safeShop}</strong></p>
                <p style="margin:0;">
                  It looks like you've reached the limit of your ${safePlan} account. Upgrade your plan to continue accessing all premium features and tools.
                </p>
               
                <div class="plan_descrition" style="border:1px solid #EBEBEB; margin-top:20px; border-radius:10px; background:#F9FAFC; text-align:left; padding:20px;">
                  <h3 style="font-size:22px; font-weight:600; margin:0; padding-bottom:12px;">Ready to upgrade?</h3>
                  <p style="margin:0; font-size:14px; line-height:18px;">Upgrade your account in just a few clicks and continue building a higher-converting cart experience for your customers.</p>
                </div>
              </td>
            </tr>

            <!-- ===================== UPGRADE STRIP ===================== -->
            <tr>
              <td style="background-image:url('https://cartplus.io/cartplus-img/Rectangle%202.svg'); padding:50px 30px;
              background-repeat:no-repeat; background-position:center center;  background-size:cover;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="text-align:center;">
                      <p style="margin:0 0 15px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:700; color:#ffffff;">
                        Upgrade to Premium
                      </p>
                      <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:18px; color:#ffffff;">
                        Unlock advanced features and higher limits.
                      </p>

                      <!-- Upgrade button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                        style="border:1px solid #ffff; border-radius:26px; background:transparent;">
                        <tr>
                          <td style="padding:5px 28px 5px 5px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:36px; height:36px; text-align:center; vertical-align:middle;">
                                  <img
                                    src="https://cartplus.io/cartplus-img/Group%201707479636%20(1).png"
                                    alt="" width="42" height="42"
                                    style="display:inline-block; vertical-align:middle; border:0;"
                                  />
                                </td>
                                <td style="padding-left:28px; vertical-align:middle;">
                                <a href="https://admin.shopify.com/store/${shopHandle}/apps/cart-drawer-52/app/pricing"
                      style="font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:500; color:#ffffff; text-decoration:none;">
                                           Upgrade Plan
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
            <tr>
              <td bgcolor="#F8EEFF" style="background-color:#F8EEFF; border-top:1px solid #eeeeee; padding:30px; text-align:center;">

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; color:#1a1a1a;">
                  Follow us
                </p>

                <!-- Social icons -->
                 <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; ">
                        <img src="https://cartplus.io/cartplus-img/Frame%206113.png" alt="Facebook" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%206115.png" alt="Instagram" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%202121452813.png" alt="LinkedIn" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; color:#888888;">
                  <a href="mailto:Support@cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">Support@cartplus.io</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">www.cartplus.io</a>
                </p>

                <hr style="border:none; border-top:1px solid #dddddd; margin:20px 0;" />

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border-bottom:1px solid #dddddd; padding-bottom:20px; margin-bottom:20px;">
                  <tr>
                    <td align="left" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      &copy; 2026 Cart Plus. All rights reserved.
                    </td>
                    <td align="right" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Preference</a>
                      &nbsp;|&nbsp;
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Unsubscription</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c; line-height:20px;">
                  Thank you for choosing Cart Plus! &#128156;<br />
                  The Cart Plus Team
                </p>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
</html>`;
};

export const buildWelcomeEmailHtml = ({ storeOwner, shop }) => {
  const safeOwner = String(storeOwner || "there").replace(/</g, "&lt;");
  const safeShop = String(shop || "").replace(/</g, "&lt;");

  return `<!doctype html>
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

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

            <!-- ===================== HEADER IMAGE ===================== -->
            <tr>
              <td
                width="600"
                height="600px"
                bgcolor="#1a1a1a"
                background="https://cartplus.io/cartplus-img/Rectangle%201.svg"
                style="
                  padding:50px 50px 10px 50px;
                  width:100%; max-width:600px; height:600px;
                  background-color:#1a1a1a;
                  background-image:url('https://cartplus.io/cartplus-img/Rectangle%201.svg');
                  background-repeat:no-repeat;
                  background-position:center center;
                  background-size:cover;
                  text-align:center;
                "
              >
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:700px;">

                  <!-- TOP: Cart Plus logo -->
                  <tr>
                    <td align="center" valign="top" style="text-align:center; vertical-align:top;">
                      <div style="text-align:center;">
                   <img
                      src="https://cartplus.io/cartplus-img/Layer_1.svg"
                      alt="Cart Plus Logo"
                      width="250"
                      style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;"
                 />
                 </div>
                    </td>
                  </tr>

                  <!-- MIDDLE: Welcome + title + image -->
                  <tr>
                    <td align="center" valign="middle" style="text-align:center; vertical-align:bottom;">
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; padding-top:20px; font-size:60px; font-weight:200; color:#3C3C3C; line-height:1.6;">
                        Welcome to
                      </p>
                   <h1 style="font-family:'Outfit',Arial,sans-serif; margin:0; font-size:80px; font-weight:600; line-height:75px; letter-spacing:-1px; padding-bottom:30px; color:#500088; display:inline-block;">
                     Cart Plus
                   </h1>
                      <img src="https://cartplus.io/cartplus-img/Group%201707479975.png"
                           style="display:inline-block; vertical-align:middle; border:0;outline:none; text-decoration:none" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ===================== BODY TEXT ===================== -->
            <tr>
              <td bgcolor="#ffffff" style="background-color:#F8EEFF; padding:50px; text-align:center; font-family:'Outfit',Arial,sans-serif; font-size:18px; line-height:28px; font-weight:400; color:#1a1a1a;">
                <p style="margin:0 0 12px;">Hi <strong>${safeOwner}</strong>,</p>
                <p style="margin:0 0 12px;"><strong>${safeShop}</strong></p>
                <p style="margin:0 0 12px;"><strong>Thank you for installing Cart Plus</strong></p>
                <p style="margin:0;">
                 We're excited to help you increase conversions, improve the customer experience, and boost your store's revenue with a smarter, more engaging cart experience.
                </p>
              </td>
            </tr>

            <!-- ===================== FEATURES STRIP ===================== -->
            <tr>
              <td style="background-image:url('https://cartplus.io/cartplus-img/Rectangle%202.svg'); padding:50px; background-repeat:no-repeat; background-position:center center; background-size:cover;">

                <!-- What you can do heading -->
                <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:600; text-align:center; color:#ffffff;">
                  What you can do with<br/>Cart Plus
                </p>

                <!-- Feature icons row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="width:100%; border:1px solid #FFFFFF; border-radius:30px; padding:15px;">
                  <tr>
                    <!-- Increase AOV -->
                    <td width="25%" style="text-align:center; vertical-align:top; padding:10px 5px;">
                      <img src="https://cartplus.io/cartplus-img/Group%201707479634.svg"
                        style="display:inline-block; vertical-align:middle; border:0;" />
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Increase AOV<br/>with upsells
                      </p>
                    </td>
                    <!-- Add rewards -->
                    <td width="25%" style="text-align:center; vertical-align:top; border-left:1px solid #FFFFFF; padding:10px 5px;">
                      <img src="https://cartplus.io/cartplus-img/Group%201707479634%20(1).svg"
                        style="display:inline-block; vertical-align:middle; border:0;" />
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Add rewards &<br/>free gifts
                      </p>
                    </td>
                    <!-- Improve conversion -->
                    <td width="25%" style="text-align:center; vertical-align:top; border-left:1px solid #FFFFFF; padding:10px 5px;">
                      <img src="https://cartplus.io/cartplus-img/Group%201707479634%20(2).svg"
                        style="display:inline-block; vertical-align:middle; border:0;" />
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Improve cart<br/>conversion rates
                      </p>
                    </td>
                    <!-- Customize -->
                    <td width="25%" style="text-align:center; vertical-align:top; border-left:1px solid #FFFFFF; padding:10px 5px;">
                      <img src="https://cartplus.io/cartplus-img/Group%201707479633.svg"
                        style="display:inline-block; vertical-align:middle; border:0;" />
                      <p style="margin:12px 0 0; font-family:'Outfit',Arial,sans-serif; font-size:13px; font-weight:500; color:#ffffff; line-height:1.3;">
                        Customize your<br/>cart drawer
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- ===================== GETTING STARTED ===================== -->
            <tr>
              <td bgcolor="#ffffff" style="background-color:#F8EEFF; padding:50px;">
              <table 
               role="presentation" 
               width="100%" 
               cellpadding="0" 
               cellspacing="0" 
               border="0"
              style="border:1px solid #9500FF1A; border-radius:30px; background-color:white;">
         <tr>
          <td style="padding:30px;">
                <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:700; color:#1a1a1a;">
                  Getting started is simple
                </p>

                <!-- Step 1 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50" valign="top" style="vertical-align:top; padding-right:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="42" height="42" align="center" valign="middle"
                            style="width:42px; height:42px; border-radius:50%; background: linear-gradient(180deg, #000000 0%, #9500FF 174.83%); color:#ffffff; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; text-align:center; vertical-align:middle;">
                            1
                          </td>
                        </tr>
                        <!-- Connector line -->
                        <tr>
                          <td align="center">
                            <div style="width:2px; height:40px; background: linear-gradient(180deg, #000000 0%, #9500FF 174.83%); margin:0 auto;"></div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align:top; padding-top:8px;">
                      <p style="margin:0 0 4px; font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:700; color:#1a1a1a;">Open the App</p>
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:15px; font-weight:400; color:#555555; line-height:1.5;">Go to your Cart Plus dashboard.</p>
                    </td>
                  </tr>
                </table>

                <!-- Step 2 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50" valign="top" style="vertical-align:top; padding-right:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="42" height="42" align="center" valign="middle"
                            style="width:42px; height:42px; border-radius:50%; background: linear-gradient(180deg, #000000 0%, #9500FF 174.83%); color:#ffffff; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; text-align:center; vertical-align:middle;">
                            2
                          </td>
                        </tr>
                        <!-- Connector line -->
                        <tr>
                          <td align="center">
                            <div style="width:2px; height:40px; background: linear-gradient(180deg, #000000 0%, #9500FF 174.83%); margin:0 auto;"></div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align:top; padding-top:8px;">
                      <p style="margin:0 0 4px; font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:700; color:#1a1a1a;">Configure</p>
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:15px; font-weight:400; color:#555555; line-height:1.5;">Add upsells, rewards, and customize your cart.</p>
                    </td>
                  </tr>
                </table>

                 <!-- Step 3 -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50" valign="top" style="vertical-align:top; padding-right:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="42" height="42" align="center" valign="middle"
                            style="width:42px; height:42px; border-radius:50%; background: linear-gradient(180deg, #000000 0%, #9500FF 174.83%); color:#ffffff; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; text-align:center; vertical-align:middle;">
                            3
                          </td>
                        </tr>
                        <!-- Connector line -->
                        <tr>
                      </table>
                    </td>
                    <td valign="top" style="vertical-align:top; padding-top:8px;">
                      <p style="margin:0 0 4px; font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:700; color:#1a1a1a;">Configure</p>
                      <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:15px; font-weight:400; color:#555555; line-height:1.5;">Add upsells, rewards, and customize your cart.</p>
                    </td>
                  </tr>
                </table>
                   </td>
                </tr>
                </table>
             </td>
            </tr>
            <!-- ===================== NEED HELP STRIP ===================== -->
            <tr>
              <td style="background-image:url('https://cartplus.io/cartplus-img/Frame%202121452816.svg'); padding:50px 30px; background-repeat:no-repeat; background-position:center center; background-size:cover;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="text-align:center;">
                      <p style="margin:0 0 15px; font-family:'Outfit',Arial,sans-serif; font-size:26px; font-weight:700; color:#ffffff;">
                        Need Help?
                      </p>
                      <p style="margin:0 0 30px; font-family:'Outfit',Arial,sans-serif; font-size:18px; color:#ffffff;">
                        Our support team is always here to help you.
                      </p>

                      <!-- Contact Support button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                        style="border:1px solid #FFFFFF; border-radius:26px; background:transparent;">
                        <tr>
                          <td style="padding:5px 28px 5px 5px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:42px; height:42px; text-align:center; vertical-align:middle;">
                                  <img
                                    src="https://cartplus.io/cartplus-img/Group%201707479635.svg"
                                    alt="" width="42" height="42"
                                    style="display:inline-block; vertical-align:middle; border:0;"
                                  />
                                </td>
                                <td style="padding-left:16px; vertical-align:middle;">
                                  <a href="mailto:Support@cartplus.io"
                                    style="font-family:'Outfit',Arial,sans-serif; font-size:17px; font-weight:500; color:#ffffff; text-decoration:none;">
                                    Contact Support
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
            <tr>
              <td bgcolor="#f7f7f7" style="background-color:#F8EEFF; border-top:1px solid #eeeeee; padding:30px; text-align:center;">

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; color:#1a1a1a;">
                  Follow us
                </p>

                <!-- Social icons -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; ">
                        <img src="https://cartplus.io/cartplus-img/Frame%206113.png" alt="Facebook" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%206115.png" alt="Instagram" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block;">
                        <img src="https://cartplus.io/cartplus-img/Frame%202121452813.png" alt="LinkedIn" width="34" height="34" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; color:#888888;">
                  <a href="mailto:Support@cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">Support@cartplus.io</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.cartplus.io" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">www.cartplus.io</a>
                </p>

                <hr style="border:none; border-top:1px solid #dddddd; margin:20px 0;" />

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border-bottom:1px solid #dddddd; padding-bottom:20px; margin-bottom:20px;">
                  <tr>
                    <td align="left" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      &copy; 2026 Cart Plus. All rights reserved.
                    </td>
                    <td align="right" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Preference</a>
                      &nbsp;|&nbsp;
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Unsubscription</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c; line-height:20px;">
                  Thank you for choosing Cart Plus! &#128156;<br />
                  The Cart Plus Team
                </p>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};