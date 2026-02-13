import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

const ProductsGrid = ({
  filteredProducts,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  searchQuery,
  selectedCategory,
  onClearFilters
}) => {
  return (
    <AnimatePresence mode="wait">
      {filteredProducts.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          key={selectedCategory + searchQuery}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-x-8 md:gap-y-16"
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-40 bg-white rounded-[3rem] shadow-sm border border-stone-100"
        >
          <div className="w-24 h-24 bg-stone-50 text-stone-200 rounded-full flex items-center justify-center mx-auto mb-8">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-bold text-text-main mb-3 font-display">No results found</h3>
          <p className="text-text-muted text-lg max-w-sm mx-auto">We couldn't find any products matching your current filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-10 px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all hover:shadow-xl active:scale-95"
          >
            Explore Everything
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductsGrid;
