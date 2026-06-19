import { adminService } from "../services/adminService.js";
import { modelResponse } from "../models/adminModels.js";

export const AuthController = {
  async login(credentials) {
    return modelResponse(await adminService.login(credentials));
  },

  async getCurrentUser() {
    return modelResponse(await adminService.getCurrentAdmin());
  },
};
