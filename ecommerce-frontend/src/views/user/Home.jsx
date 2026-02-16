import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import Loading from "../common/Loading";

import Hero from "../../components/home/Hero";
import SearchBar from "../../components/home/SearchBar";
import CategoryQuickAccess from "../../components/home/CategoryQuickAccess";
import DiscountBanner from "../../components/home/DiscountBanner";
import BrandBenefits from "../../components/home/BrandBenefits";
import ProductCollections from "../../components/home/ProductCollections";
import ParentReviews from "../../components/home/ParentReviews";
import ProductsGrid from "../../components/product/ProductsGrid";
import SectionHeader from "../../components/product/SectionHeader";
import ErrorState from "../../components/product/ErrorState";

import { useProducts, useProductFilters } from "../../hooks/useProducts";

export default function Home() {
  const { cart, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [featuredLimit, setFeaturedLimit] = useState(8);

  const { products, loading, error } = useProducts();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedType,
    setSelectedType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    inStockOnly,
    setInStockOnly,
    sortBy,
    setSortBy,
    categories,
    brands,
    types,
    resetFilters,
    filteredProducts,
  } = useProductFilters(products);

  const searchParamKey = searchParams.toString();

  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    const categoryFromUrl = searchParams.get("category");

    if (queryFromUrl !== searchQuery) {
      setSearchQuery(queryFromUrl);
    }

    if (categoryFromUrl) {
      const matchedCategory = categories.find(
        (category) => category.toLowerCase() === categoryFromUrl.toLowerCase()
      );

      if (matchedCategory && matchedCategory !== selectedCategory) {
        setSelectedCategory(matchedCategory);
      }
    } else if (searchParams.has("q") && selectedCategory !== "All") {
      setSelectedCategory("All");
    }
  }, [
    searchParamKey,
    searchParams,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  ]);

  useEffect(() => {
    if (window.location.hash === "#products") {
      const timer = window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [searchParamKey]);

  useEffect(() => {
    const updateFeaturedLimit = () => {
      if (window.matchMedia("(min-width: 1280px)").matches) {
        setFeaturedLimit(8); // 4 columns x 2 rows
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setFeaturedLimit(6); // 3 columns x 2 rows
      } else {
        setFeaturedLimit(4); // 2 columns x 2 rows
      }
    };

    updateFeaturedLimit();
    window.addEventListener("resize", updateFeaturedLimit);
    return () => window.removeEventListener("resize", updateFeaturedLimit);
  }, []);

  const handleAddToCart = (product) => {
    if (!user) return;
    addToCart(product, 1);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  const cartItemCount = cart.reduce((total, item) => {
    if (!item.product) return total;
    return total + (item.quantity || 1);
  }, 0);

  const bestSellers = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          Number(b.rating || 0) - Number(a.rating || 0) || Number(b.numReviews || 0) - Number(a.numReviews || 0)
      )
      .slice(0, 4);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 4);
  }, [products]);

  const featuredProducts = useMemo(
    () => filteredProducts.slice(0, featuredLimit),
    [filteredProducts, featuredLimit]
  );

  const handleQuickCategorySelect = ({ matchedCategory, fallbackQuery }) => {
    if (matchedCategory) {
      setSelectedCategory(matchedCategory);
      setSearchQuery("");
    } else {
      setSelectedCategory("All");
      setSearchQuery(fallbackQuery);
    }

    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans pt-[90px] md:pt-[96px]">
      <main className="pb-20 space-y-6 md:space-y-8">
        <Hero />

        <section aria-label="Category quick access">
          <CategoryQuickAccess
            categories={categories}
            products={products}
            onSelectCategory={handleQuickCategorySelect}
          />
        </section>

        <section aria-label="Search and filters">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={categories}
            brands={brands}
            types={types}
            onResetFilters={handleClearFilters}
          />
        </section>

        <section id="products" className="mx-auto max-w-7xl scroll-mt-28 px-4 md:px-6" aria-label="Featured products">
          <SectionHeader
            searchQuery={searchQuery}
            filteredProductsLength={filteredProducts.length}
            displayedProductsLength={featuredProducts.length}
            selectedCategory={selectedCategory}
          />

          <ProductsGrid
            filteredProducts={featuredProducts}
            onAddToCart={handleAddToCart}
            onWishlistToggle={toggleWishlist}
            isInWishlist={isInWishlist}
            user={user}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onClearFilters={handleClearFilters}
          />
        </section>

        <section aria-label="Promotions">
          <DiscountBanner />
        </section>

        <section aria-label="Trust and safety">
          <BrandBenefits />
        </section>

        <section id="all-products" className="mx-auto max-w-7xl px-4 md:px-6" aria-label="Best sellers and new arrivals">
          <ProductCollections
            bestSellers={bestSellers}
            newArrivals={newArrivals}
            onAddToCart={handleAddToCart}
            onWishlistToggle={toggleWishlist}
            isInWishlist={isInWishlist}
            user={user}
          />
        </section>

        <section aria-label="Customer reviews">
          <ParentReviews />
        </section>
      </main>

      <Link
        to="/cart"
        className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-text-main shadow-[0_16px_30px_rgba(197,140,173,0.22)] sm:hidden"
      >
        <ShoppingCart className="w-4 h-4" />
        Cart
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{cartItemCount}</span>
      </Link>
    </div>
  );
}
