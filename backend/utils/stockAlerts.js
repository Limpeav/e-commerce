const getLowStockThreshold = () => {
  const parsedThreshold = Number.parseInt(process.env.LOW_STOCK_THRESHOLD, 10);
  return Number.isInteger(parsedThreshold) && parsedThreshold >= 0
    ? parsedThreshold
    : 2;
};

export const isLowStock = (stock) => Number(stock) <= getLowStockThreshold();

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
}) => {
  return (
    Number(previousStock) > getLowStockThreshold() &&
    isLowStock(currentStock) &&
    !isOutOfStock(currentStock) &&
    !lowStockAlertSent
  );
};

export const getStockAlert = ({
  previousStock,
  currentStock,
  lowStockAlertSent,
  outOfStockAlertSent,
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

export const syncLowStockAlertFlag = (product) => {
  if (!product) {
    return product;
  }

  if (!isLowStock(product.stock)) {
    product.lowStockAlertSent = false;
  }

  if (!isOutOfStock(product.stock)) {
    product.outOfStockAlertSent = false;
  }

  return product;
};

export { getLowStockThreshold };
