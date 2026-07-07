import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const UserController = {
  async getUsers() {
    return modelResponse(await adminService.getUsers(), AdminModels.users);
  },

  async createStaff(payload) {
    return modelResponse(await adminService.createStaffLogin(payload));
  },

  async updateStaff(id, payload) {
    return modelResponse(await adminService.updateStaffLogin(id, payload));
  },

  async updateRole(id, role) {
    return modelResponse(await adminService.updateUserRole(id, role));
  },

  async delete(id) {
    return adminService.deleteUser(id);
  },
};
