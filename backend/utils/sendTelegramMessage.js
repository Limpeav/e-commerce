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

  if (type === "payment") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_4;
    const chatId = process.env.TELEGRAM_CHAT_ID_4;

    return {
      botToken,
      chatId,
      threadId: process.env.TELEGRAM_THREAD_ID_4,
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

export const buildPaymentTelegramMessage = ({
  orderId,
  customerName,
  amount,
  currency,
  transactionId,
  paymentTime,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCurrency = currency ? escapeHtml(currency) : "USD";
  const safeTransactionId = transactionId
    ? escapeHtml(transactionId)
    : "N/A";
  const numericAmount = Number(amount || 0);
  const formattedAmount =
    safeCurrency === "KHR"
      ? `${numericAmount.toLocaleString("en-US")} KHR`
      : `$${numericAmount.toFixed(2)} USD`;
  const formattedPaymentTime = paymentTime
    ? new Date(paymentTime).toLocaleString("en-US", {
        timeZone: "Asia/Phnom_Penh",
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "N/A";

  return [
    "<b>KHQR PAYMENT SUCCESSFUL</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Amount</b>: ${formattedAmount}`,
    "<b>Status</b>: Paid",
    `<b>Transaction</b>: <code>${safeTransactionId}</code>`,
    "",
    `<b>Paid At</b>: ${escapeHtml(formattedPaymentTime)}`,
  ].join("\n");
};

export const sendPaymentTelegramAlert = async (paymentDetails) => {
  const { botToken, chatId, threadId, enabled } =
    getTelegramConfig("payment");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const message = buildPaymentTelegramMessage(paymentDetails);
  const sendMessage = (targetThreadId) =>
    axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      buildTelegramPayload({
        chatId,
        threadId: targetThreadId,
        text: message,
        parse_mode: "HTML",
      }),
      {
        timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
      }
    );

  try {
    await sendMessage(threadId);

    return { sent: true, type: "message" };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const description = error.response?.data?.description;
      const threadNotFound =
        Boolean(threadId)
        && status === 400
        && String(description || "")
          .toLowerCase()
          .includes("message thread not found");

      if (threadNotFound) {
        console.warn(
          "Telegram payment topic was not found; retrying in the main chat. "
          + "Update TELEGRAM_THREAD_ID_4 to send alerts to a specific topic."
        );

        try {
          await sendMessage(undefined);
          return {
            sent: true,
            type: "message",
            fallback: "main-chat",
          };
        } catch (fallbackError) {
          if (axios.isAxiosError(fallbackError)) {
            const fallbackStatus = fallbackError.response?.status;
            const fallbackDescription =
              fallbackError.response?.data?.description;

            throw new Error(
              fallbackDescription
                ? `Telegram API ${fallbackStatus}: ${fallbackDescription}`
                : `Telegram API ${fallbackStatus || "error"}`
            );
          }

          throw fallbackError;
        }
      }

      throw new Error(
        description
          ? `Telegram API ${status}: ${description}`
          : `Telegram API ${status || "error"}`
      );
    }

    throw error;
  }
};

const formatReceiptItemLine = (item, index) => {
  const name = escapeHtml(item?.name || "Product");
  const quantity = Number(item?.quantity || 0);
  const price = Number(item?.price || 0);
  const variantText = [item?.size ? `Size ${item.size}` : "", item?.color ? `Color ${item.color}` : ""]
    .filter(Boolean)
    .join(", ");
  const variantSuffix = variantText ? ` (${escapeHtml(variantText)})` : "";

  return `${index + 1}. ${name}${variantSuffix} - Qty ${quantity} x $${price.toFixed(2)}`;
};

export const buildOrderReceiptCaption = ({
  orderId,
  customerName,
  customerPhone,
  paymentMethod,
  paymentStatus,
  orderItems = [],
  totalPrice,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCustomerPhone = customerPhone ? escapeHtml(customerPhone) : "N/A";
  const safePaymentMethod = paymentMethod ? escapeHtml(paymentMethod) : "N/A";
  const safePaymentStatus = paymentStatus ? escapeHtml(paymentStatus) : "N/A";
  const itemLines = orderItems.slice(0, 6).map(formatReceiptItemLine);
  const extraItemCount = Math.max(0, orderItems.length - itemLines.length);

  const lines = [
    "<b>ORDER RECEIPT</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Phone</b>: ${safeCustomerPhone}`,
    `<b>Payment</b>: ${safePaymentMethod}`,
    `<b>Status</b>: ${safePaymentStatus}`,
    "",
    ...(itemLines.length ? itemLines : ["No items listed"]),
    ...(extraItemCount ? [`...and ${extraItemCount} more item${extraItemCount === 1 ? "" : "s"}`] : []),
    "",
    `<b>Total</b>: $${Number(totalPrice || 0).toFixed(2)}`,
  ];

  return lines.join("\n");
};

export const sendOrderReceiptTelegramPhoto = async ({
  imageBuffer,
  fileName,
  mimeType,
  orderId,
  customerName,
  customerPhone,
  paymentMethod,
  paymentStatus,
  orderItems,
  totalPrice,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("receipt");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const caption = buildOrderReceiptCaption({
    orderId,
    customerName,
    customerPhone,
    paymentMethod,
    paymentStatus,
    orderItems,
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
