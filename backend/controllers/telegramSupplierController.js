import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";
import { sendTelegramTextToChat } from "../utils/sendTelegramMessage.js";

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
