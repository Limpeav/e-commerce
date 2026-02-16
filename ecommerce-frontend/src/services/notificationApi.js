import axios from "axios";
import { API_BASE_URL, getPreferredToken, withAuthHeaders } from "./http";

const API_URL = `${API_BASE_URL}/notifications`;
const isAdminSession = () => Boolean(localStorage.getItem("adminToken"));
const listEndpoint = () => (isAdminSession() ? API_URL : `${API_URL}/mine`);

export const fetchNotifications = async () => {
    const token = getPreferredToken();
    const response = await axios.get(listEndpoint(), {
        headers: withAuthHeaders(token),
    });
    return response.data;
};

export const getUnreadCount = async () => {
    const token = getPreferredToken();
    const response = await axios.get(`${API_URL}/unread-count`, {
        headers: withAuthHeaders(token),
    });
    return response.data;
};

export const markAsRead = async (notificationId) => {
    const token = getPreferredToken();
    const response = await axios.put(
        `${API_URL}/${notificationId}/read`,
        {},
        {
            headers: withAuthHeaders(token),
        }
    );
    return response.data;
};

export const markAllAsRead = async () => {
    const token = getPreferredToken();
    const response = await axios.put(
        `${API_URL}/mark-all-read`,
        {},
        {
            headers: withAuthHeaders(token),
        }
    );
    return response.data;
};

export const deleteNotification = async (notificationId) => {
    const token = getPreferredToken();
    const response = await axios.delete(`${API_URL}/${notificationId}`, {
        headers: withAuthHeaders(token),
    });
    return response.data;
};
