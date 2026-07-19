import { adminService } from "../services/adminService.js";
import { modelResponse } from "../models/adminModels.js";

export const AuthController = {
  async login(credentials) {
    return modelResponse(await adminService.login(credentials));
  },

  async verifyLogin(challenge) {
    return modelResponse(await adminService.verifyLogin(challenge));
  },

  async forgotPassword(payload) {
    return modelResponse(await adminService.forgotPassword(payload));
  },

  async resendResetCode(payload) {
    return modelResponse(await adminService.resendResetCode(payload));
  },

  async verifyResetCode(payload) {
    return modelResponse(await adminService.verifyResetCode(payload));
  },

  async resetPassword(payload) {
    return modelResponse(await adminService.resetPassword(payload));
  },

  async logout() {
    return modelResponse(await adminService.logout());
  },

  async getCurrentUser() {
    return modelResponse(await adminService.getCurrentAdmin());
  },

  async updateCurrentUser(payload) {
    return modelResponse(await adminService.updateCurrentAdmin(payload));
  },
};
