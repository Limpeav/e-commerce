import { normalizeProductCategory } from "../constants/productCategories";

export const BABY_CLOTHING_SIZES = [
  "NB",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2T",
  "3T",
  "4T",
];

export const BABY_SHOE_SIZES = [
  "EU 16",
  "EU 17",
  "EU 18",
  "EU 19",
  "EU 20",
  "EU 21",
  "EU 22",
  "EU 23",
  "EU 24",
  "EU 25",
  "EU 26",
];

export const CLOTHING_SIZES = BABY_CLOTHING_SIZES;

const SHOE_KEYWORDS = ["shoe", "shoes", "sneaker", "sneakers", "sandal", "sandals", "boot", "boots", "footwear"];

export const isShoeProduct = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  const searchableText = `${product.category || ""} ${product.title || ""} ${product.name || ""}`.toLowerCase();

  return category === "Shoes" || SHOE_KEYWORDS.some((keyword) => searchableText.includes(keyword));
};

export const isClothingProduct = (product = {}) =>
  normalizeProductCategory(product.category) === "Clothing" || isShoeProduct(product);

export const getProductSizes = (product = {}) => {
  if (!isClothingProduct(product)) return [];

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  if (customSizes.length > 0) return customSizes;

  return isShoeProduct(product) ? BABY_SHOE_SIZES : BABY_CLOTHING_SIZES;
};

export const getCartItemKey = (item = {}) => {
  const productId = item.product?._id || item.productId || item._id || "";
  return `${productId}:${item.size || "standard"}`;
};
