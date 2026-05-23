import { Filter, Search } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "../../../utils/adminProducts";

const ProductFilters = ({
  categories,
  searchTerm,
  categoryFilter,
  showLowStockOnly,
  onSearchChange,
  onCategoryChange,
  onClearLowStock,
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name or category..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
        />
      </div>

      <div className="relative">
        <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-gray-50 focus:bg-white transition-all duration-200 cursor-pointer"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "All Categories" : category}
            </option>
          ))}
        </select>
      </div>
    </div>
    {showLowStockOnly && (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
        <p className="text-sm font-medium text-orange-700">
          Filtering low stock products with stock at or below {LOW_STOCK_THRESHOLD}.
        </p>
        <button
          type="button"
          onClick={onClearLowStock}
          className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-100"
        >
          Clear Filter
        </button>
      </div>
    )}
  </div>
);

export default ProductFilters;
