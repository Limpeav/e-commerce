import { ProductModel } from "../models/productModel.js";
import { productService } from "../services/productService.js";

// Product Controller - Handles product logic
export class ProductController {
  static getReviewStorageKey(userId, productId) {
    return `reviewed_${userId}_${productId}`;
  }

  static hasReviewed(userId, productId) {
    if (!userId || !productId) {
      return false;
    }

    return (
      localStorage.getItem(this.getReviewStorageKey(userId, productId)) === "true"
    );
  }

  static markReviewed(userId, productId) {
    if (!userId || !productId) {
      return;
    }

    localStorage.setItem(this.getReviewStorageKey(userId, productId), "true");
  }

  static sortByNewest(products = []) {
    return [...products].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  static normalizeProducts(products = []) {
    return products.map((product) =>
      product instanceof ProductModel ? product : ProductModel.fromAPI(product)
    );
  }

  static async getProducts(params = {}) {
    try {
      const response = await productService.getAllProducts(params);
      const body = response.data || {};
      const rawProducts = body.products || [];
      const products = this.normalizeProducts(rawProducts);
      return {
        success: true,
        data: {
          products: this.sortByNewest(products),
          page: body.page ?? 1,
          totalPages: body.totalPages ?? 1,
          total: body.total ?? rawProducts.length,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getPersonalizedRecommendations() {
    try {
      const response = await productService.getPersonalizedRecommendations();
      return {
        success: true,
        data: {
          source: response.data?.source || "none",
          products: this.normalizeProducts(response.data?.products || []),
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getProduct(id) {
    try {
      const response = await productService.getProductById(id);
      return { success: true, data: ProductModel.fromAPI(response.data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getProductDetail(id, user) {
    try {
      const response = await productService.getProductById(id);
      const product = ProductModel.fromAPI(response.data);

      if (response.data?.alreadyReviewed && user?._id) {
        this.markReviewed(user._id, id);
      }

      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async translateProductToKhmer(id) {
    try {
      const response = await productService.translateProductToKhmer(id);
      return { success: true, data: ProductModel.fromAPI(response.data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async translateMissingProductsToKhmer() {
    try {
      const response = await productService.translateMissingProductsToKhmer();
      return { success: true, data: this.sortByNewest(this.normalizeProducts(response.data || [])) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async searchProducts(keyword) {
    try {
      const response = await productService.searchProducts(keyword);
      return { success: true, data: this.normalizeProducts(response.data || []) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getProductsByCategory(category) {
    try {
      const response = await productService.getProductsByCategory(category);
      return { success: true, data: this.normalizeProducts(response.data || []) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async createReview(productId, reviewData) {
    try {
      const response = await productService.createReview(productId, reviewData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async submitReview(productId, user, reviewData) {
    try {
      if (!user) {
        return { success: false, error: "You must be logged in to submit a review" };
      }

      if (!user.token) {
        return {
          success: false,
          error: "Authentication token missing. Please log in again.",
        };
      }

      const response = await productService.createReview(productId, reviewData);
      this.markReviewed(user._id || user.id, productId);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.message === "Product already reviewed") {
        this.markReviewed(user?._id || user?.id, productId);
        return { success: true, data: { alreadyReviewed: true } };
      }

      return { success: false, error: error.message };
    }
  }

  static async createProduct(productData) {
    try {
      const sanitized = ProductModel.sanitize(productData);
      const validation = ProductModel.validate(sanitized);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      const response = await productService.createProduct(sanitized);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateProduct(id, productData) {
    try {
      const sanitized = ProductModel.sanitize(productData);
      const validation = ProductModel.validate(sanitized);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      const response = await productService.updateProduct(id, sanitized);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async deleteProduct(id) {
    try {
      const response = await productService.deleteProduct(id);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getTopProducts() {
    try {
      const response = await productService.getTopProducts();
      return { success: true, data: this.normalizeProducts(response.data || []) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static filterProducts(products, filters) {
    return this.normalizeProducts(products).filter((product) => {
      let matches = true;
      
      if (filters.category && filters.category !== "all") {
        matches = matches && product.category === filters.category;
      }
      
      if (filters.minPrice) {
        matches = matches && product.price >= filters.minPrice;
      }
      
      if (filters.maxPrice) {
        matches = matches && product.price <= filters.maxPrice;
      }
      
      if (filters.rating) {
        matches = matches && product.rating >= filters.rating;
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        matches = matches && (
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }
      
      return matches;
    });
  }

  static sortProducts(products, sortBy) {
    const sorted = [...this.normalizeProducts(products)];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
        return this.sortByNewest(sorted);
      default:
        return sorted;
    }
  }
}
