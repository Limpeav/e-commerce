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

const AUTH_ERROR_PATHS = new Set([
    "/admin/login",
    "/admin/login/verify",
]);

const isAuthRequest = (url = "") => {
    const path = String(url).split("?")[0];
    return AUTH_ERROR_PATHS.has(path);
};

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        if (
            typeof FormData !== "undefined" &&
            config.data instanceof FormData
        ) {
            config.headers.setContentType(undefined);
        }

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
        if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
            const loginPath = getPortalLoginPath(getStoredAdminUser());
            clearAdminSession();
            window.location.href = loginPath;
        }
        return Promise.reject(error);
    }
);

export default api;
