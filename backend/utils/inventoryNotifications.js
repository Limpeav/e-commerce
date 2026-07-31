import Notification from "../models/notificationModel.js";
import Product from "../models/Product.js";
import { emitNotificationCreated } from "../realtime/socket.js";
import { getProductImageForColor } from "./productOptions.js";
import { sendLowStockTelegramAlert } from "./sendTelegramMessage.js";
import { getLowStockThreshold } from "./stockAlerts.js";

const getAlertItemTitle = (alert) =>
  alert.variant?.label ? `${alert.title} - ${alert.variant.label}` : alert.title;

const getStockAlertCopy = (alert) => {
  const stock = Math.max(0, Number(alert.stock || 0));
  const threshold = Number.isFinite(Number(alert.threshold))
    ? Number(alert.threshold)
    : getLowStockThreshold();
  const itemTitle = getAlertItemTitle(alert);
  const subject = alert.variant?.label ? "Variant" : "Product";

  if (alert.kind === "out-of-stock") {
    return {
      title: `${subject} Out of Stock`,
      message: `${itemTitle} is out of stock. Restock this ${subject.toLowerCase()} before accepting more orders.`,
    };
  }

  return {
    title: `${subject} Low Stock`,
    message: `${itemTitle} has ${stock} item${stock === 1 ? "" : "s"} left. Low stock threshold is ${threshold}.`,
  };
};

export const createStockAlertPayload = ({
  product,
  stockAlert,
  stock,
  threshold,
  variant,
}) => {
  if (!product || !stockAlert) return null;
  const imageUrl = variant?.color
    ? getProductImageForColor(product, variant.color)
    : product.image;

  return {
    kind: stockAlert.kind,
    productId: product._id,
    title: product.title,
    category: product.category,
    stock,
    threshold,
    variant,
    imageUrl,
    lowStockAlertSent: stockAlert.lowStockAlertSent,
    outOfStockAlertSent: stockAlert.outOfStockAlertSent,
  };
};

export const dispatchInventoryStockAlerts = (alerts = []) => {
  const validAlerts = alerts.filter(Boolean);
  if (validAlerts.length === 0) return;

  setImmediate(async () => {
    for (const alert of validAlerts) {
      const copy = getStockAlertCopy(alert);

      try {
        const notification = await Notification.create({
          type: "product",
          title: copy.title,
          message: copy.message,
          productId: alert.productId,
          link: `/admin/products/${alert.productId}`,
        });
        emitNotificationCreated(notification);
      } catch (notificationError) {
        console.error(
          `${copy.title} notification failed for product ${alert.productId}:`,
          notificationError.message
        );
      }

      if (!alert.variant) {
        try {
          await Product.updateOne(
            { _id: alert.productId },
            {
              $set: {
                lowStockAlertSent: Boolean(alert.lowStockAlertSent),
                outOfStockAlertSent: Boolean(alert.outOfStockAlertSent),
              },
            }
          );
        } catch (flagError) {
          console.error(
            `Stock alert flag update failed for product ${alert.productId}:`,
            flagError.message
          );
        }
      }

      try {
        await sendLowStockTelegramAlert({
          title: alert.title,
          category: alert.category,
          stock: alert.stock,
          productId: alert.productId.toString(),
          stockType: alert.variant?.label ? "Variant stock" : "Product stock",
          variant: alert.variant?.label || "",
          imageUrl: alert.imageUrl,
        });
      } catch (telegramError) {
        console.error("Telegram low stock alert failed:", telegramError.message);
      }
    }
  });
};
