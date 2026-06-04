import { Sparkles } from "lucide-react";
import ProductSubsetPage from "./ProductSubsetPage";

const isNewArrivalProduct = (product) =>
  product.isNewArrival === true ||
  product.isNewArrival === "true" ||
  product.isNewArrival === 1 ||
  product.isNewArrival === "1";

const sortByNewest = (products) =>
  [...products].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

const NewArrivalProducts = () => (
  <ProductSubsetPage
    accent="purple"
    badge="New arrivals"
    countLabel="New arrivals"
    description="Products manually marked as new arrivals by admin."
    filterProduct={isNewArrivalProduct}
    icon={Sparkles}
    loadingMessage="Loading new arrival products..."
    searchPlaceholder="Search new arrival products..."
    sortProducts={sortByNewest}
    title="New Arrival Products"
  />
);

export default NewArrivalProducts;
