import axios from "axios";
import { config } from "../config/index.js";

const API_URL = `${config.API_BASE_URL}/wishlist`;

// Get authentication token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

// Get user's wishlist
export const fetchWishlist = async () => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add item to wishlist
export const addItemToWishlist = async (productId) => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(
    `${API_URL}/remove/${productId}`,
    config
  );
  return response.data;
};
