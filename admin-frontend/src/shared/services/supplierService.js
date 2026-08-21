import api from "./api";

export const supplierService = {
  getSuppliers: (params = {}) => api.get("/admin/suppliers", { params }),
  getSupplierMetrics: () => api.get("/admin/suppliers/metrics"),
  getSupplierById: (id) => api.get(`/admin/suppliers/${id}`),
  createSupplier: (data) => api.post("/admin/suppliers", data),
  updateSupplier: (id, data) => api.put(`/admin/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/admin/suppliers/${id}`),
  getTelegramSetupLink: (id) => api.get(`/admin/suppliers/${id}/telegram-setup-link`),
  getSupplierProducts: (id) => api.get(`/admin/suppliers/${id}/products`),
};
