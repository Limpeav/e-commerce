import axios from "axios";
import { config } from "../config/index.js";
import { getStoredAdminToken } from "../utils/adminSession.js";

const API_URL = `${config.API_BASE_URL}/products`;

// Get authentication token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

export const productService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await axios.get(API_URL);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch products");
    }
  },

  getPersonalizedRecommendations: async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { data: { source: "none", products: [] } };
      }

      const response = await axios.get(`${API_URL}/recommendations/personalized`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch recommendations");
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const token = getAuthToken();
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {};
      const response = await axios.get(`${API_URL}/${id}`, config);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch product");
    }
  },

  translateMissingProductsToKhmer: async () => {
    try {
      const token = getAuthToken();
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {};
      const response = await axios.post(`${API_URL}/translate-khmer-missing`, {}, config);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to translate products");
    }
  },

  translateProductToKhmer: async (id) => {
    try {
      const token = getAuthToken();
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {};
      const response = await axios.post(`${API_URL}/${id}/translate-khmer`, {}, config);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to translate product");
    }
  },

  // Search products
  searchProducts: async (keyword) => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: keyword },
      });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to search products");
    }
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    try {
      const response = await axios.get(`${API_URL}/category/${category}`);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch products by category");
    }
  },

  // Create product review
  createReview: async (productId, reviewData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      const response = await axios.post(
        `${API_URL}/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create review");
    }
  },

  // Create product (admin only)
  createProduct: async (productData) => {
    try {
      const token = getStoredAdminToken();
      if (!token) {
        throw new Error("Admin authentication required");
      }
      const response = await axios.post(API_URL, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create product");
    }
  },

  // Update product (admin only)
  updateProduct: async (id, productData) => {
    try {
      const token = getStoredAdminToken();
      if (!token) {
        throw new Error("Admin authentication required");
      }
      const response = await axios.put(`${API_URL}/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update product");
    }
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    try {
      const token = getStoredAdminToken();
      if (!token) {
        throw new Error("Admin authentication required");
      }
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete product");
    }
  },

  // Get top products
  getTopProducts: async () => {
    try {
      const response = await axios.get(`${API_URL}/top`);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch top products");
    }
  },
};
