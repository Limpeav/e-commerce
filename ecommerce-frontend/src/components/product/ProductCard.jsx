import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  variants
}) => {
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const inWishlist = isInWishlist(product._id);
  const outOfStock = product.stock === 0;

  return (
    <motion.article
      variants={variants}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="group relative flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-shadow duration-500 border border-stone-100"
    >
      {/* ═══ IMAGE SECTION (Square for consistency) ═══ */}
      <div className="relative aspect-square overflow-hidden bg-stone-50 rounded-2xl">
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          <img
            src={product.image || product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={product.name}
            className="w-full h-full object-contain p-6 transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-110 mix-blend-multiply"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
          />
        </Link>

        {/* Hover Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Badges ── */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {outOfStock ? (
            <span className="bg-stone-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
              Sold Out
            </span>
          ) : hasDiscount && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm shadow-rose-200">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* ── Wishlist Button ── */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product); }}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm ${inWishlist
            ? 'bg-rose-500 text-white shadow-rose-200'
            : 'bg-white/80 text-stone-400 hover:text-rose-500 hover:bg-white'
            }`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* ═══ CONTENT SECTION ═══ */}
      <div className="flex flex-col flex-1 p-5 pt-6 gap-3 bg-white relative">

        {/* Floating Quick Add Button (Desktop) - Overlaps Image/Content */}
        <div className="absolute -top-6 right-5 hidden md:block opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 z-20">
          <button
            onClick={() => onAddToCart(product)}
            disabled={!user || outOfStock}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 ${!user || outOfStock
              ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
              : 'bg-indigo-600 text-white shadow-indigo-200'
              }`}
            title="Quick Add"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">
            {product.category || 'Essentials'}
          </span>
          <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-stone-600">
              {typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/products/${product._id}`} className="group-hover:text-indigo-600 transition-colors duration-300">
          <h3 className="font-bold text-stone-900 text-lg leading-snug line-clamp-2 min-h-[2.75rem]">
            {product.name || product.title}
          </h3>
        </Link>

        {/* Description Snippet (Optional - keeps card informative) */}
        <p className="text-xs font-medium text-stone-400 line-clamp-3">
          {product.description || 'Premium quality for your lifestyle.'}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-stone-100 my-1" />

        {/* Price Row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs font-bold text-stone-300 line-through">
                ${product.price?.toFixed(2)}
              </span>
            )}
            <span className="text-xl font-black text-stone-900 tracking-tight">
              ${finalPrice?.toFixed(2)}
            </span>
          </div>

          {/* Mobile Only: Text Button */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={!user || outOfStock}
            className="md:hidden text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl"
          >
            {outOfStock ? 'Sold Out' : 'Add'}
          </button>

          {/* Desktop: View Details Arrow */}
          <Link to={`/products/${product._id}`} className="hidden md:flex items-center gap-1 text-xs font-bold text-stone-300 group-hover:text-indigo-600 transition-colors">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
