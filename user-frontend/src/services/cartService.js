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

  async addToCart(productId, quantity = 1, options = {}) {
    const data = await addItemToCart({
      productId,
      quantity,
      size: options.size || "",
      color: options.color || "",
    });
    return { data: CartModel.fromApi(data) };
  },

  async updateQuantity(productId, quantity, options = {}) {
    const data = await updateCartItemQuantity(
      productId,
      quantity,
      options.size || "",
      options.color || ""
    );
    return { data: CartModel.fromApi(data) };
  },

  async removeFromCart(productId, options = {}) {
    const data = await removeItemFromCart(
      productId,
      options.size || "",
      options.color || ""
    );
    return { data: CartModel.fromApi(data) };
  },

  async clearCart() {
    const data = await clearUserCart();
    return { data: CartModel.fromApi(data) };
  },
};

export default cartService;
