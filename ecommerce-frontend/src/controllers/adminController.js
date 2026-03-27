import { adminService } from "../services/adminService.js";

// Admin Controller - Handles admin logic
export class AdminController {
  static async getDashboardStats() {
    try {
      const response = await adminService.getDashboardStats();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all users
  static async getUsers() {
    try {
      const response = await adminService.getUsers();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all orders
  static async getOrders() {
    try {
      const response = await adminService.getOrders();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    try {
      const response = await adminService.updateOrderStatus(orderId, status);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create product
  static async createProduct(productData) {
    try {
      const response = await adminService.createProduct(productData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update product
  static async updateProduct(id, productData) {
    try {
      const response = await adminService.updateProduct(id, productData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete product
  static async deleteProduct(id) {
    try {
      const response = await adminService.deleteProduct(id);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update user role
  static async updateUserRole(userId, role) {
    try {
      const response = await adminService.updateUserRole(userId, role);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete user
  static async deleteUser(userId) {
    try {
      const response = await adminService.deleteUser(userId);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get sales analytics
  static async getSalesAnalytics(period = 'month') {
    try {
      const response = await adminService.getSalesAnalytics(period);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get inventory report
  static async getInventoryReport() {
    try {
      const response = await adminService.getInventoryReport();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Export data
  static async exportData(type, format = 'csv') {
    try {
      const response = await adminService.exportData(type, format);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static validateAdminAccess(user) {
    if (!user) {
      return { isValid: false, error: "User not authenticated" };
    }
    
    if (user.role !== "admin") {
      return { isValid: false, error: "Access denied. Admin role required." };
    }
    
    return { isValid: true };
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  static formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  static calculateGrowth(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }
}
