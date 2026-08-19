import { purchaseOrderService } from "../services/purchaseOrderService";

export class PurchaseOrderController {
  static async getPurchaseOrders(params) {
    try {
      const response = await purchaseOrderService.getPurchaseOrders(params);
      return { success: true, data: response.data?.data || response.data || [], raw: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch purchase orders",
        data: [],
      };
    }
  }

  static async getPOById(id) {
    try {
      const response = await purchaseOrderService.getPOById(id);
      return { success: true, data: response.data?.data || response.data || {} };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch purchase order",
      };
    }
  }

  static async createPO(data) {
    try {
      const response = await purchaseOrderService.createPO(data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to create purchase order",
      };
    }
  }

  static async updatePO(id, data) {
    try {
      const response = await purchaseOrderService.updatePO(id, data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to update purchase order",
      };
    }
  }

  static async receiveStock(id, data) {
    try {
      const response = await purchaseOrderService.receivePOStock(id, data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to receive stock",
      };
    }
  }

  static async recordPayment(id, data) {
    try {
      const response = await purchaseOrderService.recordPOPayment(id, data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to record payment",
      };
    }
  }

  static async deletePO(id) {
    try {
      const response = await purchaseOrderService.deletePO(id);
      return { success: true, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to delete purchase order",
      };
    }
  }
}
