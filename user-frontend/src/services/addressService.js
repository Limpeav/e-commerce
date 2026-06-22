import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http.js";

const ADDRESSS_API_URL = `${API_BASE_URL}/users/addresses`;

const getConfig = (token = getUserToken()) => {
  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    headers: {
      ...withAuthHeaders(token),
      "Content-Type": "application/json",
    },
  };
};

export const addressService = {
  async getAddresses() {
    try {
      const response = await axios.get(ADDRESSS_API_URL, getConfig());
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to load addresses");
    }
  },

  async createAddress(payload) {
    try {
      const response = await axios.post(ADDRESSS_API_URL, payload, getConfig());
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to save address");
    }
  },

  async updateAddress(addressId, payload) {
    try {
      const response = await axios.put(
        `${ADDRESSS_API_URL}/${addressId}`,
        payload,
        getConfig()
      );
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to save address");
    }
  },

  async deleteAddress(addressId) {
    try {
      const response = await axios.delete(`${ADDRESSS_API_URL}/${addressId}`, getConfig());
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete address");
    }
  },

  async setDefaultAddress(addressId) {
    try {
      const response = await axios.put(
        `${ADDRESSS_API_URL}/${addressId}/default`,
        {},
        getConfig()
      );
      return { data: response.data };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to set default address"
      );
    }
  },
};
