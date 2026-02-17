import { config } from "../config/index.js";

const API_URL = `${config.API_BASE_URL}/products`;

export const fetchProducts = async () => {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch products: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please make sure the backend server is running.");
    }
    throw error;
  }
};

export const fetchProductById = async (id, token = null) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/${id}`, {
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch product: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please make sure the backend server is running.");
    }
    throw error;
  }
};

export const createProductReview = async (productId, review, token) => {
  try {
    const res = await fetch(`${API_URL}/${productId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(review),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Failed to submit review: ${res.status} ${res.statusText}`);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please make sure the backend server is running.");
    }
    throw error;
  }
};
