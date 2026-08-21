import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";
import {
  answerTelegramCallbackQuery,
  buildSupplierPurchaseOrderDecisionReplyMarkup,
  editTelegramMessageReplyMarkup,
  getSupplierContactPhone,
  sendTelegramTextToChat,
} from "../utils/sendTelegramMessage.js";

const getExpectedWebhookSecret = () =>
  process.env.TELEGRAM_SUPPLIER_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || "";

const normalizeBotUsername = (value = "") => String(value || "").trim().replace(/^@/, "");

const isWebhookAuthorized = (req) => {
  const expectedSecret = getExpectedWebhookSecret();
  if (!expectedSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    req.get("X-Telegram-Bot-Api-Secret-Token") === expectedSecret ||
    req.params.secret === expectedSecret ||
    req.query.secret === expectedSecret
  );
};

const parseSupplierStartPayload = (text = "") => {
  const [command, payload] = String(text || "").trim().split(/\s+/);
  if (!command?.startsWith("/start") || !payload?.startsWith("supplier_")) {
    return "";
  }

  return payload.replace(/^supplier_/, "");
};

const normalizeTelegramUsername = (value = "") =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

const escapeTelegramHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const parseSupplierPurchaseOrderCallbackData = (data = "") => {
  const match = String(data || "").match(/^supplier_po:(accept|cancel|contact):(.+)$/);
  if (!match) return null;

  return {
    action: match[1],
    purchaseOrderId: match[2],
  };
};

const findSupplierForTelegramStart = async ({ supplierId, username }) => {
  if (supplierId) {
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return null;
    return Supplier.findById(supplierId);
  }

  const normalizedUsername = normalizeTelegramUsername(username);
  if (!normalizedUsername) return null;

  const suppliers = await Supplier.find({
    telegram: { $in: [normalizedUsername, `@${normalizedUsername}`] },
  }).limit(2);

  return suppliers.length === 1 ? suppliers[0] : null;
};

const replyToSupplierCallback = async ({
  callbackQueryId,
  chatId,
  text,
  showAlert = false,
}) => {
  await answerTelegramCallbackQuery({
    callbackQueryId,
    type: "supplier-po",
    text,
    showAlert,
  }).catch((error) => {
    console.error("Telegram supplier callback answer failed:", error.message);
  });

  if (!chatId) return;

  await sendTelegramTextToChat({
    chatId,
    type: "supplier-po",
    text,
  }).catch((error) => {
    console.error("Telegram supplier callback reply failed:", error.message);
  });
};

const handleSupplierPurchaseOrderCallback = async (callbackQuery) => {
  const callbackQueryId = callbackQuery?.id;
  const chatId = callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;
  const from = callbackQuery?.from || {};
  const parsed = parseSupplierPurchaseOrderCallbackData(callbackQuery?.data);

  if (!parsed) {
    await replyToSupplierCallback({
      callbackQueryId,
      chatId,
      text: "This button is no longer valid. Please ask the store admin to resend the purchase order.",
      showAlert: true,
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(parsed.purchaseOrderId)) {
    await replyToSupplierCallback({
      callbackQueryId,
      chatId,
      text: "This purchase order link is invalid. Please ask the store admin to resend it.",
      showAlert: true,
    });
    return;
  }

  const purchaseOrder = await PurchaseOrder.findById(parsed.purchaseOrderId).populate(
    "supplier",
    "name telegramChatId telegramUserId"
  );

  if (!purchaseOrder) {
    await replyToSupplierCallback({
      callbackQueryId,
      chatId,
      text: "This purchase order was not found. Please ask the store admin to resend it.",
      showAlert: true,
    });
    return;
  }

  const supplierChatId = purchaseOrder.supplier?.telegramChatId;
  const supplierUserId = purchaseOrder.supplier?.telegramUserId;
  const callbackUserId = from.id ? String(from.id) : "";
  const isSupplierChat =
    supplierChatId && chatId && String(supplierChatId) === String(chatId);
  const isConnectedSupplierUser =
    supplierUserId && callbackUserId && String(supplierUserId) === callbackUserId;

  // A supplier may reconnect the bot and receive a new chat ID after a PO was
  // sent. Their Telegram user ID remains stable, so accept their response while
  // still rejecting clicks from a different supplier account.
  if (!isSupplierChat && !isConnectedSupplierUser) {
    await replyToSupplierCallback({
      callbackQueryId,
      chatId,
      text: "This purchase order belongs to another supplier chat.",
      showAlert: true,
    });
    return;
  }

  const now = new Date();
  const poNumber = purchaseOrder.poNumber || purchaseOrder._id;
  const responseFields = {
    "supplierTelegramOrder.responseTelegramUserId": from.id ? String(from.id) : "",
    "supplierTelegramOrder.responseTelegramUsername": from.username
      ? `@${from.username}`
      : "",
  };
  let replyText = "";

  if (parsed.action === "accept") {
    responseFields["supplierTelegramOrder.responseStatus"] = "accepted";
    responseFields["supplierTelegramOrder.respondedAt"] = now;
    replyText = `Purchase order ${escapeTelegramHtml(poNumber)} accepted. Thank you. Please reply with the delivery date when ready.`;
  }

  if (parsed.action === "cancel") {
    responseFields["supplierTelegramOrder.responseStatus"] = "cancelled";
    responseFields["supplierTelegramOrder.respondedAt"] = now;
    replyText = `Purchase order ${escapeTelegramHtml(poNumber)} marked as unavailable. The store team will follow up.`;
  }

  if (parsed.action === "contact") {
    const currentResponseStatus =
      purchaseOrder.supplierTelegramOrder?.responseStatus || "";
    if (!["accepted", "cancelled"].includes(currentResponseStatus)) {
      responseFields["supplierTelegramOrder.responseStatus"] = "contact_requested";
      responseFields["supplierTelegramOrder.respondedAt"] = now;
    }
    responseFields["supplierTelegramOrder.contactRequestedAt"] = now;
    replyText = `Please contact the store at ${escapeTelegramHtml(getSupplierContactPhone())}.`;
  }

  await PurchaseOrder.updateOne(
    { _id: purchaseOrder._id },
    { $set: responseFields }
  );

  if (parsed.action === "accept" || parsed.action === "cancel") {
    await editTelegramMessageReplyMarkup({
      chatId,
      messageId,
      type: "supplier-po",
      replyMarkup: buildSupplierPurchaseOrderDecisionReplyMarkup({
        purchaseOrder,
      }),
    }).catch((error) => {
      console.error("Telegram supplier button update failed:", error.message);
    });
  }

  await replyToSupplierCallback({
    callbackQueryId,
    chatId,
    text: replyText,
  });
};

export const getSupplierTelegramSetupLink = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }

    const supplier = await Supplier.findById(id).select("_id name telegramChatId").lean();
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const botUsername = normalizeBotUsername(process.env.TELEGRAM_SUPPLIER_BOT_USERNAME);
    if (!botUsername) {
      return res.status(400).json({
        message: "TELEGRAM_SUPPLIER_BOT_USERNAME is not configured",
      });
    }

    res.json({
      success: true,
      data: {
        supplierId: supplier._id,
        supplierName: supplier.name,
        connected: Boolean(supplier.telegramChatId),
        link: `https://t.me/${botUsername}?start=supplier_${supplier._id}`,
      },
    });
  } catch (error) {
    console.error("Error creating supplier Telegram setup link:", error);
    res.status(500).json({ message: "Failed to create Telegram setup link", error: error.message });
  }
};

export const handleSupplierTelegramWebhook = async (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(403).json({ message: "Invalid Telegram webhook secret" });
  }

  const callbackQuery = req.body?.callback_query;
  if (callbackQuery) {
    try {
      await handleSupplierPurchaseOrderCallback(callbackQuery);
      return res.json({ success: true });
    } catch (error) {
      console.error("Supplier Telegram callback failed:", error);
      return res.status(500).json({ message: "Failed to handle Telegram callback", error: error.message });
    }
  }

  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const supplierId = parseSupplierStartPayload(message?.text);
  const telegramUsername = message?.from?.username || "";

  if (!chatId || !message?.text?.startsWith("/start")) {
    return res.json({ success: true, ignored: true });
  }

  if (supplierId && !mongoose.Types.ObjectId.isValid(supplierId)) {
    await sendTelegramTextToChat({
      chatId,
      type: "supplier-po",
      text: "This supplier setup link is invalid. Please ask the store admin for a new link.",
    }).catch((error) => {
      console.error("Telegram supplier invalid-link reply failed:", error.message);
    });

    return res.json({ success: true, ignored: true });
  }

  try {
    const from = message.from || {};
    const supplier = await findSupplierForTelegramStart({
      supplierId,
      username: telegramUsername,
    });

    if (!supplier) {
      await sendTelegramTextToChat({
        chatId,
        type: "supplier-po",
        text: "Supplier was not found. Please ask the store admin for the Telegram setup link.",
      }).catch((error) => {
        console.error("Telegram supplier missing-supplier reply failed:", error.message);
      });

      return res.json({ success: true, ignored: true });
    }

    supplier.telegramChatId = String(chatId);
    supplier.telegramUserId = from.id ? String(from.id) : supplier.telegramUserId;
    supplier.telegramConnectedAt = new Date();

    if (!supplier.telegram && from.username) {
      supplier.telegram = `@${from.username}`;
    }

    await supplier.save();

    await sendTelegramTextToChat({
      chatId,
      type: "supplier-po",
      text: `Telegram connected for ${supplier.name}. You will receive purchase orders here.`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Supplier Telegram webhook failed:", error);
    res.status(500).json({ message: "Failed to handle Telegram webhook", error: error.message });
  }
};
