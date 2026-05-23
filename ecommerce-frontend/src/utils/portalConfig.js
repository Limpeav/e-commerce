const normalizeUrl = (url) => String(url || "").replace(/\/+$/, "");

export const portalConfig = {
  portal: import.meta.env.VITE_APP_PORTAL || "all",
  adminUrl: normalizeUrl(import.meta.env.VITE_ADMIN_URL),
  customerUrl: normalizeUrl(import.meta.env.VITE_CUSTOMER_URL),
};

export const isPortalPath = (pathname) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

export const isCustomerPortal = () => portalConfig.portal === "customer";

export const isAdminPortal = () => portalConfig.portal === "admin";

export const buildPortalUrl = (baseUrl, location, fallbackPath = "/") => {
  const path = location.pathname || fallbackPath;
  const search = location.search || "";
  const hash = location.hash || "";

  if (!baseUrl) {
    return `${path}${search}${hash}`;
  }

  return `${baseUrl}${path}${search}${hash}`;
};
