import { adminService } from "../services/adminService";

export class AdminProductController {
  static async getProducts(params) {
    try {
      const response = await adminService.getProducts(params);
      const body = response.data || {};
      return {
        success: true,
        data: Array.isArray(body) ? { products: body, total: body.length } : body,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch products",
      };
    }
  }

  static async deleteProduct(id) {
    try {
      await adminService.deleteProduct(id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Delete failed",
      };
    }
  }

  static async sendStorePromotionEmails() {
    try {
      const response = await adminService.sendStorePromotionEmails();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to send promotion emails",
        data: error.response?.data || null,
      };
    }
  }
}
