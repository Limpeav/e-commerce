const LEGACY_ADMIN_TOKEN_KEY = "admin_token";
const LEGACY_ADMIN_KEY = "admin";
const PORTAL_ROLES = ["admin", "seller", "delivery"];

const getPortalRoleFromPath = (pathname = window.location.pathname) => {
  if (pathname.startsWith("/seller")) return "seller";
  if (pathname.startsWith("/delivery")) return "delivery";
  return "admin";
};

const getSessionKeys = (role = getPortalRoleFromPath()) => ({
  token: `${role}_token`,
  user: role,
});

const parseStoredUser = (key) => {
  const adminStr = sessionStorage.getItem(key);
  if (!adminStr || adminStr === "undefined") return null;
  try {
    return JSON.parse(adminStr);
  } catch {
    return null;
  }
};

const getLegacyUserForRole = (role) => {
  const rawUser = localStorage.getItem(LEGACY_ADMIN_KEY);
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }
  return user?.role === role ? user : null;
};

export const getActivePortalRole = () => getPortalRoleFromPath();

export const getStoredAdminToken = (role = getPortalRoleFromPath()) => {
  const { token } = getSessionKeys(role);
  return sessionStorage.getItem(token) || (getLegacyUserForRole(role) ? localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY) : null);
};

export const getStoredAdminUser = (role = getPortalRoleFromPath()) => {
  const { user } = getSessionKeys(role);
  return parseStoredUser(user) || getLegacyUserForRole(role);
};

export const hasStoredAdminSession = (role = getPortalRoleFromPath()) => {
  return Boolean(getStoredAdminToken(role));
};

export const setAdminSession = (token, admin) => {
  const role = admin?.role && PORTAL_ROLES.includes(admin.role) ? admin.role : getPortalRoleFromPath();
  const { token: tokenKey, user: userKey } = getSessionKeys(role);

  sessionStorage.setItem(tokenKey, token);
  if (admin) {
    sessionStorage.setItem(userKey, JSON.stringify(admin));
  } else {
    sessionStorage.removeItem(userKey);
  }

  localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ADMIN_KEY);
  localStorage.removeItem("adminToken");
};

export const persistAdminSession = (token, admin) => {
  setAdminSession(token, admin);
};

export const clearAdminSession = (role = getPortalRoleFromPath()) => {
  const { token, user } = getSessionKeys(role);
  sessionStorage.removeItem(token);
  sessionStorage.removeItem(user);

  const legacyUser = getLegacyUserForRole(role);
  if (legacyUser) {
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ADMIN_KEY);
  }
};

export const getPortalLoginPath = (admin = getStoredAdminUser()) => {
  if (admin?.role === "delivery") {
    return "/delivery/login";
  }

  if (admin?.role === "seller") {
    return "/seller/login";
  }

  const role = admin?.role || getPortalRoleFromPath();
  if (role === "delivery") return "/delivery/login";
  if (role === "seller") return "/seller/login";
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
  return getStoredAdminUser();
};
