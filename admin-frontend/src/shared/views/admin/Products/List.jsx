import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  buildProductSearchSuggestionValues,
  getMatchingSearchSuggestions,
} from "../../../utils/searchSuggestions";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const PRODUCT_PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
const DEFAULT_PRODUCT_PAGE_SIZE = 12;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingPromotionEmails, setSendingPromotionEmails] = useState(false);
  const [promotionEmailStatus, setPromotionEmailStatus] = useState("");
  const [promotionEmailStatusType, setPromotionEmailStatusType] = useState("success");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const requestedPage = Math.max(1, Number.parseInt(searchParams.get("page"), 10) || 1);
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize"), 10);
  const pageSize = PRODUCT_PAGE_SIZE_OPTIONS.includes(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PRODUCT_PAGE_SIZE;
  const legacyInventoryState = searchParams.get("outOfStock") === "true"
    ? "sold-out"
    : searchParams.get("lowStock") === "true"
      ? "issues"
      : "all";
  const inventoryState = searchParams.get("inventory") || legacyInventoryState;

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
          nextParams.delete("page");

          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const updatePaginationParams = useCallback(
    (updates) => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);

          if (updates.page !== undefined) {
            if (!updates.page || updates.page <= 1) {
              nextParams.delete("page");
            } else {
              nextParams.set("page", String(updates.page));
            }
          }

          if (updates.pageSize !== undefined) {
            if (updates.pageSize === DEFAULT_PRODUCT_PAGE_SIZE) {
              nextParams.delete("pageSize");
            } else {
              nextParams.set("pageSize", String(updates.pageSize));
            }
          }

          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

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
  const searchSuggestions = useMemo(
    () =>
      getMatchingSearchSuggestions(
        buildProductSearchSuggestionValues(products, categories),
        searchTerm,
        10
      ),
    [categories, products, searchTerm]
  );
  const filteredProducts = useMemo(
    () =>
      filterAdminProducts(products, {
        searchTerm,
        categoryFilter,
        inventoryState,
      }),
    [products, searchTerm, categoryFilter, inventoryState]
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = filteredProducts.length ? (currentPage - 1) * pageSize : 0;
  const pageEnd = Math.min(pageStart + pageSize, filteredProducts.length);
  const paginatedProducts = filteredProducts.slice(pageStart, pageEnd);

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

    const result = await AdminProductController.sendStorePromotionEmails();
    if (result.success) {
      const sentCount = result.data?.sentCount ?? 0;
      const recipientCount = result.data?.recipientCount ?? 0;
      setPromotionEmailStatus(
        recipientCount === 0
          ? "No customers have promotional emails enabled."
          : `Promotion email sent to ${sentCount} customer${sentCount === 1 ? "" : "s"}.`
      );
    } else {
      setPromotionEmailStatusType("error");
      setPromotionEmailStatus(result.error);
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
          searchSuggestions={searchSuggestions}
          onSearchChange={(value) => updateFilterParam("search", value)}
          onCategoryChange={(value) =>
            updateFilterParam("category", value, "all")
          }
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

        {filteredProducts.length === 0 ? (
          <EmptyProductsState
            hasActiveFilters={
              Boolean(searchTerm) ||
              categoryFilter !== "all" ||
              inventoryState !== "all"
            }
            onAddProduct={goToAddProduct}
          />
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Showing {pageStart + 1}-{pageEnd} of {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(event) =>
                    updatePaginationParams({
                      page: 1,
                      pageSize: Number(event.target.value),
                    })
                  }
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-700 transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500"
                  aria-label="Products per page"
                >
                  {PRODUCT_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
                <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>

            <div className="admin-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  detailsState={{
                    returnTo: `${location.pathname}${location.search}`,
                  }}
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

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePaginationParams({ page: 1 })}
                    disabled={currentPage === 1}
                    className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePaginationParams({ page: Math.max(1, currentPage - 1) })
                    }
                    disabled={currentPage === 1}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-600">
                    Page
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(event) => {
                        const nextPage = Number(event.target.value);
                        if (!Number.isFinite(nextPage)) return;
                        updatePaginationParams({
                          page: Math.min(totalPages, Math.max(1, nextPage)),
                        });
                      }}
                      className="h-7 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-300"
                      aria-label="Go to product page"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updatePaginationParams({
                        page: Math.min(totalPages, currentPage + 1),
                      })
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePaginationParams({ page: totalPages })}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;
