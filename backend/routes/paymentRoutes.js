import express from "express";
import rateLimit from "express-rate-limit";
import {
    generateBakongQR,
    verifyBakongPayment,
    getPaymentStatus,
    getPaymentByOrderId,
    cancelPayment,
    getAllPayments,
    confirmPayment,
} from "../controllers/paymentController.js";
import { getExchangeRate } from "../controllers/settingsController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
const paymentWebhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes
router.get("/exchange-rate", getExchangeRate);
router.post("/bakong/verify", paymentWebhookLimiter, verifyBakongPayment);

// Protected routes (User)
router.post("/bakong/generate", protect, generateBakongQR);
router.get("/:paymentId/status", protect, getPaymentStatus);
router.get("/order/:orderId", protect, getPaymentByOrderId);
router.put("/:paymentId/cancel", protect, cancelPayment);

// Admin routes
router.get("/", protect, admin, getAllPayments);
router.put("/:paymentId/confirm", protect, admin, confirmPayment);

export default router;
