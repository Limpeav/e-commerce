import axios from "axios";
import FormData from "form-data";

const TELEGRAM_REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_SUPPLIER_CONTACT_PHONE = "016568335";

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

  if (type === "delivery") {
    const botToken =
      process.env.TELEGRAM_DELIVERY_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN_3 ||
      process.env.TELEGRAM_BOT_TOKEN_2 ||
      process.env.TELEGRAM_BOT_TOKEN;
    const chatId =
      process.env.TELEGRAM_DELIVERY_CHAT_ID ||
      process.env.TELEGRAM_CHAT_ID_3 ||
      process.env.TELEGRAM_CHAT_ID_2 ||
      process.env.TELEGRAM_CHAT_ID;

    return {
      botToken,
      chatId,
      threadId:
        process.env.TELEGRAM_DELIVERY_THREAD_ID ||
        process.env.TELEGRAM_THREAD_ID_3 ||
        process.env.TELEGRAM_THREAD_ID_2 ||
        process.env.TELEGRAM_THREAD_ID,
      enabled: Boolean(botToken && chatId),
    };
  }

  if (type === "expiry") {
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN_5 || process.env.TELEGRAM_BOT_TOKEN;
    const chatId =
      process.env.TELEGRAM_CHAT_ID_5 || process.env.TELEGRAM_CHAT_ID;

    return {
      botToken,
      chatId,
      threadId:
        process.env.TELEGRAM_THREAD_ID_5 || process.env.TELEGRAM_THREAD_ID,
      enabled: Boolean(botToken && chatId),
    };
  }

  if (type === "supplier-po") {
    const botToken =
      process.env.TELEGRAM_SUPPLIER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

    return {
      botToken,
      chatId: "",
      threadId: "",
      enabled: Boolean(botToken),
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

export const isTelegramAlertConfigured = (type = "default") =>
  getTelegramConfig(type).enabled;

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

export const sendTelegramTextToChat = async ({
  chatId,
  text,
  type = "default",
  threadId,
  replyMarkup,
}) => {
  const config = getTelegramConfig(type);
  const botToken = config.botToken;
  const resolvedThreadId = threadId || config.threadId;

  if (!botToken) {
    return { sent: false, reason: "missing-config" };
  }

  if (!chatId) {
    return { sent: false, reason: "missing-chat-id" };
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      buildTelegramPayload({
        chatId,
        threadId: resolvedThreadId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
      {
        timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
      }
    );

    return {
      sent: true,
      type: "message",
      messageId: response.data?.result?.message_id,
    };
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

export const answerTelegramCallbackQuery = async ({
  callbackQueryId,
  text,
  type = "default",
  showAlert = false,
}) => {
  const { botToken } = getTelegramConfig(type);

  if (!botToken) {
    return { sent: false, reason: "missing-config" };
  }

  if (!callbackQueryId) {
    return { sent: false, reason: "missing-callback-query-id" };
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        callback_query_id: callbackQueryId,
        ...(text ? { text } : {}),
        show_alert: Boolean(showAlert),
      },
      {
        timeout: TELEGRAM_REQUEST_TIMEOUT_MS,
      }
    );

    return { sent: true };
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

export const buildLowStockMessage = ({
  title,
  stock,
  category,
  productId,
  stockType = "Product stock",
  variant,
}) => {
  const safeTitle = escapeHtml(title);
  const safeCategory = category ? escapeHtml(category) : null;
  const safeProductId = productId ? escapeHtml(productId) : null;
  const safeStockType = escapeHtml(stockType);
  const safeVariant = variant ? escapeHtml(variant) : null;

  const lines = [
    "<b>LOW STOCK ALERT</b>",
    "",
  ];

  if (safeProductId) {
    lines.push(`<b>Product ID</b>: <code>${safeProductId}</code>`);
  }

  lines.push(
    `<b>Type</b>: ${safeStockType}`,
    `<b>Product</b>: ${safeTitle}`
  );

  if (safeCategory) {
    lines.push(`<b>Category</b>: ${safeCategory}`);
  }

  if (safeVariant) {
    lines.push(`<b>Variant</b>: ${safeVariant}`);
  }

  lines.push(`<b>Stock Left</b>: ${stock}`);
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

export const buildDeliveryHandoffTelegramMessage = ({
  orderId,
  customerName,
  customerPhone,
  totalPrice,
  paymentMethod,
  paymentStatus,
  shippingAddress,
  googleMapsLink,
  confirmedBy,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCustomerPhone = customerPhone ? escapeHtml(customerPhone) : "N/A";
  const safePaymentMethod = paymentMethod ? escapeHtml(paymentMethod) : "N/A";
  const safePaymentStatus = paymentStatus ? escapeHtml(paymentStatus) : "N/A";
  const safeAddress = shippingAddress ? escapeHtml(shippingAddress) : "N/A";
  const safeMapsLink = googleMapsLink ? escapeHtml(googleMapsLink) : null;
  const safeConfirmedBy = confirmedBy ? escapeHtml(confirmedBy) : "Seller";

  const lines = [
    "<b>ORDER READY FOR DELIVERY</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Confirmed By</b>: ${safeConfirmedBy}`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Phone</b>: ${safeCustomerPhone}`,
    `<b>Total</b>: $${Number(totalPrice || 0).toFixed(2)}`,
    `<b>Payment</b>: ${safePaymentMethod}`,
    `<b>Payment Status</b>: ${safePaymentStatus}`,
    `<b>Address</b>: ${safeAddress}`,
  ];

  if (safeMapsLink) {
    lines.push(`<b>Map</b>: ${safeMapsLink}`);
  }

  lines.push("", "<i>Please confirm this order in the delivery dashboard.</i>");

  return lines.join("\n");
};

const formatTelegramMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatTelegramDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const getSupplierContactPhone = () =>
  String(
    process.env.TELEGRAM_SUPPLIER_CONTACT_PHONE ||
      process.env.SUPPLIER_CONTACT_PHONE ||
      DEFAULT_SUPPLIER_CONTACT_PHONE
  ).trim();

export const buildSupplierPurchaseOrderReplyMarkup = ({ purchaseOrder } = {}) => {
  const poId = String(purchaseOrder?._id || purchaseOrder?.id || "").trim();
  const contactPhone = getSupplierContactPhone();

  if (!poId) return null;

  return {
    inline_keyboard: [
      [
        { text: "Accept", callback_data: `supplier_po:accept:${poId}` },
        { text: "Cancel", callback_data: `supplier_po:cancel:${poId}` },
      ],
      [
        {
          text: `Contact ${contactPhone}`,
          callback_data: `supplier_po:contact:${poId}`,
        },
      ],
    ],
  };
};

export const buildSupplierPurchaseOrderTelegramMessage = ({
  purchaseOrder,
  supplier,
}) => {
  const poNumber = purchaseOrder?.poNumber || purchaseOrder?._id || "N/A";
  const supplierName = supplier?.name || "Supplier";
  const expectedDate = formatTelegramDate(purchaseOrder?.expectedDeliveryDate);
  const items = Array.isArray(purchaseOrder?.items) ? purchaseOrder.items : [];
  const visibleItems = items.slice(0, 25);

  const lines = [
    "<b>PURCHASE ORDER</b>",
    "",
    `Hello ${escapeHtml(supplierName)},`,
    "Please prepare the following order:",
    "",
    `<b>PO Number</b>: <code>${escapeHtml(poNumber)}</code>`,
    `<b>Total</b>: ${formatTelegramMoney(purchaseOrder?.totalAmount)}`,
  ];

  if (expectedDate) {
    lines.push(`<b>Expected Delivery</b>: ${escapeHtml(expectedDate)}`);
  }

  lines.push("", "<b>Items</b>:");

  visibleItems.forEach((item, index) => {
    const parts = [item.size, item.color].filter(Boolean).join(" / ");
    const sku = item.sku ? ` [${item.sku}]` : "";
    const variant = parts ? ` (${parts})` : "";
    lines.push(
      `${index + 1}. ${escapeHtml(item.title || "Item")}${escapeHtml(sku)}${escapeHtml(variant)}`,
      `   Qty: ${Number(item.orderedQuantity || 0)} x ${formatTelegramMoney(item.unitCost)} = ${formatTelegramMoney(item.totalCost)}`
    );
  });

  if (items.length > visibleItems.length) {
    lines.push(`...and ${items.length - visibleItems.length} more item(s).`);
  }

  const notes = String(purchaseOrder?.notes || "").trim();
  if (notes) {
    lines.push("", `<b>Notes</b>: ${escapeHtml(notes)}`);
  }

  const contactPhone = getSupplierContactPhone();
  lines.push(
    "",
    "<b>Options</b>:",
    "Accept - confirm availability for this order.",
    "Cancel - tell us you cannot fulfill this order.",
    `Contact - call or message ${escapeHtml(contactPhone)}.`,
    "",
    "Please use the buttons below or reply here with your delivery date."
  );

  return lines.join("\n");
};

export const sendSupplierPurchaseOrderTelegramAlert = async ({
  purchaseOrder,
  supplier,
}) => {
  const chatId = supplier?.telegramChatId;

  if (!chatId) {
    return { sent: false, reason: "missing-supplier-chat-id" };
  }

  const text = buildSupplierPurchaseOrderTelegramMessage({
    purchaseOrder,
    supplier,
  });
  const replyMarkup = buildSupplierPurchaseOrderReplyMarkup({ purchaseOrder });

  return sendTelegramTextToChat({
    chatId,
    text,
    type: "supplier-po",
    replyMarkup,
  });
};

export const sendLowStockTelegramAlert = async ({
  title,
  stock,
  category,
  productId,
  stockType,
  variant,
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
    stockType,
    variant,
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

const formatExpiryDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatExpiryTimeLeft = (daysUntilExpiry) => {
  const days = Number(daysUntilExpiry);

  if (!Number.isFinite(days)) {
    return "N/A";
  }

  if (days < 0) {
    const expiredDays = Math.abs(days);
    return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  return `${days} day${days === 1 ? "" : "s"} left`;
};

const formatMoney = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "N/A";
};

export const buildProductExpiryMessage = ({
  title,
  category,
  productId,
  expiryDate,
  daysUntilExpiry,
  stock,
  price,
  discountPrice,
}) => {
  const safeTitle = escapeHtml(title || "Untitled product");
  const safeCategory = category ? escapeHtml(category) : null;
  const safeProductId = productId ? escapeHtml(productId) : null;
  const validDiscountPrice =
    Number(discountPrice) > 0 && Number(discountPrice) < Number(price);
  const actionText =
    Number(daysUntilExpiry) < 0
      ? "Review this item immediately before selling."
      : "Move this item to promotion or discount it before expiry.";

  const lines = [
    "<b>PRODUCT EXPIRY ALERT</b>",
    "",
  ];

  if (safeProductId) {
    lines.push(`<b>Product ID</b>: <code>${safeProductId}</code>`);
  }

  lines.push(`<b>Product</b>: ${safeTitle}`);

  if (safeCategory) {
    lines.push(`<b>Category</b>: ${safeCategory}`);
  }

  lines.push(
    `<b>Stock Available</b>: ${Math.max(0, Number(stock || 0))}`,
    `<b>Expiry Date</b>: ${escapeHtml(formatExpiryDate(expiryDate))}`,
    `<b>Time Left</b>: ${escapeHtml(formatExpiryTimeLeft(daysUntilExpiry))}`,
    `<b>Price</b>: ${escapeHtml(formatMoney(price))}`
  );

  if (validDiscountPrice) {
    lines.push(
      `<b>Current Promotion Price</b>: ${escapeHtml(formatMoney(discountPrice))}`
    );
  }

  lines.push("", `<i>${actionText}</i>`);

  return lines.join("\n");
};

export const sendProductExpiryTelegramAlert = async ({
  title,
  category,
  productId,
  expiryDate,
  daysUntilExpiry,
  stock,
  price,
  discountPrice,
  imageUrl,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("expiry");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const caption = buildProductExpiryMessage({
    title,
    category,
    productId,
    expiryDate,
    daysUntilExpiry,
    stock,
    price,
    discountPrice,
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

export const sendDeliveryHandoffTelegramAlert = async ({
  orderId,
  customerName,
  customerPhone,
  totalPrice,
  paymentMethod,
  paymentStatus,
  shippingAddress,
  googleMapsLink,
  confirmedBy,
}) => {
  const { botToken, chatId, threadId, enabled } = getTelegramConfig("delivery");

  if (!enabled) {
    return { sent: false, reason: "missing-config" };
  }

  const message = buildDeliveryHandoffTelegramMessage({
    orderId,
    customerName,
    customerPhone,
    totalPrice,
    paymentMethod,
    paymentStatus,
    shippingAddress,
    googleMapsLink,
    confirmedBy,
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

export const buildOrderReceiptCaption = ({
  orderId,
  customerName,
  customerPhone,
  paymentMethod,
  paymentStatus,
  totalPrice,
}) => {
  const safeOrderId = orderId ? escapeHtml(orderId) : "N/A";
  const safeCustomerName = customerName ? escapeHtml(customerName) : "Unknown";
  const safeCustomerPhone = customerPhone ? escapeHtml(customerPhone) : "N/A";
  const safePaymentMethod = paymentMethod ? escapeHtml(paymentMethod) : "N/A";
  const safePaymentStatus = paymentStatus ? escapeHtml(paymentStatus) : "N/A";

  const lines = [
    "<b>ORDER RECEIPT</b>",
    "",
    `<b>Order</b>: <code>${safeOrderId}</code>`,
    `<b>Customer</b>: ${safeCustomerName}`,
    `<b>Phone</b>: ${safeCustomerPhone}`,
    `<b>Payment</b>: ${safePaymentMethod}`,
    `<b>Status</b>: ${safePaymentStatus}`,
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
