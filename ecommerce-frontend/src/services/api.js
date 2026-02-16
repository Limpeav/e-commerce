import axios from "axios";
import { API_BASE_URL, getAdminToken } from "./http";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const adminToken = getAdminToken();
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear admin data and redirect to login
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/admin/login";
        }
        return Promise.reject(error);
    }
);

export default api;
