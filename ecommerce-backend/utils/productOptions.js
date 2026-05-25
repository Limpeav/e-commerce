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

const SHOE_CATEGORY_NAMES = ["shoe", "shoes", "sneaker", "sneakers", "sandal", "sandals", "boot", "boots", "footwear"];

export const isClothingCategory = (category = "") => {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  return ["clothing", "cloth", "clothes"].includes(normalizedCategory);
};

export const isShoeProduct = (product = {}) => {
  const searchableText = `${product.category || ""} ${product.title || ""}`.toLowerCase();
  return SHOE_CATEGORY_NAMES.some((name) => searchableText.includes(name));
};

export const getProductSizes = (product = {}) => {
  const needsSize = isClothingCategory(product.category) || isShoeProduct(product);
  if (!needsSize) return [];

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  if (customSizes.length > 0) return customSizes;

  return isShoeProduct(product) ? BABY_SHOE_SIZES : BABY_CLOTHING_SIZES;
};

export const normalizeSelectedSize = (size = "") => String(size || "").trim().toUpperCase();

export const validateProductSize = (product, size) => {
  if (!isClothingCategory(product?.category) && !isShoeProduct(product)) return "";

  const selectedSize = normalizeSelectedSize(size);
  if (!selectedSize) return "Please choose a size for this item.";

  const allowedSizes = getProductSizes(product).map(normalizeSelectedSize);
  if (!allowedSizes.includes(selectedSize)) {
    return `Invalid size. Choose one of: ${allowedSizes.join(", ")}.`;
  }

  return "";
};
