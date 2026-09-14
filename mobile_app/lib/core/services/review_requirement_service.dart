import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order.dart';

class PendingReviewItem {
  final String orderId;
  final String productId;
  final String productTitle;
  final String productImage;
  final DateTime deliveredAt;
  final DateTime createdAt;

  const PendingReviewItem({
    required this.orderId,
    required this.productId,
    required this.productTitle,
    required this.productImage,
    required this.deliveredAt,
    required this.createdAt,
  });

  String get key => '$orderId::$productId';

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'productId': productId,
      'productTitle': productTitle,
      'productImage': productImage,
      'deliveredAt': deliveredAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory PendingReviewItem.fromJson(Map<String, dynamic> json) {
    return PendingReviewItem(
      orderId: (json['orderId'] ?? '').toString(),
      productId: (json['productId'] ?? '').toString(),
      productTitle: (json['productTitle'] ?? 'Product').toString(),
      productImage: (json['productImage'] ?? '').toString(),
      deliveredAt: DateTime.tryParse((json['deliveredAt'] ?? '').toString()) ??
          DateTime.now(),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
          DateTime.now(),
    );
  }
}

class ReviewRequirementService {
  static String _pendingKey(String? userId) {
    final clean = (userId ?? '').trim();
    return clean.isEmpty ? 'required_product_reviews_pending_guest' : 'required_product_reviews_pending_$clean';
  }

  static String _ratedKey(String? userId) {
    final clean = (userId ?? '').trim();
    return clean.isEmpty ? 'required_product_reviews_rated_guest' : 'required_product_reviews_rated_$clean';
  }

  static void _cleanLegacy(SharedPreferences prefs) {
    try {
      if (prefs.containsKey('required_product_reviews_pending_v1')) {
        prefs.remove('required_product_reviews_pending_v1');
      }
    } catch (_) {}
  }

  static String _resolveUserKey(String? userId, SharedPreferences prefs) {
    final clean = (userId ?? '').trim();
    if (clean.isNotEmpty) {
      return clean;
    }
    try {
      final userJson = prefs.getString('cached_user_session');
      if (userJson != null && userJson.isNotEmpty) {
        final map = json.decode(userJson) as Map<String, dynamic>;
        final id = (map['id'] ?? map['_id'] ?? '').toString().trim();
        if (id.isNotEmpty) return id;
      }
    } catch (_) {}
    return 'default_user';
  }

  static Future<List<PendingReviewItem>> getPendingReviewItems({
    String? userId,
    List<OrderModel>? currentOrders,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    _cleanLegacy(prefs);
    final userKey = _resolveUserKey(userId, prefs);

    // If current orders are provided, derive pending reviews strictly from delivered orders
    if (currentOrders != null) {
      if (currentOrders.isEmpty) {
        await _writePending(prefs, userKey, []);
        return [];
      }

      final deliveredOrders = currentOrders.where((order) {
        return order.status == OrderStatus.delivered ||
            order.isDelivered ||
            order.deliveredAt != null;
      }).toList();

      if (deliveredOrders.isEmpty) {
        await _writePending(prefs, userKey, []);
        return [];
      }

      final ratedKeys = prefs.getStringList(_ratedKey(userKey))?.toSet() ?? <String>{};
      final canonicalPending = <PendingReviewItem>[];
      final seenKeys = <String>{};
      final now = DateTime.now();

      for (final order in deliveredOrders) {
        for (final item in order.items) {
          final product = item.product;
          if (product.id.trim().isEmpty) continue;

          final pendingItem = PendingReviewItem(
            orderId: order.id,
            productId: product.id,
            productTitle: product.title,
            productImage: product.image,
            deliveredAt: order.deliveredAt ?? now,
            createdAt: now,
          );

          if (ratedKeys.contains(pendingItem.key) || !seenKeys.add(pendingItem.key)) {
            continue;
          }

          canonicalPending.add(pendingItem);
        }
      }

      await _writePending(prefs, userKey, canonicalPending);
      return canonicalPending;
    }

    return _readPending(prefs, userKey);
  }

  static Future<bool> hasPendingReviews({
    String? userId,
    List<OrderModel>? currentOrders,
  }) async {
    final pending = await getPendingReviewItems(
      userId: userId,
      currentOrders: currentOrders,
    );
    return pending.isNotEmpty;
  }

  static Future<List<PendingReviewItem>> registerDeliveredOrders(
    List<OrderModel> orders, {
    String? userId,
  }) async {
    if (orders.isEmpty) {
      return [];
    }

    final prefs = await SharedPreferences.getInstance();
    _cleanLegacy(prefs);
    final userKey = _resolveUserKey(userId, prefs);

    final pending = _readPending(prefs, userKey);
    final pendingKeys = pending.map((item) => item.key).toSet();
    final ratedKeys = prefs.getStringList(_ratedKey(userKey))?.toSet() ?? <String>{};
    final newlyRequired = <PendingReviewItem>[];
    final now = DateTime.now();

    for (final order in orders) {
      final isDelivered = order.status == OrderStatus.delivered ||
          order.isDelivered ||
          order.deliveredAt != null;
      if (!isDelivered) continue;

      final productIdsInOrder = <String>{};
      for (final item in order.items) {
        final product = item.product;
        if (product.id.trim().isEmpty || !productIdsInOrder.add(product.id)) {
          continue;
        }

        final pendingItem = PendingReviewItem(
          orderId: order.id,
          productId: product.id,
          productTitle: product.title,
          productImage: product.image,
          deliveredAt: order.deliveredAt ?? now,
          createdAt: now,
        );

        if (pendingKeys.contains(pendingItem.key) ||
            ratedKeys.contains(pendingItem.key)) {
          continue;
        }

        pending.add(pendingItem);
        pendingKeys.add(pendingItem.key);
        newlyRequired.add(pendingItem);
      }
    }

    if (newlyRequired.isNotEmpty) {
      await _writePending(prefs, userKey, pending);
    }

    return newlyRequired;
  }

  static Future<void> markRated({
    required String orderId,
    required String productId,
    String? userId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final userKey = _resolveUserKey(userId, prefs);
    final key = '$orderId::$productId';

    final pending = _readPending(prefs, userKey)
        .where((item) => item.key != key)
        .toList(growable: false);
    final ratedKeyName = _ratedKey(userKey);
    final ratedKeys = prefs.getStringList(ratedKeyName)?.toSet() ?? <String>{};
    ratedKeys.add(key);

    await _writePending(prefs, userKey, pending);
    await prefs.setStringList(ratedKeyName, ratedKeys.toList());
  }

  static Future<void> clearForUser(String userId) async {
    final clean = userId.trim();
    if (clean.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_pendingKey(clean));
      await prefs.remove(_ratedKey(clean));
    } catch (_) {}
  }

  static List<PendingReviewItem> _readPending(
    SharedPreferences prefs,
    String userId,
  ) {
    try {
      final raw = prefs.getString(_pendingKey(userId));
      if (raw == null || raw.isEmpty) return [];
      final decoded = json.decode(raw);
      if (decoded is! List) return [];
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(PendingReviewItem.fromJson)
          .where((item) => item.orderId.isNotEmpty && item.productId.isNotEmpty)
          .toList();
    } catch (e) {
      debugPrint('⚠️ Error reading pending required reviews: $e');
      return [];
    }
  }

  static Future<void> _writePending(
    SharedPreferences prefs,
    String userId,
    List<PendingReviewItem> pending,
  ) async {
    await prefs.setString(
      _pendingKey(userId),
      json.encode(pending.map((item) => item.toJson()).toList()),
    );
  }
}
