import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";

// Components
import Hero from "../../components/home/Hero";
import SearchBar from "../../components/home/SearchBar";
import ErrorState from "../../components/product/ErrorState";
import ProductCard from "../../components/product/ProductCard";
import ProductLoadingPlaceholder from "../../components/product/ProductLoadingPlaceholder";
import { useDarkMode } from "../../hooks";

// Hooks
import { useProducts, useProductFilters } from "../../hooks/useProducts";
import { useLanguage } from "../../context/useLanguage";

function ProductSection({
    section,
    isDark,
    t,
    gridContainerVariants,
    gridItemVariants,
    onAddToCart,
    onWishlistToggle,
    isInWishlist,
    user,
}) {
    const scrollRef = useRef(null);
    const isHorizontal = section.layout === "horizontal";
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

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
        <section className="space-y-6">
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
                    onScroll={isHorizontal ? updateScrollState : undefined}
                    variants={gridContainerVariants}
                    initial="hidden"
                    animate="show"
                    className={productsContainerClass}
                >
                    {section.products.map((product) => (
                        <ProductCard
                            key={`${section.title}-${product._id}`}
                            product={product}
                            onAddToCart={onAddToCart}
                            onWishlistToggle={onWishlistToggle}
                            isInWishlist={isInWishlist}
                            user={user}
                            variants={gridItemVariants}
                            className={isHorizontal ? "h-[27rem] w-[calc((100%_-_1.5rem)*0.4545)] flex-none snap-start sm:h-[32rem] sm:w-56 md:h-[34rem] md:w-64 lg:w-72" : ""}
                        />
                    ))}
                </Motion.div>
            </div>
        </section>
    );
}

export default function Home() {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const [isDark] = useDarkMode();
    
    const productsRef = useRef(null);

    // Custom hooks
    const { products, loading, error } = useProducts(language);
    const {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredProducts
    } = useProductFilters(products);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        // Add a small delay to ensure React state updates before scrolling
        setTimeout(() => {
            if (productsRef.current) {
                const yOffset = -180; // Adjust for navbar and search bar height
                const y = productsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

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

    const gridContainerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const gridItemVariants = {
        hidden: { opacity: 0, y: 24 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 110 }
        }
    };

    const productSections = useMemo(() => {
        const normalizedProducts = [...filteredProducts];
        const newArrivals = [...normalizedProducts]
            .filter((product) => product.isNewArrival)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 8);

        const bestSellers = [...normalizedProducts]
            .filter((product) => Number(product.sold || product.totalSold || 0) > 0)
            .sort((a, b) => {
                const soldDelta = Number(b.sold || b.totalSold || 0) - Number(a.sold || a.totalSold || 0);
                if (soldDelta !== 0) return soldDelta;
                return Number(b.rating || 0) - Number(a.rating || 0);
            })
            .slice(0, 8);

        const deals = normalizedProducts
            .filter((product) => product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price)
            .sort((a, b) => {
                const discountA = ((Number(a.price || 0) - Number(a.discountPrice || 0)) / Math.max(Number(a.price || 1), 1)) * 100;
                const discountB = ((Number(b.price || 0) - Number(b.discountPrice || 0)) / Math.max(Number(b.price || 1), 1)) * 100;
                return discountB - discountA;
            })
            .slice(0, 8);

        return [
            {
                title: t("product.newArrival"),
                description: t("product.freshPicks"),
                products: newArrivals,
                layout: "horizontal",
            },
            {
                title: t("product.deal"),
                description: t("product.strongestSavings"),
                products: deals,
                layout: "horizontal",
            },
            {
                title: t("product.bestSeller"),
                description: t("product.popularProducts"),
                products: bestSellers,
                layout: "horizontal",
            },
            {
                title: t("product.all"),
                description: searchQuery
                    ? t("product.showingMatches", { query: searchQuery })
                    : t("product.browseFullCollection"),
                products: normalizedProducts,
            },
        ].filter((section) => section.products.length > 0);
    }, [filteredProducts, searchQuery, t]);

    if (error) {
        return <ErrorState error={error} onRetry={handleRetry} />;
    }

    return (
        <div className={`min-h-screen font-sans pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
            {/* Top Navigation Wrapper - Positioned below fixed navbar */}
            <div className={`sticky top-14 sm:top-16 lg:top-20 z-40 backdrop-blur-xl transition-colors duration-300 ${isDark ? "bg-slate-950/88" : "bg-bg-base/80"}`}>
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategorySelect}
                    categories={categories}
                />
                <div className="px-0 sm:px-4 md:px-6">
                    <div className={`max-w-6xl mx-auto border-b transition-colors duration-300 ${isDark ? "border-slate-800" : "border-stone-200/50"}`}></div>
                </div>
            </div>

            <main className="space-y-6 sm:space-y-12">
                {/* Hero Section Banner */}
                <Hero />

                <div ref={productsRef} className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-12 sm:pb-24">
                    {loading ? (
                        <ProductLoadingPlaceholder title={t("product.loadingProducts")} />
                    ) : productSections.length > 0 ? (
                        <div className="space-y-12 sm:space-y-16">
                            {productSections.map((section) => (
                                <ProductSection
                                    key={section.title}
                                    section={section}
                                    isDark={isDark}
                                    t={t}
                                    gridContainerVariants={gridContainerVariants}
                                    gridItemVariants={gridItemVariants}
                                    onAddToCart={handleAddToCart}
                                    onWishlistToggle={toggleWishlist}
                                    isInWishlist={isInWishlist}
                                    user={user}
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
    );
}
