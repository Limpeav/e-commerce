import { TrendingUp } from "lucide-react";
import {
  getProductSoldCount,
  isBestSellerProduct,
} from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const sortBySales = (products) =>
  [...products].sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));

const BestSellerProducts = () => (
  <ProductSubsetPage
    accent="emerald"
    badge="Sold products"
    countLabel="Best sellers"
    description="Products sorted by sold quantity so admins can see what customers buy most."
    filterProduct={isBestSellerProduct}
    icon={TrendingUp}
    loadingMessage="Loading best seller products..."
    searchPlaceholder="Search best seller products..."
    sortProducts={sortBySales}
    title="Best Seller Products"
  />
);

export default BestSellerProducts;
