const getLowStockThreshold = () => {
  const parsedThreshold = Number.parseInt(process.env.LOW_STOCK_THRESHOLD, 10);
  return Number.isInteger(parsedThreshold) && parsedThreshold >= 0
    ? parsedThreshold
    : 2;
};

export const isLowStock = (stock) => Number(stock) <= getLowStockThreshold();

export const shouldSendLowStockAlert = ({
  previousStock,
  currentStock,
  lowStockAlertSent,
}) => {
  return (
    Number(previousStock) > getLowStockThreshold() &&
    isLowStock(currentStock) &&
    !lowStockAlertSent
  );
};

export const syncLowStockAlertFlag = (product) => {
  if (!product) {
    return product;
  }

  if (!isLowStock(product.stock)) {
    product.lowStockAlertSent = false;
  }

  return product;
};

export { getLowStockThreshold };
