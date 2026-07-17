import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";
import { useProducts, useProductFilters } from "../../hooks/useProducts";
import { useDarkMode } from "../../hooks";
import { useScrollVisibility } from "../../hooks/useScrollVisibility";
import ErrorState from "../../components/product/ErrorState";
import SearchBar from "../../components/home/SearchBar";
import ProductsGrid from "../../components/product/ProductsGrid";
import ProductLoadingPlaceholder from "../../components/product/ProductLoadingPlaceholder";
import SEO from "../../components/seo/SEO";
import { useLanguage } from "../../context/useLanguage";
import { getBestSellersByCategory } from "../../utils/bestSellers";
import { ProductController } from "../../controllers/productController";
import {
  buildProductSearchSuggestionValues,
  getMatchingSearchSuggestions,
} from "../../utils/searchSuggestions";

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

const PRODUCT_RETURN_POSITION_STORAGE_KEY = "cherish-product-return-position-v1";

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

export default function ProductCatalog() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isDark] = useDarkMode();
  const isSearchBarVisible = useScrollVisibility();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [searchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryRetryToken, setCategoryRetryToken] = useState(0);

  const { products, loading, error, refetch } = useProducts(language);
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
  } = useProductFilters(products);

  const isDealsRoute = /^\/(?:customer\/)?deals\/?$/.test(location.pathname);
  const currentView = isDealsRoute ? "deals" : searchParams.get("view") || "all";
  const activeView = VIEW_CONFIG_KEYS[currentView] ? currentView : "all";
  const activeConfig = VIEW_CONFIG_KEYS[activeView];
  const activeTitle = t(activeConfig.title);
  const shouldUseCategoryRanking =
    selectedCategory !== "All" && !searchQuery.trim();
  const productSearchSuggestions = useMemo(
    () =>
      getMatchingSearchSuggestions(
        buildProductSearchSuggestionValues(products, categories),
        searchQuery,
        10
      ),
    [categories, products, searchQuery]
  );

  useEffect(() => {
    if (!shouldUseCategoryRanking) {
      const timeout = window.setTimeout(() => {
        setCategoryProducts([]);
        setCategoryError("");
        setCategoryLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    let isCurrent = true;
    const timeout = window.setTimeout(() => {
      setCategoryLoading(true);
      setCategoryError("");

      ProductController.getProductsByCategory(selectedCategory)
        .then((result) => {
          if (!isCurrent) return;

          if (result.success) {
            setCategoryProducts(result.data || []);
          } else {
            setCategoryProducts([]);
            setCategoryError(result.error || "Failed to fetch category products");
          }
        })
        .catch((err) => {
          if (!isCurrent) return;
          setCategoryProducts([]);
          setCategoryError(err.message || "Failed to fetch category products");
        })
        .finally(() => {
          if (isCurrent) setCategoryLoading(false);
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [categoryRetryToken, selectedCategory, shouldUseCategoryRanking]);

  const catalogProducts = shouldUseCategoryRanking
    ? categoryProducts
    : filteredProducts;

  const visibleProducts = useMemo(() => {
    switch (activeView) {
      case "new-arrivals":
        return getNewArrivals(catalogProducts);
      case "best-sellers":
        return shouldUseCategoryRanking
          ? catalogProducts
          : getBestSellersByCategory(catalogProducts);
      case "deals":
        return sortByDeals(catalogProducts);
      default:
        return catalogProducts;
    }
  }, [activeView, catalogProducts, shouldUseCategoryRanking]);
  const isCatalogLoading = loading || categoryLoading;
  const productCount = isCatalogLoading ? products.length : visibleProducts.length;

  useEffect(() => {
    if (navigationType === "POP") return;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView, navigationType]);

  useEffect(() => {
    if (navigationType !== "POP" || isCatalogLoading || location.hash) return undefined;

    let returnPosition = null;

    try {
      const storedPosition = window.sessionStorage.getItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
      returnPosition = storedPosition ? JSON.parse(storedPosition) : null;
    } catch {
      returnPosition = null;
    }

    if (!returnPosition?.productId) return undefined;

    let attempt = 0;
    let restoreTimer = null;
    let frameId = null;

    const restoreProductPosition = () => {
      const targetCard = Array.from(document.querySelectorAll("[data-product-card]"))
        .find((card) => card.dataset.productId === String(returnPosition.productId));

      if (targetCard) {
        const cardRect = targetCard.getBoundingClientRect();
        const cardTop = Number(returnPosition.cardTop);
        const fallbackTop = Number(returnPosition.scrollY);
        const nextTop = Number.isFinite(cardTop)
          ? window.scrollY + cardRect.top - cardTop
          : fallbackTop;

        if (Number.isFinite(nextTop)) {
          window.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: "auto" });
        }

        try {
          window.sessionStorage.removeItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
        } catch {
          // Ignore storage failures.
        }

        return;
      }

      if (attempt < 20) {
        attempt += 1;
        restoreTimer = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(restoreProductPosition);
        }, 100);
      }
    };

    frameId = window.requestAnimationFrame(restoreProductPosition);

    return () => {
      if (restoreTimer) {
        window.clearTimeout(restoreTimer);
      }
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isCatalogLoading, location.hash, navigationType, visibleProducts.length]);

  useEffect(() => {
    if (!searchQuery.trim()) return undefined;

    const scrollTimer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);

    return () => window.clearTimeout(scrollTimer);
  }, [searchQuery]);

  const handleAddToCart = (product) => {
    if (!user) return;
    addToCart(product, 1);
  };

  const handleRetry = () => {
    if (categoryError) {
      setCategoryRetryToken((currentToken) => currentToken + 1);
      return;
    }

    refetch();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  if (error || categoryError) {
    return <ErrorState error={error || categoryError} onRetry={handleRetry} />;
  }

  const seoMeta = {
    all: { title: "All Products", description: "Browse our full collection of baby and kids products. From newborn essentials to toys and apparel — find everything your family needs." },
    "new-arrivals": { title: "New Arrivals", description: "Discover the latest baby and kids products at Cherish Baby Store. Fresh arrivals added weekly." },
    "best-sellers": { title: "Best Sellers", description: "Shop Cherish Baby Store's most popular baby and kids products — loved by thousands of families." },
    deals: { title: "Deals & Discounts", description: "Save big on top-rated baby and kids products. Limited-time deals and discounts on Cherish Baby Store's best-sellers." },
  }
  const activeSeo = seoMeta[activeView] || seoMeta.all

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
        className={`sticky top-14 sm:top-16 lg:top-20 z-40 transform-gpu backdrop-blur-xl transition-[transform,opacity,background-color,color,border-color] duration-300 ease-out will-change-transform ${isSearchBarVisible ? "translate-y-0 opacity-100" : "-translate-y-[calc(100%+5rem)] opacity-0 pointer-events-none"} ${
          isDark ? "bg-slate-950/88" : "bg-bg-base/80"
        }`}
      >
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          searchSuggestions={productSearchSuggestions}
        />
        <div className="px-0 sm:px-4 md:px-6">
          <div
            className={`max-w-6xl mx-auto border-b transition-colors duration-300 ${
              isDark ? "border-slate-800" : "border-stone-200/50"
            }`}
          ></div>
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
              {productCount} {t("product.items")}
            </div>
          </div>
        </section>

        {isCatalogLoading ? (
          <ProductLoadingPlaceholder title={t("product.loadingProducts")} />
        ) : (
          <ProductsGrid
            filteredProducts={visibleProducts}
            onAddToCart={handleAddToCart}
            onWishlistToggle={toggleWishlist}
            isInWishlist={isInWishlist}
            user={user}
            searchQuery={searchQuery}
            selectedCategory={`${activeView}-${selectedCategory}`}
            onClearFilters={handleClearFilters}
          />
        )}
      </main>
    </div>
    </>
  );
}
