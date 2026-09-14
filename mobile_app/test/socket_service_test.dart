import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/services/socket_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SocketService Unit Tests', () {
    test('SocketService singleton instance exists and has initial disconnected state', () {
      final service = SocketService.instance;
      expect(service, isNotNull);
      expect(service.isConnected, isFalse);
    });

    test('SocketService exposes streams for real-time order, payment, and product updates', () {
      final service = SocketService.instance;
      expect(service.orderUpdatesStream, isNotNull);
      expect(service.paymentUpdatesStream, isNotNull);
      expect(service.productUpdatesStream, isNotNull);
      expect(service.connectionStream, isNotNull);
    });

    test('SocketService connects and disconnects cleanly without errors', () {
      final service = SocketService.instance;

      // Connect with test user and token
      service.connect(
        userId: 'test_customer_123',
        token: 'test_auth_jwt_token',
        customUrl: 'http://localhost:4000',
      );

      // Emit event safely
      service.emit('ping', {'test': true});

      // Disconnect cleanly
      service.disconnect();
      expect(service.isConnected, isFalse);
    });
  });
}
