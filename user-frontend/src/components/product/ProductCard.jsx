import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, ArrowRight, Calendar } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { translateCategory } from '../../utils/translationKeys';
import { isClothingProduct } from '../../utils/productOptions';
import { getLocalizedProductText } from '../../utils/productLocalization';
import {
  formatExpiryDate,
  productSupportsExpiry,
} from '../../utils/productExpiry';

const SAVE_SCROLL_POSITION_EVENT = 'scroll-position:save';
const PRODUCT_RETURN_POSITION_STORAGE_KEY = 'cherish-product-return-position-v1';

const ProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  variants,
  className = ""
}) => {
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const finalPrice = hasDiscount ? discountPrice : price;
  const inWishlist = isInWishlist(product._id);
  const outOfStock = product.stock === 0;
  const needsSize = isClothingProduct(product);
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProductText(product, language);
  const navigate = useNavigate();
  const cardRef = React.useRef(null);
  const roundedRating = Math.min(5, Math.max(0, Math.round(Number(product.rating) || 0)));

  const saveReturnPosition = () => {
    window.dispatchEvent(new Event(SAVE_SCROLL_POSITION_EVENT));
    const cardRect = cardRef.current?.getBoundingClientRect();

    try {
      window.sessionStorage.setItem(
        PRODUCT_RETURN_POSITION_STORAGE_KEY,
        JSON.stringify({
          productId: product._id,
          scrollY: window.scrollY,
          cardTop: cardRect?.top ?? null,
        })
      );
    } catch {
      // Ignore storage failures; global scroll restoration still handles normal browsers.
    }
  };

  const openProductDetails = () => {
    saveReturnPosition();
    navigate(`/products/${product._id}`);
  };

  const handleAddClick = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    onAddToCart(product);
  };

  return (
    <Motion.article
      ref={cardRef}
      data-product-card
      data-product-id={product._id}
      variants={variants}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={openProductDetails}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          openProductDetails();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`${localizedProduct.title} — ${t('product.details')}`}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border transition-shadow duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:rounded-[2rem] ${
        isDark
          ? 'bg-slate-900 border-slate-800 shadow-[0_20px_50px_-18px_rgba(2,6,23,0.8)] hover:shadow-[0_24px_64px_-20px_rgba(79,70,229,0.35)]'
          : 'bg-white border-stone-100 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(122,150,126,0.25)]'
      } ${className}`}
    >
      {/* ═══ IMAGE SECTION (Square for consistency) ═══ */}
      <div className={`relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-stone-50'}`}>
        <Link
          to={`/products/${product._id}`}
          onClick={(event) => {
            event.stopPropagation();
            saveReturnPosition();
          }}
          className="block h-full w-full"
        >
          <img
            src={product.image || product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={localizedProduct.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
          />
        </Link>

        {/* Hover Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Badges ── */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10 sm:top-4 sm:left-4">
          {outOfStock ? (
            <span className="bg-stone-900 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-sm sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-widest">
              {t('product.soldOut')}
            </span>
          ) : hasDiscount && (
            <span className="bg-[#FF3B30] text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-[#FF3B30]/30 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-widest">
              {t('product.save')} {discountPercent}%
            </span>
          )}
        </div>

        {/* ── Wishlist Button ── */}
        <Motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product); }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 border-2 cursor-pointer sm:top-4 sm:right-4 sm:p-2.5 ${inWishlist
            ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-md text-indigo-600`
            : `${isDark ? 'bg-slate-900/80 border-slate-600 text-slate-400 hover:text-primary-light hover:border-primary' : 'bg-transparent border-stone-300 text-stone-400 hover:text-primary hover:border-primary'}`
            }`}
        >
          <Heart className="w-3.5 h-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
        </Motion.button>
      </div>

      {/* ═══ CONTENT SECTION ═══ */}
      <div className={`flex flex-col flex-1 p-3 pt-4 gap-2 relative sm:gap-3 sm:p-5 sm:pt-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

        {/* Floating Quick Add Button (Desktop) - Overlaps Image/Content */}
        <div className="absolute -top-6 left-5 hidden md:block opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 z-20">
          {needsSize && user && !outOfStock ? (
            <Link
              to={`/products/${product._id}`}
              onClick={(event) => {
                event.stopPropagation();
                saveReturnPosition();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-[0_18px_36px_-18px_rgba(122,150,126,0.48)] transition-transform hover:scale-105 active:scale-95"
              title={t("product.chooseSize")}
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={handleAddClick}
              disabled={outOfStock}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 ${!user || outOfStock
              ? outOfStock
                ? `${isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`
                : `${isDark ? 'bg-primary/15 text-primary-light cursor-pointer' : 'bg-primary/10 text-primary cursor-pointer'}`
              : 'bg-primary text-white shadow-[0_18px_36px_-18px_rgba(122,150,126,0.48)] cursor-pointer'
              }`}
              title={t('product.quickAdd')}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <span className="max-w-[6.5rem] truncate text-[9px] font-bold uppercase tracking-wider text-primary sm:max-w-none sm:text-[10px] sm:tracking-[0.2em]">
            {product.category ? translateCategory(product.category, t) : t('product.essentials')}
          </span>
          <div
            className={`flex items-center gap-0.5 rounded-lg px-2 py-1 ${isDark ? 'bg-slate-800' : 'bg-stone-50'}`}
            aria-label={`${typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                  star <= roundedRating
                    ? 'fill-amber-400 text-amber-400'
                    : isDark
                      ? 'fill-transparent text-slate-600'
                      : 'fill-transparent text-stone-300'
                }`}
              />
            ))}
            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/products/${product._id}`}
          onClick={(event) => {
            event.stopPropagation();
            saveReturnPosition();
          }}
          className="cursor-pointer transition-colors duration-300 group-hover:text-primary"
        >
          <h3 data-no-static-translation className={`font-bold text-sm leading-snug line-clamp-1 min-h-[1.125rem] sm:min-h-[1.375rem] sm:text-lg ${isDark ? 'text-slate-50' : 'text-stone-900'}`}>
            {localizedProduct.title}
          </h3>
        </Link>

        {/* Description Snippet (Optional - keeps card informative) */}
        <p data-no-static-translation className={`text-[11px] font-medium line-clamp-2 sm:line-clamp-3 sm:text-xs ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
          {localizedProduct.description || t('product.premiumQuality')}
        </p>

        {/* Expiry Date - shown for Milk and Bath & Skin */}
        {productSupportsExpiry(product.category) && product.expiryDate && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            <Calendar className="w-3 h-3" />
            <span>{t("product.expires")}: {formatExpiryDate(product.expiryDate)}</span>
          </div>
        )}

        {/* Divider */}
        <div className={`w-full h-px my-1 ${isDark ? 'bg-slate-700' : 'bg-stone-100'}`} />

        {/* Price Row */}
        <div className="mt-auto flex min-h-[3.5rem] items-end justify-between gap-2">
          <div className="flex min-h-[3.25rem] flex-col justify-end">
            <span className={`h-4 text-xs font-bold line-through ${hasDiscount ? '' : 'invisible'} ${isDark ? 'text-slate-500' : 'text-stone-300'}`}>
              ${price.toFixed(2)}
            </span>
            <span className={`text-base font-black tracking-tight sm:text-xl ${isDark ? 'text-white' : 'text-stone-900'}`}>
              ${finalPrice.toFixed(2)}
            </span>
          </div>

          {/* Mobile Only: Text Button */}
          {needsSize && user && !outOfStock ? (
            <Link
              to={`/products/${product._id}`}
              onClick={(event) => {
                event.stopPropagation();
                saveReturnPosition();
              }}
              className={`md:hidden rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider sm:px-4 sm:text-xs ${isDark ? 'bg-primary/15 text-primary-light' : 'bg-primary/10 text-primary'}`}
            >
              Size
            </Link>
          ) : (
            <button
              onClick={handleAddClick}
              disabled={outOfStock}
              className={`md:hidden text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl cursor-pointer sm:px-4 sm:text-xs ${isDark ? 'text-primary-light bg-primary/15' : 'text-primary bg-primary/10'} ${outOfStock ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {outOfStock ? t('product.soldOut') : user ? t('product.add') : t('product.login')}
            </button>
          )}

          {/* Desktop: View Details Arrow */}
          <Link
            to={`/products/${product._id}`}
            onClick={(event) => {
              event.stopPropagation();
              saveReturnPosition();
            }}
            className={`hidden items-center gap-1 text-xs font-bold transition-colors group-hover:text-primary md:flex ${isDark ? 'text-slate-400' : 'text-stone-300'}`}
          >
            {t('product.details')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Motion.article>
  );
};

export default React.memo(ProductCard);
