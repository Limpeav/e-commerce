import { DashboardController } from "./dashboardController.js";

export const ReportController = {
  async getReportData() {
    const [dashboard, orders, products] = await Promise.all([
      DashboardController.getStats(),
      DashboardController.getOrders(),
      DashboardController.getProducts(),
    ]);

    return {
      stats: dashboard.data,
      orders: orders.data,
      products: products.data,
    };
  },
};
