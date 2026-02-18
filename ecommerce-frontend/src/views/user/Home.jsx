import React from "react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import Loading from "../common/Loading";

// Components
import Hero from "../../components/home/Hero";
import BrandBenefits from "../../components/home/BrandBenefits";
import SearchBar from "../../components/home/SearchBar";
import ProductsGrid from "../../components/product/ProductsGrid";
import SectionHeader from "../../components/product/SectionHeader";
import ErrorState from "../../components/product/ErrorState";

// Hooks
import { useProducts, useProductFilters } from "../../hooks/useProducts";

export default function Home() {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();

    // Custom hooks
    const { products, loading, error } = useProducts();
    const {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredProducts
    } = useProductFilters(products);

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

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <ErrorState error={error} onRetry={handleRetry} />;
    }

    return (
        <div className="min-h-screen bg-bg-base font-sans pt-14 sm:pt-16 md:pt-20 pb-16 md:pb-0">
            {/* Top Navigation Wrapper - Positioned below fixed navbar */}
            <div className="sticky top-14 sm:top-16 md:top-20 z-40 bg-bg-base/80 backdrop-blur-xl border-b border-stone-200/50">
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    categories={categories}
                />
            </div>

            <main className="space-y-6 sm:space-y-12">
                {/* Hero Section Banner */}
                <Hero />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-12 sm:pb-24">
                    {/* Section Header */}
                    <SectionHeader
                        searchQuery={searchQuery}
                        filteredProductsLength={filteredProducts.length}
                    />

                    {/* Products Grid */}
                    <ProductsGrid
                        filteredProducts={filteredProducts}
                        onAddToCart={handleAddToCart}
                        onWishlistToggle={toggleWishlist}
                        isInWishlist={isInWishlist}
                        user={user}
                        searchQuery={searchQuery}
                        selectedCategory={selectedCategory}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </main>

            <div className="bg-white py-12 sm:py-24 border-t border-stone-100">
                <BrandBenefits />
            </div>
        </div>
    );
}

