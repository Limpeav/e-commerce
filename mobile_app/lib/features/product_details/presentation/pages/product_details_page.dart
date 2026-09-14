import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../features/cart/presentation/bloc/cart_bloc.dart';
import '../../../../features/cart/presentation/bloc/cart_event.dart';
import '../../../../features/products/data/datasources/product_remote_datasource.dart';
import '../../../../features/products/presentation/bloc/product_bloc.dart';
import '../../../../features/products/presentation/bloc/product_state.dart';
import '../../../../features/wishlist/presentation/bloc/wishlist_bloc.dart';
import '../../../../features/wishlist/presentation/bloc/wishlist_event.dart';
import '../../../../features/wishlist/presentation/bloc/wishlist_state.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/category_assets.dart';
import '../../../../core/models/product.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../../../core/widgets/app_cached_image.dart';
import '../../../checkout/presentation/pages/checkout_page.dart';
import 'product_reviews_page.dart';

class ProductDetailsPage extends StatefulWidget {
  final Product product;
  final String? heroTag;

  const ProductDetailsPage({super.key, required this.product, this.heroTag});

  @override
  State<ProductDetailsPage> createState() => _ProductDetailsPageState();
}

class _ProductDetailsPageState extends State<ProductDetailsPage> {
  late PageController _imagePageController;
  int _selectedImageIndex = 0;
  late String _selectedColor;
  late String _selectedSize;
  int _quantity = 1;
  Product? _liveProduct;

  @override
  void initState() {
    super.initState();
    _liveProduct = widget.product;
    _selectedColor = widget.product.availableColors.isNotEmpty
        ? widget.product.availableColors.first
        : 'Default';
    _selectedSize = widget.product.availableSizes.isNotEmpty
        ? widget.product.availableSizes.first
        : 'Standard';
    _imagePageController = PageController(initialPage: 0);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchLiveProduct();
    });
  }

  @override
  void dispose() {
    _imagePageController.dispose();
    super.dispose();
  }

  Future<void> _fetchLiveProduct() async {
    if (widget.product.id.isEmpty) return;
    try {
      final isTest = Platform.environment.containsKey('FLUTTER_TEST');
      if (isTest) return;

      final ds = ProductRemoteDataSourceImpl(apiClient: ApiClient());
      final fetched = await ds.fetchProductById(widget.product.id);
      if (fetched != null && mounted) {
        setState(() {
          _liveProduct = fetched;
          // Synchronize initial selections with backend options
          if (fetched.availableColors.isNotEmpty &&
              !fetched.availableColors.any((c) => c.toLowerCase() == _selectedColor.toLowerCase())) {
            _selectedColor = fetched.availableColors.first;
          }
          if (fetched.availableSizes.isNotEmpty &&
              !fetched.availableSizes.any((s) => s.toLowerCase() == _selectedSize.toLowerCase())) {
            _selectedSize = fetched.availableSizes.first;
          }
        });
      }
    } catch (_) {}
  }

  void _onColorChanged(String newColor) {
    if (_selectedColor.toLowerCase() == newColor.toLowerCase()) return;
    setState(() {
      _selectedColor = newColor;
      _selectedImageIndex = 0;
    });

    if (_imagePageController.hasClients) {
      _imagePageController.animateToPage(
        0,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeInOut,
      );
    }
  }

  Color _getColorFromName(String colorName) {
    final clean = colorName.trim().toLowerCase();
    if (clean.contains('pink') || clean.contains('blush')) return const Color(0xFFF472B6);
    if (clean.contains('yellow')) return const Color(0xFFFBBF24);
    if (clean.contains('mint') || clean.contains('sage')) return const Color(0xFFA7F3D0);
    if (clean.contains('sky')) return const Color(0xFF38BDF8);
    if (clean.contains('slate')) return const Color(0xFF64748B);
    if (clean.contains('blue')) return const Color(0xFF3B82F6);
    if (clean.contains('navy')) return const Color(0xFF1E3A8A);
    if (clean.contains('green') || clean.contains('forest')) return const Color(0xFF10B981);
    if (clean.contains('red')) return const Color(0xFFEF4444);
    if (clean.contains('purple')) return const Color(0xFF8B5CF6);
    if (clean.contains('brown') || clean.contains('mocha')) return const Color(0xFF78350F);
    if (clean.contains('beige') || clean.contains('sand')) return const Color(0xFFD7C4B7);
    if (clean.contains('cream')) return const Color(0xFFFEF3C7);
    if (clean.contains('gray') || clean.contains('grey') || clean.contains('charcoal')) return const Color(0xFF9CA3AF);
    if (clean.contains('black')) return const Color(0xFF1F2937);
    if (clean.contains('white')) return const Color(0xFFF9FAFB);
    if (clean.contains('peach')) return const Color(0xFFFDBA74);
    if (clean.contains('giraffe')) return const Color(0xFFD97706);
    if (clean.contains('daisy')) return const Color(0xFFFDE68A);
    return AppColors.primary;
  }

  void _openFullScreenGallery(BuildContext context, List<String> images, int initialIndex) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _FullScreenGalleryView(
          images: images,
          initialIndex: initialIndex,
          colorName: _selectedColor,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subtextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, productState) {
        final product = _liveProduct ??
            (productState.getProductById(widget.product.id) ?? widget.product);

        // Fetch images specific to the selected color based on backend colorImages & productDetailImages
        final activeImages = product.getImagesForColor(_selectedColor);
        final safeImageIndex = _selectedImageIndex.clamp(0, activeImages.isNotEmpty ? activeImages.length - 1 : 0);

        // Variant stock calculation
        final variantStock = product.getStockForVariant(
          size: _selectedSize,
          color: _selectedColor,
        );
        final isOutOfStock = variantStock <= 0;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Product Details'),
            actions: [
              BlocBuilder<WishlistBloc, WishlistState>(
                builder: (context, wishlistState) {
                  final isFav = wishlistState.isFavorite(product.id);
                  return IconButton(
                    icon: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: isFav ? AppColors.discountRed : null,
                    ),
                    onPressed: () {
                      AuthGuard.requireAuth(
                        context,
                        title: 'Sign In to Save Favorites',
                        message:
                            'Please sign in or create an account to add this product to your wishlist.',
                        onAuthenticated: () {
                          context.read<WishlistBloc>().add(
                                WishlistToggleRequested(product: product),
                              );
                          ScaffoldMessenger.of(context).clearSnackBars();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                isFav
                                    ? 'Removed from wishlist'
                                    : 'Added to wishlist',
                              ),
                              duration: const Duration(seconds: 1),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      );
                    },
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.share_outlined),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Product link copied to clipboard!'),
                      duration: Duration(seconds: 1),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Hero Image Container with color-specific photos
                Container(
                  height: 330,
                  width: double.infinity,
                  color: isDark
                      ? const Color(0xFF1E293B)
                      : const Color(0xFFF8FAFC),
                  child: Stack(
                    children: [
                      PageView.builder(
                        controller: _imagePageController,
                        itemCount: activeImages.length,
                        onPageChanged: (index) {
                          setState(() {
                            _selectedImageIndex = index;
                          });
                        },
                        itemBuilder: (context, index) {
                          return GestureDetector(
                            onTap: () => _openFullScreenGallery(
                              context,
                              activeImages,
                              index,
                            ),
                            child: InteractiveViewer(
                              minScale: 1.0,
                              maxScale: 3.0,
                              child: Hero(
                                tag: index == 0
                                    ? (widget.heroTag ?? 'prod_img_${product.id}')
                                    : 'prod_img_${product.id}_$index',
                                child: AppCachedImage(
                                  imageUrl: activeImages[index],
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      // Discount Badge (Top Left)
                      if (product.discountPercentage > 0)
                        Positioned(
                          top: 14,
                          left: 14,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.discountRed,
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x33E53935),
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              'SAVE ${product.discountPercentage}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ),

                      // Image Counter Badge & Zoom Hint (Top Right)
                      if (activeImages.isNotEmpty)
                        Positioned(
                          top: 14,
                          right: 14,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.photo_library_outlined,
                                  color: Colors.white,
                                  size: 13,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${safeImageIndex + 1} / ${activeImages.length}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Floating Zoom Icon (Bottom Right)
                      Positioned(
                        bottom: 14,
                        right: 14,
                        child: GestureDetector(
                          onTap: () => _openFullScreenGallery(
                            context,
                            activeImages,
                            safeImageIndex,
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark.withValues(alpha: 0.8) : Colors.white.withValues(alpha: 0.85),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 6,
                                ),
                              ],
                            ),
                            child: Icon(
                              Icons.fullscreen_rounded,
                              size: 20,
                              color: textColor,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Product Detail Images Thumbnail Gallery (Follows backend productDetailImages)
                if (activeImages.length > 1)
                  Container(
                    height: 74,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    color: isDark ? AppColors.surfaceDark.withValues(alpha: 0.5) : const Color(0xFFF1F5F9),
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: activeImages.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final isSelected = safeImageIndex == idx;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedImageIndex = idx;
                            });
                            if (_imagePageController.hasClients) {
                              _imagePageController.animateToPage(
                                idx,
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeInOut,
                              );
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 58,
                            height: 58,
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : borderColor,
                                width: isSelected ? 2.5 : 1.2,
                              ),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: AppColors.primary.withValues(alpha: 0.3),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: AppCachedImage(
                                imageUrl: activeImages[idx],
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                // 3. Content Body
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category & Live Backend Stock Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.accentLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                CategoryIconWidget(
                                  category: product.category,
                                  size: 13,
                                  color: AppColors.accent,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  product.category.toUpperCase(),
                                  style: const TextStyle(
                                    color: AppColors.accent,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isOutOfStock
                                  ? AppColors.discountRed.withValues(alpha: 0.12)
                                  : (variantStock <= 5
                                      ? AppColors.warmAmber.withValues(alpha: 0.15)
                                      : AppColors.successGreenLight),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isOutOfStock
                                      ? Icons.cancel_outlined
                                      : (variantStock <= 5
                                          ? Icons.warning_amber_rounded
                                          : Icons.check_circle_outline),
                                  size: 14,
                                  color: isOutOfStock
                                      ? AppColors.discountRed
                                      : (variantStock <= 5
                                          ? AppColors.warmAmber
                                          : AppColors.successGreen),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isOutOfStock
                                      ? 'Out of Stock'
                                      : (variantStock <= 5
                                          ? 'Only $variantStock left in stock!'
                                          : 'In Stock ($variantStock)'),
                                  style: TextStyle(
                                    color: isOutOfStock
                                        ? AppColors.discountRed
                                        : (variantStock <= 5
                                            ? AppColors.warmAmber
                                            : AppColors.successGreen),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Product Title
                      Text(
                        product.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Rating & Reviews row with button/tap to open reviews page
                      Row(
                        children: [
                          InkWell(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ProductReviewsPage(product: product),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.star_rounded,
                                    color: AppColors.warmAmber,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    product.rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '(${product.ratingCount} reviews)',
                                    style: TextStyle(
                                      color: subtextColor,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? AppColors.surfaceSoftDark
                                          : AppColors.accentLight,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Reviews',
                                          style: TextStyle(
                                            color: isDark
                                                ? AppColors.textPrimaryDark
                                                : AppColors.accent,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 2),
                                        Icon(
                                          Icons.chevron_right_rounded,
                                          size: 14,
                                          color: isDark
                                              ? AppColors.textPrimaryDark
                                              : AppColors.accent,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Price Section
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '\$${product.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: AppColors.accent,
                            ),
                          ),
                          const SizedBox(width: 10),
                          if (product.originalPrice != null && product.discountPercentage > 0) ...[
                            Text(
                              '\$${product.originalPrice!.toStringAsFixed(2)}',
                              style: TextStyle(
                                fontSize: 16,
                                decoration: TextDecoration.lineThrough,
                                color: subtextColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.discountRed,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'SAVE ${product.discountPercentage}%',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const Divider(height: 32),

                      // 4. Color Variant Selector (Follows backend colorImages & colors)
                      if (product.availableColors.isNotEmpty) ...[
                        Row(
                          children: [
                            const Text(
                              'Color: ',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              _selectedColor,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${product.availableColors.length} Option${product.availableColors.length == 1 ? '' : 's'}',
                              style: TextStyle(
                                fontSize: 12,
                                color: subtextColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: product.availableColors.map((color) {
                            final isSelected = _selectedColor.toLowerCase() == color.toLowerCase();
                            final colorImg = product.getImageForColor(color);
                            final colorOutOfStock = product.isColorOutOfStock(color);

                            return InkWell(
                              onTap: () => _onColorChanged(color),
                              borderRadius: BorderRadius.circular(12),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary.withValues(alpha: isDark ? 0.22 : 0.08)
                                      : (isDark ? AppColors.surfaceDark : Colors.white),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : (colorOutOfStock ? Colors.grey.withValues(alpha: 0.3) : borderColor),
                                    width: isSelected ? 2.0 : 1.2,
                                  ),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: AppColors.primary.withValues(alpha: 0.18),
                                            blurRadius: 4,
                                            offset: const Offset(0, 1),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Visual color preview from backend colorImages or color swatch
                                    if (colorImg != null && colorImg.isNotEmpty)
                                      Container(
                                        width: 22,
                                        height: 22,
                                        margin: const EdgeInsets.only(right: 6),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isSelected ? AppColors.primary : Colors.grey.withValues(alpha: 0.4),
                                            width: 1,
                                          ),
                                        ),
                                        child: ClipOval(
                                          child: AppCachedImage(
                                            imageUrl: colorImg,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      )
                                    else
                                      Container(
                                        width: 16,
                                        height: 16,
                                        margin: const EdgeInsets.only(right: 6),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: _getColorFromName(color),
                                          border: Border.all(
                                            color: isDark ? Colors.white24 : Colors.black12,
                                            width: 1,
                                          ),
                                        ),
                                      ),
                                    Text(
                                      color,
                                      style: TextStyle(
                                        color: isSelected
                                            ? AppColors.primary
                                            : (colorOutOfStock ? Colors.grey : textColor),
                                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                        fontSize: 13,
                                        decoration: colorOutOfStock ? TextDecoration.lineThrough : null,
                                      ),
                                    ),
                                    if (isSelected) ...[
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.check_circle,
                                        color: AppColors.primary,
                                        size: 14,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 5. Size / Specification Variant Selector (Follows backend sizes & sizeStocks)
                      if (product.availableSizes.isNotEmpty) ...[
                        Row(
                          children: [
                            const Text(
                              'Size / Specification: ',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              _selectedSize,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: product.availableSizes.map((size) {
                            final isSelected = _selectedSize.toLowerCase() == size.toLowerCase();
                            final sizeStock = product.getStockForVariant(
                              size: size,
                              color: _selectedColor,
                            );
                            final sizeOutOfStock = sizeStock <= 0;

                            return InkWell(
                              onTap: () {
                                setState(() {
                                  _selectedSize = size;
                                  if (sizeStock > 0 && _quantity > sizeStock) {
                                    _quantity = sizeStock;
                                  }
                                });
                              },
                              borderRadius: BorderRadius.circular(10),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary.withValues(alpha: isDark ? 0.22 : 0.08)
                                      : (isDark ? AppColors.surfaceDark : Colors.white),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : (sizeOutOfStock ? Colors.grey.withValues(alpha: 0.3) : borderColor),
                                    width: isSelected ? 2.0 : 1.2,
                                  ),
                                ),
                                child: Text(
                                  size,
                                  style: TextStyle(
                                    color: isSelected
                                        ? AppColors.primary
                                        : (sizeOutOfStock ? Colors.grey : textColor),
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                    fontSize: 13,
                                    decoration: sizeOutOfStock ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 6. Quantity Selector
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Quantity',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.surfaceDark
                                  : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: borderColor,
                              ),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove, size: 18),
                                  onPressed: (!isOutOfStock && _quantity > 1)
                                      ? () {
                                          setState(() {
                                            _quantity--;
                                          });
                                        }
                                      : null,
                                ),
                                Text(
                                  '$_quantity',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add, size: 18),
                                  onPressed: (!isOutOfStock && _quantity < variantStock)
                                      ? () {
                                          setState(() {
                                            _quantity++;
                                          });
                                        }
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 32),

                      // 7. Product Description (English & Khmer)
                      const Text(
                        'About This Item',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product.description,
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: subtextColor,
                        ),
                      ),
                      const SizedBox(height: 90),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 8. Sticky Bottom Action Bar
          bottomSheet: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  // Add to Cart Button
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(
                          color: isOutOfStock ? Colors.grey : AppColors.accent,
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: isOutOfStock
                          ? null
                          : () {
                              AuthGuard.requireAuth(
                                context,
                                title: 'Sign In to Buy',
                                message:
                                    'Please sign in or create an account before adding items to your cart.',
                                onAuthenticated: () {
                                  context.read<CartBloc>().add(
                                        CartItemAdded(
                                          product: product,
                                          quantity: _quantity,
                                          color: _selectedColor,
                                          size: _selectedSize,
                                        ),
                                      );
                                  ScaffoldMessenger.of(context).clearSnackBars();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Added ${product.title} ($_selectedColor, $_selectedSize) to cart',
                                      ),
                                      duration: const Duration(seconds: 2),
                                      behavior: SnackBarBehavior.floating,
                                      action: SnackBarAction(
                                        label: 'VIEW CART',
                                        textColor: AppColors.accent,
                                        onPressed: () {
                                          Navigator.of(context).pop();
                                        },
                                      ),
                                    ),
                                  );
                                },
                              );
                            },
                      icon: Icon(
                        Icons.add_shopping_cart,
                        color: isOutOfStock ? Colors.grey : AppColors.accent,
                      ),
                      label: Text(
                        isOutOfStock ? 'Out of Stock' : 'Add to Cart',
                        style: TextStyle(
                          color: isOutOfStock ? Colors.grey : AppColors.accent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Buy Now Primary Button
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: isOutOfStock ? Colors.grey : AppColors.accent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: isOutOfStock
                          ? null
                          : () {
                              AuthGuard.requireAuth(
                                context,
                                title: 'Sign In to Checkout',
                                message:
                                    'Please sign in or create an account to proceed directly with your order.',
                                onAuthenticated: () {
                                  context.read<CartBloc>().add(
                                        CartItemAdded(
                                          product: product,
                                          quantity: _quantity,
                                          color: _selectedColor,
                                          size: _selectedSize,
                                        ),
                                      );
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => const CheckoutPage(),
                                    ),
                                  );
                                },
                              );
                            },
                      child: Text(
                        isOutOfStock ? 'Unavailable' : 'Buy Now',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Fullscreen zoomable gallery view for inspecting fabric, color & product detail images
class _FullScreenGalleryView extends StatefulWidget {
  final List<String> images;
  final int initialIndex;
  final String colorName;

  const _FullScreenGalleryView({
    required this.images,
    required this.initialIndex,
    required this.colorName,
  });

  @override
  State<_FullScreenGalleryView> createState() => _FullScreenGalleryViewState();
}

class _FullScreenGalleryViewState extends State<_FullScreenGalleryView> {
  late PageController _controller;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          widget.colorName.isNotEmpty && widget.colorName != 'Default'
              ? '${widget.colorName} • ${_currentIndex + 1} of ${widget.images.length}'
              : '${_currentIndex + 1} of ${widget.images.length}',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        onPageChanged: (idx) => setState(() => _currentIndex = idx),
        itemBuilder: (context, index) {
          return Center(
            child: InteractiveViewer(
              minScale: 0.8,
              maxScale: 4.0,
              child: AppCachedImage(
                imageUrl: widget.images[index],
                fit: BoxFit.contain,
              ),
            ),
          );
        },
      ),
    );
  }
}
