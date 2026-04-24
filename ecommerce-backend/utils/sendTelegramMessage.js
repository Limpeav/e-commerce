import axios from "axios";

const TELEGRAM_REQUEST_TIMEOUT_MS = 5000;

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
      enabled: Boolean(botToken && chatId),
    };
  }

  if (type === "order") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_2;
    const chatId = process.env.TELEGRAM_CHAT_ID_2;

    return {
      botToken,
      chatId,
      enabled: Boolean(botToken && chatId),
    };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  return {
    botToken,
    chatId,
    enabled: Boolean(botToken && chatId),
  };
};

export const sendTelegramMessage = async (message) => {
  const { botToken, chatId, enabled } = getTelegramConfig();

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  try {
    return await sendTelegramPhotoOrMessage({
      botToken,
      chatId,
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
  caption,
  imageUrl,
}) => {
  if (imageUrl) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          chat_id: chatId,
          photo: imageUrl,
          caption,
          parse_mode: "HTML",
        },
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
    {
      chat_id: chatId,
      text: caption,
      parse_mode: "HTML",
    },
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
  itemCount,
  shippingAddress,
  googleMapsLink,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCustomerPhone = customerPhone ? escapeHtml(customerPhone) : "N/A";
  const safePaymentMethod = paymentMethod ? escapeHtml(paymentMethod) : "N/A";
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
  const { botToken, chatId, enabled } = getTelegramConfig("low-stock");

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
  itemCount,
  shippingAddress,
  googleMapsLink,
}) => {
  const { botToken, chatId, enabled } = getTelegramConfig("order");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const message = buildOrderTelegramMessage({
    orderId,
    customerName,
    customerPhone,
    totalPrice,
    paymentMethod,
    itemCount,
    shippingAddress,
    googleMapsLink,
  });

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      },
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
