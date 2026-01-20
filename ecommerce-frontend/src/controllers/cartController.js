import { cartService } from '../services/cartService.js'
import { useCart } from '../context/CartContext'

// Cart Controller - Handles cart logic
export class CartController {
  // Add item to cart
  static async addToCart(product, quantity = 1) {
    try {
      const response = await cartService.addToCart(product._id, quantity)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Remove item from cart
  static async removeFromCart(itemId) {
    try {
      const response = await cartService.removeFromCart(itemId)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update item quantity
  static async updateQuantity(itemId, quantity) {
    try {
      const response = await cartService.updateQuantity(itemId, quantity)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get cart items
  static async getCart() {
    try {
      const response = await cartService.getCart()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Clear cart
  static async clearCart() {
    try {
      const response = await cartService.clearCart()
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Calculate cart totals
  static calculateTotals(cartItems) {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0)
    const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    const tax = totalAmount * 0.1 // 10% tax
    const shipping = totalAmount > 100 ? 0 : 10 // Free shipping over $100
    const grandTotal = totalAmount + tax + shipping

    return {
      totalItems,
      subtotal: totalAmount,
      tax,
      shipping,
      grandTotal,
    }
  }

  // Validate cart before checkout
  static validateCart(cartItems) {
    const errors = []
    
    if (cartItems.length === 0) {
      errors.push('Cart is empty')
    }

    cartItems.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (item.stock < item.quantity) {
        errors.push(`Item ${index + 1}: Not enough stock`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Get estimated delivery date
  static getEstimatedDeliveryDate() {
    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + 7) // 7 days from now
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format price with currency
  static formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }
}

// Custom hook for cart controller
export const useCartController = () => {
  const {
    cartItems,
    totalItems,
    totalAmount,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart()

  const totals = CartController.calculateTotals(cartItems)
  const validation = CartController.validateCart(cartItems)

  return {
    cartItems,
    totalItems,
    totalAmount,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totals,
    validation,
    estimatedDelivery: CartController.getEstimatedDeliveryDate(),
    formatPrice: CartController.formatPrice,
  }
}
