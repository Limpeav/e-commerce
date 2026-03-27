import { ProductModel } from "../models/productModel.js";
import { productService } from "../services/productService.js";

// Product Controller - Handles product logic
export class ProductController {
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

  static async getProducts() {
    try {
      const response = await productService.getAllProducts();
      const products = this.normalizeProducts(response.data || []);
      return { success: true, data: this.sortByNewest(products) };
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
