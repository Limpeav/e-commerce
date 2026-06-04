import axios from "axios";
import { config } from "../config/index.js";
import {
  clearAdminSession,
  getPortalLoginPath,
  getStoredAdminUser,
  getStoredAdminToken,
} from "../utils/adminSession.js";

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

// Admin API methods
export const adminService = {
  // Authentication
  login: (credentials) => api.post("/admin/login", credentials),
  getCurrentAdmin: () => api.get("/admin/me"),

  // Dashboard
  getDashboardStats: () => api.get("/admin/dashboard"),
  getDailyCashReport: (date, period = "day") =>
    api.get("/admin/cash-report", {
      params: {
        date,
        period,
        timezoneOffset: new Date().getTimezoneOffset(),
      },
    }),
  exportDailyCashReport: (date, period = "day") =>
    api.get("/admin/cash-report", {
      params: {
        date,
        period,
        timezoneOffset: new Date().getTimezoneOffset(),
        format: "csv",
      },
      responseType: "blob",
    }),
  getCsvBuilderDraft: () => api.get("/admin/csv-builder-draft"),
  saveCsvBuilderDraft: ({ rows, fileName }) =>
    api.put("/admin/csv-builder-draft", { rows, fileName }),
  uploadProductImage: (fileData) => {
    return api.post("/admin/uploads/product-image", fileData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Users
  getUsers: () => api.get("/admin/users"),
  createStaffLogin: (userData) => api.post("/admin/users", userData),
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
  importProductsCsv: (fileData) => {
    return api.post("/products/import-csv", fileData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  upsertProductsCsv: (fileData) => {
    return api.post("/products/upsert-csv", fileData, {
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
  sendStorePromotionEmails: () => api.post("/products/promotions/email"),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Banner methods
  getBanners: () => api.get("/banners/admin/all"),
  createBanner: (bannerData) => {
    return api.post("/banners", bannerData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateBanner: (id, bannerData) => {
    return api.put(`/banners/${id}`, bannerData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteBanner: (id) => api.delete(`/banners/${id}`),

  // Order methods
  getOrders: () => api.get("/orders"),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { orderStatus: status }),
  updatePaymentStatus: (orderId, paymentStatus) => api.put(`/orders/${orderId}/payment-status`, { paymentStatus }),
  uploadDeliveryProof: (orderId, fileData) =>
    api.put(`/orders/${orderId}/delivery-proof`, fileData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  sendOrderReceiptToTelegram: (orderId, fileData) =>
    api.post(`/orders/${orderId}/receipt-telegram`, fileData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
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
