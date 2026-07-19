import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";

// Components
import Hero from "../../components/home/Hero";
import SearchBar from "../../components/home/SearchBar";
import ErrorState from "../../components/product/ErrorState";
import ProductCard from "../../components/product/ProductCard";
import ProductLoadingPlaceholder from "../../components/product/ProductLoadingPlaceholder";
import SEO from "../../components/seo/SEO";
import { useDarkMode } from "../../hooks";
import { useScrollVisibility } from "../../hooks/useScrollVisibility";

// Hooks
import { useProducts, useProductFilters } from "../../hooks/useProducts";
import { useVisibleProductRows } from "../../hooks/useVisibleProductRows";
import { useLanguage } from "../../context/useLanguage";
import { getBestSellersByCategory } from "../../utils/bestSellers";
import { translateCategory } from "../../utils/translationKeys";
import {
    buildProductSearchSuggestionValues,
    getMatchingSearchSuggestions,
} from "../../utils/searchSuggestions";

const HOME_SECTION_NAVIGATION_EVENT = "home-section:navigate";
const HOME_PRODUCT_ORDER_STORAGE_KEY = "cherish-home-product-order-v1";
const PRODUCT_RETURN_POSITION_STORAGE_KEY = "cherish-product-return-position-v1";

const readProductReturnPosition = () => {
    if (typeof window === "undefined") return null;

    try {
        const storedPosition = window.sessionStorage.getItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
        return storedPosition ? JSON.parse(storedPosition) : null;
    } catch {
        return null;
    }
};

const shuffleProducts = (products = []) => {
    const shuffled = [...products];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
};

const getProductStableId = (product, index) =>
    String(product?._id || product?.id || product?.slug || `${product?.title || product?.name || "product"}-${index}`);

const readStoredHomeProductOrder = () => {
    if (typeof window === "undefined") return [];

    try {
        const storedOrder = window.sessionStorage.getItem(HOME_PRODUCT_ORDER_STORAGE_KEY);
        const parsedOrder = storedOrder ? JSON.parse(storedOrder) : [];
        return Array.isArray(parsedOrder) ? parsedOrder.map(String) : [];
    } catch {
        return [];
    }
};

const writeStoredHomeProductOrder = (order) => {
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.setItem(HOME_PRODUCT_ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch {
        // Ignore storage failures; the current render still gets a stable memoized order.
    }
};

const getSessionHomeProductOrder = (products = []) => {
    const productIds = products.map(getProductStableId);
    const currentProductIds = new Set(productIds);
    const storedOrder = readStoredHomeProductOrder();
    const retainedOrder = storedOrder.filter((productId) => currentProductIds.has(productId));
    const retainedIds = new Set(retainedOrder);
    const newProductIds = productIds.filter((productId) => !retainedIds.has(productId));
    const nextOrder = [...retainedOrder, ...shuffleProducts(newProductIds)];

    if (
        nextOrder.length !== storedOrder.length ||
        nextOrder.some((productId, index) => productId !== storedOrder[index])
    ) {
        writeStoredHomeProductOrder(nextOrder);
    }

    return nextOrder;
};

const sortProductsByStableOrder = (products = [], orderedProductIds = []) => {
    const orderById = new Map(orderedProductIds.map((productId, index) => [productId, index]));

    return [...products].sort((a, b) => {
        const aOrder = orderById.get(getProductStableId(a, 0)) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = orderById.get(getProductStableId(b, 0)) ?? Number.MAX_SAFE_INTEGER;

        return aOrder - bOrder;
    });
};

const isReloadNavigation = () => {
    if (typeof window === "undefined" || !window.performance?.getEntriesByType) {
        return false;
    }

    const navigationEntry = window.performance.getEntriesByType("navigation")?.[0];
    return navigationEntry?.type === "reload";
};

function ProductSection({
    section,
    sectionIndex,
    isDark,
    t,
    gridContainerVariants,
    gridItemVariants,
    animateProducts,
    onAddToCart,
    onWishlistToggle,
    isInWishlist,
    user,
    shouldRestoreProductRows,
}) {
    const scrollRef = useRef(null);
    const isHorizontal = section.layout === "horizontal";
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const productListKey = useMemo(
        () => section.products.map((product, index) => getProductStableId(product, index)).join("|"),
        [section.products]
    );
    const returnPosition = readProductReturnPosition();
    const returnProductIndex = Number(returnPosition?.productIndex);
    const returnInitialRows =
        shouldRestoreProductRows && returnPosition?.sectionId === section.id && Number.isInteger(returnProductIndex)
            ? Math.max(4, Math.ceil((returnProductIndex + 1) / 2))
            : 4;
    const { visibleCount, hasMoreProducts, showMoreProducts } = useVisibleProductRows({
        totalProducts: section.products.length,
        initialRows: returnInitialRows,
        resetKey: `${section.id}-${section.title}-${productListKey}`,
    });
    const visibleProducts = isHorizontal
        ? section.products
        : section.products.slice(0, visibleCount);

    const updateScrollState = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const remainingScroll = container.scrollWidth - container.clientWidth - container.scrollLeft;

        setCanScrollPrev(container.scrollLeft > 4);
        setCanScrollNext(remainingScroll > 4);
    }, []);

    useEffect(() => {
        if (!isHorizontal) return undefined;

        updateScrollState();
        window.addEventListener("resize", updateScrollState);

        return () => {
            window.removeEventListener("resize", updateScrollState);
        };
    }, [isHorizontal, section.products.length, updateScrollState]);

    const scrollProducts = (direction) => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const firstCard = container.querySelector("[data-product-card]");
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
        const cardWidth = firstCard?.getBoundingClientRect().width || container.clientWidth;
        const visibleCards = window.matchMedia("(max-width: 639px)").matches ? 2 : 1;
        const scrollDistance = (cardWidth + gap) * visibleCards;

        container.scrollBy({
            left: direction === "next" ? scrollDistance : -scrollDistance,
            behavior: "smooth",
        });
    };

    const productsContainerClass = isHorizontal
        ? "flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-5 pr-3 sm:gap-5 md:gap-6"
        : "grid auto-rows-fr grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-8 md:gap-y-16";

    return (
        <section id={section.id} className="scroll-mt-40 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <span className="h-[2px] w-8 bg-primary/30"></span>
                        {t("product.homeCollection")}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main md:text-4xl font-display">
                        {section.title}
                    </h2>
                    <p className="max-w-2xl text-sm text-text-muted sm:text-base">
                        {section.description}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold tracking-tight ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.8)]' : 'border-stone-100 bg-white text-text-muted shadow-sm'}`}>
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                        {section.products.length} {t("product.items")}
                    </div>
                </div>
            </div>

            <div className="relative">
                {isHorizontal && (
                    <>
                        {canScrollPrev && (
                            <button
                                type="button"
                                onClick={() => scrollProducts("prev")}
                                className={`absolute left-1 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-colors sm:left-2 sm:h-14 sm:w-14 ${
                                    isDark
                                        ? "border-primary/60 bg-slate-950/90 text-slate-200 shadow-xl shadow-primary/20 hover:border-primary hover:text-primary-light"
                                        : "border-primary/60 bg-white/95 text-text-muted shadow-xl shadow-primary/20 hover:border-primary hover:text-primary"
                                }`}
                                aria-label={`Scroll ${section.title} left`}
                            >
                                <ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7" />
                            </button>
                        )}
                        {canScrollNext && (
                            <button
                                type="button"
                                onClick={() => scrollProducts("next")}
                                className={`absolute right-1 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-colors sm:right-2 sm:h-14 sm:w-14 ${
                                    isDark
                                        ? "border-primary/60 bg-slate-950/90 text-slate-200 shadow-xl shadow-primary/20 hover:border-primary hover:text-primary-light"
                                        : "border-primary/60 bg-white/95 text-text-muted shadow-xl shadow-primary/20 hover:border-primary hover:text-primary"
                                }`}
                                aria-label={`Scroll ${section.title} right`}
                            >
                                <ChevronRight className="h-5 w-5 sm:h-7 sm:w-7" />
                            </button>
                        )}
                    </>
                )}

                <Motion.div
                    ref={scrollRef}
                    data-product-scroller={section.id}
                    onScroll={isHorizontal ? updateScrollState : undefined}
                    variants={gridContainerVariants}
                    initial={animateProducts ? "hidden" : false}
                    animate="show"
                    className={productsContainerClass}
                >
                    {visibleProducts.map((product, index) => (
                        <ProductCard
                            key={`${section.title}-${product._id}`}
                            product={product}
                            onAddToCart={onAddToCart}
                            onWishlistToggle={onWishlistToggle}
                            isInWishlist={isInWishlist}
                            user={user}
                            variants={gridItemVariants}
                            productSectionId={section.id}
                            productIndex={index}
                            imagePriority={sectionIndex === 0 && index < (isHorizontal ? 4 : 8)}
                            className={isHorizontal ? "h-[27rem] w-[calc((100%_-_1.5rem)*0.4545)] flex-none snap-start sm:h-[32rem] sm:w-56 md:h-[34rem] md:w-64 lg:w-72" : ""}
                        />
                    ))}
                </Motion.div>
                {!isHorizontal && hasMoreProducts && (
                    <div className="mt-8 flex justify-center sm:mt-12">
                        <button
                            type="button"
                            onClick={showMoreProducts}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold transition-all active:scale-95 sm:px-8 sm:py-4 ${
                                isDark
                                    ? "border-slate-700 bg-slate-900 text-slate-100 hover:border-primary hover:text-primary-light"
                                    : "border-stone-200 bg-white text-text-main shadow-sm hover:border-primary/40 hover:text-primary hover:shadow-md"
                            }`}
                        >
                            {t("product.seeMore")}
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function Home() {
    const location = useLocation();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const [isDark] = useDarkMode();
    const isSearchBarVisible = useScrollVisibility({
        keepVisibleFocusSelector: "[data-product-search-input='true']",
    });
    const navigationType = useNavigationType();
    const prefersReducedMotion = useReducedMotion();
    
    const productsRef = useRef(null);
    const sectionScrollTimeoutRef = useRef(null);
    const animateProducts = navigationType !== "POP" && !prefersReducedMotion;
    const shouldSkipProductPositionRestore = useMemo(() => isReloadNavigation(), []);

    // Custom hooks
    const {
        products,
        recommendedProducts,
        recommendationSource,
        loading,
        error,
        refetch,
    } = useProducts(language, user);
    const {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredProducts
    } = useProductFilters(products);
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
        if (!searchQuery.trim()) return undefined;

        const scrollTimer = window.setTimeout(() => {
            productsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 300);

        return () => window.clearTimeout(scrollTimer);
    }, [searchQuery]);

    const scrollToProductsArea = useCallback((targetId = "all-products") => {
        let attempt = 0;

        const scrollToTarget = () => {
            const target = document.getElementById(targetId) || productsRef.current;

            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }

            if (attempt < 20) {
                attempt += 1;
                window.setTimeout(scrollToTarget, 100);
            }
        };

        window.setTimeout(scrollToTarget, 100);
    }, []);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
        scrollToProductsArea("all-products");
    }, [scrollToProductsArea, setSelectedCategory]);

    const handleAddToCart = useCallback((product) => {
        if (!user) return;
        addToCart(product, 1);
    }, [addToCart, user]);

    const handleRetry = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleClearFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedCategory("All");
    }, [setSearchQuery, setSelectedCategory]);

    const scrollToHomeSection = useCallback((targetId) => {
        if (!targetId) return;

        setSearchQuery("");
        setSelectedCategory("All");

        if (sectionScrollTimeoutRef.current) {
            window.clearTimeout(sectionScrollTimeoutRef.current);
        }

        let attempt = 0;
        const scrollToTarget = () => {
            const target = document.getElementById(targetId);

            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                sectionScrollTimeoutRef.current = null;
                return;
            }

            if (attempt < 20) {
                attempt += 1;
                sectionScrollTimeoutRef.current = window.setTimeout(scrollToTarget, 100);
            }
        };

        sectionScrollTimeoutRef.current = window.setTimeout(scrollToTarget, 100);
    }, [setSearchQuery, setSelectedCategory]);

    const gridContainerVariants = useMemo(() => ({
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.025
            }
        }
    }), []);

    const gridItemVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 12 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.18, ease: "easeOut" }
        }
    }), []);

    const productSections = useMemo(() => {
        const normalizedProducts = [...filteredProducts];
        const homeProductOrder = getSessionHomeProductOrder(products);
        const shuffledProducts = sortProductsByStableOrder(normalizedProducts, homeProductOrder);
        const sectionTitle = selectedCategory === "All"
            ? t("product.all")
            : translateCategory(selectedCategory, t);
        const allProductsSection = {
            id: "all-products",
            title: sectionTitle,
            description: searchQuery
                ? t("product.showingMatches", { query: searchQuery })
                : t("product.browseFullCollection"),
            products: shuffledProducts,
        };

        if (selectedCategory !== "All") {
            return normalizedProducts.length > 0 ? [allProductsSection] : [];
        }

        const shouldShowPersonalizedRecommendations =
            !searchQuery.trim() && recommendedProducts.length > 0;
        const personalizedSection = shouldShowPersonalizedRecommendations
            ? [{
                id: "recommended-for-you",
                title: t("product.recommendedForYou"),
                description: recommendationSource === "orders"
                    ? t("product.recommendedFromPurchases")
                    : t("product.recommendedFromViews"),
                products: recommendedProducts,
                layout: "horizontal",
            }]
            : [];

        const newArrivals = [...normalizedProducts]
            .filter((product) => product.isNewArrival)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 8);

        const bestSellers = getBestSellersByCategory(normalizedProducts);

        const deals = normalizedProducts
            .filter((product) => product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price)
            .sort((a, b) => {
                const discountA = ((Number(a.price || 0) - Number(a.discountPrice || 0)) / Math.max(Number(a.price || 1), 1)) * 100;
                const discountB = ((Number(b.price || 0) - Number(b.discountPrice || 0)) / Math.max(Number(b.price || 1), 1)) * 100;
                return discountB - discountA;
            });

        return [
            ...personalizedSection,
            {
                id: "new-arrivals",
                title: t("product.newArrival"),
                description: t("product.freshPicks"),
                products: newArrivals,
                layout: "horizontal",
            },
            {
                id: "deals",
                title: t("product.deal"),
                description: t("product.strongestSavings"),
                products: deals,
                layout: "horizontal",
            },
            {
                id: "best-sellers",
                title: t("product.bestSeller"),
                description: t("product.popularProducts"),
                products: bestSellers,
                layout: "horizontal",
            },
            allProductsSection,
        ].filter((section) => section.products.length > 0);
    }, [filteredProducts, products, recommendationSource, recommendedProducts, searchQuery, selectedCategory, t]);

    useEffect(() => {
        if (!location.hash) return undefined;

        const targetId = decodeURIComponent(location.hash.slice(1));
        if (!targetId) return undefined;

        scrollToHomeSection(targetId);
    }, [location.hash, productSections.length, scrollToHomeSection]);

    useLayoutEffect(() => {
        if (!loading || location.hash) return undefined;

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        return undefined;
    }, [loading, location.hash]);

    useLayoutEffect(() => {
        if (!shouldSkipProductPositionRestore) return undefined;

        try {
            window.sessionStorage.removeItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
        } catch {
            // Ignore storage failures; the page should still start from the top.
        }

        if (!location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }

        return undefined;
    }, [location.hash, shouldSkipProductPositionRestore]);

    useLayoutEffect(() => {
        if (
            shouldSkipProductPositionRestore ||
            navigationType !== "POP" ||
            loading ||
            location.hash
        ) return undefined;

        const returnPosition = readProductReturnPosition();

        if (!returnPosition?.productId) return undefined;

        let attempt = 0;
        let correctionCount = 0;
        let restoreTimer = null;
        let frameId = null;
        let isCancelled = false;
        const maxCorrections = 6;
        const correctionDelay = 60;
        const finishRestore = ({ clearSavedPosition = true } = {}) => {
            if (restoreTimer) {
                window.clearTimeout(restoreTimer);
                restoreTimer = null;
            }
            if (frameId) {
                window.cancelAnimationFrame(frameId);
                frameId = null;
            }
            if (!clearSavedPosition) return;

            try {
                window.sessionStorage.removeItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
            } catch {
                // Ignore storage failures.
            }
        };
        const cancelRestore = () => {
            isCancelled = true;
            finishRestore();
        };

        const restoreProductPosition = () => {
            if (isCancelled) return;

            const matchingCards = Array.from(document.querySelectorAll("[data-product-card]"))
                .filter((card) => card.dataset.productId === String(returnPosition.productId));
            const targetCard = returnPosition.sectionId
                ? matchingCards.find((card) => (
                    card.dataset.productSection === String(returnPosition.sectionId) ||
                    card.closest("section[id]")?.id === String(returnPosition.sectionId)
                )) || matchingCards[0]
                : matchingCards[0];

            if (targetCard) {
                const targetScroller = returnPosition.scrollerId
                    ? Array.from(document.querySelectorAll("[data-product-scroller]"))
                        .find((scroller) => scroller.dataset.productScroller === String(returnPosition.scrollerId))
                    : targetCard.closest("[data-product-scroller]");
                const scrollerLeft = Number(returnPosition.scrollerLeft);

                if (targetScroller && Number.isFinite(scrollerLeft)) {
                    targetScroller.scrollLeft = scrollerLeft;
                }

                const cardRect = targetCard.getBoundingClientRect();
                const cardTop = Number(returnPosition.cardTop);
                const fallbackTop = Number(returnPosition.scrollY);
                const nextTop = Number.isFinite(cardTop)
                    ? window.scrollY + cardRect.top - cardTop
                    : fallbackTop;

                if (Number.isFinite(nextTop)) {
                    window.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: "auto" });
                }

                if (correctionCount < maxCorrections) {
                    correctionCount += 1;
                    restoreTimer = window.setTimeout(() => {
                        frameId = window.requestAnimationFrame(restoreProductPosition);
                    }, correctionDelay);
                    return;
                }

                finishRestore();
                return;
            }

            if (attempt < 20) {
                attempt += 1;
                restoreTimer = window.setTimeout(() => {
                    frameId = window.requestAnimationFrame(restoreProductPosition);
                }, 100);
            }
        };

        window.addEventListener("wheel", cancelRestore, { passive: true });
        window.addEventListener("touchstart", cancelRestore, { passive: true });
        window.addEventListener("pointerdown", cancelRestore, { passive: true });
        window.addEventListener("keydown", cancelRestore);
        frameId = window.requestAnimationFrame(restoreProductPosition);

        return () => {
            finishRestore({ clearSavedPosition: false });
            window.removeEventListener("wheel", cancelRestore);
            window.removeEventListener("touchstart", cancelRestore);
            window.removeEventListener("pointerdown", cancelRestore);
            window.removeEventListener("keydown", cancelRestore);
        };
    }, [
        loading,
        location.hash,
        navigationType,
        productSections.length,
        shouldSkipProductPositionRestore,
    ]);

    useEffect(() => {
        const handleSectionNavigation = (event) => {
            scrollToHomeSection(event.detail?.targetId);
        };

        window.addEventListener(HOME_SECTION_NAVIGATION_EVENT, handleSectionNavigation);

        return () => {
            window.removeEventListener(HOME_SECTION_NAVIGATION_EVENT, handleSectionNavigation);
        };
    }, [scrollToHomeSection]);

    useEffect(() => () => {
        if (sectionScrollTimeoutRef.current) {
            window.clearTimeout(sectionScrollTimeoutRef.current);
        }
    }, []);

    if (error) {
        return <ErrorState error={error} onRetry={handleRetry} />;
    }

    return (
        <>
            <SEO
                title="Home"
                description="Shop the best baby and kids products at Cherish Baby Store. Discover curated essentials, toys, clothing, and more — delivered to your door."
                canonical="/"
            />
            <div className={`min-h-screen font-sans pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
            {/* Top Navigation Wrapper - Positioned below fixed navbar */}
            <div className={`sticky top-14 sm:top-16 lg:top-20 z-40 transform-gpu backdrop-blur-xl transition-[transform,opacity,background-color,color,border-color] duration-300 ease-out will-change-transform ${isSearchBarVisible ? "translate-y-0 opacity-100" : "-translate-y-[calc(100%+5rem)] opacity-0 pointer-events-none"} ${isDark ? "bg-slate-950/88" : "bg-bg-base/80"}`}>
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategorySelect}
                    categories={categories}
                    searchSuggestions={productSearchSuggestions}
                />
                <div className="px-0 sm:px-4 md:px-6">
                    <div className={`max-w-6xl mx-auto border-b transition-colors duration-300 ${isDark ? "border-slate-800" : "border-stone-200/50"}`}></div>
                </div>
            </div>

            <main className="space-y-6 sm:space-y-12">
                {/* Hero Section Banner */}
                <Hero />

                <div ref={productsRef} className="scroll-mt-40 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-12 sm:pb-24">
                    {loading ? (
                        <ProductLoadingPlaceholder title={t("product.loadingProducts")} />
                    ) : productSections.length > 0 ? (
                        <div className="space-y-12 sm:space-y-16">
                            {productSections.map((section, sectionIndex) => (
                                <ProductSection
                                    key={section.title}
                                    section={section}
                                    sectionIndex={sectionIndex}
                                    isDark={isDark}
                                    t={t}
                                    gridContainerVariants={gridContainerVariants}
                                    gridItemVariants={gridItemVariants}
                                    animateProducts={animateProducts}
                                    onAddToCart={handleAddToCart}
                                    onWishlistToggle={toggleWishlist}
                                    isInWishlist={isInWishlist}
                                    user={user}
                                    shouldRestoreProductRows={
                                        navigationType === "POP" && !shouldSkipProductPositionRestore
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-16 sm:py-32 rounded-2xl sm:rounded-[3rem] px-4 border ${isDark ? 'bg-slate-900 border-slate-800 shadow-[0_20px_60px_-24px_rgba(2,6,23,0.7)]' : 'bg-white border-stone-100 shadow-sm'}`}>
                            <h2 className="text-2xl sm:text-4xl font-bold text-text-main font-display">{t("product.noProductsFound")}</h2>
                            <p className="mt-3 text-sm sm:text-lg text-text-muted max-w-xl mx-auto">
                                {t("product.noProductsMessage")}
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="mt-6 sm:mt-10 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all hover:shadow-xl active:scale-95"
                            >
                                {t("product.exploreEverything")}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
        </>
    );
}
