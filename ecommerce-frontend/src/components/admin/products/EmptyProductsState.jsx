import { Package, Plus } from "lucide-react";

const EmptyProductsState = ({ hasActiveFilters, onAddProduct }) => (
  <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Package className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">No products found</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      {hasActiveFilters
        ? "Try adjusting your search or filters to find what you're looking for"
        : "Start building your inventory by adding your first product"}
    </p>
    <button
      onClick={onAddProduct}
      className="inline-flex items-center space-x-2 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-white transition-all duration-200 shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
    >
      <Plus className="w-5 h-5" />
      <span>Add Your First Product</span>
    </button>
  </div>
);

export default EmptyProductsState;
