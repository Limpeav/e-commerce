// App Constants

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Payment Status
export const PAYMENT_STATUS = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  'CASH ON DELIVERY': 'Cash on Delivery'
};

// Product Categories
export const PRODUCT_CATEGORIES = {
  TOY: 'Toy',
  CLOTHING: 'Clothing',
  SHOES: 'Shoes',
  MILK: 'Milk',
  FEEDING_AND_NURSING: 'Feeding & Nursing',
  DIAPERING_AND_CARE: 'Diapering & Care',
  NURSERY_AND_DECOR: 'Nursery & Decor',
  TRAVEL_AND_GEAR: 'Travel & Gear',
  BATH_AND_SKIN: 'Bath & Skin',
  PLAY_AND_LEARN: 'Play & Learn',
  ALL: 'All'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  PRODUCTS: {
    GET_ALL: '/products',
    GET_BY_ID: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id'
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear'
  },
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: '/orders/:id',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    TRACK: '/orders/tracking'
  },
  USERS: {
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    GET_ADDRESSES: '/users/addresses',
    ADD_ADDRESS: '/users/addresses'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOGIN_FAILED: 'Invalid email or password.',
  REGISTER_FAILED: 'Registration failed. Please try again.',
  CART_ERROR: 'Failed to update cart. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  CART_UPDATED: 'Cart updated successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PRODUCT_ADDED: 'Product added to cart!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_RESET: 'Password reset email sent!'
};

// App Configuration
export const APP_CONFIG = {
  TAX_RATE: 0.08,
  FREE_SHIPPING_THRESHOLD: 100,
  DEFAULT_CURRENCY: 'USD',
  ITEMS_PER_PAGE: 12,
  MAX_CART_QUANTITY: 10
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN_LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  ORDER_TRACKING: '/orders/tracking',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_USERS: '/admin/users',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_REPORTS: '/admin/reports'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CART_ITEMS: 'cartItems',
  WISHLIST_ITEMS: 'wishlistItems',
  THEME: 'theme'
};
