import { wishlistService } from "../services/wishlistService.js";
import { WishlistModel } from "../models/wishlistModel.js";

// Wishlist Controller - Handles wishlist logic
export class WishlistController {
  static async addToWishlist(product) {
    try {
      const response = await wishlistService.addToWishlist(product._id);
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async removeFromWishlist(productId) {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getWishlist() {
    try {
      const response = await wishlistService.getWishlist();
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static normalizeWishlist(items = []) {
    return new WishlistModel(items).items;
  }

  static isInWishlist(wishlistItems, productId) {
    return this.normalizeWishlist(wishlistItems).some(
      (item) => item._id === productId
    );
  }

  static async moveToCart(product, addToCartFunction) {
    try {
      await addToCartFunction(product, 1);
      await this.removeFromWishlist(product._id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static getWishlistStats(wishlistItems) {
    const items = this.normalizeWishlist(wishlistItems);
    const totalItems = items.length;
    const totalValue = items.reduce((total, item) => total + item.price, 0);
    const categories = [...new Set(items.map((item) => item.category))];
    
    return {
      totalItems,
      totalValue,
      categories,
      averagePrice: totalItems > 0 ? totalValue / totalItems : 0,
    };
  }

  static filterWishlistItems(items, filters) {
    return this.normalizeWishlist(items).filter((item) => {
      let matches = true;
      
      if (filters.category && filters.category !== "all") {
        matches = matches && item.category === filters.category;
      }
      
      if (filters.minPrice) {
        matches = matches && item.price >= filters.minPrice;
      }
      
      if (filters.maxPrice) {
        matches = matches && item.price <= filters.maxPrice;
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        matches = matches && (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        );
      }
      
      return matches;
    });
  }

  static sortWishlistItems(items, sortBy) {
    const sorted = [...this.normalizeWishlist(items)];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      default:
        return sorted;
    }
  }
}
