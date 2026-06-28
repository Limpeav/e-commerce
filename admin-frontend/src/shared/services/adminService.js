import api from "./api.js";

// Admin API methods
export const adminService = {
  // Authentication
  login: (credentials) => api.post("/admin/login", credentials),
  verifyLogin: (challenge) => api.post("/admin/login/verify", challenge),
  forgotPassword: (payload) => api.post("/admin/forgot-password", payload),
  verifyResetCode: (payload) => api.post("/admin/forgot-password/verify", payload),
  resetPassword: (payload) => api.post("/admin/reset-password", payload),
  logout: () => api.post("/admin/logout"),
  getCurrentAdmin: () => api.get("/admin/me"),
  updateCurrentAdmin: (payload) => api.put("/admin/me", payload),

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
    return api.post("/admin/uploads/product-image", fileData);
  },

  // Users
  getUsers: () => api.get("/admin/users"),
  createStaffLogin: (userData) => api.post("/admin/users", userData),
  updateStaffLogin: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  getUserStats: () => api.get("/admin/users/stats"),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Orders
  // Product methods
  getProducts: (params) => api.get("/products", { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => {
    return api.post("/products", productData);
  },
  importProductsCsv: (fileData) => {
    return api.post("/products/import-csv", fileData);
  },
  upsertProductsCsv: (fileData) => {
    return api.post("/products/upsert-csv", fileData);
  },
  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },
  sendStorePromotionEmails: () => api.post("/products/promotions/email"),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Banner methods
  getBanners: () => api.get("/banners/admin/all"),
  createBanner: (bannerData) => {
    return api.post("/banners", bannerData);
  },
  updateBanner: (id, bannerData) => {
    return api.put(`/banners/${id}`, bannerData);
  },
  deleteBanner: (id) => api.delete(`/banners/${id}`),

  // Order methods
  getOrders: () => api.get("/orders"),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { orderStatus: status }),
  updatePaymentStatus: (orderId, paymentStatus) => api.put(`/orders/${orderId}/payment-status`, { paymentStatus }),
  uploadDeliveryProof: (orderId, fileData) =>
    api.put(`/orders/${orderId}/delivery-proof`, fileData),
  sendOrderReceiptToTelegram: (orderId, fileData) =>
    api.post(`/orders/${orderId}/receipt-telegram`, fileData),
  deleteOrder: (id) => api.delete(`/orders/${id}`),

  // Analytics
  getSalesAnalytics: (period) => api.get(`/admin/analytics/sales?period=${period}`),
  getInventoryReport: () => api.get("/admin/reports/inventory"),

  // Data export
  exportData: (type, format) => api.get(`/admin/export/${type}?format=${format}`),

  // Cleanup
  cleanupReviews: () => api.post("/admin/cleanup-reviews"),
  getReviewQueue: (params) => api.get("/admin/reviews", { params }),
  moderateReview: (productId, reviewId, payload) =>
    api.put(`/admin/reviews/${productId}/${reviewId}`, payload),
};

export default api;
