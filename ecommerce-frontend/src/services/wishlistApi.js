import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

const API_URL = `${API_BASE_URL}/wishlist`;

// Get user's wishlist
export const fetchWishlist = async () => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add item to wishlist
export const addItemToWishlist = async (productId) => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.post(
    `${API_URL}/add`,
    { productId },
    config
  );
  return response.data;
};

// Remove item from wishlist
export const removeItemFromWishlist = async (productId) => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.delete(
    `${API_URL}/remove/${productId}`,
    config
  );
  return response.data;
};
