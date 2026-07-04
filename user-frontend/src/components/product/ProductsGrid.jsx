import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

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
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  return (
    <AnimatePresence mode="wait">
      {filteredProducts.length > 0 ? (
        <Motion.div
          variants={container}
          initial="hidden"
          animate="show"
          key={selectedCategory + searchQuery}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-x-8 md:gap-y-16"
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
        </Motion.div>
      ) : (
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center py-16 sm:py-40 rounded-2xl sm:rounded-[3rem] px-4 border ${isDark ? 'bg-slate-900 border-slate-800 shadow-[0_20px_60px_-24px_rgba(2,6,23,0.7)]' : 'bg-white border-stone-100 shadow-sm'}`}
        >
          <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8 ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-stone-50 text-stone-200'}`}>
            <Search className="w-7 h-7 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-xl sm:text-3xl font-bold text-text-main mb-2 sm:mb-3 font-display">{t("product.noResultsFound")}</h3>
          <p className="text-text-muted text-sm sm:text-lg max-w-sm mx-auto">{t("product.noResultsMessage")}</p>
          <button
            onClick={onClearFilters}
            className="mt-6 sm:mt-10 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all hover:shadow-xl active:scale-95"
          >
            {t("product.exploreEverything")}
          </button>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductsGrid;
