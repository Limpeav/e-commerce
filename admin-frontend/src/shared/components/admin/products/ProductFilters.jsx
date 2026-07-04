import { AlertTriangle, Filter, Search } from "lucide-react";
import { INVENTORY_STATE_OPTIONS } from "../../../utils/adminProducts";

const ProductFilters = ({
  categories,
  searchTerm,
  categoryFilter,
  inventoryState,
  onSearchChange,
  onCategoryChange,
  onInventoryStateChange,
}) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

      <div className="relative">
        <AlertTriangle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <select
          value={inventoryState}
          onChange={(event) => onInventoryStateChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500"
        >
          {INVENTORY_STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    {inventoryState === "sold-out" && (
      <p className="mt-4 text-sm font-medium text-red-700">
        Showing products with no stock remaining.
      </p>
    )}
  </div>
);

export default ProductFilters;
