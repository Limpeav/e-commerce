import Notification from "../models/notificationModel.js";
import { emitNotificationCreated } from "../realtime/socket.js";

export const getPaymentMethodLabel = (paymentMethod = "") => {
  if (paymentMethod === "BAKONG_KHQR") return "KHQR";
  if (paymentMethod === "Cash on Delivery") return "Cash on Delivery";
  return paymentMethod || "Payment";
};

const getUserId = (user) => user?._id || user || undefined;

export const createPaymentSuccessNotification = async (order) => {
  if (!order || order.paymentStatus !== "Paid") return null;
  if (!["BAKONG_KHQR", "Cash on Delivery"].includes(order.paymentMethod)) {
    return null;
  }

  const shippingAddress = order.shippingAddress || {};
  const googleMapsLink =
    shippingAddress.latitude && shippingAddress.longitude
      ? `https://www.google.com/maps?q=${shippingAddress.latitude},${shippingAddress.longitude}`
      : "";
  const methodLabel = getPaymentMethodLabel(order.paymentMethod);
  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  const customerName =
    order.user?.name || shippingAddress.fullName || "Customer";
  const notification = await Notification.create({
    type: "payment",
    title: `Payment Received - ${methodLabel}`,
    message: `${customerName} paid by ${methodLabel} for order #${orderNumber} ($${Number(order.totalPrice || 0).toFixed(2)}).`,
    orderId: order._id,
    userId: getUserId(order.user),
    link: `/admin/orders/${order._id}`,
    googleMapsLink,
  });

  emitNotificationCreated(notification);
  return notification;
};
