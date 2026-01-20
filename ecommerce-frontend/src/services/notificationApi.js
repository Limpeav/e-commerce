import axios from "axios";

const API_URL = "http://localhost:4000/api/notifications";

const getAuthToken = () => {
    // Check for admin token first (admin users)
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
        return adminToken;
    }

    // Fall back to regular user token
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData.token;
    }
    return null;
};

export const fetchNotifications = async () => {
    const token = getAuthToken();
    const response = await axios.get(API_URL, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const getUnreadCount = async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/unread-count`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const markAsRead = async (notificationId) => {
    const token = getAuthToken();
    const response = await axios.put(
        `${API_URL}/${notificationId}/read`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const markAllAsRead = async () => {
    const token = getAuthToken();
    const response = await axios.put(
        `${API_URL}/mark-all-read`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const deleteNotification = async (notificationId) => {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/${notificationId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};
