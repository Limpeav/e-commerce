export const normalizeSku = (value = "") =>
  String(value || "").trim().toUpperCase();

export const getGeneratedProductSku = (product = {}) => {
  const productId =
    typeof product === "string" ? product : product?._id || product?.id || "";

  return productId ? `PRD-${String(productId).slice(-8).toUpperCase()}` : "";
};

export const getProductSku = (product = {}) =>
  normalizeSku(product?.sku) || getGeneratedProductSku(product);

export const getPurchaseOrderItemSku = (item = {}) =>
  normalizeSku(item?.sku) || getGeneratedProductSku(item?.product);
