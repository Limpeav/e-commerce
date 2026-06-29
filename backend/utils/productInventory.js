import {
  normalizeSelectedColor,
  normalizeSelectedSize,
} from "./productOptions.js";

export const normalizeSizeStocks = (sizeStocks = []) => {
  const byVariant = new Map();

  if (!Array.isArray(sizeStocks)) return [];

  sizeStocks.forEach((entry) => {
    const size = normalizeSelectedSize(entry?.size);
    const color = normalizeSelectedColor(entry?.color);
    if (!size) return;

    byVariant.set(`${size}::${color.toLowerCase()}`, {
      size,
      color,
      stock: Math.max(0, Number.parseInt(entry?.stock, 10) || 0),
      reservedStock: Math.max(0, Number.parseInt(entry?.reservedStock, 10) || 0),
    });
  });

  return [...byVariant.values()];
};

export const parseSizeStocksPayload = (value) => {
  if (Array.isArray(value)) return normalizeSizeStocks(value);

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    return normalizeSizeStocks(JSON.parse(value));
  } catch {
    return [];
  }
};

export const hasSizeStock = (product = {}) =>
  Array.isArray(product?.sizeStocks) && product.sizeStocks.length > 0;

const findSizeStock = (product, size, color = "") => {
  const normalizedSize = normalizeSelectedSize(size);
  const normalizedColor = normalizeSelectedColor(color).toLowerCase();
  if (!normalizedSize || !hasSizeStock(product)) return null;

  const exactMatch = product.sizeStocks.find(
    (entry) =>
      normalizeSelectedSize(entry?.size) === normalizedSize &&
      normalizeSelectedColor(entry?.color).toLowerCase() === normalizedColor
  );

  if (exactMatch) return exactMatch;

  if (normalizedColor) return null;

  return (
    product.sizeStocks.find(
      (entry) =>
        normalizeSelectedSize(entry?.size) === normalizedSize &&
        !normalizeSelectedColor(entry?.color)
    ) || null
  );
};

export const getTotalSizeStock = (product = {}) =>
  hasSizeStock(product)
    ? product.sizeStocks.reduce((sum, entry) => sum + Number(entry?.stock || 0), 0)
    : Number(product?.stock || 0);

export const getTotalReservedSizeStock = (product = {}) =>
  hasSizeStock(product)
    ? product.sizeStocks.reduce(
        (sum, entry) => sum + Number(entry?.reservedStock || 0),
        0
      )
    : Number(product?.reservedStock || 0);

export const syncTotalStockFromSizes = (product) => {
  if (!hasSizeStock(product)) return product;

  product.stock = getTotalSizeStock(product);
  product.reservedStock = getTotalReservedSizeStock(product);
  return product;
};

export const getAvailableStock = (product, size = "", color = "") => {
  const sizeStock = findSizeStock(product, size, color);

  if (sizeStock) {
    return Math.max(
      0,
      Number(sizeStock.stock || 0) - Number(sizeStock.reservedStock || 0)
    );
  }

  const totalStock = hasSizeStock(product)
    ? getTotalSizeStock(product)
    : Number(product?.stock || 0);
  const reservedStock = hasSizeStock(product)
    ? getTotalReservedSizeStock(product)
    : Number(product?.reservedStock || 0);

  return Math.max(
    0,
    totalStock -
      reservedStock -
      (product?.hasProductIssue ? Number(product?.issueQuantity || 0) : 0)
  );
};

export const adjustProductInventory = (product, { size = "", color = "", quantity = 0, action }) => {
  const amount = Math.max(0, Number(quantity || 0));
  const sizeStock = findSizeStock(product, size, color);

  if (sizeStock) {
    if (action === "reduce") {
      sizeStock.stock = Math.max(0, Number(sizeStock.stock || 0) - amount);
    } else if (action === "restore") {
      sizeStock.stock = Number(sizeStock.stock || 0) + amount;
    } else if (action === "reserve") {
      sizeStock.reservedStock = Number(sizeStock.reservedStock || 0) + amount;
    } else if (action === "release") {
      sizeStock.reservedStock = Math.max(
        0,
        Number(sizeStock.reservedStock || 0) - amount
      );
    }
    syncTotalStockFromSizes(product);
    return product;
  }

  if (action === "reduce") {
    product.stock = Math.max(0, Number(product.stock || 0) - amount);
  } else if (action === "restore") {
    product.stock = Number(product.stock || 0) + amount;
  } else if (action === "reserve") {
    product.reservedStock = Number(product.reservedStock || 0) + amount;
  } else if (action === "release") {
    product.reservedStock = Math.max(
      0,
      Number(product.reservedStock || 0) - amount
    );
  }

  return product;
};
