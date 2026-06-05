const getSoldCount = (product) => Number(product?.sold || product?.totalSold || 0);

const getCategoryKey = (product) =>
  String(product?.category || "uncategorized").trim().toLowerCase();

const compareBestSellerRank = (candidate, currentBest) => {
  const soldDelta = getSoldCount(candidate) - getSoldCount(currentBest);
  if (soldDelta !== 0) return soldDelta;

  const ratingDelta = Number(candidate?.rating || 0) - Number(currentBest?.rating || 0);
  if (ratingDelta !== 0) return ratingDelta;

  return new Date(candidate?.createdAt || 0) - new Date(currentBest?.createdAt || 0);
};

export const getBestSellersByCategory = (products = []) => {
  const bestByCategory = new Map();

  products.forEach((product) => {
    if (getSoldCount(product) <= 0) return;

    const categoryKey = getCategoryKey(product);
    const currentBest = bestByCategory.get(categoryKey);

    if (!currentBest || compareBestSellerRank(product, currentBest) > 0) {
      bestByCategory.set(categoryKey, product);
    }
  });

  return [...bestByCategory.values()].sort((a, b) => {
    const soldDelta = getSoldCount(b) - getSoldCount(a);
    if (soldDelta !== 0) return soldDelta;

    return Number(b?.rating || 0) - Number(a?.rating || 0);
  });
};
