import { normalizeProductCategory } from "../constants/productCategories";

export const LOW_STOCK_THRESHOLD = 2;

export const getNumericDiscount = (product) => {
  const price = Number(product?.price);
  const discountPrice = Number(product?.discountPrice);

  if (!Number.isFinite(price) || !Number.isFinite(discountPrice)) {
    return null;
  }

  return discountPrice > 0 && discountPrice < price ? discountPrice : null;
};

export const getProductSoldCount = (product) =>
  Number(product?.sold || product?.totalSold || 0);

export const isLowStockProduct = (product) =>
  Number(product?.stock) <= LOW_STOCK_THRESHOLD;

export const getProductCategories = (products = []) => [
  "all",
  ...new Set(products.map((product) => normalizeProductCategory(product.category)).filter(Boolean)),
];

export const filterAdminProducts = (
  products = [],
  { searchTerm = "", categoryFilter = "all", showLowStockOnly = false } = {}
) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const category = normalizeProductCategory(product.category);
    const matchesSearch =
      !normalizedSearch ||
      product.title?.toLowerCase().includes(normalizedSearch) ||
      category.toLowerCase().includes(normalizedSearch);

    const matchesCategory =
      categoryFilter === "all" ||
      category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStock = !showLowStockOnly || isLowStockProduct(product);

    return matchesSearch && matchesCategory && matchesStock;
  });
};

export const getProductStats = (products = [], categories = []) => ({
  totalProducts: products.length,
  categoryCount: Math.max(categories.length - 1, 0),
  lowStockCount: products.filter(isLowStockProduct).length,
  newArrivalCount: products.filter((product) => product.isNewArrival).length,
  bestSellerCount: products.filter((product) => getProductSoldCount(product) > 0).length,
});
