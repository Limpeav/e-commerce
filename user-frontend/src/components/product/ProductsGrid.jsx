import React from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import ProductCard from './ProductCard';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { useVisibleProductRows } from '../../hooks/useVisibleProductRows';
import { readProductReturnPosition } from '../../utils/productReturnPosition';

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
  const location = useLocation();
  const navigationType = useNavigationType();
  const shouldRestoreProductPosition =
    navigationType === 'POP' || location.state?.restoreProductPosition === true;
  const returnPosition = readProductReturnPosition();
  const returnProductIndex = Number(returnPosition?.productIndex);
  const returnInitialRows = shouldRestoreProductPosition && Number.isInteger(returnProductIndex)
    ? Math.max(4, Math.ceil((returnProductIndex + 1) / 2))
    : 4;
  const { visibleCount, hasMoreProducts, showMoreProducts } = useVisibleProductRows({
    totalProducts: filteredProducts.length,
    initialRows: returnInitialRows,
    resetKey: `${selectedCategory}-${searchQuery}-${filteredProducts.length}`,
  });
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <AnimatePresence mode="wait">
      {filteredProducts.length > 0 ? (
        <Motion.div
          variants={container}
          initial="hidden"
          animate="show"
          key={selectedCategory + searchQuery}
          className="space-y-8 sm:space-y-12"
        >
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-8 md:gap-y-16">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={onAddToCart}
                onWishlistToggle={onWishlistToggle}
                isInWishlist={isInWishlist}
                user={user}
                variants={item}
                productIndex={index}
                imagePriority={index < 8}
              />
            ))}
          </div>
          {hasMoreProducts && (
            <div className="flex justify-center">
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
