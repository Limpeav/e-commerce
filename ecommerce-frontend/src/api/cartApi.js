import axios from "axios";

const API_URL = "http://localhost:4000/api/cart";

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
export const updateCartItemQuantity = async (productId, quantity) => {
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  const token = getAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
