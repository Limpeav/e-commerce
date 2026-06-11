import { ShoppingBag } from "lucide-react";
import { getProductSoldCount } from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const hasSales = (product) => getProductSoldCount(product) > 0;

const sortBySales = (products) =>
  [...products].sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));

const SoldProducts = () => (
  <ProductSubsetPage
    accent="orange"
    badge="Sold products"
    countLabel="Products with sales"
    description="All products with recorded sales, sorted by units sold."
    filterProduct={hasSales}
    icon={ShoppingBag}
    layout="list"
    loadingMessage="Loading sold products..."
    searchPlaceholder="Search sold products..."
    sortProducts={sortBySales}
    title="Sold Products"
  />
);

export default SoldProducts;
