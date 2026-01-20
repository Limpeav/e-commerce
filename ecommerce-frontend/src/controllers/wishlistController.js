import { wishlistService } from '../services/wishlistService.js'
import { useWishlist } from '../context/WishlistContext'

// Wishlist Controller - Handles wishlist logic
export class WishlistController {
  // Add item to wishlist
  static async addToWishlist(product) {
    try {
      const response = await wishlistService.addToWishlist(product._id)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Remove item from wishlist
  static async removeFromWishlist(productId) {
    try {
      const response = await wishlistService.removeFromWishlist(productId)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get wishlist items
  static async getWishlist() {
    try {
      const response = await wishlistService.getWishlist()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Clear wishlist
  static async clearWishlist() {
    try {
      const response = await wishlistService.clearWishlist()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Check if item is in wishlist
  static isInWishlist(wishlistItems, productId) {
    return wishlistItems.some(item => item._id === productId)
  }

  // Move item from wishlist to cart
  static async moveToCart(product, addToCartFunction) {
    try {
      // Add to cart
      await addToCartFunction(product, 1)
      // Remove from wishlist
      await this.removeFromWishlist(product._id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get wishlist statistics
  static getWishlistStats(wishlistItems) {
    const totalItems = wishlistItems.length
    const totalValue = wishlistItems.reduce((total, item) => total + item.price, 0)
    const categories = [...new Set(wishlistItems.map(item => item.category))]
    
    return {
      totalItems,
      totalValue,
      categories,
      averagePrice: totalItems > 0 ? totalValue / totalItems : 0,
    }
  }

  // Filter wishlist items
  static filterWishlistItems(items, filters) {
    return items.filter(item => {
      let matches = true
      
      if (filters.category && filters.category !== 'all') {
        matches = matches && item.category === filters.category
      }
      
      if (filters.minPrice) {
        matches = matches && item.price >= filters.minPrice
      }
      
      if (filters.maxPrice) {
        matches = matches && item.price <= filters.maxPrice
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        matches = matches && (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        )
      }
      
      return matches
    })
  }

  // Sort wishlist items
  static sortWishlistItems(items, sortBy) {
    const sorted = [...items]
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price)
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      default:
        return sorted
    }
  }
}

// Custom hook for wishlist controller
export const useWishlistController = () => {
  const {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  } = useWishlist()

  const stats = WishlistController.getWishlistStats(wishlistItems)

  return {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    stats,
    filterItems: WishlistController.filterWishlistItems,
    sortItems: WishlistController.sortWishlistItems,
    moveToCart: WishlistController.moveToCart,
  }
}
