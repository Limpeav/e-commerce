import { adminService } from "../services/adminService.js";
import { AdminModels, modelResponse } from "../models/adminModels.js";

export const ProductController = {
  async getProducts() {
    return modelResponse(await adminService.getProducts(), AdminModels.products);
  },

  async getById(id) {
    return modelResponse(await adminService.getProductById(id), AdminModels.product);
  },

  async create(formData) {
    return modelResponse(await adminService.createProduct(formData), AdminModels.product);
  },

  async update(id, formData) {
    return modelResponse(
      await adminService.updateProduct(id, formData),
      AdminModels.product
    );
  },

  async uploadImage(formData) {
    return adminService.uploadProductImage(formData);
  },

  async importCsv(formData) {
    return adminService.importProductsCsv(formData);
  },

  async upsertCsv(formData) {
    return adminService.upsertProductsCsv(formData);
  },
};
