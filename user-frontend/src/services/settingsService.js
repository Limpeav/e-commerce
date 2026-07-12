import { apiClient } from "./http";

export const settingsService = {
  getFinancialSettings: () => apiClient.get("/settings/financial"),
};
