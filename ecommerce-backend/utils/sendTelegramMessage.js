import axios from "axios";
import FormData from "form-data";

const TELEGRAM_REQUEST_TIMEOUT_MS = 15000;

const buildTelegramPayload = ({ chatId, threadId, ...payload }) => ({
  chat_id: chatId,
  ...(threadId ? { message_thread_id: Number(threadId) } : {}),
  ...payload,
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const getTelegramConfig = (type = "default") => {
  if (type === "low-stock") {
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN_1 || process.env.TELEGRAM_BOT_TOKEN;
    const chatId =
      process.env.TELEGRAM_CHAT_ID_1 || process.env.TELEGRAM_CHAT_ID;

    return {
      botToken,
      chatId,
      threadId: process.env.TELEGRAM_THREAD_ID_1,
      enabled: Boolean(botToken && chatId),
    };
  }

  if (type === "order") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_2;
    const chatId = process.env.TELEGRAM_CHAT_ID_2;

    return {
      botToken,
      chatId,
      threadId: process.env.TELEGRAM_THREAD_ID_2,
      enabled: Boolean(botToken && chatId),
    };
  }

  if (type === "receipt") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_3;
    const chatId = process.env.TELEGRAM_CHAT_ID_3;

    return {
      botToken,
      chatId,
      threadId: process.env.TELEGRAM_THREAD_ID_3,
      enabled: Boolean(botToken && chatId),
    };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  return {
    botToken,
    chatId,
    threadId: process.env.TELEGRAM_THREAD_ID,
    enabled: Boolean(botToken && chatId),
  };
};

export const sendTelegramMessage = async (message) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig();

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  try {
    return await sendTelegramPhotoOrMessage({
      botToken,
      chatId,
      threadId,
      caption: message,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const description = error.response?.data?.description;

      throw new Error(
        description
          ? `Telegram API ${status}: ${description}`
          : `Telegram API ${status || "error"}`
      );
    }

    throw error;
  }

  return { sent: true };
};

const sendTelegramPhotoOrMessage = async ({
  botToken,
  chatId,
  threadId,
  caption,
  imageUrl,
}) => {
  if (imageUrl) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        buildTelegramPayload({
          chatId,
          threadId,
          photo: imageUrl,
          caption,
          parse_mode: "HTML",
        }),
        {
          timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
        }
      );

      return { sent: true, type: "photo" };
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const status = error.response?.status;
      const description = error.response?.data?.description;

      if (status !== 400) {
        throw error;
      }

      console.warn(
        description
          ? `Telegram photo send failed, falling back to text: ${description}`
          : "Telegram photo send failed, falling back to text"
      );
    }
  }

  await axios.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    buildTelegramPayload({
      chatId,
      threadId,
      text: caption,
      parse_mode: "HTML",
    }),
    {
      timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
    }
  );

  return { sent: true, type: "message" };
};

export const buildLowStockMessage = ({ title, stock, category, productId }) => {
  const safeTitle = escapeHtml(title);
  const safeCategory = category ? escapeHtml(category) : null;
  const safeProductId = productId ? escapeHtml(productId) : null;

  const lines = [
    "<b>LOW STOCK ALERT</b>",
    "",
    `<b>Product</b>: ${safeTitle}`,
    `<b>Stock Left</b>: ${stock}`,
  ];

  if (safeCategory) {
    lines.push(`<b>Category</b>: ${safeCategory}`);
  }

  if (safeProductId) {
    lines.push(`<b>Product ID</b>: <code>${safeProductId}</code>`);
  }

  lines.push("", "<i>Restock this item soon.</i>");

  return lines.join("\n");
};

export const buildOrderTelegramMessage = ({
  orderId,
  customerName,
  customerPhone,
  totalPrice,
  paymentMethod,
  paymentStatus,
  itemCount,
  shippingAddress,
  googleMapsLink,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCustomerPhone = customerPhone ? escapeHtml(customerPhone) : "N/A";
  const safePaymentMethod = paymentMethod ? escapeHtml(paymentMethod) : "N/A";
  const safePaymentStatus = paymentStatus ? escapeHtml(paymentStatus) : null;
  const safeAddress = shippingAddress ? escapeHtml(shippingAddress) : "N/A";
  const safeMapsLink = googleMapsLink ? escapeHtml(googleMapsLink) : null;

  const lines = [
    "<b>NEW ORDER RECEIVED</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Phone</b>: ${safeCustomerPhone}`,
    `<b>Items</b>: ${itemCount}`,
    `<b>Total</b>: $${Number(totalPrice || 0).toFixed(2)}`,
    `<b>Payment</b>: ${safePaymentMethod}`,
    ...(safePaymentStatus ? [`<b>Payment Status</b>: ${safePaymentStatus}`] : []),
    `<b>Address</b>: ${safeAddress}`,
  ];

  if (safeMapsLink) {
    lines.push(`<b>Map</b>: ${safeMapsLink}`);
  }

  return lines.join("\n");
};

export const sendLowStockTelegramAlert = async ({
  title,
  stock,
  category,
  productId,
  imageUrl,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("low-stock");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const caption = buildLowStockMessage({
    title,
    stock,
    category,
    productId,
  });

  try {
    return await sendTelegramPhotoOrMessage({
      botToken,
      chatId,
      threadId,
      caption,
      imageUrl,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const description = error.response?.data?.description;

      throw new Error(
        description
          ? `Telegram API ${status}: ${description}`
          : `Telegram API ${status || "error"}`
      );
    }

    throw error;
  }
};

export const sendOrderTelegramAlert = async ({
  orderId,
  customerName,
  customerPhone,
  totalPrice,
  paymentMethod,
  paymentStatus,
  itemCount,
  shippingAddress,
  googleMapsLink,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("order");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const message = buildOrderTelegramMessage({
    orderId,
    customerName,
    customerPhone,
    totalPrice,
    paymentMethod,
    paymentStatus,
    itemCount,
    shippingAddress,
    googleMapsLink,
  });

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      buildTelegramPayload({
        chatId,
        threadId,
        text: message,
        parse_mode: "HTML",
      }),
      {
        timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
      }
    );

    return { sent: true, type: "message" };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const description = error.response?.data?.description;

      throw new Error(
        description
          ? `Telegram API ${status}: ${description}`
          : `Telegram API ${status || "error"}`
      );
    }

    throw error;
  }
};

export const buildOrderReceiptCaption = ({ orderId, customerName, totalPrice }) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";

  return [
    "<b>ORDER RECEIPT</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Total</b>: $${Number(totalPrice || 0).toFixed(2)}`,
  ].join("\n");
};

export const sendOrderReceiptTelegramPhoto = async ({
  imageBuffer,
  fileName,
  mimeType,
  orderId,
  customerName,
  totalPrice,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("receipt");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const caption = buildOrderReceiptCaption({
    orderId,
    customerName,
    totalPrice,
  });

  const form = new FormData();
  form.append("chat_id", chatId);
  if (threadId) {
    form.append("message_thread_id", String(threadId));
  }
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("photo", imageBuffer, {
    filename: fileName || "order-receipt.png",
    contentType: mimeType || "image/png",
  });

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      form,
      {
        headers: form.getHeaders(),
        timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
      }
    );

    return { sent: true, type: "photo" };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return {
          sent: true,
          type: "photo",
          confirmation: "timeout",
          reason: "telegram-response-timeout",
        };
      }

      const status = error.response?.status;
      const description = error.response?.data?.description;

      throw new Error(
        description
          ? `Telegram API ${status}: ${description}`
          : `Telegram API ${status || "error"}`
      );
    }

    throw error;
  }
};
