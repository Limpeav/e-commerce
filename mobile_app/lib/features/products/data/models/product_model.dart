import '../../domain/entities/product_entity.dart';

class ProductReviewModel extends ProductReviewEntity {
  const ProductReviewModel({
    required super.userName,
    required super.userAvatar,
    required super.rating,
    required super.comment,
    required super.date,
  });

  factory ProductReviewModel.fromJson(Map<String, dynamic> json) => ProductReviewModel(
        userName: (json['userName'] ?? json['name'] ?? 'Verified Buyer').toString(),
        userAvatar: (json['userAvatar'] ??
                json['avatar'] ??
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
            .toString(),
        rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
        comment: (json['comment'] ?? json['review'] ?? '').toString(),
        date: (json['date'] ??
                json['createdAt']?.toString().split('T').first ??
                'Recently')
            .toString(),
      );

  Map<String, dynamic> toJson() => {
        'userName': userName,
        'userAvatar': userAvatar,
        'rating': rating,
        'comment': comment,
        'date': date,
      };
}

class ProductModel extends ProductEntity {
  const ProductModel({
    required super.id,
    required super.title,
    super.titleKm,
    required super.price,
    super.originalPrice,
    required super.description,
    super.descriptionKm,
    required super.category,
    required super.image,
    required super.images,
    super.rating = 4.5,
    super.ratingCount = 120,
    required super.availableColors,
    required super.availableSizes,
    super.isFlashDeal = false,
    super.discountPercentage = 0,
    super.stock = 25,
    super.reviews = ProductModel.defaultReviewModels,
    super.colorImages = const [],
    super.productDetailImages = const [],
    super.sizeStocks = const [],
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final String idVal = (json['_id'] ?? json['id'] ?? '').toString();
    
    // Rating calculation
    double ratingVal = 4.5;
    if (json['rating'] is num) {
      ratingVal = (json['rating'] as num).toDouble();
    } else if (json['rating'] is Map) {
      ratingVal = (json['rating']['rate'] as num?)?.toDouble() ?? 4.5;
    }

    final int ratingCountVal = (json['numReviews'] as num?)?.toInt() ??
        (json['rating'] is Map ? (json['rating']['count'] as num?)?.toInt() : null) ??
        14;

    final String mainImg = json['image'] as String? ??
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';

    // 1. Parse colorImages from backend: [ { color: "...", image: "..." } ]
    final List<ProductColorImage> parsedColorImages = [];
    if (json['colorImages'] is List) {
      for (final item in json['colorImages'] as List) {
        if (item is Map) {
          final colorName = (item['color'] ?? item['colorName'] ?? item['name'] ?? '').toString().trim();
          final imgUrl = (item['image'] ?? item['imageUrl'] ?? item['url'] ?? '').toString().trim();
          if (colorName.isNotEmpty || imgUrl.isNotEmpty) {
            parsedColorImages.add(ProductColorImage(color: colorName, image: imgUrl));
          }
        }
      }
    }

    // 2. Parse productDetailImages from backend: [ { color: "...", images: [...] } ] or list of strings
    final List<ProductDetailImageGroup> parsedDetailImageGroups = [];
    if (json['productDetailImages'] is List) {
      for (final item in json['productDetailImages'] as List) {
        if (item is Map) {
          final groupColor = (item['color'] ?? item['colorName'] ?? '').toString().trim();
          final rawImgs = item['images'] ?? item['imageUrls'] ?? item['image'] ?? [];
          final List<String> groupList = [];
          if (rawImgs is List) {
            for (final img in rawImgs) {
              final str = img.toString().trim();
              if (str.isNotEmpty && (str.startsWith('http') || str.startsWith('assets/'))) {
                groupList.add(str);
              }
            }
          } else if (rawImgs is String && rawImgs.trim().isNotEmpty) {
            final str = rawImgs.trim();
            if (str.startsWith('http') || str.startsWith('assets/')) {
              groupList.add(str);
            }
          }
          if (groupList.isNotEmpty || groupColor.isNotEmpty) {
            parsedDetailImageGroups.add(ProductDetailImageGroup(color: groupColor, images: groupList));
          }
        } else if (item is String && item.trim().isNotEmpty) {
          final str = item.trim();
          if (str.startsWith('http') || str.startsWith('assets/')) {
            parsedDetailImageGroups.add(ProductDetailImageGroup(color: '', images: [str]));
          }
        }
      }
    }

    // 3. Parse sizeStocks from backend: [ { size: "...", color: "...", stock: N } ]
    final List<ProductSizeStock> parsedSizeStocks = [];
    if (json['sizeStocks'] is List) {
      for (final item in json['sizeStocks'] as List) {
        if (item is Map) {
          parsedSizeStocks.add(ProductSizeStock(
            size: (item['size'] ?? '').toString().trim(),
            color: (item['color'] ?? '').toString().trim(),
            stock: (item['stock'] as num?)?.toInt() ?? 0,
          ));
        }
      }
    }

    // 4. Flattened image gallery for catalog and general display
    final List<String> imgList = [mainImg];
    for (final ci in parsedColorImages) {
      if (ci.image.isNotEmpty && !imgList.contains(ci.image)) {
        imgList.add(ci.image);
      }
    }
    for (final group in parsedDetailImageGroups) {
      for (final img in group.images) {
        if (!imgList.contains(img)) {
          imgList.add(img);
        }
      }
    }

    // 5. Colors (backend colors list, or derived from colorImages / productDetailImages)
    List<String> colorsList = const [];
    if (json['colors'] is List && (json['colors'] as List).isNotEmpty) {
      final parsed = (json['colors'] as List)
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
      if (parsed.isNotEmpty) colorsList = parsed;
    }
    if (colorsList.isEmpty && parsedColorImages.isNotEmpty) {
      colorsList = parsedColorImages
          .map((c) => c.color)
          .where((c) => c.isNotEmpty)
          .toSet()
          .toList();
    }
    if (colorsList.isEmpty && parsedDetailImageGroups.isNotEmpty) {
      colorsList = parsedDetailImageGroups
          .map((d) => d.color)
          .where((c) => c.isNotEmpty && c.toLowerCase() != 'product' && c.toLowerCase() != 'general')
          .toSet()
          .toList();
    }

    // 6. Sizes (backend sizes list, or derived from sizeStocks)
    List<String> sizesList = const [];
    if (json['sizes'] is List && (json['sizes'] as List).isNotEmpty) {
      final parsed = (json['sizes'] as List)
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
      if (parsed.isNotEmpty) sizesList = parsed;
    }
    if (sizesList.isEmpty && parsedSizeStocks.isNotEmpty) {
      sizesList = parsedSizeStocks
          .map((s) => s.size)
          .where((s) => s.isNotEmpty)
          .toSet()
          .toList();
    }

    final double rawPrice = (json['price'] as num?)?.toDouble() ?? 0.0;
    final double? dbDiscountPrice = (json['discountPrice'] as num?)?.toDouble();

    double effectivePrice = rawPrice;
    double? origPrice = (json['originalPrice'] as num?)?.toDouble() ??
        (json['compareAtPrice'] as num?)?.toDouble();
    int discount = (json['discountPercentage'] as num?)?.toInt() ?? 0;

    // Direct Database discountPrice handling:
    // In backend MongoDB: "price" is regular price, "discountPrice" is the promotional sale price
    if (dbDiscountPrice != null && dbDiscountPrice > 0 && dbDiscountPrice < rawPrice) {
      effectivePrice = dbDiscountPrice;
      origPrice = rawPrice;
      discount = (((rawPrice - dbDiscountPrice) / rawPrice) * 100).round();
    } else if (origPrice != null && origPrice > rawPrice && origPrice > 0) {
      discount = (((origPrice - rawPrice) / origPrice) * 100).round();
    } else if (discount > 0 && origPrice == null) {
      origPrice = rawPrice * (1 + (discount / 100));
    }

    // Strictly sanitize discount & original price: If discount <= 0 or original price isn't higher, reset
    if (discount <= 0 || origPrice == null || origPrice <= effectivePrice) {
      discount = 0;
      origPrice = null;
    }

    // Flash Deal flag is strictly true ONLY if the product has a genuine positive discount
    final bool isFlash = discount > 0;

    // Stock
    final int stockVal = (json['countInStock'] as num?)?.toInt() ??
        (json['stock'] as num?)?.toInt() ??
        25;

    // Reviews parsing
    List<ProductReviewModel> parsedReviews = [];
    if (json['reviews'] is List && (json['reviews'] as List).isNotEmpty) {
      parsedReviews = (json['reviews'] as List).map((r) {
        if (r is Map<String, dynamic>) {
          final revDate = r['date']?.toString() ??
              r['createdAt']?.toString().split('T').first ??
              'Recently';
          return ProductReviewModel(
            userName: (r['userName'] ?? r['name'] ?? 'Verified Buyer').toString(),
            userAvatar: (r['userAvatar'] ?? r['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150').toString(),
            rating: (r['rating'] as num?)?.toDouble() ?? 5.0,
            comment: (r['comment'] ?? r['review'] ?? 'Great quality product!').toString(),
            date: revDate,
          );
        }
        return const ProductReviewModel(
          userName: 'Verified Buyer',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          rating: 5.0,
          comment: 'Great product!',
          date: 'Recently',
        );
      }).toList();
    } else {
      parsedReviews = defaultReviewModels;
    }

    return ProductModel(
      id: idVal,
      title: json['title'] as String? ?? '',
      titleKm: json['titleKm'] as String?,
      price: effectivePrice,
      originalPrice: origPrice,
      description: json['description'] as String? ?? '',
      descriptionKm: json['descriptionKm'] as String?,
      category: json['category'] as String? ?? 'General',
      image: mainImg,
      images: imgList,
      rating: ratingVal,
      ratingCount: ratingCountVal,
      availableColors: colorsList,
      availableSizes: sizesList,
      isFlashDeal: isFlash,
      discountPercentage: discount,
      stock: stockVal,
      reviews: parsedReviews,
      colorImages: parsedColorImages,
      productDetailImages: parsedDetailImageGroups,
      sizeStocks: parsedSizeStocks,
    );
  }

  factory ProductModel.fromEntity(ProductEntity entity) {
    return ProductModel(
      id: entity.id,
      title: entity.title,
      titleKm: entity.titleKm,
      price: entity.price,
      originalPrice: entity.originalPrice,
      description: entity.description,
      descriptionKm: entity.descriptionKm,
      category: entity.category,
      image: entity.image,
      images: entity.images,
      rating: entity.rating,
      ratingCount: entity.ratingCount,
      availableColors: entity.availableColors,
      availableSizes: entity.availableSizes,
      isFlashDeal: entity.isFlashDeal,
      discountPercentage: entity.discountPercentage,
      stock: entity.stock,
      reviews: entity.reviews.map((r) => r is ProductReviewModel
          ? r
          : ProductReviewModel(
              userName: r.userName,
              userAvatar: r.userAvatar,
              rating: r.rating,
              comment: r.comment,
              date: r.date,
            )).toList(),
      colorImages: entity.colorImages,
      productDetailImages: entity.productDetailImages,
      sizeStocks: entity.sizeStocks,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        '_id': id,
        'title': title,
        'titleKm': titleKm,
        'price': price,
        'originalPrice': originalPrice,
        'description': description,
        'descriptionKm': descriptionKm,
        'category': category,
        'image': image,
        'images': images,
        'rating': rating,
        'ratingCount': ratingCount,
        'colors': availableColors,
        'availableColors': availableColors,
        'sizes': availableSizes,
        'availableSizes': availableSizes,
        'isFlashDeal': isFlashDeal,
        'discountPercentage': discountPercentage,
        'stock': stock,
        'colorImages': colorImages.map((c) => c.toJson()).toList(),
        'productDetailImages': productDetailImages.map((d) => d.toJson()).toList(),
        'sizeStocks': sizeStocks.map((s) => s.toJson()).toList(),
        'reviews': reviews
            .map((e) => e is ProductReviewModel
                ? e.toJson()
                : {
                    'userName': e.userName,
                    'userAvatar': e.userAvatar,
                    'rating': e.rating,
                    'comment': e.comment,
                    'date': e.date,
                  })
            .toList(),
      };

  static const List<ProductReviewModel> defaultReviewModels = [
    ProductReviewModel(
      userName: 'Sophia Martinez',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      rating: 5.0,
      comment: 'Exceptional build quality! Surpassed my expectations in every way.',
      date: '2 days ago',
    ),
    ProductReviewModel(
      userName: 'Alexander Wright',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 4.5,
      comment: 'Super fast delivery and packaging was pristine. Highly recommended.',
      date: '1 week ago',
    ),
    ProductReviewModel(
      userName: 'Elena Rostova',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: 4.8,
      comment: 'Matches the description perfectly. Fits great and feels very premium.',
      date: '2 weeks ago',
    ),
  ];
}
