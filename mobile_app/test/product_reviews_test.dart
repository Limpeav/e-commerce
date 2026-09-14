import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/features/profile/presentation/bloc/address_cubit.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/cart/presentation/bloc/cart_bloc.dart';
import 'package:mobile_app/features/orders/presentation/bloc/order_bloc.dart';
import 'package:mobile_app/features/products/presentation/bloc/product_bloc.dart';
import 'package:mobile_app/core/theme/bloc/theme_cubit.dart';
import 'package:mobile_app/features/wishlist/presentation/bloc/wishlist_bloc.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/models/product.dart';
import 'package:mobile_app/features/product_details/presentation/pages/product_details_page.dart';
import 'package:mobile_app/features/product_details/presentation/pages/product_reviews_page.dart';

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

  const testProduct = Product(
    id: 'test-item-1',
    title: 'Edition Valencia Linen Shirt',
    price: 24.99,
    description: 'High quality summer linen shirt with breathable fabric.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    rating: 4.9,
    ratingCount: 224,
    availableColors: ['White', 'Navy'],
    availableSizes: ['S', 'M', 'L'],
    reviews: [
      ProductReview(
        userName: 'Carly West',
        userAvatar: '',
        rating: 4.0,
        comment: 'I am very happy to refer to anyone who enjoys online shopping.',
        date: 'Oct 20, 2020',
      ),
      ProductReview(
        userName: 'Kate Carter',
        userAvatar: '',
        rating: 5.0,
        comment: "I'm very happy with order, it was delivered on time and very good quality.",
        date: 'Oct 20, 2020',
      ),
    ],
  );

  testWidgets('ProductDetailsPage has clickable Reviews button and navigates to ProductReviewsPage', (tester) async {
    await tester.pumpWidget(_buildTestApp(child: const ProductDetailsPage(product: testProduct)));
    await tester.pumpAndSettle();

    // Verify Reviews button is visible in ProductDetailsPage
    expect(find.text('Reviews'), findsOneWidget);
    expect(find.text('(224 reviews)'), findsOneWidget);

    // Tap on the Reviews button
    await tester.tap(find.text('Reviews'));
    await tester.pumpAndSettle();

    // Verify navigation landed on ProductReviewsPage
    expect(find.byType(ProductReviewsPage), findsOneWidget);
    expect(find.text('Reviews'), findsWidgets); // Title and count
    expect(find.text('Edition Valencia Linen Shirt'), findsOneWidget);
    expect(find.text('\$24.99'), findsWidgets);
    expect(find.text('4.9'), findsOneWidget);
    expect(find.text('OUT OF 5'), findsOneWidget);
    expect(find.text('224 ratings'), findsOneWidget);

    // Verify customer reviews are displayed
    expect(find.text('Carly West'), findsOneWidget);
    expect(find.text('I am very happy to refer to anyone who enjoys online shopping.'), findsOneWidget);
    expect(find.text('Kate Carter'), findsOneWidget);

    // Verify initial letters in front of names are rendered in the avatars
    expect(find.text('C'), findsWidgets);
    expect(find.text('K'), findsWidgets);

    // Verify read-only: No write review button
    expect(find.text('WRITE A REVIEW'), findsNothing);
    expect(find.byType(TextField), findsNothing);
  });

  testWidgets('ProductReviewsPage renders distribution breakdown accurately', (tester) async {
    await tester.pumpWidget(_buildTestApp(child: const ProductReviewsPage(product: testProduct)));
    await tester.pumpAndSettle();

    expect(find.text('2 Reviews'), findsOneWidget);
    expect(find.text('5'), findsOneWidget);
    expect(find.text('4'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
  });

  testWidgets('ProductReviewsPage places new comments on top, formats date as DD-MM-YYYY, and removes refresh icon from AppBar', (tester) async {
    const multiReviewProduct = Product(
      id: 'test-item-cambodia',
      title: 'Baby Diapers Pack',
      price: 18.00,
      description: 'Comfortable diapers',
      category: 'diapers',
      image: 'https://example.com/diapers.jpg',
      images: ['https://example.com/diapers.jpg'],
      rating: 4.3,
      ratingCount: 3,
      availableColors: ['White'],
      availableSizes: ['M'],
      reviews: [
        ProductReview(
          userName: 'Old Reviewer',
          userAvatar: '',
          rating: 5.0,
          comment: 'Bought in July.',
          date: '2026-07-19',
        ),
        ProductReview(
          userName: 'Mid Reviewer',
          userAvatar: '',
          rating: 4.0,
          comment: 'Bought late July.',
          date: '2026-07-22',
        ),
        ProductReview(
          userName: 'Newest Reviewer',
          userAvatar: '',
          rating: 5.0,
          comment: 'Bought in September.',
          date: '2026-09-06',
        ),
      ],
    );

    await tester.pumpWidget(_buildTestApp(child: const ProductReviewsPage(product: multiReviewProduct)));
    await tester.pumpAndSettle();

    // 1. Verify refresh icon on AppBar is removed
    expect(find.byIcon(Icons.refresh), findsNothing);

    // 2. Verify date text format is DD-MM-YYYY (day month year)
    expect(find.text('5 OUT OF 5, 06-09-2026'), findsOneWidget);
    expect(find.text('4 OUT OF 5, 22-07-2026'), findsOneWidget);
    expect(find.text('5 OUT OF 5, 19-07-2026'), findsOneWidget);

    // 3. Verify chronological order: newest comment is on TOP of old comments
    final newestTop = tester.getTopLeft(find.text('Newest Reviewer')).dy;
    final midTop = tester.getTopLeft(find.text('Mid Reviewer')).dy;
    final oldTop = tester.getTopLeft(find.text('Old Reviewer')).dy;

    expect(newestTop < midTop, isTrue, reason: 'Newest review (Sep 06) must be above mid review (Jul 22)');
    expect(midTop < oldTop, isTrue, reason: 'Mid review (Jul 22) must be above old review (Jul 19)');
  });
}
