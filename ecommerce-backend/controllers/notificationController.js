import asyncHandler from "express-async-handler";
import Notification from "../models/notificationModel.js";

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications
// @access  Private/Admin
export const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({})
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private/Admin
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ isRead: false });
    res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        notification.isRead = true;
        const updatedNotification = await notification.save();
        res.json(updatedNotification);
    } else {
        res.status(404);
        throw new Error("Notification not found");
    }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private/Admin
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        await notification.deleteOne();
        res.json({ message: "Notification removed" });
    } else {
        res.status(404);
        throw new Error("Notification not found");
    }
});
