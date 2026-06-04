import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";
import { ORDER_REQUEST_TIMEOUT_MS } from "../utils/checkout";

export const createOrder = async (orderData) => {
  const token = getUserToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
    headers: {
      ...withAuthHeaders(token),
      "Content-Type": "application/json",
    },
    timeout: ORDER_REQUEST_TIMEOUT_MS,
  });
  return response.data;
};

export const getOrderById = async (orderId) => {
  const token = getUserToken();
  const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
    headers: withAuthHeaders(token),
  });
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const token = getUserToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await axios.put(
    `${API_BASE_URL}/orders/${orderId}/cancel`,
    {},
    {
      headers: withAuthHeaders(token),
    }
  );
  return response.data;
};

export const trackOrder = async (orderNumber) => {
  const token = getUserToken();
  if (!token) {
    throw new Error("Please log in to track your order.");
  }

  const response = await axios.get(
    `${API_BASE_URL}/orders/track/${encodeURIComponent(orderNumber)}`,
    {
      headers: withAuthHeaders(token),
    }
  );
  return response.data;
};
