import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

const API_URL = `${API_BASE_URL}/cart`;

// Get user's cart
export const fetchCart = async () => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add item to cart
export const addItemToCart = async (productData) => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.post(`${API_URL}/add`, productData, config);
  return response.data;
};

// Update cart item quantity
export const updateCartItemQuantity = async (productId, quantity) => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.put(
    `${API_URL}/${productId}`,
    { quantity },
    config
  ); // ✅ Remove productId from body
  return response.data;
};

// Remove item from cart
export const removeItemFromCart = async (productId) => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.delete(`${API_URL}/remove/${productId}`, config); // ✅ Add /remove/
  return response.data;
};

// Clear entire cart
export const clearUserCart = async () => {
  const token = getUserToken();
  const config = {
    headers: withAuthHeaders(token),
  };
  const response = await axios.delete(API_URL, config);
  return response.data;
};
