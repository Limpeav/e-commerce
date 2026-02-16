import React, { useState } from "react";
import {
  ArrowDownWideNarrow,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function SearchBar({
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
  onResetFilters,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    selectedCategory !== "All",
    selectedBrand !== "All",
    selectedType !== "All",
    minPrice !== "",
    maxPrice !== "",
    inStockOnly,
  ].filter(Boolean).length;

  const activeSelections = activeFiltersCount + (searchQuery.trim() ? 1 : 0) + (sortBy !== "latest" ? 1 : 0);

  return (
    <div className="px-4 md:px-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-primary/12 bg-white p-4 shadow-[0_10px_22px_rgba(116,178,226,0.12)] md:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Smart Product Finder</p>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-blue-soft/45 px-3 py-1.5 text-xs font-semibold text-text-muted">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            {activeSelections === 0 ? "No filters active" : `${activeSelections} active`}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_220px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search products, brand, or type..."
              className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-10 text-sm text-text-main placeholder:text-text-muted/70 focus:border-primary focus:outline-none"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:text-primary"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <ArrowDownWideNarrow className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full appearance-none rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-3 text-sm text-text-main focus:border-primary focus:outline-none"
            >
              <option value="latest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
              <option value="stock-desc">Most Stock</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              showAdvanced
                ? "border-primary bg-primary text-text-main"
                : "border-primary/20 bg-white text-text-main hover:border-primary"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            disabled={activeSelections === 0}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeSelections === 0
                ? "cursor-not-allowed border-primary/10 bg-white text-text-muted/60"
                : "border-primary/20 bg-white text-text-main hover:border-primary hover:text-primary"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? "border-primary bg-primary text-text-main"
                  : "border-primary/20 bg-white text-text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-primary/12 bg-blue-soft/15 p-3.5 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-text-muted">Brand</span>
              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none"
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === "All" ? "All Brands" : brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-text-muted">Type</span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-text-muted">Min Price</span>
              <input
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="0"
                min="0"
                className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-text-muted">Max Price</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Any"
                min="0"
                className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none"
              />
            </label>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm font-semibold text-text-main">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                In-stock only
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
