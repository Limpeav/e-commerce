import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const CashReportController = {
  async get(date, period = "day", options = {}) {
    return modelResponse(
      await adminService.getDailyCashReport(date, period, options),
      AdminModels.cashReport
    );
  },

  async export(date, period = "day", options = {}) {
    return adminService.exportDailyCashReport(date, period, options);
  },
};
