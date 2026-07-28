import { adminService } from "../services/adminService.js";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export class NotificationController {
  static async getNotifications() {
    try {
      const response = await adminService.getNotifications();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Failed to load notifications"),
      };
    }
  }

  static async getUnreadCount() {
    try {
      const response = await adminService.getNotificationUnreadCount();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Failed to load notification count"),
      };
    }
  }

  static async markAsRead(notificationId) {
    try {
      const response = await adminService.markNotificationRead(notificationId);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Failed to mark notification as read"),
      };
    }
  }

  static async markAllAsRead() {
    try {
      const response = await adminService.markAllNotificationsRead();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Failed to mark notifications as read"),
      };
    }
  }

  static async deleteNotification(notificationId) {
    try {
      const response = await adminService.deleteNotification(notificationId);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Failed to delete notification"),
      };
    }
  }
}
