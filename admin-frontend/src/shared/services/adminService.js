import api from "./api.js";

const hasAttachments = (payload = {}) =>
  Array.isArray(payload.attachments) && payload.attachments.length > 0;

const toFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "attachments" || value === undefined || value === null) return;
    formData.append(key, value);
  });

  payload.attachments?.forEach((file) => {
    formData.append("attachments", file);
  });

  return formData;
};

const supportPayload = (payload = {}) =>
  hasAttachments(payload) ? toFormData(payload) : payload;

// Admin API methods
export const adminService = {
  // Authentication
  login: (credentials) => api.post("/admin/login", credentials),
  verifyLogin: (challenge) => api.post("/admin/login/verify", challenge),
  forgotPassword: (payload) => api.post("/admin/forgot-password", payload),
  resendResetCode: (payload) => api.post("/admin/forgot-password/resend", payload),
  verifyResetCode: (payload) => api.post("/admin/forgot-password/verify", payload),
  resetPassword: (payload) => api.post("/admin/reset-password", payload),
  logout: () => api.post("/admin/logout"),
  getCurrentAdmin: () => api.get("/admin/me"),
  updateCurrentAdmin: (payload) => api.put("/admin/me", payload),

  // Dashboard
  getDashboardStats: () => api.get("/admin/dashboard"),
  getSentimentReport: () => api.get("/admin/sentiment-report"),
  getFinancialSettings: () => api.get("/admin/financial-settings"),
  getPublicFinancialSettings: () => api.get("/settings/financial"),
  updateFinancialSettings: (payload) => api.put("/admin/financial-settings", payload),
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
  uploadProductImage: (fileData) => {
    return api.post("/admin/uploads/product-image", fileData);
  },

  // Users
  getUsers: () => api.get("/admin/users"),
  createStaffLogin: (userData) => api.post("/admin/users", userData),
  updateStaffLogin: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Orders
  // Product methods
  getProducts: (params) => api.get("/products", { params }),
  getProductSearchSuggestions: (params) => api.get("/products/search/suggestions", { params }),
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
  sendOrderReceiptToTelegram: (orderId, fileData, options = {}) =>
    api.post(`/orders/${orderId}/receipt-telegram`, fileData, { params: options }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),

  // Notifications
  getNotifications: () => api.get("/notifications"),
  getNotificationUnreadCount: () => api.get("/notifications/unread-count"),
  markNotificationRead: (id) => api.put(`/notifications/${encodeURIComponent(id)}/read`),
  markAllNotificationsRead: () => api.put("/notifications/mark-all-read"),
  deleteNotification: (id) => api.delete(`/notifications/${encodeURIComponent(id)}`),

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

  // Support tickets
  getSupportTickets: (params) => api.get("/admin/support/tickets", { params }),
  getSupportTicket: (ticketNumber) =>
    api.get(`/admin/support/tickets/${encodeURIComponent(ticketNumber)}`),
  replyToSupportTicket: (ticketNumber, payload) =>
    api.post(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/replies`,
      supportPayload(payload)
    ),
  updateSupportTicketStatus: (ticketNumber, payload) =>
    api.patch(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/status`,
      payload
    ),
  updateSupportTicketPriority: (ticketNumber, priority) =>
    api.patch(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/priority`,
      { priority }
    ),
  updateSupportTicketAssignment: (ticketNumber, assignedTo) =>
    api.patch(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/assignment`,
      { assignedTo }
    ),
  addSupportInternalNote: (ticketNumber, message) =>
    api.post(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/internal-notes`,
      { message }
    ),
  reopenSupportTicket: (ticketNumber, payload = {}) =>
    api.post(
      `/admin/support/tickets/${encodeURIComponent(ticketNumber)}/reopen`,
      payload
    ),
};

export default api;
