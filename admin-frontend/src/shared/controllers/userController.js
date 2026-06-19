import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const UserController = {
  async getUsers() {
    return modelResponse(await adminService.getUsers(), AdminModels.users);
  },

  async getStats() {
    return modelResponse(await adminService.getUserStats(), AdminModels.userStats);
  },

  async createStaff(payload) {
    return modelResponse(await adminService.createStaffLogin(payload));
  },

  async updateRole(id, role) {
    return modelResponse(await adminService.updateUserRole(id, role));
  },

  async delete(id) {
    return adminService.deleteUser(id);
  },
};
