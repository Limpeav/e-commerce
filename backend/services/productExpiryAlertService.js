import Notification from "../models/notificationModel.js";
import Product from "../models/Product.js";
import { emitNotificationCreated } from "../realtime/socket.js";
import { getAvailableStock } from "../utils/productInventory.js";
import {
  getProductExpiryAlertCutoffDate,
  getProductExpiryAlertStatus,
  getProductExpiryAlertWindowDays,
  getProductExpiryCategoryLookupValues,
} from "../utils/productExpiry.js";
import {
  isTelegramAlertConfigured,
  sendProductExpiryTelegramAlert,
} from "../utils/sendTelegramMessage.js";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 100;

let productExpiryAlertTimer = null;
let productExpiryAlertsRunning = false;

const parsePositiveInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const getProductExpiryNotificationCopy = ({ product, status, stock }) => {
  if (status.kind === "expired") {
    const expiredDays = Math.abs(status.daysUntilExpiry);

    return {
      title: "Product Expired",
      message:
        `${product.title} expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago. ` +
        `Review the remaining ${stock} item${stock === 1 ? "" : "s"} immediately.`,
    };
  }

  if (status.kind === "expires-today") {
    return {
      title: "Product Expires Today",
      message:
        `${product.title} expires today and has ${stock} item${stock === 1 ? "" : "s"} available. ` +
        "Move it to promotion or discount it now.",
    };
  }

  return {
    title: "Product Nearly Expired",
    message:
      `${product.title} expires in ${status.daysUntilExpiry} days and has ${stock} item${stock === 1 ? "" : "s"} available. ` +
      "Move it to promotion or discount it before expiry.",
  };
};

const getProductExpiryAlertSchedulerConfig = () => ({
  enabled: process.env.PRODUCT_EXPIRY_ALERTS_ENABLED !== "false",
  intervalMs: parsePositiveInteger(
    process.env.PRODUCT_EXPIRY_ALERT_INTERVAL_MS,
    DEFAULT_INTERVAL_MS
  ),
  batchSize: parsePositiveInteger(
    process.env.PRODUCT_EXPIRY_ALERT_BATCH_SIZE,
    DEFAULT_BATCH_SIZE
  ),
});

const sendProductExpiryAlertForProduct = async (
  product,
  {
    now = new Date(),
    windowDays = getProductExpiryAlertWindowDays(),
  } = {}
) => {
  const summary = {
    checked: product ? 1 : 0,
    eligible: 0,
    processed: 0,
    skipped: 0,
    telegramSent: 0,
    telegramSkipped: 0,
    failed: 0,
    windowDays,
  };

  if (!product) {
    summary.skipped += 1;
    return summary;
  }

  if (!isTelegramAlertConfigured("expiry")) {
    summary.skippedReason = "missing-telegram-config";
    return summary;
  }

  const status = getProductExpiryAlertStatus(product, { now, windowDays });
  const stock = getAvailableStock(product);

  if (!status?.eligible || stock <= 0 || product.expiryAlertSent) {
    summary.skipped += 1;
    return summary;
  }

  summary.eligible += 1;

  const productId = product._id.toString();

  try {
    const telegramResult = await sendProductExpiryTelegramAlert({
      title: product.title,
      category: product.category,
      productId,
      expiryDate: product.expiryDate,
      daysUntilExpiry: status.daysUntilExpiry,
      stock,
      price: product.price,
      discountPrice: product.discountPrice,
      imageUrl: product.image,
    });

    if (!telegramResult.sent) {
      summary.telegramSkipped += 1;
      return summary;
    }

    summary.telegramSent += 1;
  } catch (telegramError) {
    summary.failed += 1;
    console.error(
      `Telegram product expiry alert failed for product ${productId}:`,
      telegramError.message
    );
    return summary;
  }

  const copy = getProductExpiryNotificationCopy({ product, status, stock });

  try {
    const notification = await Notification.create({
      type: "product",
      title: copy.title,
      message: copy.message,
      productId: product._id,
      link: `/admin/products/${productId}`,
    });
    emitNotificationCreated(notification);
  } catch (notificationError) {
    console.error(
      `Product expiry notification failed for product ${productId}:`,
      notificationError.message
    );
  }

  try {
    const flagResult = await Product.updateOne(
      { _id: product._id, expiryAlertSent: { $ne: true } },
      {
        $set: {
          expiryAlertSent: true,
          expiryAlertSentAt: new Date(),
        },
      }
    );

    if (flagResult.modifiedCount === 0 && flagResult.matchedCount === 0) {
      summary.skipped += 1;
      return summary;
    }

    summary.processed += 1;
  } catch (flagError) {
    summary.failed += 1;
    console.error(
      `Product expiry alert flag update failed for product ${productId}:`,
      flagError.message
    );
  }

  return summary;
};

export const dispatchProductExpiryAlertForProduct = (productOrProductId) => {
  const productId = productOrProductId?._id || productOrProductId;

  if (!productId) {
    return;
  }

  setImmediate(async () => {
    try {
      const product = await Product.findById(productId);
      const summary = await sendProductExpiryAlertForProduct(product);

      if (summary.processed || summary.failed) {
        console.log("Product expiry alert after product save:", summary);
      }
    } catch (error) {
      console.error(
        `Product expiry alert dispatch failed for product ${productId}:`,
        error.message
      );
    }
  });
};

export const processProductExpiryAlerts = async ({
  now = new Date(),
  batchSize = getProductExpiryAlertSchedulerConfig().batchSize,
} = {}) => {
  const windowDays = getProductExpiryAlertWindowDays();
  const cutoffDate = getProductExpiryAlertCutoffDate({ now, windowDays });
  const summary = {
    checked: 0,
    eligible: 0,
    processed: 0,
    skipped: 0,
    telegramSent: 0,
    telegramSkipped: 0,
    failed: 0,
    windowDays,
  };

  if (!isTelegramAlertConfigured("expiry")) {
    summary.skippedReason = "missing-telegram-config";
    return summary;
  }

  const products = await Product.find({
    category: { $in: getProductExpiryCategoryLookupValues() },
    expiryDate: { $ne: null, $lte: cutoffDate },
    expiryAlertSent: { $ne: true },
    stock: { $gt: 0 },
  })
    .sort({ expiryDate: 1, _id: 1 })
    .limit(batchSize);

  summary.checked = products.length;

  for (const product of products) {
    const productSummary = await sendProductExpiryAlertForProduct(product, {
      now,
      windowDays,
    });

    summary.eligible += productSummary.eligible;
    summary.processed += productSummary.processed;
    summary.skipped += productSummary.skipped;
    summary.telegramSent += productSummary.telegramSent;
    summary.telegramSkipped += productSummary.telegramSkipped;
    summary.failed += productSummary.failed;
  }

  return summary;
};

const runProductExpiryAlerts = async () => {
  if (productExpiryAlertsRunning) {
    return;
  }

  productExpiryAlertsRunning = true;

  try {
    const summary = await processProductExpiryAlerts();

    if (
      summary.processed ||
      summary.failed ||
      summary.skippedReason === "missing-telegram-config"
    ) {
      console.log("Product expiry alerts:", summary);
    }
  } catch (error) {
    console.error("Product expiry alerts failed:", error.message);
  } finally {
    productExpiryAlertsRunning = false;
  }
};

export const startProductExpiryAlerts = () => {
  const config = getProductExpiryAlertSchedulerConfig();

  if (!config.enabled || productExpiryAlertTimer) {
    return null;
  }

  productExpiryAlertTimer = setInterval(runProductExpiryAlerts, config.intervalMs);
  productExpiryAlertTimer.unref?.();
  setImmediate(runProductExpiryAlerts);

  console.log(
    `Product expiry alerts enabled every ${config.intervalMs}ms ` +
      `for products expiring within ${getProductExpiryAlertWindowDays()} days`
  );

  return productExpiryAlertTimer;
};

export const stopProductExpiryAlerts = () => {
  if (productExpiryAlertTimer) {
    clearInterval(productExpiryAlertTimer);
    productExpiryAlertTimer = null;
  }
};
