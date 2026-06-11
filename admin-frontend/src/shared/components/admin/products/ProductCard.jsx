import { Pencil, Trash2, Calendar } from "lucide-react";
import { normalizeProductCategory } from "../../../constants/productCategories";
import {
  formatExpiryDate,
  productSupportsExpiry,
} from "../../../utils/productExpiry";
import {
  getAvailableStock,
  getNumericDiscount,
  getProductSoldCount,
  isBestSellerProduct,
  isLowStockProduct,
  isOutOfStockProduct,
  isProductIssue,
} from "../../../utils/adminProducts";

const ProductCard = ({ product, onEdit, onDelete }) => {
  const price = Number(product.price) || 0;
  const discountPrice = getNumericDiscount(product);
  const sold = getProductSoldCount(product);
  const availableStock = getAvailableStock(product);
  const isLowStock = isLowStockProduct(product);
  const isOutOfStock = isOutOfStockProduct(product);
  const hasProductIssue = isProductIssue(product);
  const isBestSeller = isBestSellerProduct(product);
  const normalizedCategory = normalizeProductCategory(product.category);
  const showExpiry = productSupportsExpiry(normalizedCategory) && product.expiryDate;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {(isOutOfStock || hasProductIssue) && (
          <span className="absolute right-3 top-3 rounded-full bg-[#FF3B30] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#FF3B30]/30">
            {isOutOfStock ? "Sold Out" : "Product Issue"}
          </span>
        )}
        {isBestSeller && (
          <span className="absolute left-3 top-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Best Seller
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5">
        <div className="mb-3">
          <span className="inline-block bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
            {normalizeProductCategory(product.category)}
          </span>
          {product.isNewArrival && (
            <span className="ml-2 inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              New Arrival
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description || "No description available"}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div>
            {discountPrice !== null ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">
                  ${discountPrice.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 line-through">${price.toFixed(2)}</p>
                <span className="bg-[#FF3B30] text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm shadow-[#FF3B30]/30">
                  {Math.round(((price - discountPrice) / price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</p>
            )}
            <p className="text-sm text-gray-600">
              Available:{" "}
              <span className={`font-semibold ${isLowStock ? "text-[#b45309]" : "text-green-600"}`}>
                {availableStock}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Sold:{" "}
              <span className={`font-semibold ${isBestSeller ? "text-emerald-600" : "text-gray-500"}`}>
                {sold}
              </span>
            </p>
            {hasProductIssue && (
              <p className="text-sm text-orange-700">
                Issue quantity:{" "}
                <span className="font-semibold">{product.issueQuantity || 0}</span>
              </p>
            )}
            {showExpiry && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Expires:{" "}
                <span className="font-semibold text-amber-600">
                  {formatExpiryDate(product.expiryDate)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product._id)}
            className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg font-medium group"
          >
            <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm">Edit</span>
          </button>
          <button
            onClick={() => onDelete(product._id)}
            className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-red-700 hover:shadow-lg font-medium group"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
