export const getAvailableStock = (product) =>
  Math.max(
    0,
    Number(product?.stock || 0) -
      Number(product?.reservedStock || 0) -
      (product?.hasProductIssue ? Number(product?.issueQuantity || 0) : 0)
  );
