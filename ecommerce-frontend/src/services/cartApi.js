import axios from "axios";
import { config } from "../config/index.js";
import { authService } from "./authService.js";

const API_URL = `${config.API_BASE_URL}/cart`;

const cartClient = axios.create();

cartClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.expireSession();
    }

    return Promise.reject(error);
  }
);

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
  const response = await cartClient.get(API_URL, config);
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
  const response = await cartClient.post(`${API_URL}/add`, productData, config);
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
  const response = await cartClient.put(
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
  const response = await cartClient.delete(`${API_URL}/remove/${productId}`, config); // ✅ Add /remove/
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
  const response = await cartClient.delete(API_URL, config);
  return response.data;
};
