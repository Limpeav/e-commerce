class ProductColorImage {
  final String color;
  final String image;

  const ProductColorImage({
    required this.color,
    required this.image,
  });

  factory ProductColorImage.fromJson(Map<String, dynamic> json) => ProductColorImage(
        color: (json['color'] ?? json['colorName'] ?? json['name'] ?? '').toString().trim(),
        image: (json['image'] ?? json['imageUrl'] ?? json['url'] ?? '').toString().trim(),
      );

  Map<String, dynamic> toJson() => {
        'color': color,
        'image': image,
      };
}

class ProductDetailImageGroup {
  final String color;
  final List<String> images;

  const ProductDetailImageGroup({
    required this.color,
    required this.images,
  });

  factory ProductDetailImageGroup.fromJson(dynamic data) {
    if (data is Map<String, dynamic>) {
      final color = (data['color'] ?? data['colorName'] ?? '').toString().trim();
      final rawImages = data['images'] ?? data['imageUrls'] ?? data['image'] ?? [];
      final List<String> imgs = [];
      if (rawImages is List) {
        for (final item in rawImages) {
          final str = item.toString().trim();
          if (str.isNotEmpty && (str.startsWith('http') || str.startsWith('assets/'))) {
            imgs.add(str);
          }
        }
      } else if (rawImages is String && rawImages.trim().isNotEmpty) {
        final str = rawImages.trim();
        if (str.startsWith('http') || str.startsWith('assets/')) {
          imgs.add(str);
        }
      }
      return ProductDetailImageGroup(color: color, images: imgs);
    } else if (data is String && data.isNotEmpty) {
      return ProductDetailImageGroup(color: '', images: [data.trim()]);
    }
    return const ProductDetailImageGroup(color: '', images: []);
  }

  Map<String, dynamic> toJson() => {
        'color': color,
        'images': images,
      };
}

class ProductSizeStock {
  final String size;
  final String color;
  final int stock;

  const ProductSizeStock({
    required this.size,
    required this.color,
    required this.stock,
  });

  factory ProductSizeStock.fromJson(Map<String, dynamic> json) => ProductSizeStock(
        size: (json['size'] ?? '').toString().trim(),
        color: (json['color'] ?? '').toString().trim(),
        stock: (json['stock'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'size': size,
        'color': color,
        'stock': stock,
      };
}

class ProductEntity {
  final String id;
  final String title;
  final String? titleKm;
  final double price;
  final double? originalPrice;
  final String description;
  final String? descriptionKm;
  final String category;
  final String image;
  final List<String> images;
  final double rating;
  final int ratingCount;
  final List<String> availableColors;
  final List<String> availableSizes;
  final bool isFlashDeal;
  final int discountPercentage;
  final int stock;
  final List<ProductReviewEntity> reviews;
  final List<ProductColorImage> colorImages;
  final List<ProductDetailImageGroup> productDetailImages;
  final List<ProductSizeStock> sizeStocks;

  const ProductEntity({
    required this.id,
    required this.title,
    this.titleKm,
    required this.price,
    this.originalPrice,
    required this.description,
    this.descriptionKm,
    required this.category,
    required this.image,
    required this.images,
    this.rating = 4.5,
    this.ratingCount = 120,
    required this.availableColors,
    required this.availableSizes,
    this.isFlashDeal = false,
    this.discountPercentage = 0,
    this.stock = 25,
    required this.reviews,
    this.colorImages = const [],
    this.productDetailImages = const [],
    this.sizeStocks = const [],
  });

  ProductEntity copyWith({
    String? id,
    String? title,
    String? titleKm,
    double? price,
    double? originalPrice,
    String? description,
    String? descriptionKm,
    String? category,
    String? image,
    List<String>? images,
    double? rating,
    int? ratingCount,
    List<String>? availableColors,
    List<String>? availableSizes,
    bool? isFlashDeal,
    int? discountPercentage,
    int? stock,
    List<ProductReviewEntity>? reviews,
    List<ProductColorImage>? colorImages,
    List<ProductDetailImageGroup>? productDetailImages,
    List<ProductSizeStock>? sizeStocks,
  }) {
    return ProductEntity(
      id: id ?? this.id,
      title: title ?? this.title,
      titleKm: titleKm ?? this.titleKm,
      price: price ?? this.price,
      originalPrice: originalPrice ?? this.originalPrice,
      description: description ?? this.description,
      descriptionKm: descriptionKm ?? this.descriptionKm,
      category: category ?? this.category,
      image: image ?? this.image,
      images: images ?? this.images,
      rating: rating ?? this.rating,
      ratingCount: ratingCount ?? this.ratingCount,
      availableColors: availableColors ?? this.availableColors,
      availableSizes: availableSizes ?? this.availableSizes,
      isFlashDeal: isFlashDeal ?? this.isFlashDeal,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      stock: stock ?? this.stock,
      reviews: reviews ?? this.reviews,
      colorImages: colorImages ?? this.colorImages,
      productDetailImages: productDetailImages ?? this.productDetailImages,
      sizeStocks: sizeStocks ?? this.sizeStocks,
    );
  }

  /// Returns images for a specific color (color hero image + color detail images + shared images)
  List<String> getImagesForColor(String? selectedColor) {
    final List<String> result = [];
    final cleanColor = (selectedColor ?? '').trim().toLowerCase();

    // Collect images that belong to other colors to avoid cross-color pollution
    final otherColorImages = <String>{};
    if (cleanColor.isNotEmpty && cleanColor != 'default') {
      for (final ci in colorImages) {
        if (ci.color.trim().toLowerCase() != cleanColor && ci.image.isNotEmpty) {
          otherColorImages.add(ci.image);
        }
      }
      for (final group in productDetailImages) {
        if (group.color.trim().toLowerCase() != cleanColor &&
            group.color.trim().toLowerCase() != 'product' &&
            group.color.trim().toLowerCase() != 'general' &&
            group.color.trim().isNotEmpty) {
          otherColorImages.addAll(group.images);
        }
      }
    }

    // 1. Color-specific hero image from colorImages
    if (cleanColor.isNotEmpty && cleanColor != 'default') {
      for (final ci in colorImages) {
        if (ci.color.trim().toLowerCase() == cleanColor && ci.image.isNotEmpty) {
          result.add(ci.image);
          break;
        }
      }
    }

    // 2. Color-specific detailed images from productDetailImages
    if (cleanColor.isNotEmpty && cleanColor != 'default') {
      for (final group in productDetailImages) {
        if (group.color.trim().toLowerCase() == cleanColor) {
          for (final img in group.images) {
            if (!result.contains(img)) {
              result.add(img);
            }
          }
        }
      }
    }

    // 3. Shared/generic product detail images (e.g. color is 'Product', 'General', or empty)
    for (final group in productDetailImages) {
      final groupColor = group.color.trim().toLowerCase();
      if (groupColor == 'product' || groupColor == 'general' || groupColor.isEmpty) {
        for (final img in group.images) {
          if (!result.contains(img) && !otherColorImages.contains(img)) {
            result.add(img);
          }
        }
      }
    }

    // 4. Fallback to main product image and general images if no color-specific images exist
    if (result.isEmpty) {
      if (image.isNotEmpty && !otherColorImages.contains(image)) {
        result.add(image);
      }
      for (final img in images) {
        if (!result.contains(img) && !otherColorImages.contains(img)) {
          result.add(img);
        }
      }
    }

    return result.isNotEmpty ? result : (image.isNotEmpty ? [image] : []);
  }

  /// Returns the main image URL for a color from colorImages, or null if none
  String? getImageForColor(String? selectedColor) {
    if (selectedColor == null || selectedColor.isEmpty) return null;
    final clean = selectedColor.trim().toLowerCase();
    for (final ci in colorImages) {
      if (ci.color.trim().toLowerCase() == clean && ci.image.isNotEmpty) {
        return ci.image;
      }
    }
    return null;
  }

  /// Returns stock for a specific (size, color) variant
  int getStockForVariant({String? size, String? color}) {
    if (sizeStocks.isEmpty) return stock;

    final cleanSize = (size ?? '').trim().toLowerCase();
    final cleanColor = (color ?? '').trim().toLowerCase();

    if (cleanSize.isNotEmpty && cleanColor.isNotEmpty && cleanColor != 'default' && cleanSize != 'standard') {
      for (final s in sizeStocks) {
        if (s.size.trim().toLowerCase() == cleanSize &&
            s.color.trim().toLowerCase() == cleanColor) {
          return s.stock;
        }
      }
    } else if (cleanColor.isNotEmpty && cleanColor != 'default') {
      final colorMatches = sizeStocks.where((s) => s.color.trim().toLowerCase() == cleanColor);
      if (colorMatches.isNotEmpty) {
        return colorMatches.fold<int>(0, (sum, item) => sum + item.stock);
      }
    } else if (cleanSize.isNotEmpty && cleanSize != 'standard') {
      final sizeMatches = sizeStocks.where((s) => s.size.trim().toLowerCase() == cleanSize);
      if (sizeMatches.isNotEmpty) {
        return sizeMatches.fold<int>(0, (sum, item) => sum + item.stock);
      }
    }

    return stock;
  }

  /// Whether a color variant is completely out of stock across all sizes
  bool isColorOutOfStock(String colorName) {
    if (sizeStocks.isEmpty) return stock <= 0;
    final clean = colorName.trim().toLowerCase();
    final matches = sizeStocks.where((s) => s.color.trim().toLowerCase() == clean);
    if (matches.isEmpty) return stock <= 0;
    return matches.every((s) => s.stock <= 0);
  }

  /// Whether a size variant is out of stock (optionally for a given color)
  bool isSizeOutOfStock(String sizeName, {String? colorName}) {
    if (sizeStocks.isEmpty) return stock <= 0;
    final cleanSize = sizeName.trim().toLowerCase();
    final cleanColor = (colorName ?? '').trim().toLowerCase();

    if (cleanColor.isNotEmpty && cleanColor != 'default') {
      final match = sizeStocks.firstWhere(
        (s) => s.size.trim().toLowerCase() == cleanSize && s.color.trim().toLowerCase() == cleanColor,
        orElse: () => const ProductSizeStock(size: '', color: '', stock: -1),
      );
      if (match.stock >= 0) return match.stock <= 0;
    }

    final matches = sizeStocks.where((s) => s.size.trim().toLowerCase() == cleanSize);
    if (matches.isEmpty) return stock <= 0;
    return matches.every((s) => s.stock <= 0);
  }
}

class ProductReviewEntity {
  final String userName;
  final String userAvatar;
  final double rating;
  final String comment;
  final String date;

  const ProductReviewEntity({
    required this.userName,
    required this.userAvatar,
    required this.rating,
    required this.comment,
    required this.date,
  });
}
