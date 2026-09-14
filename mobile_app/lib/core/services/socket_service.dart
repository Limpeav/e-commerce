import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/app_config.dart';

/// Real-time WebSockets / Socket.IO service for mobile application.
///
/// Connects to the exact same backend server as the website for:
/// - Real-time order status updates (Delivered, Shipped, Processing)
/// - Instant Bakong KHQR payment confirmations
/// - Real-time product inventory & review updates
class SocketService {
  static final SocketService instance = SocketService._internal();
  SocketService._internal();

  IO.Socket? _socket;
  String? _currentUserId;
  String? _currentToken;
  bool _isConnected = false;

  final _connectionController = StreamController<bool>.broadcast();
  final _orderUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _paymentUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _productUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Whether the socket is currently connected
  bool get isConnected => _isConnected;

  /// Stream of connection status changes (true = connected, false = disconnected)
  Stream<bool> get connectionStream => _connectionController.stream;

  /// Stream of real-time order status events
  Stream<Map<String, dynamic>> get orderUpdatesStream =>
      _orderUpdateController.stream;

  /// Stream of real-time payment success events
  Stream<Map<String, dynamic>> get paymentUpdatesStream =>
      _paymentUpdateController.stream;

  /// Stream of real-time product/stock/review events
  Stream<Map<String, dynamic>> get productUpdatesStream =>
      _productUpdateController.stream;

  /// Connect to the backend Socket.IO server
  void connect({String? userId, String? token, String? customUrl}) {
    final serverUrl = customUrl ?? AppConfig.baseUrl;

    _currentUserId = userId ?? _currentUserId;
    _currentToken = token ?? _currentToken;

    final isTest = Platform.environment.containsKey('FLUTTER_TEST');
    if (isTest && customUrl == null) {
      // In headless unit/widget tests without a specified mock URL, avoid starting live network sockets
      return;
    }

    // Disconnect existing socket if target server URL or credentials changed
    if (_socket != null) {
      if (_socket!.connected) return;
      _socket!.disconnect();
      _socket = null;
    }

    try {
      final options = IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setTimeout(isTest ? 1000 : 10000);

      if (isTest) {
        options.disableReconnection();
      } else {
        options
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(2000);
      }

      if (_currentToken != null && _currentToken!.isNotEmpty) {
        options.setAuth({'token': _currentToken});
      }

      if (_currentUserId != null && _currentUserId!.isNotEmpty) {
        options.setQuery({'userId': _currentUserId});
      }

      _socket = IO.io(serverUrl, options.build());

      _setupListeners();
    } catch (e) {
      debugPrint('⚠️ SocketService connect notice: $e');
    }
  }

  void _setupListeners() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _isConnected = true;
      _connectionController.add(true);
      debugPrint('🟢 Socket connected to backend: ${AppConfig.baseUrl}');

      // Join user-specific private room for order & payment alerts
      if (_currentUserId != null && _currentUserId!.isNotEmpty) {
        _socket!.emit('join_user', {'userId': _currentUserId});
        _socket!.emit('join_room', 'user_$_currentUserId');
        _socket!.emit('join', 'orders_$_currentUserId');
      }

      // Join broadcast rooms for store-wide events
      _socket!.emit('join_room', 'store_updates');
      _socket!.emit('join_room', 'products');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      _connectionController.add(false);
      debugPrint('🔴 Socket disconnected from backend');
    });

    _socket!.onConnectError((data) {
      _isConnected = false;
      _connectionController.add(false);
      final isTest = Platform.environment.containsKey('FLUTTER_TEST');
      if (!isTest) {
        debugPrint('⚠️ Socket connection error: $data');
      }
    });

    // 1. Order status change events (matches standard website socket events)
    for (final eventName in [
      'order_status_updated',
      'order_status_changed',
      'order_updated',
      'orderStatusUpdate',
      'order:status',
    ]) {
      _socket!.on(eventName, (data) {
        debugPrint('📦 Socket order event received: $eventName -> $data');
        if (data is Map<String, dynamic>) {
          _orderUpdateController.add(data);
        } else if (data is Map) {
          _orderUpdateController.add(Map<String, dynamic>.from(data));
        }
      });
    }

    // 2. KHQR & payment success events
    for (final eventName in [
      'payment_success',
      'payment_completed',
      'payment_status',
      'khqr_paid',
      'payment:success',
    ]) {
      _socket!.on(eventName, (data) {
        debugPrint('💳 Socket payment event received: $eventName -> $data');
        if (data is Map<String, dynamic>) {
          _paymentUpdateController.add(data);
        } else if (data is Map) {
          _paymentUpdateController.add(Map<String, dynamic>.from(data));
        }
      });
    }

    // 3. Product & inventory updates
    for (final eventName in [
      'product_updated',
      'stock_updated',
      'new_review',
      'flash_sale_updated',
    ]) {
      _socket!.on(eventName, (data) {
        debugPrint('🛍️ Socket product event received: $eventName -> $data');
        if (data is Map<String, dynamic>) {
          _productUpdateController.add(data);
        } else if (data is Map) {
          _productUpdateController.add(Map<String, dynamic>.from(data));
        }
      });
    }
  }

  /// Emit a custom event to the backend socket server
  void emit(String event, [dynamic data]) {
    try {
      if (_socket != null && _socket!.connected) {
        _socket!.emit(event, data);
      }
    } catch (e) {
      debugPrint('⚠️ SocketService emit error: $e');
    }
  }

  /// Disconnect socket cleanly (e.g. on user logout or app teardown)
  void disconnect() {
    try {
      _socket?.disconnect();
      _socket = null;
      _isConnected = false;
      _connectionController.add(false);
    } catch (e) {
      debugPrint('⚠️ SocketService disconnect error: $e');
    }
  }

  /// Clean up all stream controllers
  void dispose() {
    disconnect();
    _connectionController.close();
    _orderUpdateController.close();
    _paymentUpdateController.close();
    _productUpdateController.close();
  }
}
