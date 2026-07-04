import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const DashboardController = {
  async getStats() {
    return modelResponse(
      await adminService.getDashboardStats(),
      AdminModels.dashboard
    );
  },

  async getOrders() {
    return modelResponse(await adminService.getOrders(), AdminModels.orders);
  },

  async getProducts() {
    return modelResponse(await adminService.getProducts(), AdminModels.products);
  },

  async getCashReport(date, period = "day") {
    return modelResponse(
      await adminService.getDailyCashReport(date, period),
      AdminModels.cashReport
    );
  },
};
