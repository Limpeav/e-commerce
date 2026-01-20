import express from "express";
import {
    getAllNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notificationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are admin only
router.route("/").get(protect, admin, getAllNotifications);
router.route("/unread-count").get(protect, admin, getUnreadCount);
router.route("/mark-all-read").put(protect, admin, markAllAsRead);
router.route("/:id/read").put(protect, admin, markAsRead);
router.route("/:id").delete(protect, admin, deleteNotification);

export default router;
