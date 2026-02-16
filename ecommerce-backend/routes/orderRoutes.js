import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updateOrderToPaid,
    updatePaymentStatus,
    getUserOrders,
    cancelMyOrder,
    deleteOrder,
    getOrderStats,
    getShippingFeeQuote,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.route("/").post(protect, createOrder).get(protect, admin, getAllOrders);
router.route("/shipping-fee").get(protect, getShippingFeeQuote).post(protect, getShippingFeeQuote);
router.route("/myorders").get(protect, getUserOrders);
router.route("/:id/cancel").put(protect, cancelMyOrder);
router.route("/stats").get(protect, admin, getOrderStats);
router.route("/:id").get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route("/:id/pay").put(protect, admin, updateOrderToPaid);
router.route("/:id/status").put(protect, admin, updateOrderStatus);
router.route("/:id/payment-status").put(protect, admin, updatePaymentStatus);

export default router;
