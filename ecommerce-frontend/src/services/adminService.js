import axios from "axios";
import { config } from "../config/index.js";

const API_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add admin token to requests
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
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
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

// Admin API methods
export const adminService = {
  // Authentication
  login: (credentials) => api.post("/admin/login", credentials),
  getCurrentAdmin: () => api.get("/admin/me"),

  // Dashboard
  getDashboardStats: () => api.get("/admin/dashboard"),

  // Users
  getUsers: () => api.get("/admin/users"),
  getUserStats: () => api.get("/admin/users/stats"),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Orders
  // Product methods
  getProducts: () => api.get("/products"),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => {
    return api.post("/products", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Order methods
  getOrders: () => api.get("/orders"),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { orderStatus: status }),
  updatePaymentStatus: (orderId, paymentStatus) => api.put(`/orders/${orderId}/payment-status`, { paymentStatus }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),

  // Analytics
  getSalesAnalytics: (period) => api.get(`/admin/analytics/sales?period=${period}`),
  getInventoryReport: () => api.get("/admin/reports/inventory"),

  // Data export
  exportData: (type, format) => api.get(`/admin/export/${type}?format=${format}`),

  // Cleanup
  cleanupReviews: () => api.post("/admin/cleanup-reviews")
};

export default api;
