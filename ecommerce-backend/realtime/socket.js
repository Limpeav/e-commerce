import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

let ioInstance = null;

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
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name email");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Not authorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    socket.join(`role:${socket.user.role}`);
    socket.emit("realtime:connected", { userId, role: socket.user.role });

    socket.on("join:order", (orderId) => {
      const normalizedOrderId = resolveUserId(orderId);
      if (!normalizedOrderId) {
        return;
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

export const getSocket = () => ioInstance;

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

export const emitToAdmins = (eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to("role:admin").emit(eventName, payload);
};

export const emitToUsers = (eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to("role:user").emit(eventName, payload);
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
    updatedAt: order.updatedAt || new Date().toISOString(),
    ...details,
  };

  if (userId) {
    emitToUser(userId, "order:updated", payload);
  }

  emitToAdmins("order:updated", payload);

  if (ioInstance && orderId) {
    ioInstance.to(`order:${orderId}`).emit("order:updated", payload);
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
    recipient: resolveUserId(notification.recipient),
    createdAt: notification.createdAt || new Date().toISOString(),
    isRead: Boolean(notification.isRead),
  };

  if (audience === "admin") {
    emitToAdmins("notification:created", payload);
    return;
  }

  if (audience === "user" && payload.recipient) {
    emitToUser(payload.recipient, "notification:created", payload);
    return;
  }

  // Fallback for broadcast.
  emitToAdmins("notification:created", payload);
  emitToUsers("notification:created", payload);
};
