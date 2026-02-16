import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

export const getOrderById = async (orderId) => {
  const token = getUserToken();
  const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
    headers: withAuthHeaders(token),
  });
  return response.data;
};
