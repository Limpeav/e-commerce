import axios from "axios";
import { createHttpExports } from "../../../../shared-frontend/services/http.js";
import { getStoredAdminToken } from "../utils/adminSession";

export const {
  API_BASE_URL,
  getStoredUser,
  getUserToken,
  getAdminToken,
  getPreferredToken,
  withAuthHeaders,
  apiClient,
} = createHttpExports({
  axios,
  rawApiUrl: import.meta.env.VITE_API_URL,
  getStoredAdminToken,
});
