import express from "express";
import {
    generateBakongQR,
    verifyBakongPayment,
    getPaymentStatus,
    getPaymentByOrderId,
    cancelPayment,
    getAllPayments,
    confirmPayment,
} from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/bakong/verify", verifyBakongPayment); // Webhook endpoint

// Protected routes (User)
router.post("/bakong/generate", protect, generateBakongQR);
router.get("/:paymentId/status", protect, getPaymentStatus);
router.get("/order/:orderId", protect, getPaymentByOrderId);
router.put("/:paymentId/cancel", protect, cancelPayment);

// Admin routes
router.get("/", protect, admin, getAllPayments);
router.put("/:paymentId/confirm", protect, admin, confirmPayment);

export default router;
