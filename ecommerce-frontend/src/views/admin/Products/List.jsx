import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyProductsState from "../../../components/admin/products/EmptyProductsState";
import ProductCard from "../../../components/admin/products/ProductCard";
import ProductFilters from "../../../components/admin/products/ProductFilters";
import ProductListHeader from "../../../components/admin/products/ProductListHeader";
import ProductStatsGrid from "../../../components/admin/products/ProductStatsGrid";
import Loading from "../../../components/common/Loading";
import { AdminProductController } from "../../../controllers/adminProductController";
import {
  filterAdminProducts,
  getProductCategories,
  getProductStats,
} from "../../../utils/adminProducts";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await AdminProductController.getProducts();

      if (result.success) {
        setProducts(result.data);
        setError("");
      } else {
        setError(result.error);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => getProductCategories(products), [products]);
  const stats = useMemo(() => getProductStats(products, categories), [products, categories]);
  const filteredProducts = useMemo(
    () =>
      filterAdminProducts(products, {
        searchTerm,
        categoryFilter,
        showLowStockOnly,
      }),
    [products, searchTerm, categoryFilter, showLowStockOnly]
  );

  const goToAddProduct = () => navigate("/admin/products/add");

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await AdminProductController.deleteProduct(id);
    if (result.success) {
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product._id !== id)
      );
      return;
    }

    alert(result.error);
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ProductListHeader
        onAddBanner={() => navigate("/admin/banners")}
        onAddProduct={goToAddProduct}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductStatsGrid
          stats={stats}
          showLowStockOnly={showLowStockOnly}
          onToggleLowStock={() => setShowLowStockOnly((current) => !current)}
        />

        <ProductFilters
          categories={categories}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          showLowStockOnly={showLowStockOnly}
          onSearchChange={setSearchTerm}
          onCategoryChange={setCategoryFilter}
          onClearLowStock={() => setShowLowStockOnly(false)}
        />

        {filteredProducts.length === 0 ? (
          <EmptyProductsState
            hasActiveFilters={
              Boolean(searchTerm) || categoryFilter !== "all" || showLowStockOnly
            }
            onAddProduct={goToAddProduct}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
