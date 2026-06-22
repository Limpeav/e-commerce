import { cartService } from "../services/cartService.js";
import { CartModel } from "../models/cartModel.js";

// Cart Controller - Handles cart logic
export class CartController {
  static async addToCart(product, quantity = 1, options = {}) {
    try {
      const response = await cartService.addToCart(product._id, quantity, options);
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  static async removeFromCart(itemId, options = {}) {
    try {
      const response = await cartService.removeFromCart(itemId, options);
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  static async updateQuantity(itemId, quantity, options = {}) {
    try {
      const response = await cartService.updateQuantity(itemId, quantity, options);
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  static async getCart() {
    try {
      const response = await cartService.getCart();
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async clearCart() {
    try {
      const response = await cartService.clearCart();
      return { success: true, data: response.data.items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static normalizeCart(cartItems = []) {
    return new CartModel(cartItems).items;
  }

  static calculateTotals(cartItems) {
    const cart = new CartModel(cartItems);
    const tax = cart.subtotal * 0.1;
    const shipping = 0;
    const grandTotal = cart.subtotal + tax + shipping;

    return {
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      tax,
      shipping,
      grandTotal,
    };
  }

  static validateCart(cartItems) {
    const items = this.normalizeCart(cartItems);
    const errors = [];
    
    if (items.length === 0) {
      errors.push("Cart is empty");
    }

    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.stock < item.quantity) {
        errors.push(`Item ${index + 1}: Not enough stock`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static getEstimatedDeliveryDate() {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);
    
    return deliveryDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }
}
