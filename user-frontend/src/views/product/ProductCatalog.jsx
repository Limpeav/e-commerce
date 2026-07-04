import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";
import { usePaginatedProducts } from "../../hooks/useProducts";
import { useDarkMode } from "../../hooks";
import ErrorState from "../../components/product/ErrorState";

import SearchBar from "../../components/home/SearchBar";
import ProductsGrid from "../../components/product/ProductsGrid";
import Pagination from "../../components/common/Pagination";
import ProductLoadingPlaceholder from "../../components/product/ProductLoadingPlaceholder";
import SEO from "../../components/seo/SEO";
import { useLanguage } from "../../context/useLanguage";
import { Grid3x3, List } from "lucide-react";

const VIEW_CONFIG_KEYS = {
  all: {
    title: "footer.allProducts",
    description: "product.browseFullCollection",
  },
  "new-arrivals": {
    title: "footer.newArrivals",
    description: "product.freshPicks",
  },
  "best-sellers": {
    title: "footer.bestSellers",
    description: "product.popularProducts",
  },
  deals: {
    title: "footer.deals",
    description: "product.strongestSavings",
  },
};

const sortByDeals = (products) =>
  [...products]
    .filter(
      (product) =>
        product.discountPrice &&
        product.discountPrice > 0 &&
        product.discountPrice < product.price
    )
    .sort((a, b) => {
      const discountA =
        ((Number(a.price || 0) - Number(a.discountPrice || 0)) /
          Math.max(Number(a.price || 1), 1)) *
        100;
      const discountB =
        ((Number(b.price || 0) - Number(b.discountPrice || 0)) /
          Math.max(Number(b.price || 1), 1)) *
        100;
      return discountB - discountA;
    });

const sortByNewest = (products) =>
  [...products].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

const isNewArrivalProduct = (product) =>
  product.isNewArrival === true ||
  product.isNewArrival === "true" ||
  product.isNewArrival === 1 ||
  product.isNewArrival === "1";

const getNewArrivals = (products) => {
  const markedNewArrivals = products.filter(isNewArrivalProduct);
  return sortByNewest(markedNewArrivals).slice(0, 8);
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name" },
  { value: "best-selling", label: "Best Selling" },
];

const CATEGORIES = [
  "All", "Milk & Formula", "Diapers", "Bath & Skin", "Apparel",
  "Health & Safety", "Feeding", "Nursery", "Toys", "Moms & Maternity", "Gifts",
];

const ITEMS_PER_PAGE = 20;

export default function ProductCatalog() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isDark] = useDarkMode();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const [layout, setLayout] = useState("grid");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  const isDealsRoute = /^\/(?:customer\/)?deals\/?$/.test(location.pathname);
  const currentView = isDealsRoute ? "deals" : searchParams.get("view") || "all";
  const activeView = VIEW_CONFIG_KEYS[currentView] ? currentView : "all";
  const activeConfig = VIEW_CONFIG_KEYS[activeView];
  const activeTitle = t(activeConfig.title);

  const apiParams = useMemo(() => {
    const params = { limit: String(ITEMS_PER_PAGE), sort: sortBy };
    const p = searchParams.get("page") || "1";
    params.page = p;

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (selectedCategory !== "All") {
      params.category = selectedCategory;
    }

    if (activeView && activeView !== "all") {
      switch (activeView) {
        case "new-arrivals":
          params.sort = "newest";
          break;
        case "deals":
          params.sort = "price-low";
          break;
      }
    }

    return params;
  }, [searchQuery, selectedCategory, sortBy, activeView, searchParams]);

  const { products, loading, error, total, page, totalPages, setParams, goToPage, refetch } = usePaginatedProducts(apiParams);

  useEffect(() => {
    setParams(apiParams);
  }, [apiParams, setParams]);

  const syncParamToState = useCallback((key, value) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === "All" || value === "newest") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      next.delete("page");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    syncParamToState("search", value);
  }, [syncParamToState]);

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
    syncParamToState("category", value === "All" ? "" : value);
  }, [syncParamToState]);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    syncParamToState("sort", value);
  }, [syncParamToState]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleAddToCart = (product) => {
    if (!user) return;
    addToCart(product, 1);
  };

  const handleRetry = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("newest");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== "All";

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  const seoMeta = {
    all: { title: "All Products", description: "Browse our full collection of baby and kids products." },
    "new-arrivals": { title: "New Arrivals", description: "Discover the latest baby and kids products." },
    "best-sellers": { title: "Best Sellers", description: "Shop our most popular products." },
    deals: { title: "Deals & Discounts", description: "Save big on top-rated products." },
  };
  const activeSeo = seoMeta[activeView] || seoMeta.all;

  return (
    <>
      <SEO
        title={activeSeo.title}
        description={activeSeo.description}
        canonical={isDealsRoute ? "/deals" : "/products"}
      />
      <div
        className={`min-h-screen font-sans pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0 transition-colors duration-300 ${
          isDark ? "bg-slate-950" : "bg-bg-base"
        }`}
      >
        <div
          className={`sticky top-14 sm:top-16 lg:top-20 z-40 backdrop-blur-xl transition-colors duration-300 ${
            isDark ? "bg-slate-950/88" : "bg-bg-base/80"
          }`}
        >
          <div className="px-4 sm:px-6 md:px-8 py-3">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("product.searchProducts") || "Search products..."}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary"
                      : "bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-primary"
                  }`}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-white border-stone-200 text-stone-700"
                }`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-white border-stone-200 text-stone-700"
                }`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(`product.sort${opt.label.replace(/\s/g, "")}`) || opt.label}</option>
                ))}
              </select>

              <div className={`flex rounded-xl border overflow-hidden ${
                isDark ? "border-slate-700" : "border-stone-200"
              }`}>
                <button
                  onClick={() => setLayout("grid")}
                  className={`p-2.5 transition-colors ${layout === "grid"
                    ? "bg-primary text-white"
                    : isDark ? "text-slate-400 hover:text-slate-100" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout("list")}
                  className={`p-2.5 transition-colors ${layout === "list"
                    ? "bg-primary text-white"
                    : isDark ? "text-slate-400 hover:text-slate-100" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="px-0 sm:px-4 md:px-6">
            <div
              className={`max-w-7xl mx-auto border-b transition-colors duration-300 ${
                isDark ? "border-slate-800" : "border-stone-200/50"
              }`}
            />
          </div>
        </div>

        <main
          ref={resultsRef}
          className="scroll-mt-40 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16"
        >
          <section className="mb-8 sm:mb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span className="h-[2px] w-8 bg-primary/30"></span>
                  {t("product.productCatalog")}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl md:text-5xl font-display">
                  {activeTitle}
                </h1>
                <p className="max-w-2xl text-sm text-text-muted sm:text-base">
                  {searchQuery
                    ? t("product.showingViewMatches", { view: activeTitle.toLowerCase(), query: searchQuery })
                    : t(activeConfig.description)}
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 self-start rounded-2xl border px-5 py-3 text-sm font-bold tracking-tight sm:self-auto ${
                  isDark
                    ? "border-slate-800 bg-slate-900 text-slate-300 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.8)]"
                    : "border-stone-100 bg-white text-text-muted shadow-sm"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                {total} {t("product.items")}
              </div>
            </div>
          </section>

          {loading ? (
            <ProductLoadingPlaceholder title={t("product.loadingProducts")} />
          ) : (
            <>
              <ProductsGrid
                filteredProducts={products}
                onAddToCart={handleAddToCart}
                onWishlistToggle={toggleWishlist}
                isInWishlist={isInWishlist}
                user={user}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                onClearFilters={handleClearFilters}
                layout={layout}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
