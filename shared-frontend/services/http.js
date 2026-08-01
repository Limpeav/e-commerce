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

const getStoredUser = () => {
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

const withAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const createHttpExports = ({ axios, rawApiUrl, getStoredAdminToken }) => {
  const API_BASE_URL = normalizeApiBaseUrl(rawApiUrl);
  const getUserToken = () => getStoredUser()?.token || null;
  const getAdminToken = () => getStoredAdminToken();
  const getPreferredToken = () => getAdminToken() || getUserToken();
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return {
    API_BASE_URL,
    getStoredUser,
    getUserToken,
    getAdminToken,
    getPreferredToken,
    withAuthHeaders,
    apiClient,
  };
};
