import { Percent } from "lucide-react";
import { isPromotionalProduct } from "../../../utils/adminProducts";
import ProductSubsetPage from "./ProductSubsetPage";

const PromotionProducts = () => (
  <ProductSubsetPage
    accent="red"
    badge="Discount products"
    countLabel="Active promotions"
    description="Products with a discount price lower than the original price."
    filterProduct={isPromotionalProduct}
    icon={Percent}
    loadingMessage="Loading promotion products..."
    searchPlaceholder="Search promotion products..."
    title="Promotion Products"
  />
);

export default PromotionProducts;
