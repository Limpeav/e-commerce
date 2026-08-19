import express from "express";
import cors from "cors";
import "./config/env.js";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import { assertSecurityConfig } from "./config/security.js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

import http from "http";
import { initializeSocket } from "./realtime/socket.js";
import {
  assertBakongConfig,
  getBakongTokenDiagnostic,
} from "./config/bakong.js";
import {
  startBakongReconciliation,
  stopBakongReconciliation,
} from "./services/bakongReconciliationService.js";
import {
  startSupportTicketAutomation,
  stopSupportTicketAutomation,
} from "./services/supportTicketScheduler.js";
import {
  startProductExpiryAlerts,
  stopProductExpiryAlerts,
} from "./services/productExpiryAlertService.js";

assertSecurityConfig();

const { errors: bakongConfigErrors } = assertBakongConfig();
if (bakongConfigErrors.length > 0) {
  console.warn(
    `Bakong payment configuration is incomplete: ${bakongConfigErrors.join("; ")}`
  );
}
console.log("Bakong token diagnostic:", getBakongTokenDiagnostic());

// Connect to Database
await connectDB();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.ALLOWED_ORIGINS
    || [process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL]
      .filter(Boolean)
      .join(",");

  const origins = String(rawOrigins || "")
    .split(",")
    .map((origin) => origin.trim())
    .map((origin) => origin.replace(/\/+$/, ""))
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  return [];
};

const allowedOrigins = parseAllowedOrigins();
const hasConfiguredOrigins = allowedOrigins.length > 0;
const isDevelopment = process.env.NODE_ENV !== "production";
const allowLocalDevOrigins =
  process.env.ALLOW_LOCAL_DEV_ORIGINS === undefined
    ? isDevelopment
    : process.env.ALLOW_LOCAL_DEV_ORIGINS === "true";
const localNetworkOriginPattern =
  /^https?:\/\/(?:(?:localhost|127\.0\.0\.1|\[::1\])|(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})|(?:172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))(?::\d+)?$/;
const localNetworkDomainOriginPattern =
  /^https?:\/\/(?:(?:localhost|127-0-0-1)|(?:10-\d{1,3}-\d{1,3}-\d{1,3})|(?:192-168-\d{1,3}-\d{1,3})|(?:172-(?:1[6-9]|2\d|3[0-1])-\d{1,3}-\d{1,3})|(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})|(?:172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))\.sslip\.io(?::\d+)?$/;

const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    (isDevelopment && !hasConfiguredOrigins) ||
    allowedOrigins.includes(normalizedOrigin) ||
    ((isDevelopment || allowLocalDevOrigins) &&
      (localNetworkOriginPattern.test(normalizedOrigin) ||
        localNetworkDomainOriginPattern.test(normalizedOrigin)))
  );
};

const corsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${normalizeOrigin(origin)}`));
};

const sanitizeMongoOperators = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeMongoOperators);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      const sanitizedKey = key.replace(/^\$+/g, "").replace(/\./g, "");
      accumulator[sanitizedKey] = sanitizeMongoOperators(nestedValue);
      return accumulator;
    }, {});
  }

  return value;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeMongoOperators(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeMongoOperators(req.params);
  }

  const query = req.query;
  if (query && typeof query === "object") {
    const sanitizedQuery = sanitizeMongoOperators(query);
    Object.keys(query).forEach((key) => {
      delete query[key];
    });
    Object.assign(query, sanitizedQuery);
  }

  next();
};

app.use(express.json({
  limit: "1mb",
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  },
}));

// CORS Configuration
const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Support-Access-Token"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false // Allows OAuth popups (like Google) to communicate back to the app
}));
app.use(mongoSanitizeMiddleware);

// Rate Limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 300 : 1000,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Initialize Socket.io
initializeSocket(server, corsOrigin);


// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/suppliers", supplierRoutes);
app.use("/api/admin/purchase-orders", purchaseOrderRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/health", (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working fine" });
});

app.use((err, req, res, _next) => {
  void _next;

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || "Server error";

  console.error(`${req.method} ${req.originalUrl} failed:`, message);

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
});

// START SERVER
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startBakongReconciliation();
  startSupportTicketAutomation();
  startProductExpiryAlerts();
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  stopBakongReconciliation();
  stopSupportTicketAutomation();
  stopProductExpiryAlerts();

  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
// Server updated with email config
