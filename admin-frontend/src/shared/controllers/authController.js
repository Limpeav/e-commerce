import { adminService } from "../services/adminService.js";
import { modelResponse } from "../models/adminModels.js";

export const AuthController = {
  async login(credentials) {
    return modelResponse(await adminService.login(credentials));
  },

  async verifyLogin(challenge) {
    return modelResponse(await adminService.verifyLogin(challenge));
  },

  async logout() {
    return modelResponse(await adminService.logout());
  },

  async getCurrentUser() {
    return modelResponse(await adminService.getCurrentAdmin());
  },
};
