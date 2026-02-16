import express from "express";
import {
    getAllNotifications,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createPromotionNotification,
} from "../controllers/notificationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, admin, getAllNotifications);
router.route("/mine").get(protect, getMyNotifications);
router.route("/unread-count").get(protect, getUnreadCount);
router.route("/mark-all-read").put(protect, markAllAsRead);
router.route("/promotions").post(protect, admin, createPromotionNotification);
router.route("/:id/read").put(protect, markAsRead);
router.route("/:id").delete(protect, deleteNotification);

export default router;
