import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/core/models/order.dart';
import 'package:mobile_app/core/models/cart_item.dart';
import 'package:mobile_app/features/products/domain/entities/product_entity.dart';
import 'package:mobile_app/core/services/review_requirement_service.dart';
import 'package:mobile_app/core/services/push_notification_service.dart';
import 'package:mobile_app/features/notifications/presentation/bloc/notification_cubit.dart';
import 'package:mobile_app/features/orders/presentation/bloc/order_bloc.dart';
import 'package:mobile_app/features/orders/presentation/pages/rating_thank_you_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const testProduct = ProductEntity(
    id: 'prod_123',
    title: 'Baby Stroller Deluxe',
    description: 'Comfortable stroller',
    price: 99.0,
    originalPrice: 120.0,
    rating: 4.8,
    ratingCount: 25,
    image: 'https://example.com/stroller.jpg',
    images: ['https://example.com/stroller.jpg'],
    category: 'Strollers',
    availableColors: ['Red', 'Blue'],
    availableSizes: ['Standard'],
    reviews: [],
  );

  final testCartItem = CartItem(product: testProduct, quantity: 1);

  group('Order Rating Flow & Registration Bug Tests', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    test('1. Newly registered customer with 0 orders has ZERO pending reviews and no rating prompt', () async {
      const newUserId = 'new_customer_999';

      // Ensure no orders exist for this new user
      final pending = await ReviewRequirementService.getPendingReviewItems(
        userId: newUserId,
        currentOrders: [],
      );

      expect(pending, isEmpty, reason: 'New customer must have 0 pending reviews');

      // Initialize OrderBloc for this new customer
      final orderBloc = OrderBloc(preferences: prefs);
      expect(orderBloc.state.orders, isEmpty);
      expect(orderBloc.state.pendingReviewItems, isEmpty);
      expect(orderBloc.state.deliveryReviewPrompt, isNull);

      await orderBloc.close();
    });

    test('2. Customer orders product (status: processing) -> No rating notification or prompt', () async {
      const customerId = 'customer_101';
      final processingOrder = OrderModel(
        id: '#ORD-10001',
        date: DateTime.now(),
        items: [testCartItem],
        subtotal: 99.0,
        discount: 0.0,
        shipping: 0.0,
        tax: 0.0,
        total: 99.0,
        deliveryAddress: 'Street 210, Phnom Penh',
        paymentMethod: 'Cash on Delivery',
        status: OrderStatus.processing,
        trackingNumber: 'TRK-10001',
        estimatedDelivery: 'Tomorrow',
        isPaid: false,
      );

      final pending = await ReviewRequirementService.getPendingReviewItems(
        userId: customerId,
        currentOrders: [processingOrder],
      );

      expect(pending, isEmpty, reason: 'Processing order must not require product rating');
    });

    test('3. When order status is delivered -> Send notification to customer for rating the product', () async {
      final notifCubit = NotificationCubit(preferences: prefs);
      await PushNotificationService.instance.init(notificationCubit: notifCubit);

      final deliveredOrder = OrderModel(
        id: '#ORD-10002',
        date: DateTime.now(),
        items: [testCartItem],
        subtotal: 99.0,
        discount: 0.0,
        shipping: 0.0,
        tax: 0.0,
        total: 99.0,
        deliveryAddress: 'Street 210, Phnom Penh',
        paymentMethod: 'Bakong KHQR',
        status: OrderStatus.delivered,
        trackingNumber: 'TRK-10002',
        estimatedDelivery: 'Delivered Today',
        isPaid: true,
        deliveredAt: DateTime.now(),
      );

      PushNotificationService.instance.notifyOrderStatusChange(
        order: deliveredOrder,
        newStatus: OrderStatus.delivered,
      );

      final notifs = notifCubit.state.notifications;
      expect(notifs.isNotEmpty, isTrue);
      final deliveredNotif = notifs.first;
      expect(deliveredNotif.title, contains('Rate Your Products'));
      expect(deliveredNotif.message, contains('Please rate the products'));

      await notifCubit.close();
    });

    test('4. When customer opens application with delivered orders -> Product is listed for rating', () async {
      const customerId = 'customer_102';
      final deliveredOrder = OrderModel(
        id: '#ORD-10003',
        date: DateTime.now(),
        items: [testCartItem],
        subtotal: 99.0,
        discount: 0.0,
        shipping: 0.0,
        tax: 0.0,
        total: 99.0,
        deliveryAddress: 'Street 210, Phnom Penh',
        paymentMethod: 'Bakong KHQR',
        status: OrderStatus.delivered,
        trackingNumber: 'TRK-10003',
        estimatedDelivery: 'Delivered',
        isPaid: true,
        deliveredAt: DateTime.now(),
      );

      // Customer has delivered order and has not rated it yet
      final pending = await ReviewRequirementService.getPendingReviewItems(
        userId: customerId,
        currentOrders: [deliveredOrder],
      );

      expect(pending.length, equals(1));
      expect(pending.first.productId, equals('prod_123'));
      expect(pending.first.orderId, equals('#ORD-10003'));

      // After rating, it is no longer pending
      await ReviewRequirementService.markRated(
        orderId: '#ORD-10003',
        productId: 'prod_123',
        userId: customerId,
      );

      final updatedPending = await ReviewRequirementService.getPendingReviewItems(
        userId: customerId,
        currentOrders: [deliveredOrder],
      );

      expect(updatedPending, isEmpty, reason: 'Delivered item must be removed from pending once rated');
    });

    test('5. Previous user ratings/orders never bleed into newly registered customer', () async {
      const oldUserId = 'old_customer_1';
      const newUserId = 'new_registered_customer_2';

      final oldDeliveredOrder = OrderModel(
        id: '#ORD-OLD-99',
        date: DateTime.now(),
        items: [testCartItem],
        subtotal: 99.0,
        discount: 0.0,
        shipping: 0.0,
        tax: 0.0,
        total: 99.0,
        deliveryAddress: 'Street 1, Phnom Penh',
        paymentMethod: 'Bakong KHQR',
        status: OrderStatus.delivered,
        trackingNumber: 'TRK-OLD-99',
        estimatedDelivery: 'Delivered',
        isPaid: true,
        deliveredAt: DateTime.now(),
      );

      // Old user had a delivered order requiring review
      await ReviewRequirementService.getPendingReviewItems(
        userId: oldUserId,
        currentOrders: [oldDeliveredOrder],
      );

      // New customer registers and opens the app with 0 orders
      final newCustomerPending = await ReviewRequirementService.getPendingReviewItems(
        userId: newUserId,
        currentOrders: [],
      );

      expect(newCustomerPending, isEmpty,
          reason: 'Newly registered customer must never receive old user pending reviews');
    });

    testWidgets('6. RatingThankYouPage renders celebration animation, 5 stars, and auto-dismisses after ~2s', (WidgetTester tester) async {
      bool dismissed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: RatingThankYouPage(
            displayDuration: const Duration(milliseconds: 2000),
            onDismissed: () {
              dismissed = true;
            },
          ),
        ),
      );

      // Verify immediate render
      expect(find.text('Thank You!'), findsOneWidget);
      expect(find.textContaining('submitted successfully'), findsOneWidget);
      expect(find.byIcon(Icons.check_rounded), findsOneWidget);
      expect(find.byIcon(Icons.star_rounded), findsNWidgets(5));
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(dismissed, isFalse);

      // Advance by 1 second -> still visible, not yet dismissed
      await tester.pump(const Duration(milliseconds: 1000));
      expect(dismissed, isFalse);

      // Advance past 2 seconds (total 2100ms) -> dismissed callback fired
      await tester.pump(const Duration(milliseconds: 1100));
      expect(dismissed, isTrue);
    });

    testWidgets('7. RatingThankYouPage dismisses immediately when tapped', (WidgetTester tester) async {
      bool dismissed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: RatingThankYouPage(
            displayDuration: const Duration(milliseconds: 2000),
            onDismissed: () {
              dismissed = true;
            },
          ),
        ),
      );

      expect(dismissed, isFalse);
      // Tap anywhere on the page
      await tester.tap(find.byType(GestureDetector).first);
      await tester.pump();

      expect(dismissed, isTrue);
    });
  });
}
