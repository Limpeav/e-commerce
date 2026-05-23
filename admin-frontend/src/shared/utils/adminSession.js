const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_KEY = "admin";

export const getStoredAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const getStoredAdminUser = () => {
  const adminStr = localStorage.getItem(ADMIN_KEY);
  if (!adminStr || adminStr === "undefined") return null;
  try {
    return JSON.parse(adminStr);
  } catch {
    return null;
  }
};

export const hasStoredAdminSession = () => {
  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
};

export const setAdminSession = (token, admin) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
};

export const persistAdminSession = (token, admin) => {
  setAdminSession(token, admin);
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

export const getPortalLoginPath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "delivery") {
    return "/delivery/login";
  }

  if (admin?.role === "seller") {
    return "/seller/login";
  }

  return "/admin/login";
};

export const getPortalOrdersPath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "delivery") {
    return "/delivery/orders";
  }

  if (admin?.role === "seller") {
    return "/seller/orders";
  }

  return "/admin/orders";
};

export const getPortalDashboardPath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "delivery") {
    return getPortalOrdersPath(admin);
  }

  if (admin?.role === "seller") {
    return "/seller/dashboard";
  }

  return "/admin";
};

export const getPortalOrderDetailsPath = (orderId, admin = getStoredAdminUser()) => {
  return `${getPortalOrdersPath(admin)}/${orderId}`;
};

export const getPortalCashReportPath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "seller") {
    return "/seller/cash-report";
  }

  return "/admin/cash-report";
};

export const getPortalPaymentQueuePath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "seller") {
    return "/seller/payment-queue";
  }

  return "/admin/orders";
};

export const getStoredAdmin = () => {
  const adminStr = localStorage.getItem(ADMIN_KEY);
  if (!adminStr || adminStr === "undefined") return null;
  try {
    return JSON.parse(adminStr);
  } catch {
    return null;
  }
};
