export const buildPlanUpgradeEmailHtml = ({ storeOwner, shop, plan }) => {
  const safeOwner = String(storeOwner || "there").replace(/</g, "&lt;");
  const safeShop = String(shop || "").replace(/</g, "&lt;");
  const safePlan = String(plan || "Premium").replace(/</g, "&lt;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Congratulations – Custom Cart</title>
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
    background="https://hubsyntax.com/cart-images/cartDashboardImg.svg"
    style="
      padding:50px;
      width:100%; max-width:600px; height:390px;
      background-color:#1a1a1a;
      background-image:url('https://hubsyntax.com/cart-images/cartDashboardImg.svg');
      background-repeat:no-repeat;
      background-position:center center;
      background-size:cover;
      text-align:center;
    "
  >
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:390px;">

      <!-- TOP: Custom Cart logo -->
      <tr>
        <td align="center" valign="top" style="text-align:center; vertical-align:top;">
          <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:35px; font-weight:600; color:#ffffff; line-height:1;">
            Custom <span style="background:#c8f000; color:#1a1a1a; padding:2px 10px; border-radius:4px;">Cart</span>
          </p>
        </td>
      </tr>

      <!-- MIDDLE: Congratulations + subtitle -->
      <tr>
        <td align="center" valign="middle" style="text-align:center; vertical-align:bottom; padding:0 30px 40px;">
          <h1 style="font-family:'Outfit',Arial,sans-serif; font-size:68px; font-weight:600; color:#c8f000; line-height:1.1; letter-spacing:-1px; margin-bottom:25px;">
            Congratulations
          </h1>
          <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:30px; font-weight:200; color:#ffffff; line-height:1.6;">
            Your plan has now been upgraded.
          </p>
        </td>
      </tr>

    </table>
  </td>
</tr>
            <!-- ===================== BODY TEXT ===================== -->
            <tr>
              <td bgcolor="#f7f7f7" style="background-color:#f7f7f7; padding:50px; text-align:center; font-family:'Outfit',Arial,sans-serif; font-size:18px; line-height:28px; font-weight:400; color:#1a1a1a;">
                <p style="margin:0 0 12px;">Hi <strong>${safeOwner}</strong>,</p>
                <p style="margin:0 0 12px;"><strong>${safeShop}</strong></p>
                <p style="margin:0;">
                  <strong>Thank you for upgrading your account</strong><br />
                  Your ${safePlan} plan is now active and you can start using all advanced
                  Checkout Cart features immediately.
                </p>
              </td>
            </tr>

            <!-- ===================== FEATURES STRIP ===================== -->
            <!-- background-image replaced with solid bgcolor fallback -->
            <tr>
              <td style="background-image:url('https://hubsyntax.com/cart-images/featureBg.svg'); padding:50px 30px;
              background-repeat:no-repeat; background-position:center center;  background-size:cover;">

                <!-- Feature icons row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="width:100%; border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:20px 15px;">
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
                    <td width="33%" style="text-align:center; vertical-align:top; border-left:1px solid rgba(255,255,255,0.2);">
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
                    <td width="34%" style="text-align:center; vertical-align:top; border-left:1px solid rgba(255,255,255,0.2);">
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
                        style="border:1px solid rgba(255,255,255,0.2); border-radius:26px; background:transparent;">
                        <tr>
                          <td style="padding:5px 28px 5px 5px; vertical-align:middle;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:36px; height:36px; text-align:center; vertical-align:middle;">
                                  <img
                                    src="https://hubsyntax.com/cart-images/cartEmailImage.svg"
                                    alt="" width="42" height="42"
                                    style="display:inline-block; vertical-align:middle; border:0;"
                                  />
                                </td>
                                <td style="padding-left:28px; vertical-align:middle;">
                                  <a href="mailto:Info@customcart.com"
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
              <td bgcolor="#f7f7f7" style="background-color:#f7f7f7; border-top:1px solid #eeeeee; padding:30px; text-align:center;">

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; font-size:18px; font-weight:700; color:#1a1a1a;">
                  Follow us
                </p>

                <!-- Social icons -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; width:34px; height:34px; background:#ffffff; border-radius:50%; border:0.68px solid #680bd6; text-align:center; line-height:34px; overflow:hidden; text-decoration:none;">
                        <img src="https://hubsyntax.com/cart-images/cartFacbook.svg" alt="Facebook" width="13" height="13" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; width:34px; height:34px; background:#ffffff; border-radius:50%; border:0.68px solid #680bd6; text-align:center; line-height:34px; overflow:hidden; text-decoration:none;">
                        <img src="https://hubsyntax.com/cart-images/cartInstagram.svg" alt="Instagram" width="13" height="13" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="#" style="display:inline-block; width:34px; height:34px; background:#ffffff; border-radius:50%; border:0.68px solid #680bd6; text-align:center; line-height:34px; overflow:hidden; text-decoration:none;">
                        <img src="https://hubsyntax.com/cart-images/cartLinkdin.svg" alt="LinkedIn" width="13" height="13" style="display:inline-block; vertical-align:middle; border:0;" />
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 20px; font-family:'Outfit',Arial,sans-serif; color:#888888;">
                  <a href="mailto:Info@customcart.com" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">Info@customcart.com</a>
                  &nbsp;|&nbsp;
                  <a href="https://www.customcart.com" style="color:#555555; font-size:18px; font-weight:300; text-decoration:none;">www.customcart.com</a>
                </p>

                <hr style="border:none; border-top:1px solid #dddddd; margin:20px 0;" />

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border-bottom:1px solid #dddddd; padding-bottom:20px; margin-bottom:20px;">
                  <tr>
                    <td align="left" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      &copy; 2026 Custom Cart. All rights reserved.
                    </td>
                    <td align="right" style="font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c;">
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Preference</a>
                      &nbsp;|&nbsp;
                      <a href="#" style="color:#3c3c3c; font-weight:700; font-size:14px; text-decoration:none;">Unsubscription</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-family:'Outfit',Arial,sans-serif; font-size:14px; color:#3c3c3c; line-height:20px;">
                  Thank you for choosing Custom Cart! &#128156;<br />
                  The Custom Cart Team
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