import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, text = "", attachments = []) => {
  if (!to) throw new Error("No recipients defined");
  const recipients = Array.isArray(to) ? to.map(e => e.trim()).filter(Boolean) : to.trim();
  if (!recipients || (Array.isArray(recipients) && recipients.length === 0))
    throw new Error("No valid recipients");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: {
      rejectUnauthorized: false, 
    },
  });

  await transporter.sendMail({
    from: `"HubSyntax" <${process.env.EMAIL_USER}>`,
    to: recipients,
    subject,
    html,
    text,
    attachments,
  });
};