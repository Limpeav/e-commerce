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

export const isSizedProduct = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  return category === "Clothing" || category === "Shoes";
};

export const getDefaultSizesForCategory = (category = "") => {
  const normalizedCategory = normalizeProductCategory(category);
  if (normalizedCategory === "Shoes") return BABY_SHOE_SIZES;
  if (normalizedCategory === "Clothing") return BABY_CLOTHING_SIZES;
  return [];
};

export const buildDefaultSizeStocks = (category = "", currentSizeStocks = []) => {
  const currentBySize = new Map(
    currentSizeStocks.map((entry) => [String(entry.size || "").toUpperCase(), entry])
  );

  return getDefaultSizesForCategory(category).map((size) => {
    const existing = currentBySize.get(size.toUpperCase());
    return {
      size,
      stock: existing?.stock ?? "",
      reservedStock: existing?.reservedStock ?? 0,
    };
  });
};

export const normalizeSizeStocksForForm = (sizeStocks = [], category = "") => {
  if (Array.isArray(sizeStocks) && sizeStocks.length > 0) {
    return sizeStocks.map((entry) => ({
      size: String(entry.size || "").trim().toUpperCase(),
      stock: entry.stock ?? "",
      reservedStock: Number(entry.reservedStock || 0),
    }));
  }

  return buildDefaultSizeStocks(category);
};

export const getSizeStocksTotal = (sizeStocks = []) =>
  sizeStocks.reduce((sum, entry) => sum + (Number.parseInt(entry.stock, 10) || 0), 0);
