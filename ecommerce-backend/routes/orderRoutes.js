import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updateOrderToPaid,
    updatePaymentStatus,
    getUserOrders,
    deleteOrder,
    getOrderStats,
    uploadDeliveryProof,
} from "../controllers/orderController.js";
import { protect, admin, portalAccess } from "../middleware/authMiddleware.js";
import { createUpload } from "../middleware/upload.js";

const router = express.Router();
const deliveryProofUpload = createUpload("delivery-proofs");

// User routes
router.route("/").post(protect, createOrder).get(protect, portalAccess, getAllOrders);
router.route("/myorders").get(protect, getUserOrders);
router.route("/stats").get(protect, portalAccess, getOrderStats);
router.route("/:id").get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/status").put(protect, portalAccess, updateOrderStatus);
router.route("/:id/payment-status").put(protect, portalAccess, updatePaymentStatus);
router
    .route("/:id/delivery-proof")
    .put(protect, portalAccess, deliveryProofUpload.single("proofPhoto"), uploadDeliveryProof);

export default router;
