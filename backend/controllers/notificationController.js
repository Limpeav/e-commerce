import asyncHandler from "express-async-handler";
import Notification from "../models/notificationModel.js";

const sellerVisibleNotificationFilter = {
    $and: [
        {
            $or: [
                { audience: "admin" },
                { audience: "broadcast" },
                { audience: { $exists: false } },
                { audience: null },
            ],
        },
        {
            $or: [
                { type: { $in: ["order", "payment"] } },
                { orderId: { $exists: true, $ne: null } },
                { title: /payment/i },
                { message: /paid by/i },
            ],
        },
    ],
};

const getNotificationScopeFilter = (req) =>
    req.user?.role === "seller" ? sellerVisibleNotificationFilter : {};

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications
// @access  Private/Admin/Seller
export const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find(getNotificationScopeFilter(req))
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private/Admin/Seller
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        ...getNotificationScopeFilter(req),
        isRead: false,
    });
    res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin/Seller
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        ...getNotificationScopeFilter(req),
    });

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
// @access  Private/Admin/Seller
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            ...getNotificationScopeFilter(req),
            isRead: false,
        },
        { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin/Seller
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        ...getNotificationScopeFilter(req),
    });

    if (notification) {
        await notification.deleteOne();
        res.json({ message: "Notification removed" });
    } else {
        res.status(404);
        throw new Error("Notification not found");
    }
});
