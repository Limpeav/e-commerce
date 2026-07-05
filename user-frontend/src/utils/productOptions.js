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

  const sizeStockSizes = Array.isArray(product.sizeStocks)
    ? [
        ...new Set(
          product.sizeStocks
            .map((entry) => String(entry.size || "").trim())
            .filter(Boolean)
        ),
      ]
    : [];

  if (sizeStockSizes.length > 0) return sizeStockSizes;

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  if (customSizes.length > 0) return customSizes;

  return isShoeProduct(product) ? BABY_SHOE_SIZES : BABY_CLOTHING_SIZES;
};

export const getAvailableStockForSize = (product = {}, size = "", color = "") => {
  const normalizedSize = String(size || "").trim().toUpperCase();
  const normalizedColor = String(color || "").trim().toLowerCase();
  const matchingSizeStocks = Array.isArray(product.sizeStocks)
    ? product.sizeStocks.filter(
        (entry) => String(entry.size || "").trim().toUpperCase() === normalizedSize
      )
    : [];

  if (normalizedColor) {
    const sizeStock = matchingSizeStocks.find(
      (entry) => String(entry.color || "").trim().toLowerCase() === normalizedColor
    );

    if (!sizeStock) return 0;

    return Math.max(
      0,
      Number(sizeStock.stock || 0) - Number(sizeStock.reservedStock || 0)
    );
  }

  if (matchingSizeStocks.length === 0) return Number(product.stock || 0);

  return matchingSizeStocks.reduce(
    (total, entry) =>
      total +
      Math.max(
        0,
        Number(entry.stock || 0) - Number(entry.reservedStock || 0)
      ),
    0
  );
};

export const getAvailableStock = (product = {}, size = "", color = "") => {
  if (size) return getAvailableStockForSize(product, size, color);

  const stock = Number(product.stock || 0);
  const reservedStock = Number(product.reservedStock || 0);
  const issueQuantity = product.hasProductIssue ? Number(product.issueQuantity || 0) : 0;

  return Math.max(0, stock - reservedStock - issueQuantity);
};

export const getProductColors = (product = {}) =>
  Array.isArray(product.colors)
    ? product.colors.map((color) => String(color || "").trim()).filter(Boolean)
    : [];

export const productHasColorOptions = (product = {}) =>
  getProductColors(product).length > 0;

export const getProductImageForColor = (product = {}, color = "") => {
  const selectedColor = String(color || "").trim().toLowerCase();
  if (!selectedColor) return product.image || product.images?.[0] || "";

  const colorImage = Array.isArray(product.colorImages)
    ? product.colorImages.find(
        (entry) => String(entry.color || "").trim().toLowerCase() === selectedColor
      )
    : null;

  return colorImage?.image || product.image || product.images?.[0] || "";
};

export const getCartItemKey = (item = {}) => {
  const productId = item.product?._id || item.productId || item._id || "";
  return `${productId}:${item.size || "standard"}:${item.color || "default"}`;
};
