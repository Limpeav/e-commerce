const LOCAL_CUSTOMER_FRONTEND_URL = "http://localhost:5173";
const LOCAL_ADMIN_FRONTEND_URL = "http://localhost:5174";
const PRODUCTION_CUSTOMER_FRONTEND_URL = "https://cherishbabykhstore.store";

export const normalizeUrl = (url = "") =>
  String(url || "")
    .trim()
    .replace(/\/+$/, "");

const parseUrls = (value = "") =>
  String(value || "")
    .split(/[,\s]+/)
    .map(normalizeUrl)
    .filter((url) => /^https?:\/\//i.test(url));

const isLocalFrontendUrl = (url = "") =>
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(url);

const isProduction = () => process.env.NODE_ENV === "production";

const pickFrontendUrl = ({
  explicitUrl,
  configuredUrl,
  localFallback,
  productionFallback,
}) => {
  const explicitUrls = parseUrls(explicitUrl);
  if (explicitUrls.length > 0) {
    return explicitUrls[0];
  }

  const configuredUrls = parseUrls(configuredUrl);
  if (!isProduction()) {
    return (
      configuredUrls.find(isLocalFrontendUrl) ||
      localFallback ||
      configuredUrls[0] ||
      productionFallback
    );
  }

  return configuredUrls[0] || productionFallback || localFallback;
};

export const getCustomerFrontendUrl = () =>
  pickFrontendUrl({
    explicitUrl:
      process.env.SUPPORT_CUSTOMER_FRONTEND_URL ||
      process.env.SUPPORT_FRONTEND_URL,
    configuredUrl: process.env.FRONTEND_URL,
    localFallback: LOCAL_CUSTOMER_FRONTEND_URL,
    productionFallback: PRODUCTION_CUSTOMER_FRONTEND_URL,
  });

export const getAdminFrontendUrl = () =>
  pickFrontendUrl({
    explicitUrl:
      process.env.SUPPORT_ADMIN_FRONTEND_URL ||
      process.env.SUPPORT_ADMIN_URL,
    configuredUrl: process.env.ADMIN_FRONTEND_URL || process.env.ADMIN_URL,
    localFallback: LOCAL_ADMIN_FRONTEND_URL,
    productionFallback: LOCAL_ADMIN_FRONTEND_URL,
  });
