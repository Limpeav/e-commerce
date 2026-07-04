const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = (rawUrl || 'http://localhost:4000/api').trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

// App Configuration
export const config = {
  // API Configuration
  API_BASE_URL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),

  // App Configuration
  APP_NAME: 'E-Commerce Platform',
  APP_VERSION: '1.0.0',

  // UI Configuration
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  USD_TO_KHR_RATE: Number(import.meta.env.VITE_USD_TO_KHR_RATE) || 4100,

  // Pagination
  ITEMS_PER_PAGE: 12,

  // Image Configuration
  DEFAULT_IMAGE: '/assets/images/placeholder.png',
  IMAGE_QUALITY: 80,

  // Local Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    ADMIN_TOKEN: 'adminToken',
    ADMIN_USER: 'adminUser',
    CART: 'cart',
    WISHLIST: 'wishlist',
    THEME: 'theme'
  }
};

export default config;
