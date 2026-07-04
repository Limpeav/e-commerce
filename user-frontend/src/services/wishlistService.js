import {
  addItemToWishlist,
  fetchWishlist,
  removeItemFromWishlist,
} from "./wishlistApi.js";
import { WishlistModel } from "../models/wishlistModel.js";

export const wishlistService = {
  async getWishlist() {
    const data = await fetchWishlist();
    return { data: WishlistModel.fromApi(data) };
  },

  async addToWishlist(productId) {
    const data = await addItemToWishlist(productId);
    return { data: WishlistModel.fromApi(data) };
  },

  async removeFromWishlist(productId) {
    const data = await removeItemFromWishlist(productId);
    return { data: WishlistModel.fromApi(data) };
  },
};

export default wishlistService;
