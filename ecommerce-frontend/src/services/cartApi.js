import axios from "axios";
import { config } from "../config/index.js";

const API_URL = `${config.API_BASE_URL}/cart`;

// Get authentication token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

// Get user's cart
export const fetchCart = async () => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add item to cart
export const addItemToCart = async (productData) => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/add`, productData, config);
  return response.data;
};

// Update cart item quantity
export const updateCartItemQuantity = async (productId, quantity, size = "") => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.put(
    `${API_URL}/${productId}`,
    { quantity, size },
    config
  ); // ✅ Remove productId from body
  return response.data;
};

// Remove item from cart
export const removeItemFromCart = async (productId, size = "") => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: size ? { size } : {},
  };
  const response = await axios.delete(`${API_URL}/remove/${productId}`, config); // ✅ Add /remove/
  return response.data;
};

// Clear entire cart
export const clearUserCart = async () => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(API_URL, config);
  return response.data;
};
