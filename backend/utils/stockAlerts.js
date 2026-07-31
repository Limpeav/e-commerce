import {
  COLOR_ONLY_STOCK_SIZE,
  findSizeStock,
  getAvailableStock,
  hasSizeStock,
} from "./productInventory.js";

const parseThreshold = (value, fallback) => {
  const parsedThreshold = Number.parseInt(value, 10);
  return Number.isInteger(parsedThreshold) && parsedThreshold >= 0
    ? parsedThreshold
    : fallback;
};

export const getProductLowStockThreshold = () =>
  parseThreshold(process.env.PRODUCT_LOW_STOCK_THRESHOLD, 5);

export const getVariantLowStockThreshold = () =>
  parseThreshold(process.env.VARIANT_LOW_STOCK_THRESHOLD, 2);

const getLowStockThreshold = getProductLowStockThreshold;

export const isLowStock = (stock, threshold = getLowStockThreshold()) =>
  Number(stock) <= threshold;

export const isOutOfStock = (stock) => Number(stock) <= 0;

export const shouldSendOutOfStockAlert = ({
  previousStock,
  currentStock,
  outOfStockAlertSent,
}) => {
  return (
    Number(previousStock) > 0 &&
    isOutOfStock(currentStock) &&
    !outOfStockAlertSent
  );
};

export const shouldSendLowStockAlert = ({
  previousStock,
  currentStock,
  lowStockAlertSent,
  threshold = getLowStockThreshold(),
  requireThresholdCross = true,
}) => {
  return (
    (!requireThresholdCross || Number(previousStock) > threshold) &&
    isLowStock(currentStock, threshold) &&
    !isOutOfStock(currentStock) &&
    !lowStockAlertSent
  );
};

export const getStockAlert = ({
  previousStock,
  currentStock,
  lowStockAlertSent,
  outOfStockAlertSent,
  threshold = getLowStockThreshold(),
  requireThresholdCross = true,
}) => {
  if (
    shouldSendOutOfStockAlert({
      previousStock,
      currentStock,
      outOfStockAlertSent,
    })
  ) {
    return {
      kind: "out-of-stock",
      lowStockAlertSent: true,
      outOfStockAlertSent: true,
    };
  }

  if (
    shouldSendLowStockAlert({
      previousStock,
      currentStock,
      lowStockAlertSent,
      threshold,
      requireThresholdCross,
    })
  ) {
    return {
      kind: "low-stock",
      lowStockAlertSent: true,
      outOfStockAlertSent: false,
    };
  }

  return null;
};

const getVariantAvailableStock = (entry = {}) =>
  Math.max(0, Number(entry.stock || 0) - Number(entry.reservedStock || 0));

const getVariantLabel = (entry = {}) => {
  const size = String(entry.size || "").trim();
  const color = String(entry.color || "").trim();
  const normalizedSize = size.toUpperCase();

  if (normalizedSize === COLOR_ONLY_STOCK_SIZE && color) return color;
  if (size && color) return `${size} / ${color}`;
  if (size) return size;
  if (color) return color;
  return "Variant";
};

export const getStockAlertTarget = (product, { size = "", color = "" } = {}) => {
  const variant = findSizeStock(product, size, color);

  if (variant) {
    return {
      scope: "variant",
      stock: getVariantAvailableStock(variant),
      threshold: getVariantLowStockThreshold(),
      lowStockAlertSent: Boolean(variant.lowStockAlertSent),
      outOfStockAlertSent: Boolean(variant.outOfStockAlertSent),
      variant: {
        size: variant.size || "",
        color: variant.color || "",
        label: getVariantLabel(variant),
      },
      applyFlags(stockAlert) {
        variant.lowStockAlertSent = stockAlert.lowStockAlertSent;
        variant.outOfStockAlertSent = stockAlert.outOfStockAlertSent;
      },
    };
  }

  return {
    scope: "product",
    stock: getAvailableStock(product),
    threshold: getProductLowStockThreshold(),
    lowStockAlertSent: Boolean(product?.lowStockAlertSent),
    outOfStockAlertSent: Boolean(product?.outOfStockAlertSent),
    variant: null,
    applyFlags(stockAlert) {
      product.lowStockAlertSent = stockAlert.lowStockAlertSent;
      product.outOfStockAlertSent = stockAlert.outOfStockAlertSent;
    },
  };
};

export const getStockAlertTargetStock = (product, options = {}) =>
  getStockAlertTarget(product, options).stock;

export const getInventoryStockAlert = ({
  product,
  previousStock,
  size = "",
  color = "",
  requireThresholdCross = true,
}) => {
  const target = getStockAlertTarget(product, { size, color });
  const stockAlert = getStockAlert({
    previousStock,
    currentStock: target.stock,
    lowStockAlertSent: target.lowStockAlertSent,
    outOfStockAlertSent: target.outOfStockAlertSent,
    threshold: target.threshold,
    requireThresholdCross,
  });

  if (!stockAlert) return null;

  target.applyFlags(stockAlert);

  return {
    stockAlert,
    stock: target.stock,
    threshold: target.threshold,
    variant: target.variant,
  };
};

export const syncLowStockAlertFlag = (product) => {
  if (!product) {
    return product;
  }

  if (!isLowStock(getAvailableStock(product), getProductLowStockThreshold())) {
    product.lowStockAlertSent = false;
  }

  if (!isOutOfStock(getAvailableStock(product))) {
    product.outOfStockAlertSent = false;
  }

  if (hasSizeStock(product)) {
    product.sizeStocks.forEach((entry) => {
      const currentStock = getVariantAvailableStock(entry);

      if (!isLowStock(currentStock, getVariantLowStockThreshold())) {
        entry.lowStockAlertSent = false;
      }

      if (!isOutOfStock(currentStock)) {
        entry.outOfStockAlertSent = false;
      }
    });
  }

  return product;
};

export { getLowStockThreshold };
