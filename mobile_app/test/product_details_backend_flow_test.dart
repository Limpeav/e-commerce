import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/theme/bloc/theme_cubit.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/cart/presentation/bloc/cart_bloc.dart';
import 'package:mobile_app/features/notifications/presentation/bloc/notification_cubit.dart';
import 'package:mobile_app/features/orders/presentation/bloc/order_bloc.dart';
import 'package:mobile_app/features/product_details/presentation/pages/product_details_page.dart';
import 'package:mobile_app/features/products/data/models/product_model.dart';
import 'package:mobile_app/features/products/domain/entities/product_entity.dart';
import 'package:mobile_app/features/products/presentation/bloc/product_bloc.dart';
import 'package:mobile_app/features/profile/presentation/bloc/address_cubit.dart';
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

  group('Backend Alignment - Product Model & Colors & Detail Images', () {
    test('ProductModel.fromJson accurately parses backend colorImages, productDetailImages, and sizeStocks', () {
      final backendJson = {
        '_id': '6a4234025b16cfdb15f2394a',
        'title': 'Toddler T-Shirt Organic Cotton',
        'titleKm': 'អាវយឺតកុមារតូច',
        'price': 15.0,
        'discountPrice': 12.0,
        'description': 'Super comfortable breathable toddler tee.',
        'descriptionKm': 'អាវយឺតកុមារតូចមានផាសុកភាពល្អ។',
        'category': 'Clothing',
        'image': 'https://res.cloudinary.com/main.png',
        'colors': ['Pink', 'Blue'],
        'sizes': ['NB', '0-3M'],
        'colorImages': [
          {
            'color': 'Pink',
            'image': 'https://res.cloudinary.com/pink_hero.png',
          },
          {
            'color': 'Blue',
            'image': 'https://res.cloudinary.com/blue_hero.png',
          },
        ],
        'productDetailImages': [
          {
            'color': 'Pink',
            'images': [
              'https://res.cloudinary.com/pink_detail_1.jpg',
              'https://res.cloudinary.com/pink_detail_2.jpg',
            ],
          },
          {
            'color': 'Blue',
            'images': [
              'https://res.cloudinary.com/blue_detail_1.jpg',
            ],
          },
        ],
        'sizeStocks': [
          {
            'size': 'NB',
            'color': 'Pink',
            'stock': 8,
          },
          {
            'size': '0-3M',
            'color': 'Pink',
            'stock': 4,
          },
          {
            'size': 'NB',
            'color': 'Blue',
            'stock': 0, // out of stock
          },
          {
            'size': '0-3M',
            'color': 'Blue',
            'stock': 3,
          },
        ],
      };

      final product = ProductModel.fromJson(backendJson);

      // Verify basic fields & discount calculation
      expect(product.id, '6a4234025b16cfdb15f2394a');
      expect(product.title, 'Toddler T-Shirt Organic Cotton');
      expect(product.titleKm, 'អាវយឺតកុមារតូច');
      expect(product.price, 12.0);
      expect(product.originalPrice, 15.0);
      expect(product.discountPercentage, 20);

      // Verify colors & colorImages
      expect(product.availableColors, ['Pink', 'Blue']);
      expect(product.colorImages.length, 2);
      expect(product.colorImages[0].color, 'Pink');
      expect(product.colorImages[0].image, 'https://res.cloudinary.com/pink_hero.png');
      expect(product.colorImages[1].color, 'Blue');
      expect(product.colorImages[1].image, 'https://res.cloudinary.com/blue_hero.png');

      // Verify productDetailImages
      expect(product.productDetailImages.length, 2);
      expect(product.productDetailImages[0].color, 'Pink');
      expect(product.productDetailImages[0].images.length, 2);
      expect(product.productDetailImages[1].color, 'Blue');
      expect(product.productDetailImages[1].images.length, 1);

      // Verify getImagesForColor() returns the exact images for each color
      final pinkImages = product.getImagesForColor('Pink');
      expect(pinkImages.first, 'https://res.cloudinary.com/pink_hero.png');
      expect(pinkImages.contains('https://res.cloudinary.com/pink_detail_1.jpg'), true);
      expect(pinkImages.contains('https://res.cloudinary.com/pink_detail_2.jpg'), true);
      expect(pinkImages.contains('https://res.cloudinary.com/blue_hero.png'), false);

      final blueImages = product.getImagesForColor('Blue');
      expect(blueImages.first, 'https://res.cloudinary.com/blue_hero.png');
      expect(blueImages.contains('https://res.cloudinary.com/blue_detail_1.jpg'), true);
      expect(blueImages.contains('https://res.cloudinary.com/pink_hero.png'), false);

      // Verify stock per variant
      expect(product.getStockForVariant(size: 'NB', color: 'Pink'), 8);
      expect(product.getStockForVariant(size: 'NB', color: 'Blue'), 0);
      expect(product.isSizeOutOfStock('NB', colorName: 'Blue'), true);
      expect(product.isSizeOutOfStock('NB', colorName: 'Pink'), false);
    });

    testWidgets('ProductDetailsPage dynamically switches images and thumbnails when a color is selected', (tester) async {
      const testProduct = ProductEntity(
        id: 'prd-stroller-01',
        title: 'BabyJoy Premium Travel Baby Stroller',
        titleKm: 'រទេះរុញទារកគុណភាពខ្ពស់',
        price: 89.99,
        originalPrice: 119.99,
        discountPercentage: 25,
        description: 'Lightweight compact folding stroller.',
        descriptionKm: 'រទេះរុញទារកបត់បានស្រាល និងងាយស្រួល។',
        category: 'Travel & Gear',
        image: 'https://res.cloudinary.com/stroller_main.png',
        images: ['https://res.cloudinary.com/stroller_main.png'],
        availableColors: ['Slate Blue', 'Mocha Brown'],
        availableSizes: ['Standard'],
        colorImages: [
          ProductColorImage(
            color: 'Slate Blue',
            image: 'https://res.cloudinary.com/slate_blue_hero.png',
          ),
          ProductColorImage(
            color: 'Mocha Brown',
            image: 'https://res.cloudinary.com/mocha_brown_hero.png',
          ),
        ],
        productDetailImages: [
          ProductDetailImageGroup(
            color: 'Slate Blue',
            images: [
              'https://res.cloudinary.com/slate_blue_canopy.png',
              'https://res.cloudinary.com/slate_blue_wheel.png',
            ],
          ),
          ProductDetailImageGroup(
            color: 'Mocha Brown',
            images: [
              'https://res.cloudinary.com/mocha_brown_canopy.png',
            ],
          ),
        ],
        sizeStocks: [
          ProductSizeStock(size: 'Standard', color: 'Slate Blue', stock: 12),
          ProductSizeStock(size: 'Standard', color: 'Mocha Brown', stock: 0), // out of stock
        ],
        reviews: [],
      );

      await tester.pumpWidget(_buildTestApp(child: const ProductDetailsPage(product: testProduct)));
      await tester.pumpAndSettle();

      // Verify product title is displayed and Khmer title/description are removed
      expect(find.text('BabyJoy Premium Travel Baby Stroller'), findsOneWidget);
      expect(find.text('រទេះរុញទារកគុណភាពខ្ពស់'), findsNothing);
      expect(find.text('ព័ត៌មានលម្អិតអំពីផលិតផល (Khmer)'), findsNothing);

      // Verify initial selected color is 'Slate Blue'
      expect(find.text('Color: '), findsOneWidget);
      expect(find.text('Slate Blue'), findsWidgets);
      expect(find.text('In Stock (12)'), findsOneWidget);

      // Verify image counter displays 3 images for Slate Blue (Hero + Canopy + Wheel)
      expect(find.text('1 / 3'), findsOneWidget);

      // Verify Add to Cart button is enabled for Slate Blue
      expect(find.text('Add to Cart'), findsOneWidget);

      // Tap on 'Mocha Brown' color option
      final mochaBrownOption = find.text('Mocha Brown');
      expect(mochaBrownOption, findsOneWidget);
      await tester.ensureVisible(mochaBrownOption);
      await tester.tap(mochaBrownOption);
      await tester.pumpAndSettle();

      // Verify selected color switches to Mocha Brown
      expect(find.text('Mocha Brown'), findsWidgets);

      // Verify image counter updates to 2 images for Mocha Brown (Hero + Canopy)
      expect(find.text('1 / 2'), findsOneWidget);

      // Verify stock updates to Out of Stock for Mocha Brown
      expect(find.text('Out of Stock'), findsWidgets);
      expect(find.text('Unavailable'), findsOneWidget);

      // Tap back to 'Slate Blue'
      final slateBlueOption = find.text('Slate Blue');
      await tester.ensureVisible(slateBlueOption.last);
      await tester.tap(slateBlueOption.last);
      await tester.pumpAndSettle();

      // Verify re-switches to Slate Blue with 3 images and in stock state
      expect(find.text('1 / 3'), findsOneWidget);
      expect(find.text('In Stock (12)'), findsOneWidget);
      expect(find.text('Add to Cart'), findsOneWidget);
    });
  });
}
