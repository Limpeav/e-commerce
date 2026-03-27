import {
  addItemToCart,
  clearUserCart,
  fetchCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "./cartApi.js";
import { CartModel } from "../models/cartModel.js";

export const cartService = {
  async getCart() {
    const data = await fetchCart();
    return { data: CartModel.fromApi(data) };
  },

  async addToCart(productId, quantity = 1) {
    const data = await addItemToCart({ productId, quantity });
    return { data: CartModel.fromApi(data) };
  },

  async updateQuantity(productId, quantity) {
    const data = await updateCartItemQuantity(productId, quantity);
    return { data: CartModel.fromApi(data) };
  },

  async removeFromCart(productId) {
    const data = await removeItemFromCart(productId);
    return { data: CartModel.fromApi(data) };
  },

  async clearCart() {
    const data = await clearUserCart();
    return { data: CartModel.fromApi(data) };
  },
};

export default cartService;
