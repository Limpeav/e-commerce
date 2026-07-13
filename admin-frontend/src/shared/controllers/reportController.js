import { DashboardController } from "./dashboardController.js";
import { adminService } from "../services/adminService.js";

export const ReportController = {
  async getReportData() {
    const [dashboard, orders, products, sentimentReport] = await Promise.all([
      DashboardController.getStats(),
      DashboardController.getOrders(),
      DashboardController.getProducts(),
      adminService.getSentimentReport(),
    ]);

    return {
      stats: dashboard.data,
      orders: orders.data,
      products: products.data,
      sentiment: sentimentReport.data?.sentiment || dashboard.data?.sentiment,
    };
  },
};
