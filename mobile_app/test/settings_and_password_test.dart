import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/theme/bloc/theme_cubit.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:mobile_app/features/cart/presentation/bloc/cart_bloc.dart';
import 'package:mobile_app/features/notifications/presentation/bloc/notification_cubit.dart';
import 'package:mobile_app/features/orders/presentation/bloc/order_bloc.dart';
import 'package:mobile_app/features/products/presentation/bloc/product_bloc.dart';
import 'package:mobile_app/features/profile/presentation/bloc/address_cubit.dart';
import 'package:mobile_app/features/profile/presentation/pages/change_password_page.dart';
import 'package:mobile_app/features/profile/presentation/pages/profile_page.dart';
import 'package:mobile_app/features/profile/presentation/pages/settings_page.dart';
import 'package:mobile_app/features/wishlist/presentation/bloc/wishlist_bloc.dart';

Widget _buildTestApp({required Widget child}) {
  return MultiBlocProvider(
    providers: [
      BlocProvider<ThemeCubit>.value(value: ServiceLocator.instance.themeCubit),
      BlocProvider<AuthBloc>.value(value: ServiceLocator.instance.authBloc),
      BlocProvider<ProductBloc>.value(value: ServiceLocator.instance.productBloc),
      BlocProvider<CartBloc>.value(value: ServiceLocator.instance.cartBloc),
      BlocProvider<WishlistBloc>.value(value: ServiceLocator.instance.wishlistBloc),
      BlocProvider<OrderBloc>.value(value: ServiceLocator.instance.orderBloc),
      BlocProvider<AddressCubit>.value(value: ServiceLocator.instance.addressCubit),
      BlocProvider<NotificationCubit>.value(value: ServiceLocator.instance.notificationCubit),
    ],
    child: MaterialApp(home: child),
  );
}

void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await ServiceLocator.instance.init(preferences: prefs, force: true);
  });

  group('ChangePasswordPage Tests', () {
    testWidgets('renders all input fields, strength indicator, and update button', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const ChangePasswordPage(userEmail: 'parent@example.com'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Change Password'), findsWidgets);
      expect(find.text('Create New Password'), findsOneWidget);
      expect(find.text('Current Password'), findsOneWidget);
      expect(find.text('New Password'), findsOneWidget);
      expect(find.text('Confirm New Password'), findsOneWidget);
      expect(find.text('Update Password'), findsOneWidget);
      expect(find.text('Forgot your current password?'), findsOneWidget);
    });

    testWidgets('validates required fields on submission', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const ChangePasswordPage(userEmail: 'parent@example.com'),
        ),
      );
      await tester.pumpAndSettle();

      // Scroll to Update Password button and tap
      final updateBtn = find.text('Update Password');
      await tester.ensureVisible(updateBtn);
      await tester.tap(updateBtn);
      await tester.pumpAndSettle();

      expect(find.text('Please enter your current password'), findsOneWidget);
      expect(find.text('Please enter your new password'), findsOneWidget);
      expect(find.text('Please confirm your new password'), findsOneWidget);
    });

    testWidgets('validates password minimum length and mismatch', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const ChangePasswordPage(userEmail: 'parent@example.com'),
        ),
      );
      await tester.pumpAndSettle();

      final textFields = find.byType(TextFormField);
      expect(textFields, findsNWidgets(3));

      // Enter short new password and mismatched confirm password
      await tester.enterText(textFields.at(0), 'OldPass123!');
      await tester.enterText(textFields.at(1), '123');
      await tester.enterText(textFields.at(2), 'mismatch');
      await tester.pumpAndSettle();

      final updateBtn = find.text('Update Password');
      await tester.ensureVisible(updateBtn);
      await tester.tap(updateBtn);
      await tester.pumpAndSettle();

      expect(find.text('Password must be at least 6 characters'), findsOneWidget);
      expect(find.text('Passwords do not match'), findsOneWidget);
    });
  });

  group('ForgotPasswordPage Tests', () {
    testWidgets('pre-populates email field when initialEmail is provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const ForgotPasswordPage(initialEmail: 'user_prefill@gmail.com'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Forgot Password'), findsOneWidget);
      expect(find.text('user_prefill@gmail.com'), findsOneWidget);
      expect(find.text('Send Reset Code'), findsOneWidget);
    });
  });

  group('SettingsPage Tests', () {
    testWidgets('renders Account & Security, Preferences, and Support sections', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: const SettingsPage(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('ACCOUNT & SECURITY'), findsOneWidget);
      expect(find.text('PREFERENCES'), findsOneWidget);
      expect(find.text('SUPPORT & LEGAL'), findsOneWidget);
      expect(find.text('Forgot Password'), findsOneWidget);
      expect(find.text('Dark Appearance'), findsOneWidget);
      expect(find.text('Language & Currency'), findsOneWidget);
    });
  });

  group('ProfilePage Settings & Security Tests', () {
    testWidgets('ProfilePage removes inline settings/support containers and opens them via Settings gear icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: ProfilePage(onTabChange: (_) {}),
        ),
      );
      await tester.pumpAndSettle();

      // Verify inline containers are removed from ProfilePage
      expect(find.text('SETTINGS & SECURITY'), findsNothing);
      expect(find.text('SUPPORT & INFORMATION'), findsNothing);
      expect(find.text('Cherish Rewards Club'), findsNothing);

      // Verify Settings gear icon is present in AppBar
      final settingsIcon = find.byTooltip('Settings');
      expect(settingsIcon, findsOneWidget);

      // Tap Settings gear icon to navigate to SettingsPage
      await tester.tap(settingsIcon);
      await tester.pumpAndSettle();

      // Verify SettingsPage is opened with Account & Security and Forgot Password
      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('ACCOUNT & SECURITY'), findsOneWidget);
      expect(find.text('Forgot Password'), findsOneWidget);
      expect(find.text('Dark Appearance'), findsOneWidget);
    });

    testWidgets('ProfilePage does not have notification bell icon on the top AppBar', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildTestApp(
          child: ProfilePage(onTabChange: (_) {}),
        ),
      );
      await tester.pumpAndSettle();

      // Ensure notification bell icon is removed from AppBar
      expect(find.byIcon(Icons.notifications_none_outlined), findsNothing);
      expect(find.byIcon(Icons.notifications), findsNothing);
      expect(find.byIcon(Icons.notifications_outlined), findsNothing);
      expect(find.byTooltip('Notifications'), findsNothing);

      // Verify Settings gear icon is present
      expect(find.byTooltip('Settings'), findsOneWidget);
    });
  });
}
