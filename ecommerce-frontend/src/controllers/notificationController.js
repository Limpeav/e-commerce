import {
  deleteNotification,
  fetchNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../services/notificationApi.js";

export class NotificationController {
  static async getPanelState() {
    try {
      const [notifications, countData] = await Promise.all([
        fetchNotifications(),
        getUnreadCount(),
      ]);

      return {
        success: true,
        data: {
          notifications: Array.isArray(notifications) ? notifications : [],
          unreadCount: countData?.count || 0,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async markAsRead(notificationId) {
    try {
      await markAsRead(notificationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async markAllAsRead() {
    try {
      await markAllAsRead();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async delete(notificationId) {
    try {
      await deleteNotification(notificationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
