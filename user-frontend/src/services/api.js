import axios from "axios";
import { config as appConfig } from "../config/index.js";
import {
    clearAdminSession,
    getPortalLoginPath,
    getStoredAdminUser,
    getStoredAdminToken,
} from "../utils/adminSession.js";

const API_URL = appConfig.API_BASE_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const adminToken = getStoredAdminToken();
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
            const loginPath = getPortalLoginPath(getStoredAdminUser());
            clearAdminSession();
            window.location.href = loginPath;
        }
        return Promise.reject(error);
    }
);

export default api;
