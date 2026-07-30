const normalizeUrl = (url) => String(url || "").replace(/\/+$/, "");

const FALLBACK_ADMIN_URL = "https://admin-frontend-02jx.onrender.com";
const FALLBACK_CUSTOMER_URL = "https://cherishbabykhstore.store";

export const portalConfig = {
  portal: import.meta.env.VITE_APP_PORTAL || "all",
  adminUrl: normalizeUrl(import.meta.env.VITE_ADMIN_URL) || FALLBACK_ADMIN_URL,
  customerUrl:
    normalizeUrl(import.meta.env.VITE_CUSTOMER_URL) || FALLBACK_CUSTOMER_URL,
};

const getCurrentOrigin = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeUrl(window.location.origin);
};

const getCurrentHostname = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
};

export const getActivePortal = () => {
  const currentOrigin = getCurrentOrigin();
  const currentHostname = getCurrentHostname();

  if (portalConfig.adminUrl && currentOrigin === portalConfig.adminUrl) {
    return "admin";
  }

  if (portalConfig.customerUrl && currentOrigin === portalConfig.customerUrl) {
    return "customer";
  }

  if (
    currentHostname.startsWith("admin.") ||
    currentHostname.includes("admin-frontend")
  ) {
    return "admin";
  }

  if (
    currentHostname.startsWith("customer.") ||
    currentHostname.includes("customer-frontend")
  ) {
    return "customer";
  }

  return portalConfig.portal;
};

export const isPortalPath = (pathname) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

export const isCustomerPortal = () => getActivePortal() === "customer";

export const isAdminPortal = () => getActivePortal() === "admin";

export const buildPortalUrl = (baseUrl, location, fallbackPath = "/") => {
  const path = location.pathname || fallbackPath;
  const search = location.search || "";
  const hash = location.hash || "";

  if (!baseUrl) {
    return `${path}${search}${hash}`;
  }

  return `${baseUrl}${path}${search}${hash}`;
};
