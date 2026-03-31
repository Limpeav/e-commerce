import { config } from "../config/index.js";

const API_URL = `${config.API_BASE_URL}/banners`;

export const fetchBanners = async () => {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch banners: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please make sure the backend server is running.");
    }

    throw error;
  }
};
