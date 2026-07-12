import { createElement, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyProductsState from "../../../components/admin/products/EmptyProductsState";
import ProductCard from "../../../components/admin/products/ProductCard";
import Loading from "../../../components/common/Loading";
import { normalizeProductCategory } from "../../../constants/productCategories";
import { AdminProductController } from "../../../controllers/adminProductController";
import {
  getAvailableStock,
  getNumericDiscount,
  getProductSoldCount,
} from "../../../utils/adminProducts";
import {
  buildProductSearchSuggestionValues,
  getMatchingSearchSuggestions,
} from "../../../utils/searchSuggestions";

const accentStyles = {
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    hover: "hover:border-emerald-200 hover:text-emerald-700",
    count: "border-emerald-100 bg-emerald-50 text-emerald-700",
    ring: "focus:ring-emerald-500",
  },
  purple: {
    badge: "border-purple-200 bg-purple-50 text-purple-700",
    hover: "hover:border-purple-200 hover:text-purple-700",
    count: "border-purple-100 bg-purple-50 text-purple-700",
    ring: "focus:ring-purple-500",
  },
  orange: {
    badge: "border-orange-200 bg-orange-50 text-[#b45309]",
    hover: "hover:border-orange-200 hover:text-[#b45309]",
    count: "border-orange-200 bg-orange-50 text-[#b45309]",
    ring: "focus:ring-orange-500",
  },
  red: {
    badge: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
    hover: "hover:border-[#fecdd3] hover:text-[#be123c]",
    count: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
    ring: "focus:ring-[#e11d48]",
  },
};
const EMPTY_SORT_OPTIONS = [];

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetStartDate = (preset) => {
  const today = new Date();
  const startDate = new Date(today);

  if (preset === "today") return formatDateInput(today);
  if (preset === "7") {
    startDate.setDate(today.getDate() - 6);
    return formatDateInput(startDate);
  }
  if (preset === "30") {
    startDate.setDate(today.getDate() - 29);
    return formatDateInput(startDate);
  }

  return "";
};

const ProductSubsetPage = ({
  accent = "red",
  badge,
  countLabel,
  description,
  emptyHasActiveFilters,
  filterProduct,
  getSubsetProducts,
  icon,
  layout = "grid",
  loadingMessage,
  searchPlaceholder,
  sortProducts,
  sortOptions = EMPTY_SORT_OPTIONS,
  enableSalesDateFilter = false,
  title,
}) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState(sortOptions[0]?.value || "");
  const [salesDatePreset, setSalesDatePreset] = useState("all");
  const [customSalesStartDate, setCustomSalesStartDate] = useState("");
  const [customSalesEndDate, setCustomSalesEndDate] = useState("");
  const navigate = useNavigate();
  const styles = accentStyles[accent] || accentStyles.red;
  const todayInput = formatDateInput(new Date());

  const salesDateParams = useMemo(() => {
    if (!enableSalesDateFilter || salesDatePreset === "all") {
      return {};
    }

    if (salesDatePreset === "custom") {
      return {
        ...(customSalesStartDate ? { salesStartDate: customSalesStartDate } : {}),
        ...(customSalesEndDate ? { salesEndDate: customSalesEndDate } : {}),
      };
    }

    return {
      salesStartDate: getPresetStartDate(salesDatePreset),
      salesEndDate: todayInput,
    };
  }, [customSalesEndDate, customSalesStartDate, enableSalesDateFilter, salesDatePreset, todayInput]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await AdminProductController.getProducts(salesDateParams);

      if (result.success) {
        setProducts(result.data);
        setError("");
      } else {
        setError(result.error);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [salesDateParams]);

  const baseSubsetProducts = useMemo(
    () =>
      typeof getSubsetProducts === "function"
        ? getSubsetProducts(products)
        : products.filter(filterProduct),
    [filterProduct, getSubsetProducts, products]
  );

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    baseSubsetProducts.forEach((product) => {
      const category = normalizeProductCategory(product.category);
      if (category) categories.add(category);
    });

    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [baseSubsetProducts]);
  const searchSuggestions = useMemo(
    () =>
      getMatchingSearchSuggestions(
        buildProductSearchSuggestionValues(baseSubsetProducts, categoryOptions),
        searchTerm,
        10
      ),
    [baseSubsetProducts, categoryOptions, searchTerm]
  );

  const subsetProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedSortOption = sortOptions.find((option) => option.value === sortKey);
    const searchedProducts = baseSubsetProducts.filter((product) => {
      const matchesCategory =
        categoryFilter === "all" ||
        normalizeProductCategory(product.category).toLowerCase() ===
          categoryFilter.toLowerCase();

      if (!matchesCategory) return false;
      if (!normalizedSearch) return true;

      const soldText = String(getProductSoldCount(product));
      const availableText = String(getAvailableStock(product));

      return (
        product.title?.toLowerCase().includes(normalizedSearch) ||
        product.titleKm?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch) ||
        soldText.includes(normalizedSearch) ||
        availableText.includes(normalizedSearch)
      );
    });

    const sortedProducts =
      typeof selectedSortOption?.sort === "function"
        ? [...searchedProducts].sort(selectedSortOption.sort)
        : typeof sortProducts === "function"
          ? sortProducts(searchedProducts)
          : searchedProducts;

    return sortedProducts;
  }, [baseSubsetProducts, categoryFilter, searchTerm, sortKey, sortOptions, sortProducts]);

  const totalCount = baseSubsetProducts.length;
  const totalPages = Math.max(1, Math.ceil(subsetProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = subsetProducts.length ? (currentPage - 1) * pageSize : 0;
  const pageEnd = Math.min(pageStart + pageSize, subsetProducts.length);
  const visibleProducts = subsetProducts.slice(pageStart, pageEnd);

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
    return <Loading message={loadingMessage} />;
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
      <div className="border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className={`mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors ${styles.hover}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.badge}`}>
                {createElement(icon, { className: "h-4 w-4" })}
                {badge}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>

            <div className={`rounded-2xl border px-5 py-3 ${styles.count}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">
                {countLabel}
              </p>
              <p className="text-3xl font-black">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_180px_160px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                list="admin-product-subset-search-suggestions"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
              />
              <datalist id="admin-product-subset-search-suggestions">
                {searchSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            {enableSalesDateFilter ? (
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
                <select
                  value={salesDatePreset}
                  onChange={(event) => {
                    setSalesDatePreset(event.target.value);
                    setPage(1);
                  }}
                  className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
                  aria-label="Filter by sales date"
                >
                  <option value="all">All sales dates</option>
                  <option value="today">Today</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
            ) : null}

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {sortOptions.length > 0 ? (
              <select
                value={sortKey}
                onChange={(event) => {
                  setSortKey(event.target.value);
                  setPage(1);
                }}
                className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
              aria-label="Products per page"
            >
              {[25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
          {enableSalesDateFilter && salesDatePreset === "custom" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  From
                </span>
                <input
                  type="date"
                  value={customSalesStartDate}
                  max={customSalesEndDate || todayInput}
                  onChange={(event) => {
                    setCustomSalesStartDate(event.target.value);
                    setPage(1);
                  }}
                  className={`admin-date-input w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  To
                </span>
                <input
                  type="date"
                  value={customSalesEndDate}
                  min={customSalesStartDate || undefined}
                  max={todayInput}
                  onChange={(event) => {
                    setCustomSalesEndDate(event.target.value);
                    setPage(1);
                  }}
                  className={`admin-date-input w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
                />
              </label>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-gray-500">
            <span>
              Showing {subsetProducts.length ? pageStart + 1 : 0}-{pageEnd} of{" "}
              {subsetProducts.length} matches
            </span>
            {(searchTerm || categoryFilter !== "all" || salesDatePreset !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setSalesDatePreset("all");
                  setCustomSalesStartDate("");
                  setCustomSalesEndDate("");
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${styles.hover}`}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {subsetProducts.length === 0 ? (
          <EmptyProductsState
            hasActiveFilters={emptyHasActiveFilters ?? Boolean(searchTerm)}
            onAddProduct={() => navigate("/admin/products/add")}
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
                    <th className="px-6 py-4">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleProducts.map((product) => {
                    const price = Number(product.price) || 0;
                    const discountPrice = getNumericDiscount(product);

                    return (
                      <tr
                        key={product._id}
                        className="transition-colors hover:bg-orange-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                            />
                            <div>
                              <p className="max-w-xs font-semibold text-gray-900">
                                {product.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {normalizeProductCategory(product.category)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            ${(discountPrice ?? price).toFixed(2)}
                          </p>
                          {discountPrice !== null && (
                            <p className="text-xs text-gray-400 line-through">
                              ${price.toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex min-w-12 justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-[#b45309]">
                            {getProductSoldCount(product)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                          {getAvailableStock(product)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {subsetProducts.length > pageSize ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                    const requestedPage = Number(event.target.value);
                    if (!Number.isFinite(requestedPage)) return;
                    setPage(Math.min(totalPages, Math.max(1, requestedPage)));
                  }}
                  className="h-7 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-300"
                  aria-label="Go to page"
                />
              </label>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductSubsetPage;
