import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import ProductCard from "./ProductCard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const ProductsGrid = ({
  filteredProducts,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  searchQuery,
  selectedCategory,
  onClearFilters,
}) => {
  return (
    <AnimatePresence mode="wait">
      {filteredProducts.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          key={`${selectedCategory}-${searchQuery}`}
          className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={onAddToCart}
              onWishlistToggle={onWishlistToggle}
              isInWishlist={isInWishlist}
              user={user}
              variants={item}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-primary/12 bg-white px-6 py-16 text-center shadow-sm md:py-20"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-soft text-primary/70">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text-main mb-2">No products found</h3>
          <p className="mx-auto max-w-md text-sm text-text-muted md:text-base">
            Try a different keyword or reset your filters to see more products.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover"
          >
            Reset Filters
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductsGrid;
