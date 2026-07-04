import {
  isRemovedProductCategory,
  normalizeProductCategory,
} from "../constants/productCategories.js";

export const LOW_STOCK_THRESHOLD = 2;
export const INVENTORY_STATE_OPTIONS = [
  { value: "all", label: "All Inventory" },
  { value: "issues", label: "Product Issues" },
  { value: "sold-out", label: "Sold Out" },
];

const toProductArray = (products) => (Array.isArray(products) ? products : []);

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

export const getProductPaidRevenue = (product) => {
  const explicitRevenue = Number(product?.paidRevenue ?? product?.revenue);
  if (Number.isFinite(explicitRevenue) && explicitRevenue > 0) {
    return explicitRevenue;
  }

  return getProductSoldCount(product) * Number(product?.discountPrice || product?.price || 0);
};

export const getAvailableStock = (product) => {
  const providedAvailableStock = Number(product?.availableStock);
  if (Number.isFinite(providedAvailableStock)) {
    return Math.max(0, providedAvailableStock);
  }

  const issueQuantity = isProductIssue(product)
    ? Number(product?.issueQuantity || 0)
    : 0;
  return Math.max(0, Number(product?.stock || 0) - issueQuantity);
};

export const isBestSellerProduct = (product) =>
  product?.isBestSeller === true;

const getBestSellerCategoryKey = (product) =>
  normalizeProductCategory(product?.category || "uncategorized").toLowerCase();

const compareBestSellerRank = (candidate, currentBest) => {
  const soldDelta = getProductSoldCount(candidate) - getProductSoldCount(currentBest);
  if (soldDelta !== 0) return soldDelta;

  const revenueDelta = getProductPaidRevenue(candidate) - getProductPaidRevenue(currentBest);
  if (revenueDelta !== 0) return revenueDelta;

  const ratingDelta = Number(candidate?.rating || 0) - Number(currentBest?.rating || 0);
  if (ratingDelta !== 0) return ratingDelta;

  return new Date(candidate?.createdAt || 0) - new Date(currentBest?.createdAt || 0);
};

export const getBestSellerProductsByCategory = (products = []) => {
  const productList = toProductArray(products);
  const bestByCategory = new Map();

  productList.forEach((product) => {
    if (getProductSoldCount(product) <= 0) return;

    const categoryKey = getBestSellerCategoryKey(product);
    const currentBest = bestByCategory.get(categoryKey);

    if (!currentBest || compareBestSellerRank(product, currentBest) > 0) {
      bestByCategory.set(categoryKey, product);
    }
  });

  return [...bestByCategory.values()].sort((a, b) => compareBestSellerRank(b, a));
};

export const isLowStockProduct = (product) =>
  getAvailableStock(product) <= LOW_STOCK_THRESHOLD;

export const isOutOfStockProduct = (product) =>
  getAvailableStock(product) <= 0;

export const isProductIssue = (product) =>
  product?.hasProductIssue === true ||
  product?.hasProductIssue === "true" ||
  product?.hasProductIssue === 1 ||
  product?.hasProductIssue === "1";

export const getProductCategories = (products = []) => [
  "all",
  ...new Set(
    toProductArray(products)
      .map((product) => normalizeProductCategory(product.category))
      .filter((category) => category && !isRemovedProductCategory(category))
  ),
];

export const filterAdminProducts = (
  products = [],
  {
    searchTerm = "",
    categoryFilter = "all",
    inventoryState = "all",
    showPromotionOnly = false,
  } = {}
) => {
  const productList = toProductArray(products);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return productList.filter((product) => {
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

    const matchesInventoryState =
      inventoryState === "all" ||
      (inventoryState === "issues" && isProductIssue(product)) ||
      (inventoryState === "sold-out" && isOutOfStockProduct(product));
    const matchesPromotion = !showPromotionOnly || isPromotionalProduct(product);

    return matchesSearch && matchesCategory && matchesInventoryState && matchesPromotion;
  });
};

export const getProductStats = (products = [], categories = []) => {
  const productList = toProductArray(products);

  return {
  totalProducts: productList.length,
  categoryCount: Math.max(categories.length - 1, 0),
  productIssueCount: productList.filter(isProductIssue).length,
  soldOutCount: productList.filter(isOutOfStockProduct).length,
  totalSoldCount: productList.reduce(
    (total, product) => total + getProductSoldCount(product),
    0
  ),
  promotionCount: productList.filter(isPromotionalProduct).length,
  newArrivalCount: productList.filter((product) => product.isNewArrival).length,
  bestSellerCount: getBestSellerProductsByCategory(productList).length,
  };
};
