import React, { useMemo, useRef } from "react";
import { motion as Motion } from "framer-motion";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";
import Loading from "../common/Loading";

// Components
import Hero from "../../components/home/Hero";
import SearchBar from "../../components/home/SearchBar";
import ErrorState from "../../components/product/ErrorState";
import ProductCard from "../../components/product/ProductCard";
import { useDarkMode } from "../../hooks";

// Hooks
import { useProducts, useProductFilters } from "../../hooks/useProducts";
import { useLanguage } from "../../context/useLanguage";

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
            },
            {
                title: t("product.deal"),
                description: t("product.strongestSavings"),
                products: deals,
            },
            {
                title: t("product.bestSeller"),
                description: t("product.popularProducts"),
                products: bestSellers,
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

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <ErrorState error={error} onRetry={handleRetry} />;
    }

    return (
        <div className={`min-h-screen font-sans pt-14 sm:pt-16 md:pt-20 pb-16 md:pb-0 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
            {/* Top Navigation Wrapper - Positioned below fixed navbar */}
            <div className={`sticky top-14 sm:top-16 md:top-20 z-40 backdrop-blur-xl transition-colors duration-300 ${isDark ? "bg-slate-950/88" : "bg-bg-base/80"}`}>
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
                    {productSections.length > 0 ? (
                        <div className="space-y-12 sm:space-y-16">
                            {productSections.map((section) => (
                                <section key={section.title} className="space-y-6">
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

                                        <div className={`inline-flex items-center gap-2 self-start rounded-2xl border px-5 py-3 text-sm font-bold tracking-tight sm:self-auto ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.8)]' : 'border-stone-100 bg-white text-text-muted shadow-sm'}`}>
                                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                                            {section.products.length} {t("product.items")}
                                        </div>
                                    </div>

                                    <Motion.div
                                        variants={gridContainerVariants}
                                        initial="hidden"
                                        whileInView="show"
                                        viewport={{ once: true, amount: 0.15 }}
                                        className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-8 md:gap-y-16"
                                    >
                                        {section.products.map((product) => (
                                            <ProductCard
                                                key={`${section.title}-${product._id}`}
                                                product={product}
                                                onAddToCart={handleAddToCart}
                                                onWishlistToggle={toggleWishlist}
                                                isInWishlist={isInWishlist}
                                                user={user}
                                                variants={gridItemVariants}
                                            />
                                        ))}
                                    </Motion.div>
                                </section>
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
