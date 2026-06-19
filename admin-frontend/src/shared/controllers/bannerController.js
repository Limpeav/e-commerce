import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const BannerController = {
  async getAll() {
    return modelResponse(await adminService.getBanners(), AdminModels.banners);
  },

  async create(formData) {
    return modelResponse(await adminService.createBanner(formData));
  },

  async update(id, formData) {
    return modelResponse(await adminService.updateBanner(id, formData));
  },

  async delete(id) {
    return adminService.deleteBanner(id);
  },
};
