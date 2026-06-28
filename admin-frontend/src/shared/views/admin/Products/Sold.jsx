import { ShoppingBag } from "lucide-react";
import { getAvailableStock, getProductSoldCount } from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const hasSales = (product) => getProductSoldCount(product) > 0;

const sortBySales = (products) =>
  [...products].sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));

const sortOptions = [
  {
    value: "most-sold",
    label: "Most sold",
    sort: (a, b) => getProductSoldCount(b) - getProductSoldCount(a),
  },
  {
    value: "least-sold",
    label: "Least sold",
    sort: (a, b) => getProductSoldCount(a) - getProductSoldCount(b),
  },
  {
    value: "low-stock",
    label: "Lowest stock",
    sort: (a, b) => getAvailableStock(a) - getAvailableStock(b),
  },
  {
    value: "newest",
    label: "Newest",
    sort: (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
  },
  {
    value: "price-high",
    label: "Highest price",
    sort: (a, b) => Number(b?.price || 0) - Number(a?.price || 0),
  },
];

const SoldProducts = () => (
  <ProductSubsetPage
    accent="orange"
    badge="Sold products"
    countLabel="Products with sales"
    description="All products with recorded sales, sorted by units sold."
    filterProduct={hasSales}
    icon={ShoppingBag}
    layout="list"
    enableSalesDateFilter
    loadingMessage="Loading sold products..."
    searchPlaceholder="Search sold products..."
    sortProducts={sortBySales}
    sortOptions={sortOptions}
    title="Sold Products"
  />
);

export default SoldProducts;
