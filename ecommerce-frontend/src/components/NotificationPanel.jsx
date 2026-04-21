import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    X,
    CheckCircle,
    Trash2,
    CheckCheck,
} from "lucide-react";
import { NotificationController } from "../controllers/notificationController.js";

const NotificationPanel = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Load notifications
    const loadNotifications = async () => {
        setLoading(true);
        const result = await NotificationController.getPanelState();

        if (result.success) {
            setNotifications(result.data.notifications);
            setUnreadCount(result.data.unreadCount);
        } else {
            console.error("Error loading notifications:", result.error);
        }

        setLoading(false);
    };

    // Initial load
    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        const result = await NotificationController.markAsRead(notificationId);
        if (!result.success) {
            console.error("Error marking notification as read:", result.error);
            return;
        }
        await loadNotifications();
    };

    const handleMarkAllAsRead = async () => {
        const result = await NotificationController.markAllAsRead();
        if (!result.success) {
            console.error("Error marking all as read:", result.error);
            return;
        }
        await loadNotifications();
    };

    const handleDelete = async (notificationId, e) => {
        e.stopPropagation(); // Prevent notification click
        const result = await NotificationController.delete(notificationId);
        if (!result.success) {
            console.error("Error deleting notification:", result.error);
            return;
        }
        await loadNotifications();
    };

    const handleNotificationClick = async (notification) => {
        // Close panel immediately for better UX
        setIsOpen(false);

        // Navigate to order details
        if (notification.orderId) {
            navigate(`/admin/orders/${notification.orderId}`);
        }

        // Auto-delete the notification after viewing (runs in background)
        const result = await NotificationController.delete(notification._id);
        if (!result.success) {
            console.error("Error auto-deleting notification:", result.error);
            return;
        }
        await loadNotifications();
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Panel */}
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                <h3 className="font-bold text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                    <Bell className="w-12 h-12 mb-2" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? "bg-blue-50" : ""
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div
                                                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.type === "order"
                                                        ? "bg-green-100"
                                                        : "bg-blue-100"
                                                        }`}
                                                >
                                                    {notification.type === "order" ? (
                                                        <CheckCircle
                                                            className={`w-5 h-5 ${notification.type === "order"
                                                                ? "text-green-600"
                                                                : "text-blue-600"
                                                                }`}
                                                        />
                                                    ) : (
                                                        <Bell className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h4 className="font-semibold text-sm text-gray-900">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1.5"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {notification.message}
                                                    </p>

                                                    {/* Time & Actions */}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-400">
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleDelete(notification._id, e)}
                                                            className="p-1 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // You can add navigation to a full notifications page here
                                    }}
                                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All Notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationPanel;
