import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

export const submitContactSupport = async (payload) => {
  const token = getUserToken();
  const response = await axios.post(`${API_BASE_URL}/support/contact`, payload, {
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(token),
    },
  });

  return response.data;
};
