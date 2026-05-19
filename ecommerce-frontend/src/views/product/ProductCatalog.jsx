import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";
import { useProducts, useProductFilters } from "../../hooks/useProducts";
import { useDarkMode } from "../../hooks";
import ErrorState from "../../components/product/ErrorState";
import SearchBar from "../../components/home/SearchBar";
import ProductsGrid from "../../components/product/ProductsGrid";
import ProductLoadingPlaceholder from "../../components/product/ProductLoadingPlaceholder";
import { useLanguage } from "../../context/useLanguage";
import { consumeProductBackScrollTop } from "../../utils/scrollIntent";

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

const sortByBestSellers = (products) =>
  [...products].sort((a, b) => {
    const soldDelta = Number(b.sold || 0) - Number(a.sold || 0);
    if (soldDelta !== 0) return soldDelta;
    return Number(b.rating || 0) - Number(a.rating || 0);
  });

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

export default function ProductCatalog() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isDark] = useDarkMode();
  const [searchParams] = useSearchParams();

  const { products, loading, error } = useProducts(language);
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
  } = useProductFilters(products);

  const currentView = searchParams.get("view") || "all";
  const activeView = VIEW_CONFIG_KEYS[currentView] ? currentView : "all";
  const activeConfig = VIEW_CONFIG_KEYS[activeView];
  const activeTitle = t(activeConfig.title);

  const visibleProducts = useMemo(() => {
    switch (activeView) {
      case "new-arrivals":
        return [...filteredProducts].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      case "best-sellers":
        return sortByBestSellers(filteredProducts);
      case "deals":
        return sortByDeals(filteredProducts);
      default:
        return filteredProducts;
    }
  }, [activeView, filteredProducts]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  useEffect(() => {
    if (!loading && consumeProductBackScrollTop()) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  }, [loading]);

  const handleAddToCart = (product) => {
    if (!user) return;
    addToCart(product, 1);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div
      className={`min-h-screen font-sans pt-14 sm:pt-16 md:pt-20 pb-16 md:pb-0 transition-colors duration-300 ${
        isDark ? "bg-slate-950" : "bg-bg-base"
      }`}
    >
      <div
        className={`sticky top-14 sm:top-16 md:top-20 z-40 backdrop-blur-xl transition-colors duration-300 ${
          isDark ? "bg-slate-950/88" : "bg-bg-base/80"
        }`}
      >
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
        <div className="px-0 sm:px-4 md:px-6">
          <div
            className={`max-w-6xl mx-auto border-b transition-colors duration-300 ${
              isDark ? "border-slate-800" : "border-stone-200/50"
            }`}
          ></div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
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
              {visibleProducts.length} {t("product.items")}
            </div>
          </div>
        </section>

        {loading ? (
          <ProductLoadingPlaceholder title={t("product.loadingProducts")} />
        ) : (
          <ProductsGrid
            filteredProducts={visibleProducts}
            onAddToCart={handleAddToCart}
            onWishlistToggle={toggleWishlist}
            isInWishlist={isInWishlist}
            user={user}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onClearFilters={handleClearFilters}
          />
        )}
      </main>
    </div>
  );
}
