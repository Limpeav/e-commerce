// Lazy loaded components for better performance
export const lazyComponents = {
  // User routes
  Home: () => import("../views/user/Home"),
  ProductCatalog: () => import("../views/product/ProductCatalog"),
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
  StaffLogin: () => import("../views/auth/pages/StaffLogin"),
  ForgotPassword: () => import("../views/auth/pages/ForgotPassword"),
  ResetPassword: () => import("../views/auth/pages/ResetPassword"),
  CompleteProfile: () => import("../views/auth/pages/CompleteProfile"),

  // Admin routes
  AdminDashboard: () => import("../views/admin/Dashboard"),
  AdminProductsList: () => import("../views/admin/Products/List"),
  AdminProductsAdd: () => import("../views/admin/Products/Add"),
  AdminProductsCsvBuilder: () => import("../views/admin/Products/CsvBuilder"),
  AdminProductsEdit: () => import("../views/admin/Products/Edit"),
  AdminBanners: () => import("../views/admin/Banners"),
  AdminUsers: () => import("../views/admin/Users"),
  AdminStaff: () => import("../views/admin/Staff"),
  AdminOrdersList: () => import("../views/admin/Orders/List"),
  AdminOrderDetails: () => import("../views/admin/Orders/Details"),
  AdminReports: () => import("../views/admin/Reports"),
  AdminCashReport: () => import("../views/admin/CashReport"),
  SellerDashboard: () => import("../views/admin/SellerDashboard"),
  SellerPaymentQueue: () => import("../views/admin/PaymentQueue"),

  // Error routes
  NotFound: () => import("../views/errors/NotFound"),
};

// Route configurations
export const publicRoutes = [
  { path: "/login", component: "Login" },
  { path: "/register", component: "Register" },
  { path: "/admin/login", component: "AdminLogin" },
  { path: "/seller", component: "StaffLogin" },
  { path: "/seller/login", component: "StaffLogin" },
  { path: "/staff", component: "StaffLogin" },
  { path: "/staff/login", component: "StaffLogin" },
  { path: "/delivery", component: "StaffLogin" },
  { path: "/delivery/login", component: "StaffLogin" },
  { path: "/forgot-password", component: "ForgotPassword" },
  { path: "/reset-password", component: "ResetPassword" },
  { path: "/", component: "Home" },
  { path: "/products", component: "ProductCatalog" },
  { path: "/products/:id", component: "ProductDetail" },
  { path: "/cart", component: "Cart" },
];

export const protectedRoutes = [
  { path: "/checkout", component: "Checkout" },
  { path: "/wishlist", component: "Wishlist" },
  { path: "/profile", component: "Profile" },
  { path: "/orders", component: "Orders" },
  { path: "/orders/:id", component: "OrderDetail" },
  { path: "/payment/bakong/:orderId", component: "BakongPayment" },
  { path: "/complete-profile", component: "CompleteProfile" },
];

export const adminRoutes = [
  { path: "/admin", component: "AdminDashboard", allowedRoles: ["admin"] },
  { path: "/admin/products", component: "AdminProductsList", allowedRoles: ["admin"] },
  { path: "/admin/products/add", component: "AdminProductsAdd", allowedRoles: ["admin"] },
  { path: "/admin/products/csv-builder", component: "AdminProductsCsvBuilder", allowedRoles: ["admin"] },
  { path: "/admin/products/edit/:id", component: "AdminProductsEdit", allowedRoles: ["admin"] },
  { path: "/admin/banners", component: "AdminBanners", allowedRoles: ["admin"] },
  { path: "/admin/users", component: "AdminUsers", allowedRoles: ["admin"] },
  { path: "/admin/orders", component: "AdminOrdersList", allowedRoles: ["admin"] },
  { path: "/admin/orders/:id", component: "AdminOrderDetails", allowedRoles: ["admin"] },
  { path: "/admin/cash-report", component: "AdminCashReport", allowedRoles: ["admin", "seller"] },
  { path: "/staff/orders", component: "AdminOrdersList", allowedRoles: ["seller"] },
  { path: "/staff/orders/:id", component: "AdminOrderDetails", allowedRoles: ["seller"] },
  { path: "/staff/dashboard", component: "SellerDashboard", allowedRoles: ["seller"] },
  { path: "/staff/payment-queue", component: "SellerPaymentQueue", allowedRoles: ["seller"] },
  { path: "/staff/cash-report", component: "AdminCashReport", allowedRoles: ["seller"] },
  { path: "/delivery/orders", component: "AdminOrdersList", allowedRoles: ["delivery"] },
  { path: "/delivery/orders/:id", component: "AdminOrderDetails", allowedRoles: ["delivery"] },
  { path: "/admin/seller", component: "AdminStaff", allowedRoles: ["admin"] },
  { path: "/admin/staff", component: "AdminStaff", allowedRoles: ["admin"] },
  { path: "/admin/reports", component: "AdminReports", allowedRoles: ["admin"] },
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
  "/seller",
  "/seller/login",
  "/staff",
  "/staff/login",
  "/delivery",
  "/delivery/login",
  "/forgot-password",
  "/reset-password",
  "/complete-profile"
];
