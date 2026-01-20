// Lazy loaded components for better performance
export const lazyComponents = {
  // User routes
  Home: () => import("../views/user/Home"),
  ProductDetail: () => import("../views/product/ProductDetail"),
  Cart: () => import("../views/cart/Cart"),
  Wishlist: () => import("../views/wishlist/Wishlist"),
  Profile: () => import("../views/user/Profile"),
  Settings: () => import("../views/user/Settings"),
  Orders: () => import("../views/orders/Orders"),
  OrderDetail: () => import("../views/orders/OrderDetail"),
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
  AdminLogin: () => import("../views/auth/pages/AdminLogin"),
  ForgotPassword: () => import("../views/auth/pages/ForgotPassword"),
  ResetPassword: () => import("../views/auth/pages/ResetPassword"),

  // Admin routes
  AdminDashboard: () => import("../views/admin/Dashboard"),
  AdminProductsList: () => import("../views/admin/Products/List"),
  AdminProductsAdd: () => import("../views/admin/Products/Add"),
  AdminProductsEdit: () => import("../views/admin/Products/Edit"),
  AdminUsers: () => import("../views/admin/Users"),
  AdminOrdersList: () => import("../views/admin/Orders/List"),
  AdminOrderDetails: () => import("../views/admin/Orders/Details"),
  AdminReports: () => import("../views/admin/Reports"),

  // Error routes
  NotFound: () => import("../views/errors/NotFound"),
};

// Route configurations
export const publicRoutes = [
  { path: "/login", component: "Login" },
  { path: "/register", component: "Register" },
  { path: "/admin/login", component: "AdminLogin" },
  { path: "/forgot-password", component: "ForgotPassword" },
  { path: "/reset-password", component: "ResetPassword" },
];

export const protectedRoutes = [
  { path: "/", component: "Home" },
  { path: "/products/:id", component: "ProductDetail" },
  { path: "/cart", component: "Cart" },
  { path: "/checkout", component: "Checkout" },
  { path: "/wishlist", component: "Wishlist" },
  { path: "/profile", component: "Profile" },
  { path: "/orders", component: "Orders" },
  { path: "/orders/:id", component: "OrderDetail" },
  { path: "/payment/bakong/:orderId", component: "BakongPayment" },
];

export const adminRoutes = [
  { path: "/admin", component: "AdminDashboard" },
  { path: "/admin/products", component: "AdminProductsList" },
  { path: "/admin/products/add", component: "AdminProductsAdd" },
  { path: "/admin/products/edit/:id", component: "AdminProductsEdit" },
  { path: "/admin/users", component: "AdminUsers" },
  { path: "/admin/orders", component: "AdminOrdersList" },
  { path: "/admin/orders/:id", component: "AdminOrderDetails" },
  { path: "/admin/reports", component: "AdminReports" },
];

export const additionalRoutes = [
  { path: "/settings", component: "Settings" },
  { path: "/orders/tracking", component: "OrderTracking" },
  { path: "/cart/success", component: "OrderSuccess" },
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
  "/admin/login",
  "/forgot-password",
  "/reset-password"
];
