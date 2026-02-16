import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
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
import supportRoutes from "./routes/supportRoutes.js";
import { initializeSocket } from "./realtime/socket.js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();
connectDB();

const app = express();

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      if (key.startsWith("$") || key.includes(".")) {
        return acc;
      }

      acc[key] = sanitizeObject(nestedValue);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  // req.query is a getter in Express 5, so mutate its entries instead of reassignment.
  if (req.query && typeof req.query === "object") {
    const sanitizedQuery = sanitizeObject(req.query);
    for (const key of Object.keys(req.query)) {
      if (!(key in sanitizedQuery)) {
        delete req.query[key];
      }
    }
    for (const [key, value] of Object.entries(sanitizedQuery)) {
      req.query[key] = value;
    }
  }

  next();
};

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Security Middleware
app.use(helmet());
app.use(sanitizeRequest);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);


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
app.use("/api/support", supportRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working fine" });
});

// START SERVER
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
initializeSocket(server, corsOrigins);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Server updated with email config
