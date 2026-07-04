import { adminService } from "../services/adminService";

const PRODUCT_LIST_KEYS = ["products", "items", "results", "data"];

const normalizeProductsResponse = (body) => {
  if (Array.isArray(body)) {
    return {
      products: body,
      total: body.length,
      totalPages: 1,
      page: 1,
    };
  }

  if (!body || typeof body !== "object") {
    throw new Error("Products API returned an invalid response");
  }

  for (const key of PRODUCT_LIST_KEYS) {
    const value = body[key];

    if (Array.isArray(value)) {
      return {
        ...body,
        products: value,
        total: Number(body.total ?? body.count ?? value.length) || value.length,
        totalPages: Number(body.totalPages ?? body.pages ?? 1) || 1,
        page: Number(body.page ?? 1) || 1,
      };
    }

    if (value && typeof value === "object") {
      const nested = normalizeProductsResponse(value);
      return {
        ...nested,
        total: Number(body.total ?? nested.total) || nested.products.length,
        totalPages: Number(body.totalPages ?? nested.totalPages) || 1,
        page: Number(body.page ?? nested.page) || 1,
      };
    }
  }

  throw new Error("Products API response is missing a products list");
};

export class AdminProductController {
  static async getProducts(params) {
    try {
      const response = await adminService.getProducts(params);
      const body = response.data || {};
      return {
        success: true,
        data: normalizeProductsResponse(body),
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch products",
      };
    }
  }

  static async deleteProduct(id) {
    try {
      await adminService.deleteProduct(id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Delete failed",
      };
    }
  }

  static async sendStorePromotionEmails() {
    try {
      const response = await adminService.sendStorePromotionEmails();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to send promotion emails",
        data: error.response?.data || null,
      };
    }
  }
}
