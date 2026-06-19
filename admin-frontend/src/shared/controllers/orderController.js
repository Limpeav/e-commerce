import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const OrderController = {
  async getOrders() {
    return modelResponse(await adminService.getOrders(), AdminModels.orders);
  },

  async getById(id) {
    return modelResponse(await adminService.getOrderById(id), AdminModels.order);
  },

  async updateStatus(id, status) {
    return modelResponse(
      await adminService.updateOrderStatus(id, status),
      AdminModels.order
    );
  },

  async updatePaymentStatus(id, paymentStatus) {
    return modelResponse(
      await adminService.updatePaymentStatus(id, paymentStatus),
      AdminModels.order
    );
  },

  async delete(id) {
    return adminService.deleteOrder(id);
  },

  async sendReceipt(id, formData) {
    return adminService.sendOrderReceiptToTelegram(id, formData);
  },
};
