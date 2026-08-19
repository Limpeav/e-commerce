import api from "./api";

export const purchaseOrderService = {
  getPurchaseOrders: (params = {}) => api.get("/admin/purchase-orders", { params }),
  getPOById: (id) => api.get(`/admin/purchase-orders/${id}`),
  createPO: (data) => api.post("/admin/purchase-orders", data),
  updatePO: (id, data) => api.put(`/admin/purchase-orders/${id}`, data),
  receivePOStock: (id, data) => api.post(`/admin/purchase-orders/${id}/receive`, data),
  recordPOPayment: (id, data) => api.post(`/admin/purchase-orders/${id}/payment`, data),
  deletePO: (id) => api.delete(`/admin/purchase-orders/${id}`),
};
