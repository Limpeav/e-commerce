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

export const BABY_DIAPERING_CARE_SIZES = [
  "NB",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export const COLOR_ONLY_STOCK_SIZE = "ONE SIZE";

export const isSizedProduct = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  return category === "Clothing" || category === "Shoes";
};

export const productSupportsOptionalSizeOptions = (product = {}) =>
  normalizeProductCategory(product.category) === "Diapering & Care";

export const productSupportsColorOptions = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  return isSizedProduct(product) || category === "Furniture" || category === "Travel & Gear";
};

export const getDefaultSizesForCategory = (category = "") => {
  const normalizedCategory = normalizeProductCategory(category);
  if (normalizedCategory === "Shoes") return BABY_SHOE_SIZES;
  if (normalizedCategory === "Clothing") return BABY_CLOTHING_SIZES;
  if (normalizedCategory === "Diapering & Care") return BABY_DIAPERING_CARE_SIZES;
  return [];
};

const normalizeColor = (color = "") => String(color || "").trim();
const normalizeSize = (size = "") => String(size || "").trim().toUpperCase();

const getSizeStockKey = (size = "", color = "") =>
  `${normalizeSize(size)}::${normalizeColor(color).toLowerCase()}`;

export const buildDefaultSizeStocks = (category = "", currentSizeStocks = [], colors = []) => {
  const currentBySize = new Map(
    currentSizeStocks.map((entry) => [
      getSizeStockKey(entry.size, entry.color),
      entry,
    ])
  );
  const selectedColors = colors.map(normalizeColor).filter(Boolean);
  const normalizedCategory = normalizeProductCategory(category);

  if (
    selectedColors.length > 0 &&
    (normalizedCategory === "Furniture" || normalizedCategory === "Travel & Gear")
  ) {
    return selectedColors.map((color) => {
      const existing = currentBySize.get(getSizeStockKey(COLOR_ONLY_STOCK_SIZE, color));
      return {
        size: COLOR_ONLY_STOCK_SIZE,
        color,
        stock: existing?.stock ?? "",
        reservedStock: existing?.reservedStock ?? 0,
      };
    });
  }

  return getDefaultSizesForCategory(category).flatMap((size) => {
    const variantColors = selectedColors.length > 0 ? selectedColors : [""];

    return variantColors.map((color) => {
      const existing = currentBySize.get(getSizeStockKey(size, color));
      return {
        size,
        color,
        stock: existing?.stock ?? "",
        reservedStock: existing?.reservedStock ?? 0,
      };
    });
  });
};

export const normalizeSizeStocksForForm = (sizeStocks = [], category = "", colors = []) => {
  if (Array.isArray(sizeStocks) && sizeStocks.length > 0) {
    return sizeStocks.map((entry) => ({
      size: String(entry.size || "").trim().toUpperCase(),
      color: normalizeColor(entry.color),
      stock: entry.stock ?? "",
      reservedStock: Number(entry.reservedStock || 0),
    }));
  }

  if (productSupportsOptionalSizeOptions({ category })) {
    return [];
  }

  return buildDefaultSizeStocks(category, [], colors);
};

export const getSizeStocksTotal = (sizeStocks = []) =>
  sizeStocks.reduce((sum, entry) => sum + (Number.parseInt(entry.stock, 10) || 0), 0);
