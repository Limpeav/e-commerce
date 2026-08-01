import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import {
  getAdminFrontendUrl,
  getCustomerFrontendUrl,
} from "./frontendUrls.js";

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

export const sendStorePromotionEmail = async ({
  email,
  customerName,
  discountRange,
  promotionCount = 0,
  dealsUrl,
}) => {
  const fromName = FROM_NAME;
  const frontendUrl = getCustomerFrontendUrl();
  const storeDealsUrl = dealsUrl || `${frontendUrl}/deals`;
  const safeCustomerName = escapeHtml(customerName || "there");
  const safeDealsUrl = escapeHtml(storeDealsUrl);
  const safePromotionCount = Number(promotionCount || 0);
  const minDiscount = Number(discountRange?.min || 0);
  const maxDiscount = Number(discountRange?.max || 0);
  const discountText =
    minDiscount > 0 && maxDiscount > 0
      ? minDiscount === maxDiscount
        ? `${maxDiscount}%`
        : `${minDiscount}%-${maxDiscount}%`
      : "Special";
  const subject = "New store promotions are available";

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
        <body style="margin:0;padding:0;background:#b7dff1;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f3340;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#b7dff1;padding:28px 14px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 18px 46px rgba(23,74,95,0.18);">
                  <tr>
                    <td style="padding:26px 34px 18px;background:#ffffff;text-align:center;">
                      <p style="margin:0;font-size:34px;line-height:1;font-weight:900;letter-spacing:-1px;color:#3f7183;">cherish<span style="color:#f7a13b;">baby</span></p>
                      <table cellpadding="0" cellspacing="0" align="center" style="margin:24px auto 0;">
                        <tr>
                          <td style="padding:0 13px;font-size:11px;font-weight:800;color:#4b7d90;">New!</td>
                          <td style="padding:0 13px;font-size:11px;font-weight:800;color:#4b7d90;">Essentials</td>
                          <td style="padding:0 13px;font-size:11px;font-weight:800;color:#4b7d90;">Best Sellers</td>
                          <td style="padding:0 13px;font-size:11px;font-weight:800;color:#4b7d90;">Sale</td>
                          <td style="padding:0 13px;font-size:11px;font-weight:800;color:#4b7d90;">Baby Deals</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:48px 44px 44px;background:#e6f6fc;text-align:center;">
                      <span style="display:inline-block;margin:0 0 22px;border-radius:999px;background:#f79a35;color:#ffffff;padding:10px 18px;font-size:12px;font-weight:900;letter-spacing:1.3px;text-transform:uppercase;box-shadow:0 10px 24px rgba(247,154,53,0.24);">🔥 TODAY'S DEALS</span>
                      <h1 style="margin:0;font-size:40px;line-height:1.05;font-weight:900;letter-spacing:-0.8px;color:#263945;">Fresh deals are waiting for you.</h1>
                      <p style="margin:20px 0 0;font-size:46px;line-height:1;font-weight:900;letter-spacing:-1px;color:#f79a35;">${escapeHtml(discountText)} OFF</p>
                      <p style="margin:8px 0 0;font-size:17px;font-weight:900;color:#4b7d90;">Selected Items</p>
                      <p style="margin:18px auto 0;max-width:460px;font-size:15px;line-height:1.7;color:#5b6b74;">Hi ${safeCustomerName}, our store has <strong style="color:#263945;">${safePromotionCount} promoted ${safePromotionCount === 1 ? "product" : "products"}</strong> available now.</p>
                      <p style="margin:18px auto 0;max-width:470px;font-size:15px;line-height:1.7;color:#5b6b74;">Open the deals page to see every product currently on promotion and choose what fits your family best.</p>
                      <table cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 0;">
                        <tr>
                          <td align="center" style="background:#f79a35;border-radius:9px;box-shadow:0 10px 22px rgba(247,154,53,0.24);">
                            <a href="${safeDealsUrl}" style="display:inline-block;padding:15px 34px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;">View all deals →</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#4f8397;padding:30px 36px;text-align:center;">
                      <p style="margin:0;font-size:13px;line-height:1.8;color:#dcecf2;">Thank you for shopping with Cherish Baby Store.</p>
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

Fresh deals are waiting for you.

Our store has ${safePromotionCount} promoted ${safePromotionCount === 1 ? "product" : "products"} available now.
Deal range: ${discountText} OFF

View all deals here:
${storeDealsUrl}

You are receiving this because promotional emails are enabled in your account settings.

${fromName}
      `,
    },
    "store promotion"
  );

  console.log("Store promotional email sent successfully.");
  console.log("   Message ID:", data?.id);
  console.log("   To:", email);
  return data;
};

const getTicketDisplayNumber = (ticket = {}) =>
  escapeHtml(ticket.ticketNumber || ticket._id?.toString?.() || "Support ticket");

const formatSupportEmailDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildSupportTicketEmail = ({
  title,
  intro,
  details = [],
  ctaLabel,
  ctaUrl,
  secondaryText = "",
}) => {
  const detailRows = details
    .filter((item) => item?.label && item.value !== undefined && item.value !== null)
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;font-size:13px;color:#71717a;width:148px;">${escapeHtml(item.label)}</td>
          <td style="padding:10px 0;font-size:14px;font-weight:800;color:#18181b;">${escapeHtml(item.value)}</td>
        </tr>
      `
    )
    .join("");
  const safeCtaUrl = escapeHtml(ctaUrl || getCustomerFrontendUrl());
  const button = ctaLabel
    ? `
      <table cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 16px;">
        <tr>
          <td align="center" style="background:#8DAA91;border-radius:999px;">
            <a href="${safeCtaUrl}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;">${escapeHtml(ctaLabel)}</a>
          </td>
        </tr>
      </table>
    `
    : "";
  const secondary = secondaryText
    ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.7;color:#71717a;">${escapeHtml(secondaryText)}</p>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="padding:28px 32px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8DAA91;">Cherish Baby Store Support</p>
                  <h1 style="margin:0;font-size:24px;line-height:1.25;color:#18181b;">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;">
                  <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3f3f46;">${escapeHtml(intro)}</p>
                  ${
                    detailRows
                      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">${detailRows}</table>`
                      : ""
                  }
                  ${button}
                  ${secondary}
                  <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#71717a;">Regards,<br>${escapeHtml(FROM_NAME)} Support</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const buildSupportEmailPayload = ({
  to,
  subject,
  title,
  intro,
  details,
  ctaLabel,
  ctaUrl,
  secondaryText,
  text,
  replyTo,
}) => {
  const payload = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: buildSupportTicketEmail({
      title,
      intro,
      details,
      ctaLabel,
      ctaUrl,
      secondaryText,
    }),
    text,
  };

  if (replyTo && !IS_RESEND_TEST_SENDER) {
    payload.replyTo = replyTo;
  }

  return payload;
};

const getTicketDetails = (ticket = {}) => [
  { label: "Ticket ID", value: ticket.ticketNumber || ticket._id?.toString?.() || "" },
  { label: "Subject", value: ticket.subject || "" },
  { label: "Topic", value: ticket.inquiryTopic || ticket.topic || "" },
  { label: "Status", value: ticket.status || "" },
];

export const sendSupportTicketReceivedEmail = async ({ ticket, ticketUrl }) => {
  const ticketNumber = getTicketDisplayNumber(ticket);
  const subject = `We received your support request ${ticket.ticketNumber}`;
  const intro =
    "Thank you. Your support request has been received. Our support team will respond within one business day.";

  return sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject,
      title: "Support request received",
      intro,
      details: getTicketDetails(ticket),
      ctaLabel: "View support ticket",
      ctaUrl: ticketUrl,
      secondaryText: `Ticket ID: ${ticketNumber}`,
      text: `
Thank you. Your support request has been received.

Ticket ID: ${ticket.ticketNumber}

Our support team will respond within one business day.

View ticket:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    "support ticket received"
  );
};

export const sendSupportTeamNewTicketEmail = async ({ ticket, adminUrl }) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: SUPPORT_EMAIL,
      subject: `New support ticket ${ticket.ticketNumber}: ${ticket.subject}`,
      title: "New support ticket",
      intro: `${ticket.fullName || ticket.name} submitted a support request.`,
      details: [
        ...getTicketDetails(ticket),
        { label: "Customer", value: ticket.fullName || ticket.name || "" },
        { label: "Email", value: ticket.email || "" },
        { label: "Order", value: ticket.orderNumber || "Not provided" },
      ],
      ctaLabel: "Open admin ticket",
      ctaUrl: adminUrl || `${getAdminFrontendUrl()}/admin/support/tickets/${ticket.ticketNumber}`,
      text: `
New support ticket

Ticket ID: ${ticket.ticketNumber}
Subject: ${ticket.subject}
Topic: ${ticket.inquiryTopic || ticket.topic}
Customer: ${ticket.fullName || ticket.name}
Email: ${ticket.email}
Order: ${ticket.orderNumber || "Not provided"}

Open admin ticket:
${adminUrl || `${getAdminFrontendUrl()}/admin/support/tickets/${ticket.ticketNumber}`}
      `,
      replyTo: ticket.email,
    }),
    "support team new ticket"
  );

export const sendSupportReplyEmail = async ({ ticket, ticketUrl }) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `New reply for support ticket ${ticket.ticketNumber}`,
      title: "Your support ticket has a new reply",
      intro: `Hello ${ticket.fullName || ticket.name || "there"}, our support team replied to your ticket.`,
      details: getTicketDetails(ticket),
      ctaLabel: "View and reply",
      ctaUrl: ticketUrl,
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

Our support team replied to ticket ${ticket.ticketNumber}.

Subject: ${ticket.subject}

View and reply:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    "support reply"
  );

export const sendSupportWaitingForCustomerEmail = async ({ ticket, ticketUrl }) => {
  const autoCloseText = formatSupportEmailDate(ticket.autoCloseAt);

  return sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `Action required for support ticket ${ticket.ticketNumber}`,
      title: "Action required",
      intro:
        "Our support team needs additional information before we can continue with your request.",
      details: [
        ...getTicketDetails(ticket),
        { label: "Auto-close date", value: autoCloseText || "Seven days from now" },
      ],
      ctaLabel: "Reply to ticket",
      ctaUrl: ticketUrl,
      secondaryText:
        "If we do not receive a response, we will send a reminder after three days and automatically close the ticket after seven days.",
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

Our support team needs additional information before we can continue with your request.

Ticket: ${ticket.ticketNumber}
Subject: ${ticket.subject}

Please reply through your account or use the secure ticket link:
${ticketUrl}

If we do not receive a response, we will send a reminder after three days and automatically close the ticket after seven days without a response.

Regards,
${FROM_NAME} Support
      `,
    }),
    "support waiting for customer"
  );
};

export const sendSupportWaitingReminderEmail = async ({ ticket, ticketUrl }) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `Reminder: We are waiting for your response - ${ticket.ticketNumber}`,
      title: "We are waiting for your response",
      intro: `Hello ${ticket.fullName || ticket.name || "there"}, we are still waiting for the information requested for ticket ${ticket.ticketNumber}.`,
      details: getTicketDetails(ticket),
      ctaLabel: "Reply to ticket",
      ctaUrl: ticketUrl,
      secondaryText:
        "Please reply within the next four days. If we do not receive a response, the ticket will be automatically closed.",
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

We are still waiting for the information requested for ticket ${ticket.ticketNumber}.

Please reply within the next four days. If we do not receive a response, the ticket will be automatically closed.

Reply here:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    "support waiting reminder"
  );

export const sendSupportAutoClosedEmail = async ({
  ticket,
  ticketUrl,
  manual = false,
}) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `Support ticket ${ticket.ticketNumber} has been closed`,
      title: manual ? "Support ticket closed" : "Support ticket automatically closed",
      intro: manual
        ? `Ticket ${ticket.ticketNumber} has been closed by our support team.`
        : `Ticket ${ticket.ticketNumber} was automatically closed because we did not receive a response within seven days.`,
      details: [
        ...getTicketDetails(ticket),
        { label: "Closed reason", value: ticket.closedReason || "Closed" },
      ],
      ctaLabel: "View ticket",
      ctaUrl: ticketUrl,
      secondaryText:
        "You may reopen the ticket within 30 days if you still need assistance. After 30 days, please create a new support request.",
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

Ticket ${ticket.ticketNumber} ${
        manual
          ? "has been closed by our support team."
          : "was automatically closed because we did not receive a response within seven days."
      }

You may reopen the ticket within 30 days if you still need assistance. After 30 days, please create a new support request.

View ticket:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    manual ? "support ticket closed" : "support ticket auto closed"
  );

export const sendSupportTicketReopenedEmail = async ({ ticket, ticketUrl }) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `Support ticket ${ticket.ticketNumber} has been reopened`,
      title: "Support ticket reopened",
      intro: `Ticket ${ticket.ticketNumber} has been reopened and our support team has been notified.`,
      details: getTicketDetails(ticket),
      ctaLabel: "View ticket",
      ctaUrl: ticketUrl,
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

Ticket ${ticket.ticketNumber} has been reopened and our support team has been notified.

View ticket:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    "support ticket reopened"
  );

export const sendSupportResolvedEmail = async ({ ticket, ticketUrl }) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: ticket.email,
      subject: `Support ticket ${ticket.ticketNumber} has been resolved`,
      title: "Support ticket resolved",
      intro: `Ticket ${ticket.ticketNumber} has been marked resolved. You can still reply if you need follow-up help.`,
      details: getTicketDetails(ticket),
      ctaLabel: "View ticket",
      ctaUrl: ticketUrl,
      text: `
Hello ${ticket.fullName || ticket.name || "there"},

Ticket ${ticket.ticketNumber} has been marked resolved. You can still reply if you need follow-up help.

View ticket:
${ticketUrl}

Regards,
${FROM_NAME} Support
      `,
    }),
    "support ticket resolved"
  );

export const sendSupportCustomerReplyNotificationEmail = async ({
  ticket,
  adminUrl,
  subjectPrefix = "Customer replied to support ticket",
}) =>
  sendConfiguredEmail(
    buildSupportEmailPayload({
      to: SUPPORT_EMAIL,
      subject: `${subjectPrefix} ${ticket.ticketNumber}`,
      title: subjectPrefix,
      intro: `${ticket.fullName || ticket.name} replied to support ticket ${ticket.ticketNumber}.`,
      details: [
        ...getTicketDetails(ticket),
        { label: "Customer", value: ticket.fullName || ticket.name || "" },
        { label: "Email", value: ticket.email || "" },
      ],
      ctaLabel: "Open admin ticket",
      ctaUrl: adminUrl || `${getAdminFrontendUrl()}/admin/support/tickets/${ticket.ticketNumber}`,
      text: `
${subjectPrefix}

Ticket ID: ${ticket.ticketNumber}
Customer: ${ticket.fullName || ticket.name}
Email: ${ticket.email}
Subject: ${ticket.subject}

Open admin ticket:
${adminUrl || `${getAdminFrontendUrl()}/admin/support/tickets/${ticket.ticketNumber}`}
      `,
      replyTo: ticket.email,
    }),
    "support customer reply notification"
  );

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
// Send Delete Account OTP
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

export const sendPortalLoginCode = async (email, userName, code) => {
  const safeName = escapeHtml(userName || "there");
  const safeCode = escapeHtml(code);

  return sendConfiguredEmail(
    {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: `${code} is your portal security code`,
      html: `
        <!doctype html>
        <html lang="en">
          <body style="margin:0;padding:32px;background:#f6f7fb;font-family:Arial,sans-serif;color:#111827;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;">Portal sign-in verification</h1>
              <p style="line-height:1.6;color:#4b5563;">Hello ${safeName}, enter this one-time code to finish signing in:</p>
              <div style="margin:28px 0;padding:18px;text-align:center;background:#f3f4f6;border-radius:14px;font-size:32px;font-weight:800;letter-spacing:8px;">${safeCode}</div>
              <p style="line-height:1.6;color:#6b7280;">This code expires in 5 minutes. If you did not attempt to sign in, change your password and contact the site owner.</p>
            </div>
          </body>
        </html>
      `,
      text: `Hello ${userName || "there"},\n\nYour portal security code is ${code}.\nIt expires in 5 minutes.\n\nIf you did not attempt to sign in, change your password and contact the site owner.`,
    },
    "portal login security code"
  );
};
