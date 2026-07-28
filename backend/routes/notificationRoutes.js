import express from "express";
import {
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notificationController.js";
import { protect, adminOrSeller } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admins see every notification; sellers are scoped to order/payment notifications.
router.route("/").get(protect, adminOrSeller, getAllNotifications);
router.route("/unread-count").get(protect, adminOrSeller, getUnreadCount);
router.route("/mark-all-read").put(protect, adminOrSeller, markAllAsRead);
router.route("/:id/read").put(protect, adminOrSeller, markAsRead);
router.route("/:id").delete(protect, adminOrSeller, deleteNotification);

export default router;
