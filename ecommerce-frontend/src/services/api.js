import axios from "axios";

const API_URL = "http://localhost:4000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        if (adminData?.token) {
            config.headers.Authorization = `Bearer ${adminData.token}`;
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
            localStorage.removeItem("admin");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
