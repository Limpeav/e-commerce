import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const CashReportController = {
  async get(date, period = "day") {
    return modelResponse(
      await adminService.getDailyCashReport(date, period),
      AdminModels.cashReport
    );
  },

  async export(date, period = "day") {
    return adminService.exportDailyCashReport(date, period);
  },
};
