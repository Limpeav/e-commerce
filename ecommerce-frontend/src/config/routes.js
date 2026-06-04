// Lazy loaded components for better performance
export const userLazyComponents = {
  Home: () => import("../views/user/Home"),
  ProductCatalog: () => import("../views/product/ProductCatalog"),
  ProductDetail: () => import("../views/product/ProductDetail"),
  Cart: () => import("../views/cart/Cart"),
  Wishlist: () => import("../views/wishlist/Wishlist"),
  Profile: () => import("../views/user/Profile"),
  Settings: () => import("../views/user/Settings"),
  Orders: () => import("../views/orders/Orders"),
  OrderDetail: () => import("../views/orders/OrderDetail"),
  ReviewOrder: () => import("../views/orders/ReviewOrder"),
  OrderTracking: () => import("../views/orders/Tracking"),
  Checkout: () => import("../views/cart/Checkout"),
  OrderSuccess: () => import("../views/cart/Success"),
  About: () => import("../views/user/About"),
  Privacy: () => import("../views/user/Privacy"),
  Terms: () => import("../views/user/Terms"),
  Contact: () => import("../views/user/Contact"),
  KnowledgeBase: () => import("../views/user/KnowledgeBase"),
  Location: () => import("../views/user/Location"),
  BakongPayment: () => import("../views/payment/BakongPayment"),

  // Auth routes
  Login: () => import("../views/auth/pages/Login"),
  Register: () => import("../views/auth/pages/Register"),
  ForgotPassword: () => import("../views/auth/pages/ForgotPassword"),
  ResetPassword: () => import("../views/auth/pages/ResetPassword"),
  CompleteProfile: () => import("../views/auth/pages/CompleteProfile"),

  // Error routes
  NotFound: () => import("../views/errors/NotFound"),
};

// Route configurations
export const publicRoutes = [
  { path: "/login", component: "Login" },
  { path: "/register", component: "Register" },
  { path: "/forgot-password", component: "ForgotPassword" },
  { path: "/reset-password", component: "ResetPassword" },
  { path: "/", component: "Home" },
  { path: "/customer", component: "Home" },
  { path: "/products", component: "ProductCatalog" },
  { path: "/customer/products", component: "ProductCatalog" },
  { path: "/deals", component: "ProductCatalog" },
  { path: "/customer/deals", component: "ProductCatalog" },
  { path: "/products/:id", component: "ProductDetail" },
  { path: "/customer/products/:id", component: "ProductDetail" },
  { path: "/cart", component: "Cart" },
  { path: "/customer/cart", component: "Cart" },
];

export const protectedRoutes = [
  { path: "/checkout", component: "Checkout" },
  { path: "/customer/checkout", component: "Checkout" },
  { path: "/wishlist", component: "Wishlist" },
  { path: "/customer/wishlist", component: "Wishlist" },
  { path: "/profile", component: "Profile" },
  { path: "/customer/profile", component: "Profile" },
  { path: "/orders", component: "Orders" },
  { path: "/customer/orders", component: "Orders" },
  { path: "/orders/:id", component: "OrderDetail" },
  { path: "/customer/orders/:id", component: "OrderDetail" },
  { path: "/orders/:id/review", component: "ReviewOrder" },
  { path: "/customer/orders/:id/review", component: "ReviewOrder" },
  { path: "/payment/bakong/:orderId", component: "BakongPayment" },
  { path: "/customer/payment/bakong/:orderId", component: "BakongPayment" },
  { path: "/complete-profile", component: "CompleteProfile" },
];

export const additionalRoutes = [
  { path: "/settings", component: "Settings" },
  { path: "/customer/settings", component: "Settings" },
  { path: "/orders/tracking", component: "OrderTracking" },
  { path: "/customer/orders/tracking", component: "OrderTracking" },
  { path: "/cart/success", component: "OrderSuccess" },
  { path: "/customer/cart/success", component: "OrderSuccess" },
  { path: "/privacy", component: "Privacy" },
  { path: "/terms", component: "Terms" },
  { path: "/about", component: "About" },
  { path: "/contact", component: "Contact" },
  { path: "/knowledge-base", component: "KnowledgeBase" },
  { path: "/location", component: "Location" },
  { path: "*", component: "NotFound" },
];

// Paths where Navbar and Footer should be hidden
export const hideNavFooterPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/complete-profile"
];
