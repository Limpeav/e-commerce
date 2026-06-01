import express from "express";
import multer from "multer";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    trackOrder,
    updateOrderStatus,
    updateOrderToPaid,
    updatePaymentStatus,
    getUserOrders,
    deleteOrder,
    getOrderStats,
    uploadDeliveryProof,
    sendOrderReceiptToTelegram,
} from "../controllers/orderController.js";
import { protect, admin, portalAccess } from "../middleware/authMiddleware.js";
import { createUpload } from "../middleware/upload.js";

const router = express.Router();
const deliveryProofUpload = createUpload("delivery-proofs");
const receiptTelegramUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error("Receipt image must be PNG, JPEG, or WebP"));
    },
});

// User routes
router.route("/").post(protect, createOrder).get(protect, portalAccess, getAllOrders);
router.route("/myorders").get(protect, getUserOrders);
router.route("/stats").get(protect, portalAccess, getOrderStats);
router.route("/track/:orderNumber").get(protect, trackOrder);
router.route("/:id").get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/status").put(protect, portalAccess, updateOrderStatus);
router.route("/:id/payment-status").put(protect, portalAccess, updatePaymentStatus);
router
    .route("/:id/delivery-proof")
    .put(protect, portalAccess, deliveryProofUpload.single("proofPhoto"), uploadDeliveryProof);
router
    .route("/:id/receipt-telegram")
    .post(protect, portalAccess, receiptTelegramUpload.single("receipt"), sendOrderReceiptToTelegram);

export default router;
