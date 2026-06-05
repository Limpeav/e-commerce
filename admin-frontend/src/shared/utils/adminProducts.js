import {
  isRemovedProductCategory,
  normalizeProductCategory,
} from "../constants/productCategories";

export const LOW_STOCK_THRESHOLD = 2;

export const getNumericDiscount = (product) => {
  const price = Number(product?.price);
  const discountPrice = Number(product?.discountPrice);

  if (!Number.isFinite(price) || !Number.isFinite(discountPrice)) {
    return null;
  }

  return discountPrice > 0 && discountPrice < price ? discountPrice : null;
};

export const isPromotionalProduct = (product) =>
  getNumericDiscount(product) !== null;

export const getProductSoldCount = (product) =>
  Number(product?.sold || product?.totalSold || 0);

export const isBestSellerProduct = (product) =>
  product?.isBestSeller === true;

const getBestSellerCategoryKey = (product) =>
  normalizeProductCategory(product?.category || "uncategorized").toLowerCase();

const compareBestSellerRank = (candidate, currentBest) => {
  const soldDelta = getProductSoldCount(candidate) - getProductSoldCount(currentBest);
  if (soldDelta !== 0) return soldDelta;

  const ratingDelta = Number(candidate?.rating || 0) - Number(currentBest?.rating || 0);
  if (ratingDelta !== 0) return ratingDelta;

  return new Date(candidate?.createdAt || 0) - new Date(currentBest?.createdAt || 0);
};

export const getBestSellerProductsByCategory = (products = []) => {
  const bestByCategory = new Map();

  products.forEach((product) => {
    if (getProductSoldCount(product) <= 0) return;

    const categoryKey = getBestSellerCategoryKey(product);
    const currentBest = bestByCategory.get(categoryKey);

    if (!currentBest || compareBestSellerRank(product, currentBest) > 0) {
      bestByCategory.set(categoryKey, product);
    }
  });

  return [...bestByCategory.values()].sort(
    (a, b) => getProductSoldCount(b) - getProductSoldCount(a)
  );
};

export const isLowStockProduct = (product) =>
  Number(product?.stock) <= LOW_STOCK_THRESHOLD;

export const getProductCategories = (products = []) => [
  "all",
  ...new Set(
    products
      .map((product) => normalizeProductCategory(product.category))
      .filter((category) => category && !isRemovedProductCategory(category))
  ),
];

export const filterAdminProducts = (
  products = [],
  {
    searchTerm = "",
    categoryFilter = "all",
    showLowStockOnly = false,
    showPromotionOnly = false,
  } = {}
) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const category = normalizeProductCategory(product.category);
    const matchesSearch =
      !normalizedSearch ||
      product.title?.toLowerCase().includes(normalizedSearch) ||
      product.titleKm?.toLowerCase().includes(normalizedSearch) ||
      product.descriptionKm?.toLowerCase().includes(normalizedSearch) ||
      category.toLowerCase().includes(normalizedSearch);

    const matchesCategory =
      categoryFilter === "all" ||
      category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStock = !showLowStockOnly || isLowStockProduct(product);
    const matchesPromotion = !showPromotionOnly || isPromotionalProduct(product);

    return matchesSearch && matchesCategory && matchesStock && matchesPromotion;
  });
};

export const getProductStats = (products = [], categories = []) => ({
  totalProducts: products.length,
  categoryCount: Math.max(categories.length - 1, 0),
  lowStockCount: products.filter(isLowStockProduct).length,
  promotionCount: products.filter(isPromotionalProduct).length,
  newArrivalCount: products.filter((product) => product.isNewArrival).length,
  bestSellerCount: getBestSellerProductsByCategory(products).length,
});
