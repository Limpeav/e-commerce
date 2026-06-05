import { TrendingUp } from "lucide-react";
import {
  getBestSellerProductsByCategory,
  getProductSoldCount,
} from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const sortBySales = (products) =>
  [...products].sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));

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
