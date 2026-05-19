import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { translateCategory } from '../../utils/translationKeys';
import { isClothingProduct } from '../../utils/productOptions';
import { getLocalizedProductText } from '../../utils/productLocalization';

const ProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  variants
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

  return (
    <Motion.article
      variants={variants}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`group relative flex flex-col h-full rounded-[2rem] overflow-hidden transition-shadow duration-500 border ${
        isDark
          ? 'bg-slate-900 border-slate-800 shadow-[0_20px_50px_-18px_rgba(2,6,23,0.8)] hover:shadow-[0_24px_64px_-20px_rgba(79,70,229,0.35)]'
          : 'bg-white border-stone-100 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(122,150,126,0.25)]'
      }`}
    >
      {/* ═══ IMAGE SECTION (Square for consistency) ═══ */}
      <div className={`relative aspect-square overflow-hidden rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-stone-50'}`}>
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          <img
            src={product.image || product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={localizedProduct.title}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
          />
        </Link>

        {/* Hover Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Badges ── */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {outOfStock ? (
            <span className="bg-stone-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
              {t('product.soldOut')}
            </span>
          ) : hasDiscount && (
            <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm shadow-primary/30">
              {t('product.save')} {discountPercent}%
            </span>
          )}
        </div>

        {/* ── Wishlist Button ── */}
        <Motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product); }}
          className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 border-2 cursor-pointer ${inWishlist
            ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-md text-indigo-600`
            : `${isDark ? 'bg-slate-900/80 border-slate-600 text-slate-400 hover:text-primary-light hover:border-primary' : 'bg-transparent border-stone-300 text-stone-400 hover:text-primary hover:border-primary'}`
            }`}
        >
          <Heart className="w-4 h-4" strokeWidth={2.5} />
        </Motion.button>
      </div>

      {/* ═══ CONTENT SECTION ═══ */}
      <div className={`flex flex-col flex-1 p-5 pt-6 gap-3 relative ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

        {/* Floating Quick Add Button (Desktop) - Overlaps Image/Content */}
        <div className="absolute -top-6 right-5 hidden md:block opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 z-20">
          {needsSize && user && !outOfStock ? (
            <Link
              to={`/products/${product._id}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-[0_18px_36px_-18px_rgba(122,150,126,0.48)] transition-transform hover:scale-105 active:scale-95"
              title="Choose size"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              disabled={!user || outOfStock}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 ${!user || outOfStock
              ? `${isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`
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
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {product.category ? translateCategory(product.category, t) : t('product.essentials')}
          </span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-stone-50'}`}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-stone-600'}`}>
              {typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/products/${product._id}`} className="group-hover:text-primary transition-colors duration-300 cursor-pointer">
          <h3 className={`font-bold text-lg leading-snug line-clamp-2 min-h-[2.75rem] ${isDark ? 'text-slate-50' : 'text-stone-900'}`}>
            {localizedProduct.title}
          </h3>
        </Link>

        {/* Description Snippet (Optional - keeps card informative) */}
        <p className={`text-xs font-medium line-clamp-3 ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
          {localizedProduct.description || t('product.premiumQuality')}
        </p>

        {/* Divider */}
        <div className={`w-full h-px my-1 ${isDark ? 'bg-slate-700' : 'bg-stone-100'}`} />

        {/* Price Row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className={`text-xs font-bold line-through ${isDark ? 'text-slate-500' : 'text-stone-300'}`}>
                ${price.toFixed(2)}
              </span>
            )}
            <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              ${finalPrice.toFixed(2)}
            </span>
          </div>

          {/* Mobile Only: Text Button */}
          {needsSize && user && !outOfStock ? (
            <Link
              to={`/products/${product._id}`}
              className={`md:hidden rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider ${isDark ? 'bg-primary/15 text-primary-light' : 'bg-primary/10 text-primary'}`}
            >
              Size
            </Link>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              disabled={!user || outOfStock}
              className={`md:hidden text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer ${isDark ? 'text-primary-light bg-primary/15' : 'text-primary bg-primary/10'} ${(!user || outOfStock) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {outOfStock ? t('product.soldOut') : t('product.add')}
            </button>
          )}

          {/* Desktop: View Details Arrow */}
          <Link to={`/products/${product._id}`} className={`hidden md:flex items-center gap-1 text-xs font-bold transition-colors group-hover:text-primary ${isDark ? 'text-slate-400' : 'text-stone-300'}`}>
            {t('product.details')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Motion.article>
  );
};

export default ProductCard;
