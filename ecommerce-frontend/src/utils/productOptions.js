import { normalizeProductCategory } from "../constants/productCategories";

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];

export const isClothingProduct = (product = {}) =>
  normalizeProductCategory(product.category) === "Clothing";

export const getProductSizes = (product = {}) => {
  if (!isClothingProduct(product)) return [];

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  return customSizes.length > 0 ? customSizes : CLOTHING_SIZES;
};

export const getCartItemKey = (item = {}) => {
  const productId = item.product?._id || item.productId || item._id || "";
  return `${productId}:${item.size || "standard"}`;
};
