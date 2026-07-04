import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Grid3x3, List } from "lucide-react";
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

const PAGE_SIZES = [20, 50, 100];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
];

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingPromotionEmails, setSendingPromotionEmails] = useState(false);
  const [promotionEmailStatus, setPromotionEmailStatus] = useState("");
  const [promotionEmailStatusType, setPromotionEmailStatusType] = useState("success");
  const [promotionEmailFailures, setPromotionEmailFailures] = useState([]);
  const [layout, setLayout] = useState("grid");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const inventoryState = searchParams.get("inventory") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const updateFilterParam = useCallback(
    (name, value, defaultValue = "") => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          if (!value || value === defaultValue) {
            nextParams.delete(name);
          } else {
            nextParams.set(name, value);
          }
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const buildApiParams = useCallback(() => {
    const params = { page, limit: pageSize, sort: sortBy };
    if (searchTerm) params.search = searchTerm;
    if (categoryFilter !== "all") params.category = categoryFilter;
    if (inventoryState !== "all") params.inventory = inventoryState;
    return params;
  }, [page, pageSize, sortBy, searchTerm, categoryFilter, inventoryState]);

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      const result = await AdminProductController.getProducts(buildApiParams());

      if (result.success) {
        const { products: data, total, totalPages: tp } = result.data || {};
        setProducts(data || []);
        setTotalProducts(total || 0);
        setTotalPages(tp || 1);
        setCurrentPage(page || 1);
        setError("");
      } else {
        setError(result.error);
      }

      if (!silent) setLoading(false);
  }, [buildApiParams, page]);

  useEffect(() => {
    fetchProducts();
    return subscribeRealtimeDomains(
      ["products", "reviews"],
      () => fetchProducts({ silent: true })
    );
  }, [fetchProducts]);

  const categories = useMemo(() => getProductCategories(products), [products]);
  const stats = useMemo(() => getProductStats(products, categories), [products, categories]);

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

  const handlePageChange = (p) => {
    updateFilterParam("page", String(p));
  };

  const handleSortChange = (value) => {
    updateFilterParam("sort", value, "newest");
  };

  const handlePageSizeChange = (value) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("pageSize", String(value));
      next.delete("page");
      return next;
    }, { replace: true });
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

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

      <div className="admin-stagger-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          onOpenPromotions={() => navigate("/admin/products/promotions")}
          onOpenSold={() => navigate("/admin/products/sold")}
          onOpenBestSellers={() => navigate("/admin/products/best-sellers")}
          onOpenNewArrivals={() => navigate("/admin/products/new-arrivals")}
        />

        <ProductFilters
          categories={categories}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          inventoryState={inventoryState}
          onSearchChange={(value) => {
            updateFilterParam("search", value);
            updateFilterParam("page", "");
          }}
          onCategoryChange={(value) => {
            updateFilterParam("category", value, "all");
            updateFilterParam("page", "");
          }}
          onInventoryStateChange={(value) => {
            setSearchParams((currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.delete("lowStock");
              nextParams.delete("outOfStock");
              if (value === "all") {
                nextParams.delete("inventory");
              } else {
                nextParams.set("inventory", value);
              }
              nextParams.delete("page");
              return nextParams;
            }, { replace: true });
          }}
        />

        {/* Sort, Layout, Page Size Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayout("grid")}
              className={`p-2 rounded-lg border transition-colors ${layout === "grid" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`p-2 rounded-lg border transition-colors ${layout === "list" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyProductsState
            hasActiveFilters={Boolean(searchTerm) || categoryFilter !== "all" || inventoryState !== "all"}
            onAddProduct={goToAddProduct}
          />
        ) : layout === "list" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-bold uppercase tracking-wide text-gray-600">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Sold</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product._id} className="transition-colors hover:bg-orange-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || "https://via.placeholder.com/48"}
                            alt={product.title}
                            className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                          />
                          <span className="max-w-xs font-semibold text-gray-900 truncate">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">${(Number(product.discountPrice || product.price) || 0).toFixed(2)}</span>
                        {product.discountPrice > 0 && (
                          <span className="ml-2 text-xs text-gray-400 line-through">${Number(product.price || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex min-w-10 justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-amber-700">
                          {product.sold || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={product.availableStock > 0 ? "text-emerald-700" : "text-red-600"}>
                          {product.availableStock ?? product.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product._id}`, {
                              state: { returnTo: `${location.pathname}${location.search}` },
                            })}
                            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={(id) =>
                  navigate(`/admin/products/edit/${id}`, {
                    state: {
                      returnTo: `${location.pathname}${location.search}`,
                    },
                  })
                }
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Showing {startItem}–{endItem} of {totalProducts}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                      p === currentPage
                        ? "bg-primary text-white shadow-md"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
