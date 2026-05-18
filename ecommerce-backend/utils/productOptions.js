export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];

export const isClothingCategory = (category = "") => {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  return ["clothing", "cloth", "clothes"].includes(normalizedCategory);
};

export const getProductSizes = (product = {}) => {
  if (!isClothingCategory(product.category)) return [];

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  return customSizes.length > 0 ? customSizes : CLOTHING_SIZES;
};

export const normalizeSelectedSize = (size = "") => String(size || "").trim().toUpperCase();

export const validateProductSize = (product, size) => {
  if (!isClothingCategory(product?.category)) return "";

  const selectedSize = normalizeSelectedSize(size);
  if (!selectedSize) return "Please choose a size for clothing items.";

  const allowedSizes = getProductSizes(product).map(normalizeSelectedSize);
  if (!allowedSizes.includes(selectedSize)) {
    return `Invalid size. Choose one of: ${allowedSizes.join(", ")}.`;
  }

  return "";
};
