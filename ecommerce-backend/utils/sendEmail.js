import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Resend } from "resend";

dotenv.config({ path: new URL("../.env", import.meta.url) });

// Initialize Resend client with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev"; // Use your verified domain here
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Baby Product Website";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_TO || FROM_EMAIL;
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
const IS_RESEND_TEST_SENDER = FROM_EMAIL.toLowerCase() === "onboarding@resend.dev";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_LOCAL_EMAIL_CAPTURE =
  !IS_PRODUCTION &&
  EMAIL_PROVIDER !== "smtp" &&
  (process.env.USE_LOCAL_EMAIL_CAPTURE === "true" || IS_RESEND_TEST_SENDER);
const LOCAL_SMTP_HOST = process.env.LOCAL_SMTP_HOST || "localhost";
const LOCAL_SMTP_PORT = Number(process.env.LOCAL_SMTP_PORT || 1025);
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE !== "false";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeUrl = (url = "") => String(url || "").trim().replace(/\/+$/, "");

const getCustomerFrontendUrl = () => {
  const frontendUrls = String(process.env.FRONTEND_URL || "http://localhost:5173")
    .split(/[,\s]+/)
    .map(normalizeUrl)
    .filter((url) => /^https?:\/\//i.test(url));

  return (
    frontendUrls.find((url) => url.includes("cherishbabykhstore.store")) ||
    frontendUrls[0] ||
    "http://localhost:5173"
  );
};

const sendLocalCapturedEmail = async (emailPayload) => {
  const transporter = nodemailer.createTransport({
    host: LOCAL_SMTP_HOST,
    port: LOCAL_SMTP_PORT,
    secure: false,
    ignoreTLS: true,
  });

  try {
    const info = await transporter.sendMail({
      ...emailPayload,
      to: Array.isArray(emailPayload.to) ? emailPayload.to.join(", ") : emailPayload.to,
    });

    console.log("Local email captured successfully.");
    console.log("   Message ID:", info.messageId);
    console.log("   SMTP:", `${LOCAL_SMTP_HOST}:${LOCAL_SMTP_PORT}`);
    console.log("   Inbox:", process.env.LOCAL_EMAIL_INBOX_URL || "http://localhost:8025");
    return {
      id: info.messageId,
      local: true,
    };
  } catch (error) {
    console.error("Local email capture failed:", error.message);
    console.error("Start Mailpit, then try again:");
    console.error("   brew install mailpit");
    console.error("   mailpit");
    console.error("Open inbox:");
    console.error("   http://localhost:8025");
    throw error;
  }
};

const sendSmtpEmail = async (emailPayload) => {
  if (
    !SMTP_USER ||
    !SMTP_PASS ||
    SMTP_USER === "yourgmail@gmail.com" ||
    SMTP_PASS === "your_gmail_app_password"
  ) {
    throw new Error(
      "Set SMTP_USER to your Gmail address and SMTP_PASS to a Gmail app password when EMAIL_PROVIDER=smtp"
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    ...emailPayload,
    from: emailPayload.from || `${FROM_NAME} <${FROM_EMAIL || SMTP_USER}>`,
    to: Array.isArray(emailPayload.to) ? emailPayload.to.join(", ") : emailPayload.to,
  });

  console.log("SMTP email sent successfully.");
  console.log("   Message ID:", info.messageId);
  console.log("   Host:", SMTP_HOST);
  return {
    id: info.messageId,
    smtp: true,
  };
};

const sendConfiguredEmail = async (emailPayload, label = "email") => {
  if (USE_LOCAL_EMAIL_CAPTURE) {
    return await sendLocalCapturedEmail(emailPayload);
  }

  if (EMAIL_PROVIDER === "smtp") {
    return await sendSmtpEmail(emailPayload);
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Set RESEND_API_KEY when EMAIL_PROVIDER=resend");
  }

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    console.error(`Resend error (${label}):`, error);
    throw new Error(error.message || `Failed to send ${label}`);
  }

  return data;
};

export const sendDeliveryReviewRequestEmail = async ({
  email,
  customerName,
  orderId,
  orderItems = [],
}) => {
  const fromName = FROM_NAME;
  const reviewBaseUrl = getCustomerFrontendUrl();
  const shortOrderId = String(orderId || "").slice(-8).toUpperCase();
  const safeCustomerName = escapeHtml(customerName || "there");
  const uniqueItems = Array.from(
    new Map(
      orderItems
        .filter((item) => item?.product)
        .map((item) => [String(item.product), item])
    ).values()
  );
  const primaryReviewUrl = orderId
    ? `${reviewBaseUrl}/orders/${orderId}/review`
    : `${reviewBaseUrl}/orders`;

  const itemRows = uniqueItems
    .slice(0, 4)
    .map((item) => {
      const productUrl = orderId
        ? `${reviewBaseUrl}/orders/${orderId}/review?product=${item.product}`
        : `${reviewBaseUrl}/products/${item.product}#reviews`;
      const safeName = escapeHtml(item.name || "Purchased product");
      const safeImage = escapeHtml(item.image || "");

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eef2f7;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="64" style="padding-right:14px;">
                  ${safeImage
                    ? `<img src="${safeImage}" alt="${safeName}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:14px;border:1px solid #e5e7eb;">`
                    : `<div style="width:56px;height:56px;border-radius:14px;background:#f1f5f9;border:1px solid #e5e7eb;"></div>`}
                </td>
                <td style="font-size:14px;line-height:1.45;color:#111827;font-weight:800;">${safeName}</td>
                <td align="right" style="padding-left:12px;">
                  <a href="${productUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;padding:10px 14px;border-radius:999px;">Rate</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  try {
    const emailPayload = {
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [email],
      subject: `How was your order #${shortOrderId}?`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rate Your Order</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 14px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.10);">
                  <tr>
                    <td style="padding:34px 32px 28px;background:#fdf7f1;border-bottom:1px solid #f1e7dc;">
                      <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;color:#9a6b43;">Delivered</p>
                      <h1 style="margin:0;font-size:30px;line-height:1.15;letter-spacing:-0.8px;color:#111827;">Your order has arrived.</h1>
                      <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#5b6472;">Hi ${safeCustomerName}, thank you for shopping with ${escapeHtml(fromName)}. Your feedback helps other customers choose with confidence.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:22px;padding:0 18px;margin-bottom:24px;">
                        <tr>
                          <td style="padding:18px 0;font-size:13px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Order</td>
                          <td align="right" style="padding:18px 0;font-size:15px;color:#111827;font-weight:900;">#${escapeHtml(shortOrderId)}</td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        ${itemRows || `
                          <tr>
                            <td style="padding:18px 0;font-size:15px;line-height:1.6;color:#4b5563;">Your items are ready for a review.</td>
                          </tr>
                        `}
                      </table>

                      <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px;">
                        <tr>
                          <td align="center" style="background:#8DAA91;border-radius:999px;">
                            <a href="${primaryReviewUrl}" style="display:inline-block;padding:15px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;">Rate your products</a>
                          </td>
                        </tr>
                      </table>

                      <div style="text-align:center;font-size:22px;letter-spacing:5px;color:#f59e0b;margin-bottom:12px;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                      <p style="margin:0;text-align:center;font-size:13px;line-height:1.6;color:#64748b;">It only takes a minute. You can rate each product from its product page.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#fafafa;padding:22px 32px;text-align:center;border-top:1px solid #f1f5f9;">
                      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">If the button does not work, open this link:<br><a href="${primaryReviewUrl}" style="color:#64748b;">${primaryReviewUrl}</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${customerName || "there"},

Your order #${shortOrderId} has been delivered.

Please rate your product here:
${primaryReviewUrl}

Thank you,
${fromName}
      `,
    };

    const data = await sendConfiguredEmail(emailPayload, "delivery review request");

    console.log("Delivery review request email sent successfully.");
    console.log("   Message ID:", data?.id);
    console.log("   To:", email);
    return data;
  } catch (err) {
    console.error("Failed to send delivery review request email:", err);
    throw new Error(err.message || "Failed to send review request email");
  }
};

export const sendProductPromotionEmail = async ({
  email,
  customerName,
  product,
  reasons = [],
}) => {
  const fromName = FROM_NAME;
  const frontendUrl = getCustomerFrontendUrl();
  const productId = product?._id?.toString?.() || product?.id || "";
  const productUrl = productId ? `${frontendUrl}/products/${productId}` : `${frontendUrl}/products`;
  const safeCustomerName = escapeHtml(customerName || "there");
  const safeTitle = escapeHtml(product?.title || "New product");
  const safeDescription = escapeHtml(product?.description || "A new product is ready for you to discover.");
  const safeImage = escapeHtml(product?.image || "");
  const price = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  const hasPromotion = discountPrice > 0 && discountPrice < price;
  const reasonLabels = reasons.length > 0
    ? reasons
    : [
        ...(product?.isNewArrival ? ["New arrival"] : []),
        ...(hasPromotion ? ["Promotion"] : []),
      ];
  const badgeText = escapeHtml(reasonLabels.join(" + ") || "Store update");
  const subject = hasPromotion
    ? `${product?.title || "A product"} is on promotion`
    : `New arrival: ${product?.title || "fresh picks"}`;

  const priceHtml = hasPromotion
    ? `<p style="margin:10px 0 0;font-size:15px;color:#6b7280;"><span style="text-decoration:line-through;">$${price.toFixed(2)}</span> <strong style="font-size:22px;color:#5F7A63;">$${discountPrice.toFixed(2)}</strong></p>`
    : `<p style="margin:10px 0 0;font-size:22px;font-weight:900;color:#5F7A63;">$${price.toFixed(2)}</p>`;

  const data = await sendConfiguredEmail(
    {
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [email],
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(subject)}</title>
        </head>
        <body style="margin:0;padding:0;background:#f7f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D312E;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f1;padding:32px 14px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #EAE3DB;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px rgba(95,122,99,0.14);">
                  <tr>
                    <td style="padding:34px 32px;background:linear-gradient(135deg,#F7F2EA,#EFF6F0);">
                      <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;color:#7A967E;">${badgeText}</p>
                      <h1 style="margin:0;font-size:30px;line-height:1.15;letter-spacing:-0.8px;color:#2D312E;">Something new for your little one.</h1>
                      <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#727871;">Hi ${safeCustomerName}, ${safeTitle} is now available${hasPromotion ? " with a special price" : ""}.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px 32px;">
                      ${safeImage
                        ? `<img src="${safeImage}" alt="${safeTitle}" style="display:block;width:100%;max-height:320px;object-fit:cover;border-radius:22px;border:1px solid #EAE3DB;margin-bottom:24px;">`
                        : ""}
                      <h2 style="margin:0;font-size:24px;line-height:1.25;color:#2D312E;">${safeTitle}</h2>
                      ${priceHtml}
                      <p style="margin:16px 0 26px;font-size:14px;line-height:1.7;color:#727871;">${safeDescription}</p>
                      <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                        <tr>
                          <td align="center" style="background:#7A967E;border-radius:999px;">
                            <a href="${productUrl}" style="display:inline-block;padding:15px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;">View product</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#FCF9F5;padding:22px 32px;text-align:center;border-top:1px solid #EAE3DB;">
                      <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">You are receiving this because promotional emails are enabled in your account settings.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${customerName || "there"},

${product?.title || "A product"} is ${reasonLabels.join(" + ") || "available now"}.
${hasPromotion ? `Promotion price: $${discountPrice.toFixed(2)} (was $${price.toFixed(2)})` : `Price: $${price.toFixed(2)}`}

View it here:
${productUrl}

You are receiving this because promotional emails are enabled in your account settings.

${fromName}
      `,
    },
    "product promotion"
  );

  console.log("Product promotional email sent successfully.");
  console.log("   Message ID:", data?.id);
  console.log("   To:", email);
  return data;
};

export const sendSupportContactEmail = async ({
  name,
  email,
  phone = "",
  topic = "General",
  message,
  ticketId,
}) => {
  const fromName = FROM_NAME;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeTicketId = escapeHtml(ticketId || "");

  try {
    const emailPayload = {
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [SUPPORT_EMAIL],
      subject: `New support request: ${topic}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Support Request</title>
        </head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden;">
                  <tr>
                    <td style="padding:28px 32px;border-bottom:1px solid #f4f4f5;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8DAA91;">Support Request</p>
                      <h1 style="margin:0;font-size:24px;line-height:1.25;color:#18181b;">${safeTopic}</h1>
                      ${safeTicketId ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a;">Ticket ID: ${safeTicketId}</p>` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="padding:10px 0;font-size:13px;color:#71717a;width:120px;">Name</td>
                          <td style="padding:10px 0;font-size:14px;font-weight:700;color:#18181b;">${safeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;font-size:13px;color:#71717a;">Email</td>
                          <td style="padding:10px 0;font-size:14px;font-weight:700;color:#18181b;">${safeEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;font-size:13px;color:#71717a;">Phone</td>
                          <td style="padding:10px 0;font-size:14px;font-weight:700;color:#18181b;">${safePhone}</td>
                        </tr>
                      </table>
                      <div style="background:#f8fafc;border:1px solid #e4e4e7;border-radius:16px;padding:20px;">
                        <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#71717a;">Message</p>
                        <p style="margin:0;font-size:15px;line-height:1.7;color:#27272a;">${safeMessage}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
New support request

Ticket ID: ${ticketId || "N/A"}
Topic: ${topic}
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}
      `,
    };

    if (!IS_RESEND_TEST_SENDER) {
      emailPayload.replyTo = email;
    }

    const data = await sendConfiguredEmail(emailPayload, "support contact");

    console.log("✅ Support contact email sent successfully!");
    console.log("   Message ID:", data?.id);
    console.log("   To:", SUPPORT_EMAIL);
    return data;
  } catch (err) {
    console.error("❌ Failed to send support contact email:", err);
    throw new Error(err.message || "Failed to send support email");
  }
};

// ─────────────────────────────────────────────────
// Send Account Verification Code Email
// ─────────────────────────────────────────────────
export const sendAccountVerificationCode = async (email, userName, verificationCode) => {
  const fromName = FROM_NAME;

  try {
    const data = await sendConfiguredEmail({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [email],
      subject: `${verificationCode} is your account verification code`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #18181b; }
            .container { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04); border: 1px solid #e4e4e7; }
            .header { background-color: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f4f4f5; }
            .logo-text { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
            .content { padding: 40px 32px; text-align: center; }
            .h1 { font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 16px; letter-spacing: -0.5px; }
            .p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 32px; }
            .code-box { background-color: #eef2ff; border: 2px dashed #c7d2fe; border-radius: 16px; padding: 24px; margin: 0 0 32px; display: inline-block; min-width: 200px; }
            .code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; line-height: 1; display: block; }
            .code-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 12px; display: block; letter-spacing: 1px; }
            .expiry { font-size: 13px; color: #71717a; background-color: #fafafa; padding: 12px; border-radius: 8px; display: inline-block; }
            .footer { background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f4f4f5; }
            .footer-text { font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p class="logo-text">${fromName}</p>
            </div>
            <div class="content">
              <h1 class="h1">Verify your email</h1>
              <p class="p">Hello ${userName || "there"},<br>Enter this code to finish creating your account.</p>

              <div class="code-box">
                <span class="code-label">Verification Code</span>
                <span class="code">${verificationCode}</span>
              </div>

              <div class="expiry">
                This code expires in <strong>10 minutes</strong>.
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                If you didn't create this account, you can safely ignore this email.<br>
                &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
ACCOUNT VERIFICATION CODE: ${verificationCode}

Hello ${userName || "there"},

Enter this code to finish creating your account.
This code expires in 10 minutes.

If you didn't create this account, please ignore this email.

${fromName}
      `,
    });

    console.log("✅ Account verification email sent successfully!");
    console.log("   Message ID:", data?.id);
    console.log("   To:", email);
    return data;
  } catch (err) {
    console.error("❌ Failed to send account verification email:", err);
    throw new Error(err.message || "Failed to send account verification email");
  }
};

// ─────────────────────────────────────────────────
// Send Password Reset Code Email
// ─────────────────────────────────────────────────
export const sendPasswordResetCode = async (email, userName, resetCode) => {
  const fromName = FROM_NAME;

  try {
    const data = await sendConfiguredEmail({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [email],
      subject: `${resetCode} is your password reset code`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #18181b; }
            .container { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04); border: 1px solid #e4e4e7; }
            .header { background-color: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f4f4f5; }
            .logo-text { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
            .content { padding: 40px 32px; text-align: center; }
            .h1 { font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 16px; letter-spacing: -0.5px; }
            .p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 32px; }
            .code-box { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 24px; margin: 0 0 32px; display: inline-block; min-width: 200px; }
            .code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; line-height: 1; display: block; }
            .code-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 12px; display: block; letter-spacing: 1px; }
            .expiry { font-size: 13px; color: #71717a; background-color: #fafafa; padding: 12px; border-radius: 8px; display: inline-block; }
            .footer { background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f4f4f5; }
            .footer-text { font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p class="logo-text">${fromName}</p>
            </div>
            <div class="content">
              <h1 class="h1">Password Reset Request</h1>
              <p class="p">Hello ${userName || "there"},<br>We received a request to reset your password. Use the code below to verify your identity.</p>
              
              <div class="code-box">
                <span class="code-label">Verification Code</span>
                <span class="code">${resetCode}</span>
              </div>

              <div class="expiry">
                This code expires in <strong>10 minutes</strong>.
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                If you didn't request this code, you can safely ignore this email.<br>
                &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
VERIFICATION CODE: ${resetCode}

Hello ${userName || "there"},

We received a request to reset your password. Use the code above to verify your identity.
This code expires in 10 minutes.

If you didn't request this code, please ignore this email.

${fromName}
      `,
    });

    console.log("✅ Password reset code email sent successfully!");
    console.log("   Message ID:", data?.id);
    console.log("   To:", email);
    return data;
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err);
    throw new Error(err.message || "Failed to send password reset email");
  }
};

// ─────────────────────────────────────────────────
// Send Delete Account OTP (for Google OAuth users)
// ─────────────────────────────────────────────────
export const sendDeleteAccountOtp = async (email, userName, otp) => {
  const fromName = FROM_NAME;

  // Build individual digit boxes for a visual OTP display
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding:0 4px;">
          <div style="
            width:48px; height:60px;
            background:#fff1f2;
            border:2px solid #fecdd3;
            border-radius:12px;
            text-align:center;
            line-height:60px;
            font-size:28px;
            font-weight:800;
            color:#dc2626;
            font-family:'Courier New',monospace;
            display:inline-block;
          ">${d}</div>
        </td>`
    )
    .join("");

  try {
    const data = await sendConfiguredEmail({
      from: `${fromName} <${FROM_EMAIL}>`,
      to: [email],
      subject: `[Action Required] Confirm your account deletion — ${otp}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delete Account Confirmation</title>
        </head>
        <body style="margin:0;padding:0;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #fecdd3;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#dc2626;padding:28px 32px;text-align:center;">
                      <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;text-transform:uppercase;">${fromName}</p>
                      <p style="margin:8px 0 0;font-size:13px;color:#fca5a5;font-weight:500;">Account Security Alert</p>
                    </td>
                  </tr>

                  <!-- Warning Icon row -->
                  <tr>
                    <td style="padding:40px 32px 0;text-align:center;">
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td align="center" valign="middle" style="width:64px;height:64px;background:#fee2e2;border-radius:50%;border:4px solid #fecdd3;">
                            <span style="display:inline-block;font-size:28px;line-height:1;color:#f59e0b;">&#9888;</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="font-size:22px;font-weight:800;color:#18181b;margin:20px 0 8px;letter-spacing:-0.5px;">Delete Account Request</h1>
                      <p style="font-size:14px;line-height:1.7;color:#52525b;margin:0 0 32px;">
                        Hello <strong>${userName || "there"}</strong>,<br>
                        We received a request to permanently delete your account.<br>
                        Enter the code below in the app to confirm.
                      </p>
                    </td>
                  </tr>

                  <!-- OTP Digit Boxes -->
                  <tr>
                    <td style="padding:0 32px 32px;text-align:center;">
                      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin:0 0 16px;">Your Confirmation Code</p>
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>${digitBoxes}</tr>
                      </table>
                      <p style="font-size:13px;color:#9ca3af;margin:20px 0 0;">
                        ⏱ This code expires in <strong style="color:#dc2626;">10 minutes</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Warning box -->
                  <tr>
                    <td style="padding:0 32px 32px;">
                      <div style="background:#fef2f2;border:1.5px solid #fecdd3;border-radius:14px;padding:16px 20px;">
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#dc2626;font-weight:600;">
                          🚨 This action is permanent and irreversible.<br>
                          <span style="font-weight:400;color:#6b7280;">All your orders, reviews, and account data will be permanently deleted.</span>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #f4f4f5;">
                      <p style="font-size:12px;color:#a1a1aa;line-height:1.6;margin:0;">
                        If you did NOT request this, your account is safe — simply ignore this email.<br>
                        &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
DELETE ACCOUNT CONFIRMATION CODE: ${otp}

Hello ${userName || "there"},

We received a request to permanently delete your account.
Enter the 6-digit code above in the app to confirm.

This code expires in 10 minutes.

WARNING: This action is PERMANENT and irreversible.

If you did NOT request this, please ignore this email — your account is safe.

${fromName}
      `,
    });

    console.log("✅ Delete account OTP email sent successfully!");
    console.log("   Message ID:", data?.id);
    console.log("   To:", email);
    return data;
  } catch (err) {
    console.error("❌ Failed to send delete OTP email:", err);
    throw new Error(err.message || "Failed to send confirmation email");
  }
};
