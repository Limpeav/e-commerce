import { supplierService } from "../services/supplierService";

export class SupplierController {
  static async getSuppliers(params) {
    try {
      const response = await supplierService.getSuppliers(params);
      return { success: true, data: response.data?.data || response.data || [], raw: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch suppliers",
        data: [],
      };
    }
  }

  static async getMetrics() {
    try {
      const response = await supplierService.getSupplierMetrics();
      return { success: true, data: response.data?.data || {} };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch metrics",
        data: {},
      };
    }
  }

  static async getSupplierById(id) {
    try {
      const response = await supplierService.getSupplierById(id);
      return { success: true, data: response.data?.data || response.data || {} };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch supplier details",
      };
    }
  }

  static async createSupplier(data) {
    try {
      const response = await supplierService.createSupplier(data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to create supplier",
      };
    }
  }

  static async updateSupplier(id, data) {
    try {
      const response = await supplierService.updateSupplier(id, data);
      return { success: true, data: response.data?.data || response.data, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to update supplier",
      };
    }
  }

  static async deleteSupplier(id) {
    try {
      const response = await supplierService.deleteSupplier(id);
      return { success: true, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to delete supplier",
      };
    }
  }

  static async getSupplierProducts(id) {
    try {
      const response = await supplierService.getSupplierProducts(id);
      return { success: true, data: response.data?.data || response.data || [] };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch supplier products",
        data: [],
      };
    }
  }
}
