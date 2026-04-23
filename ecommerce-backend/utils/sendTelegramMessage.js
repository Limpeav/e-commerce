import axios from "axios";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const getTelegramConfig = () => {
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
      await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        chat_id: chatId,
        photo: imageUrl,
        caption,
        parse_mode: "HTML",
      });

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

  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: caption,
    parse_mode: "HTML",
  });

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

export const sendLowStockTelegramAlert = async ({
  title,
  stock,
  category,
  productId,
  imageUrl,
}) => {
  const { botToken, chatId, enabled } = getTelegramConfig();

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
