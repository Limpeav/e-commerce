import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import { translatePlainText } from "../controllers/translationController.js";

let ioInstance = null;
const TRANSLATION_RATE_LIMIT = 20;
const TRANSLATION_RATE_WINDOW_MS = 60 * 1000;

const normalizeOrigins = (origins) => {
  if (!origins || origins === true) {
    return true;
  }

  if (typeof origins === "function") {
    return origins;
  }

  if (Array.isArray(origins)) {
    return origins;
  }

  return String(origins)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const resolveUserId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

export const initializeSocket = (httpServer, corsOrigins) => {
  const allowedOrigins = normalizeOrigins(corsOrigins);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!rawToken) {
        socket.user = { _id: null, role: "guest", name: "Guest" };
        return next();
      }

      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name email");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Not authorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.user._id?.toString() || null;
    let translationRequestTimestamps = [];

    if (userId) {
      socket.join(`user:${userId}`);
    }
    socket.join(`role:${socket.user.role}`);
    socket.emit("realtime:connected", { userId, role: socket.user.role });

    socket.on("language:change", (requestedLanguage) => {
      const language = requestedLanguage === "km" ? "kh" : requestedLanguage;
      if (!["en", "kh"].includes(language)) {
        return;
      }

      const payload = {
        language,
        changedAt: new Date().toISOString(),
      };

      socket.emit("language:changed", payload);
      if (userId) {
        socket.to(`user:${userId}`).emit("language:changed", payload);
      }
    });

    socket.on("translation:request", async (payload = {}, respond) => {
      const sendResponse = typeof respond === "function" ? respond : () => {};
      const now = Date.now();
      translationRequestTimestamps = translationRequestTimestamps.filter(
        (timestamp) => now - timestamp < TRANSLATION_RATE_WINDOW_MS
      );

      if (translationRequestTimestamps.length >= TRANSLATION_RATE_LIMIT) {
        sendResponse({
          ok: false,
          statusCode: 429,
          message: "Too many translation requests. Please wait a minute and try again.",
        });
        return;
      }

      translationRequestTimestamps.push(now);

      try {
        const result = await translatePlainText(payload);
        sendResponse({
          ok: true,
          ...result,
          translatedAt: new Date().toISOString(),
        });
      } catch (error) {
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          "Translation failed";

        sendResponse({
          ok: false,
          statusCode: error.statusCode || error.response?.status || 502,
          message,
        });
      }
    });

    socket.on("join:order", async (orderId) => {
      const normalizedOrderId = resolveUserId(orderId);
      if (!normalizedOrderId || !mongoose.isValidObjectId(normalizedOrderId)) {
        return;
      }

      const isPortalUser = ["admin", "seller", "delivery"].includes(socket.user.role);
      if (!isPortalUser) {
        const ownsOrder = await Order.exists({
          _id: normalizedOrderId,
          user: socket.user._id,
        });
        if (!ownsOrder) {
          socket.emit("realtime:error", {
            code: "ORDER_ROOM_FORBIDDEN",
            message: "Not authorized to subscribe to this order",
          });
          return;
        }
      }

      socket.join(`order:${normalizedOrderId}`);
    });

    socket.on("leave:order", (orderId) => {
      const normalizedOrderId = resolveUserId(orderId);
      if (!normalizedOrderId) {
        return;
      }
      socket.leave(`order:${normalizedOrderId}`);
    });
  });

  return ioInstance;
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  const resolvedUserId = resolveUserId(userId);
  if (!resolvedUserId) {
    return;
  }

  ioInstance.to(`user:${resolvedUserId}`).emit(eventName, payload);
};

export const emitToRoles = (roles = [], eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  roles.forEach((role) => {
    if (role) {
      ioInstance.to(`role:${role}`).emit(eventName, payload);
    }
  });
};

export const emitToUsers = (eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to("role:user").emit(eventName, payload);
  ioInstance.to("role:guest").emit(eventName, payload);
};

export const emitDomainChanged = (
  domain,
  action,
  payload = {},
  { roles = ["admin", "seller", "delivery"], users = false, userId = null } = {}
) => {
  if (!domain) {
    return;
  }

  const eventPayload = {
    domain,
    action,
    changedAt: new Date().toISOString(),
    ...payload,
  };

  emitToRoles(roles, `${domain}:changed`, eventPayload);

  if (users) {
    emitToUsers(`${domain}:changed`, eventPayload);
  }

  if (userId) {
    emitToUser(userId, `${domain}:changed`, eventPayload);
  }
};

export const emitOrderCreated = (order) => {
  if (!order) {
    return;
  }

  const orderId = resolveUserId(order._id);
  const userId = resolveUserId(order.user);

  const payload = {
    orderId,
    userId,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    isPaid: Boolean(order.isPaid),
    isDelivered: Boolean(order.isDelivered),
    totalPrice: order.totalPrice,
    exchangeRate: order.exchangeRate,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  };

  emitToRoles(["admin", "seller"], "order:created", payload);
  emitDomainChanged("orders", "created", payload, {
    roles: ["admin", "seller", "delivery"],
    userId,
  });

  if (userId) {
    emitToUser(userId, "order:created", payload);
  }
};

export const emitOrderUpdated = (order, details = {}) => {
  if (!order) {
    return;
  }

  const orderId = resolveUserId(order._id);
  const userId = resolveUserId(order.user);

  const payload = {
    orderId,
    userId,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    isPaid: Boolean(order.isPaid),
    isDelivered: Boolean(order.isDelivered),
    exchangeRate: order.exchangeRate,
    updatedAt: order.updatedAt || new Date().toISOString(),
    ...details,
  };

  const statusPayload = {
    orderId,
    userId,
    orderStatus: payload.orderStatus,
    paymentStatus: payload.paymentStatus,
    isPaid: payload.isPaid,
    isDelivered: payload.isDelivered,
    processedAt: payload.processedAt,
    shippedAt: payload.shippedAt,
    deliveredAt: payload.deliveredAt,
    paidAt: payload.paidAt,
    updatedAt: payload.updatedAt,
  };

  if (userId) {
    emitToUser(userId, "order:updated", payload);
    emitToUser(userId, "order:status-updated", statusPayload);
  }

  emitToRoles(["admin", "seller", "delivery"], "order:updated", payload);
  emitToRoles(["admin", "seller", "delivery"], "order:status-updated", statusPayload);
  emitDomainChanged("orders", "updated", payload, {
    roles: ["admin", "seller", "delivery"],
    userId,
  });

  if (ioInstance && orderId) {
    ioInstance.to(`order:${orderId}`).emit("order:updated", payload);
    ioInstance.to(`order:${orderId}`).emit("order:status-updated", statusPayload);
  }
};

export const emitNotificationCreated = (notification) => {
  if (!notification) {
    return;
  }

  const audience = notification.audience || "admin";
  const payload = {
    _id: resolveUserId(notification._id),
    type: notification.type,
    audience,
    title: notification.title,
    message: notification.message,
    orderId: resolveUserId(notification.orderId),
    productId: resolveUserId(notification.productId),
    recipient: resolveUserId(notification.recipient),
    link: notification.link,
    createdAt: notification.createdAt || new Date().toISOString(),
    isRead: Boolean(notification.isRead),
  };

  if (audience === "admin") {
    emitToRoles(["admin", "seller"], "notification:created", payload);
    return;
  }

  if (audience === "user" && payload.recipient) {
    emitToUser(payload.recipient, "notification:created", payload);
    return;
  }

  // Fallback for broadcast.
  emitToRoles(["admin", "seller", "delivery"], "notification:created", payload);
  emitToUsers("notification:created", payload);
};
