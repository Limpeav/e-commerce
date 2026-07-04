import axios from "axios";
import { getStoredAdminToken } from "../utils/adminSession";

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || "/api").trim();

  if (trimmed === "/api") {
    return "/api";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const getStoredUser = () => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const getUserToken = () => getStoredUser()?.token || null;

export const getAdminToken = () => getStoredAdminToken();

export const getPreferredToken = () => getAdminToken() || getUserToken();

export const withAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
