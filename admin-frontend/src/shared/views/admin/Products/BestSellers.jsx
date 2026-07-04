import { TrendingUp } from "lucide-react";
import {
  getBestSellerProductsByCategory,
  getProductPaidRevenue,
  getProductSoldCount,
} from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const sortBySales = (products) =>
  [...products].sort((a, b) => {
    const soldDelta = getProductSoldCount(b) - getProductSoldCount(a);
    if (soldDelta !== 0) return soldDelta;

    const revenueDelta = getProductPaidRevenue(b) - getProductPaidRevenue(a);
    if (revenueDelta !== 0) return revenueDelta;

    const ratingDelta = Number(b?.rating || 0) - Number(a?.rating || 0);
    if (ratingDelta !== 0) return ratingDelta;

    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
  });

const BestSellerProducts = () => (
  <ProductSubsetPage
    accent="emerald"
    badge="Sold products"
    countLabel="Best sellers"
    description="Top sold product from each category, sorted by sold quantity."
    getSubsetProducts={getBestSellerProductsByCategory}
    icon={TrendingUp}
    loadingMessage="Loading best seller products..."
    searchPlaceholder="Search best seller products..."
    sortProducts={sortBySales}
    title="Best Seller Products"
  />
);

export default BestSellerProducts;
