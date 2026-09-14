import 'app_config.dart';

class ApiConstants {
  static String get baseUrl => AppConfig.baseUrl;
  static String get products => '$baseUrl/api/products';
  static String get singleProduct => '$baseUrl/api/products';
  static String productReviews(String productId) =>
      '$products/$productId/reviews';
  static String get banners => '$baseUrl/api/banners';

  // Orders API Endpoints (Mapped directly to backend orderRoutes.js)
  static String get orders => '$baseUrl/api/orders';
  static String get myOrders => '$orders/myorders';
  static String get orderStats => '$orders/stats';
  static String get pendingReviews => '$orders/pending-reviews';
  static String trackOrder(String orderNumber) => '$orders/track/$orderNumber';
  static String orderById(String id) => '$orders/$id';
  static String payOrder(String id) => '$orders/$id/pay';
  static String cancelOrder(String id) => '$orders/$id/cancel';
  static String updateOrderStatus(String id) => '$orders/$id/status';
  static String updatePaymentStatus(String id) => '$orders/$id/payment-status';
  static String deliveryProof(String id) => '$orders/$id/delivery-proof';
  static String deliveryConfirmation(String id) =>
      '$orders/$id/delivery-confirmation';
  static String receiptTelegram(String id) => '$orders/$id/receipt-telegram';

  // Wishlist API Endpoints
  static String get wishlist => '$baseUrl/api/wishlist';
  static String get addToWishlist => '$wishlist/add';
  static String removeFromWishlist(String productId) =>
      '$wishlist/remove/$productId';

  // Cart API Endpoints
  static String get cart => '$baseUrl/api/cart';
  static String get addToCart => '$cart/add';
  static String removeFromCart(String productId) => '$cart/remove/$productId';
  static String updateCartQuantity(String productId) => '$cart/$productId';
  static String get clearCart => cart;

  // Payment API Endpoints (Securely handled by backend)
  static String get payments => '$baseUrl/api/payments';
  static String get generateBakongQR => '$payments/bakong/generate';
  static String paymentStatus(String paymentId) =>
      '$payments/$paymentId/status';
  static String paymentByOrder(String orderId) => '$payments/order/$orderId';

  // Settings (admin-configured, public)
  static String get financialSettings => '$baseUrl/api/settings/financial';

  // Google Maps API Key
  static const String googleMapsApiKey = AppConfig.googleMapsApiKey;
}
