import { config } from "../config/index.js";

const {
  ADMIN_TOKEN,
  ADMIN_USER,
} = config.STORAGE_KEYS;

const parseStoredJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getStoredAdminUser = () =>
  parseStoredJson(localStorage.getItem(ADMIN_USER));

export const getStoredAdminToken = () => localStorage.getItem(ADMIN_TOKEN);

export const hasStoredAdminSession = () => {
  const adminUser = getStoredAdminUser();
  const adminToken = getStoredAdminToken();

  return Boolean(adminToken && adminUser?.role === "admin");
};

export const persistAdminSession = (authData) => {
  const adminToken = authData?.token || authData?.adminToken;
  const adminUser = authData?.admin || authData?.user || authData;

  if (!adminToken || adminUser?.role !== "admin") {
    throw new Error("Invalid admin session");
  }

  localStorage.setItem(ADMIN_TOKEN, adminToken);
  localStorage.setItem(
    ADMIN_USER,
    JSON.stringify({
      ...adminUser,
      token: adminToken,
    })
  );
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN);
  localStorage.removeItem(ADMIN_USER);
};
