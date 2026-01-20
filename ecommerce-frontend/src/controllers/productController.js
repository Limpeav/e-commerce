import { productService } from '../services/productService.js'

// Product Controller - Handles product logic
export class ProductController {
  // Get all products
  static async getProducts() {
    try {
      const response = await productService.getAllProducts()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get product by ID
  static async getProduct(id) {
    try {
      const response = await productService.getProductById(id)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Search products
  static async searchProducts(keyword) {
    try {
      const response = await productService.searchProducts(keyword)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get products by category
  static async getProductsByCategory(category) {
    try {
      const response = await productService.getProductsByCategory(category)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create product review
  static async createReview(productId, reviewData) {
    try {
      const response = await productService.createReview(productId, reviewData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create product (admin only)
  static async createProduct(productData) {
    try {
      const response = await productService.createProduct(productData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update product (admin only)
  static async updateProduct(id, productData) {
    try {
      const response = await productService.updateProduct(id, productData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Delete product (admin only)
  static async deleteProduct(id) {
    try {
      const response = await productService.deleteProduct(id)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get top products
  static async getTopProducts() {
    try {
      const response = await productService.getTopProducts()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Filter products
  static filterProducts(products, filters) {
    return products.filter(product => {
      let matches = true
      
      if (filters.category && filters.category !== 'all') {
        matches = matches && product.category === filters.category
      }
      
      if (filters.minPrice) {
        matches = matches && product.price >= filters.minPrice
      }
      
      if (filters.maxPrice) {
        matches = matches && product.price <= filters.maxPrice
      }
      
      if (filters.rating) {
        matches = matches && product.rating >= filters.rating
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        matches = matches && (
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        )
      }
      
      return matches
    })
  }

  // Sort products
  static sortProducts(products, sortBy) {
    const sorted = [...products]
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price)
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating)
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      default:
        return sorted
    }
  }
}

// Custom hook for product controller
// Note: This hook requires a useProducts hook to be implemented
// export const useProductController = () => {
//   const {
//     products,
//     currentProduct,
//     loading,
//     error,
//     fetchProducts,
//     fetchProduct,
//     createReview,
//     searchProducts,
//     fetchTopProducts,
//   } = useProducts()

//   return {
//     products,
//     currentProduct,
//     loading,
//     error,
//     fetchProducts,
//     fetchProduct,
//     createReview,
//     searchProducts,
//     fetchTopProducts,
//     filterProducts: ProductController.filterProducts,
//     sortProducts: ProductController.sortProducts,
//   }
// }
