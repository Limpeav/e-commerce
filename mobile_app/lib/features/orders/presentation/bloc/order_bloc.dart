import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/models/order.dart';
import '../../../../core/services/order_service.dart';
import '../../../../core/services/push_notification_service.dart';
import '../../../../core/services/review_requirement_service.dart';
import '../../../../core/services/telegram_bot_service.dart';
import 'order_event.dart';
import 'order_state.dart';

class OrderBloc extends Bloc<OrderEvent, OrderState> {
  final SharedPreferences? _prefs;

  OrderBloc({SharedPreferences? preferences})
      : _prefs = preferences,
        super(const OrderState()) {
    on<OrderLoadedFromStorage>(_onOrderLoadedFromStorage);
    on<OrderFetchRequested>(_onOrderFetchRequested);
    on<OrderPlaced>(_onOrderPlaced);
    on<OrderMarkedAsPaid>(_onOrderMarkedAsPaid);
    on<OrderTrackRequested>(_onOrderTrackRequested);
    on<OrderCancelled>(_onOrderCancelled);
    on<OrderCleared>(_onOrderCleared);
    on<OrderPendingReviewsRefreshed>(_onOrderPendingReviewsRefreshed);
    on<OrderDeliveryReviewPromptCleared>(_onOrderDeliveryReviewPromptCleared);

    // Automatically load persisted orders
    add(const OrderLoadedFromStorage());
  }

  String? _getCurrentUserId() {
    try {
      if (_prefs != null) {
        final raw = _prefs.getString('cached_user_session');
        if (raw != null && raw.isNotEmpty) {
          final map = json.decode(raw) as Map<String, dynamic>;
          final id = (map['id'] ?? map['_id'] ?? '').toString().trim();
          if (id.isNotEmpty) return id;
        }
      }
    } catch (_) {}
    return null;
  }

  String _getStorageKey(String? userId) {
    final clean = (userId ?? '').trim();
    return clean.isEmpty ? 'customer_saved_orders_guest' : 'customer_saved_orders_$clean';
  }

  void _cleanLegacyStorage() {
    try {
      if (_prefs != null && _prefs.containsKey('customer_saved_orders_v1')) {
        _prefs.remove('customer_saved_orders_v1');
      }
    } catch (_) {}
  }

  Future<void> _notifyNewlyDeliveredOrders(
    List<OrderModel> orders,
    String userId,
  ) async {
    final cleanUserId = userId.trim();
    if (cleanUserId.isEmpty || _prefs == null) return;

    final notifiedKey = 'notified_delivered_orders_$cleanUserId';
    final notifiedSet = _prefs.getStringList(notifiedKey)?.toSet() ?? <String>{};
    final nowDelivered = orders.where((o) =>
        o.status == OrderStatus.delivered || o.isDelivered || o.deliveredAt != null).toList();

    bool added = false;
    for (final order in nowDelivered) {
      if (!notifiedSet.contains(order.id)) {
        notifiedSet.add(order.id);
        added = true;
        PushNotificationService.instance.notifyOrderStatusChange(
          order: order,
          newStatus: OrderStatus.delivered,
        );
      }
    }

    if (added) {
      await _prefs.setStringList(notifiedKey, notifiedSet.toList());
    }
  }

  Future<void> _onOrderLoadedFromStorage(
    OrderLoadedFromStorage event,
    Emitter<OrderState> emit,
  ) async {
    _cleanLegacyStorage();
    final userId = _getCurrentUserId();

    // If customer is not authenticated, do not show any old cached orders or review prompts
    if (userId == null || userId.isEmpty) {
      emit(state.copyWith(
        orders: const [],
        pendingReviewItems: const [],
        clearDeliveryReviewPrompt: true,
      ));
      return;
    }

    var loadedOrders = <OrderModel>[];
    if (_prefs != null) {
      final jsonString = _prefs.getString(_getStorageKey(userId));
      if (jsonString != null && jsonString.isNotEmpty) {
        try {
          final List<dynamic> decoded = json.decode(jsonString);
          for (final item in decoded) {
            if (item is Map<String, dynamic>) {
              loadedOrders.add(OrderModel.fromJson(item));
            }
          }
        } catch (e) {
          debugPrint('⚠️ Error loading saved orders: $e');
        }
      }
    }

    final pendingReviewItems =
        await ReviewRequirementService.getPendingReviewItems(
      userId: userId,
      currentOrders: loadedOrders,
    );

    emit(state.copyWith(
      orders: loadedOrders,
      pendingReviewItems: pendingReviewItems,
      deliveryReviewPrompt:
          pendingReviewItems.isNotEmpty ? pendingReviewItems.first : null,
      clearDeliveryReviewPrompt: pendingReviewItems.isEmpty,
    ));
  }

  Future<void> _saveOrders(List<OrderModel> orders, [String? userId]) async {
    if (_prefs != null) {
      try {
        final activeUser = userId ?? _getCurrentUserId();
        final key = _getStorageKey(activeUser);
        final List<Map<String, dynamic>> rawList =
            orders.map((o) => o.toJson()).toList();
        await _prefs.setString(key, json.encode(rawList));
      } catch (e) {
        debugPrint('⚠️ Error saving orders to storage: $e');
      }
    }
  }

  Future<void> _onOrderFetchRequested(
    OrderFetchRequested event,
    Emitter<OrderState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true));

    final currentUserId = (event.userId ?? _getCurrentUserId() ?? '').trim();

    try {
      if (event.authToken == null || event.authToken!.isEmpty) {
        emit(state.copyWith(
          orders: const [],
          pendingReviewItems: const [],
          isLoading: false,
          clearDeliveryReviewPrompt: true,
        ));
        await _saveOrders([], currentUserId);
        return;
      }

      final remoteOrders = await OrderService.fetchMyOrders(authToken: event.authToken);
      if (remoteOrders != null) {
        await _saveOrders(remoteOrders, currentUserId);
        await _notifyNewlyDeliveredOrders(remoteOrders, currentUserId);

        final pendingReviewItems =
            await ReviewRequirementService.getPendingReviewItems(
          userId: currentUserId,
          currentOrders: remoteOrders,
        );

        emit(state.copyWith(
          orders: remoteOrders,
          pendingReviewItems: pendingReviewItems,
          deliveryReviewPrompt:
              pendingReviewItems.isNotEmpty ? pendingReviewItems.first : null,
          clearDeliveryReviewPrompt: pendingReviewItems.isEmpty,
          isLoading: false,
        ));
        return;
      }
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      ));
      return;
    }

    emit(state.copyWith(isLoading: false));
  }

  Future<void> _onOrderPlaced(
    OrderPlaced event,
    Emitter<OrderState> emit,
  ) async {
    final randomNum = 100000 + Random().nextInt(900000);
    final trackingCode = 'EXP-${1000 + Random().nextInt(9000)}-${Random().nextInt(999)}';
    final now = DateTime.now();
    final deliveryDate = now.add(const Duration(days: 3));
    final dateStr = '${_monthName(deliveryDate.month)} ${deliveryDate.day}, ${deliveryDate.year}';
    final isKhqr = event.paymentMethod.toUpperCase().contains('BAKONG') ||
        event.paymentMethod.toUpperCase().contains('KHQR');

    OrderModel orderToSave = OrderModel(
      id: '#ORD-$randomNum',
      date: now,
      items: List.from(event.items),
      subtotal: event.subtotal,
      discount: event.discount,
      shipping: event.shipping,
      tax: event.tax,
      total: event.total,
      deliveryAddress: event.deliveryAddress,
      paymentMethod: event.paymentMethod,
      status: OrderStatus.processing,
      trackingNumber: trackingCode,
      estimatedDelivery: dateStr,
      isPaid: false,
      paidAt: null,
      recipientName: event.recipientName,
      recipientPhone: event.recipientPhone,
      city: event.city,
      street: event.street,
      latitude: event.latitude,
      longitude: event.longitude,
    );

    bool backendHandled = false;
    // Call Backend API
    try {
      final result = await OrderService.createOrder(
        order: orderToSave,
        authToken: event.authToken,
      );
      if (result.success && result.order != null) {
        backendHandled = true;
        orderToSave = result.order!.copyWith(
          latitude: event.latitude ?? result.order!.latitude,
          longitude: event.longitude ?? result.order!.longitude,
          recipientName: event.recipientName ?? result.order!.recipientName,
          recipientPhone: event.recipientPhone ?? result.order!.recipientPhone,
        );
      } else {
        debugPrint('⚠️ Backend rejected order creation: ${result.errorMessage}');
      }
    } catch (e) {
      debugPrint('⚠️ Order saved locally, backend sync notice: $e');
    }

    final updatedOrders = [orderToSave, ...state.orders];
    await _saveOrders(updatedOrders);
    emit(state.copyWith(
      orders: updatedOrders,
      lastPlacedOrder: orderToSave,
    ));

    event.onComplete?.call(orderToSave);

    // Dispatch real-time push notification for order creation
    PushNotificationService.instance.notifyOrderStatusChange(
      order: orderToSave,
      newStatus: orderToSave.status,
    );

    // The backend already sends a Telegram notification when an order is created.
    // To prevent duplicate messages, only dispatch from mobile if the backend call was offline/failed.
    if (!isKhqr && !backendHandled) {
      TelegramBotService.sendOrderNotification(
        order: orderToSave,
        exchangeRate: event.exchangeRate,
      ).catchError((e) {
        debugPrint('⚠️ Telegram dispatch background error: $e');
        return false;
      });
    }
  }

  Future<void> _onOrderMarkedAsPaid(
    OrderMarkedAsPaid event,
    Emitter<OrderState> emit,
  ) async {
    final index = state.orders.indexWhere((o) => o.id == event.orderId || o.id == '#${event.orderId}');
    final now = DateTime.now();

    final paidOrder = await OrderService.markOrderAsPaid(
      event.orderId,
      authToken: event.authToken,
      paymentResult: event.paymentResult,
    );

    if (index >= 0) {
      final updatedOrders = List<OrderModel>.from(state.orders);
      final updatedOrder = updatedOrders[index].copyWith(
        isPaid: true,
        paidAt: now,
      );
      updatedOrders[index] = updatedOrder;

      await _saveOrders(updatedOrders);
      emit(state.copyWith(orders: updatedOrders));

      // If backend already marked the order paid, do not send duplicate Telegram notification
      if (paidOrder == null) {
        TelegramBotService.sendOrderNotification(
          order: updatedOrder,
          exchangeRate: event.exchangeRate,
          paymentStatusOverride: 'PAID',
          transactionId: event.paymentResult?['id']?.toString() ??
              event.paymentResult?['paymentId']?.toString(),
        ).catchError((e) {
          debugPrint('⚠️ Telegram dispatch background error: $e');
          return false;
        });
      }
    }
  }

  Future<void> _onOrderTrackRequested(
    OrderTrackRequested event,
    Emitter<OrderState> emit,
  ) async {
    try {
      final updated = await OrderService.trackOrder(
        event.orderIdOrNumber,
        authToken: event.authToken,
      );
      if (updated != null) {
        final updatedOrders = List<OrderModel>.from(state.orders);
        final index = updatedOrders.indexWhere((o) =>
            o.id == updated.id ||
            o.trackingNumber == updated.trackingNumber ||
            o.id == event.orderIdOrNumber ||
            o.trackingNumber == event.orderIdOrNumber);

        if (index >= 0) {
          final previousStatus = updatedOrders[index].status;
          updatedOrders[index] = updated;
          if (previousStatus != updated.status) {
            PushNotificationService.instance.notifyOrderStatusChange(
              order: updated,
              newStatus: updated.status,
            );
          }
        } else {
          updatedOrders.insert(0, updated);
        }

        final currentUserId = (_getCurrentUserId() ?? '').trim();
        await _saveOrders(updatedOrders, currentUserId);
        await _notifyNewlyDeliveredOrders(updatedOrders, currentUserId);

        final pendingReviewItems =
            await ReviewRequirementService.getPendingReviewItems(
          userId: currentUserId,
          currentOrders: updatedOrders,
        );

        emit(state.copyWith(
          orders: updatedOrders,
          pendingReviewItems: pendingReviewItems,
          deliveryReviewPrompt:
              (updated.status == OrderStatus.delivered && pendingReviewItems.isNotEmpty)
                  ? pendingReviewItems.first
                  : null,
          clearDeliveryReviewPrompt: pendingReviewItems.isEmpty,
        ));
        event.onResult?.call(updated);
        return;
      }
    } catch (e) {
      debugPrint('⚠️ Error tracking order in bloc: $e');
    }
    event.onResult?.call(null);
  }

  Future<void> _onOrderCancelled(
    OrderCancelled event,
    Emitter<OrderState> emit,
  ) async {
    final index = state.orders.indexWhere((o) => o.id == event.orderId);
    if (index >= 0) {
      await OrderService.cancelOrder(event.orderId, authToken: event.authToken);

      final updatedOrders = List<OrderModel>.from(state.orders);
      updatedOrders[index] = updatedOrders[index].copyWith(status: OrderStatus.cancelled);

      final currentUserId = (_getCurrentUserId() ?? '').trim();
      await _saveOrders(updatedOrders, currentUserId);
      emit(state.copyWith(orders: updatedOrders));
    }
  }

  Future<void> _onOrderCleared(
    OrderCleared event,
    Emitter<OrderState> emit,
  ) async {
    final userId = (_getCurrentUserId() ?? '').trim();
    if (userId.isNotEmpty) {
      await _saveOrders([], userId);
      await ReviewRequirementService.clearForUser(userId);
    }
    emit(state.copyWith(
      orders: const [],
      pendingReviewItems: const [],
      clearDeliveryReviewPrompt: true,
    ));
  }

  Future<void> _onOrderPendingReviewsRefreshed(
    OrderPendingReviewsRefreshed event,
    Emitter<OrderState> emit,
  ) async {
    final userId = (_getCurrentUserId() ?? '').trim();
    final pendingReviewItems =
        await ReviewRequirementService.getPendingReviewItems(
      userId: userId.isNotEmpty ? userId : null,
      currentOrders: state.orders.isNotEmpty ? state.orders : null,
    );
    emit(state.copyWith(
      pendingReviewItems: pendingReviewItems,
      clearDeliveryReviewPrompt: pendingReviewItems.isEmpty,
    ));
  }

  void _onOrderDeliveryReviewPromptCleared(
    OrderDeliveryReviewPromptCleared event,
    Emitter<OrderState> emit,
  ) {
    emit(state.copyWith(clearDeliveryReviewPrompt: true));
  }

  static String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}
