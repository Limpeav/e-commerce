import asyncHandler from "express-async-handler";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { emitNotificationCreated } from "../realtime/socket.js";

const getAudienceFilterForUser = (req) => {
  if (req.user.role === "admin") {
    return { audience: { $in: ["admin", "all"] } };
  }

  return {
    audience: "user",
    recipient: req.user._id,
  };
};

// @desc    Get all notifications (admin stream)
// @route   GET /api/notifications
// @access  Private/Admin
export const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    audience: { $in: ["admin", "all"] },
  })
    .populate("userId", "name email")
    .populate("recipient", "name email")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// @desc    Get notifications for current user
// @route   GET /api/notifications/mine
// @access  Private
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find(getAudienceFilterForUser(req))
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    ...getAudienceFilterForUser(req),
    isRead: false,
  });

  res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          audience: "user",
          recipient: req.user._id,
        };

  const notification = await Notification.findOne(filter);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  const updatedNotification = await notification.save();
  res.json(updatedNotification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      ...getAudienceFilterForUser(req),
      isRead: false,
    },
    { isRead: true }
  );

  res.json({ message: "All notifications marked as read" });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          audience: "user",
          recipient: req.user._id,
        };

  const notification = await Notification.findOne(filter);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  await notification.deleteOne();
  res.json({ message: "Notification removed" });
});

// @desc    Create a promotional notification
// @route   POST /api/notifications/promotions
// @access  Private/Admin
export const createPromotionNotification = asyncHandler(async (req, res) => {
  const title = req.body.title?.toString().trim();
  const message = req.body.message?.toString().trim();
  const link = req.body.link?.toString().trim();

  if (!title || !message) {
    res.status(400);
    throw new Error("Title and message are required");
  }

  const targetRole = req.body.targetRole?.toString().trim() || "user";
  const recipientUserIds = Array.isArray(req.body.userIds) ? req.body.userIds : null;

  const userFilter = {};
  if (targetRole === "user" || targetRole === "admin") {
    userFilter.role = targetRole;
  }

  if (recipientUserIds && recipientUserIds.length > 0) {
    userFilter._id = { $in: recipientUserIds };
  }

  const users = await User.find(userFilter).select("_id");
  if (users.length === 0) {
    res.status(400);
    throw new Error("No target users found for this promotion");
  }

  const docs = users.map((user) => ({
    type: "promotion",
    audience: "user",
    recipient: user._id,
    title,
    message,
    link: link || "/",
    userId: req.user._id,
  }));

  const createdNotifications = await Notification.insertMany(docs);
  for (const notification of createdNotifications) {
    emitNotificationCreated(notification);
  }

  res.status(201).json({
    message: "Promotional notifications sent",
    delivered: docs.length,
  });
});
