import { useCallback, useEffect, useMemo, useState } from "react";
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
import { subscribeRealtimeDomains } from "../../../services/realtime";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [sendingPromotionEmails, setSendingPromotionEmails] = useState(false);
  const [promotionEmailStatus, setPromotionEmailStatus] = useState("");
  const [promotionEmailStatusType, setPromotionEmailStatusType] = useState("success");
  const [promotionEmailFailures, setPromotionEmailFailures] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      const result = await AdminProductController.getProducts();

      if (result.success) {
        setProducts(result.data);
        setError("");
      } else {
        setError(result.error);
      }

      if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    return subscribeRealtimeDomains(
      ["products", "reviews"],
      () => fetchProducts({ silent: true })
    );
  }, [fetchProducts]);

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

  const handleSendPromotionEmails = async () => {
    if (stats.promotionCount === 0) {
      setPromotionEmailStatusType("error");
      setPromotionEmailStatus("Add discount prices before sending promotion emails.");
      return;
    }

    if (
      !confirm(
        `Send one store promotion email to customers for ${stats.promotionCount} promoted product${stats.promotionCount === 1 ? "" : "s"}?`
      )
    ) {
      return;
    }

    setSendingPromotionEmails(true);
    setPromotionEmailStatus("");
    setPromotionEmailStatusType("success");
    setPromotionEmailFailures([]);

    const result = await AdminProductController.sendStorePromotionEmails();
    if (result.success) {
      const sentCount = result.data?.sentCount ?? 0;
      const failedCount = result.data?.failedCount ?? 0;
      const recipientCount = result.data?.recipientCount ?? 0;
      setPromotionEmailFailures(result.data?.failedRecipients || []);
      setPromotionEmailStatus(
        recipientCount === 0
          ? "No customers have promotional emails enabled."
          : `Promotion email sent to ${sentCount} customer${sentCount === 1 ? "" : "s"}${failedCount ? `; ${failedCount} failed` : ""}.`
      );
    } else {
      setPromotionEmailStatusType("error");
      setPromotionEmailStatus(result.error);
      setPromotionEmailFailures(result.data?.failedRecipients || []);
    }

    setSendingPromotionEmails(false);
  };

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
        onSendPromotionEmails={handleSendPromotionEmails}
        promotionCount={stats.promotionCount}
        sendingPromotionEmails={sendingPromotionEmails}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {promotionEmailStatus && (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 text-sm font-semibold ${
              promotionEmailStatusType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {promotionEmailStatus}
            {promotionEmailFailures.length > 0 && (
              <div className="mt-3 space-y-1 text-xs font-medium">
                {promotionEmailFailures.slice(0, 6).map((failure) => (
                  <p key={failure.email}>
                    {failure.email}: {failure.reason}
                  </p>
                ))}
                {promotionEmailFailures.length > 6 && (
                  <p>And {promotionEmailFailures.length - 6} more failed recipients.</p>
                )}
              </div>
            )}
          </div>
        )}

        <ProductStatsGrid
          stats={stats}
          showLowStockOnly={showLowStockOnly}
          onToggleLowStock={() => setShowLowStockOnly((current) => !current)}
          onOpenPromotions={() => navigate("/admin/products/promotions")}
          onOpenBestSellers={() => navigate("/admin/products/best-sellers")}
          onOpenNewArrivals={() => navigate("/admin/products/new-arrivals")}
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
              Boolean(searchTerm) ||
              categoryFilter !== "all" ||
              showLowStockOnly
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
