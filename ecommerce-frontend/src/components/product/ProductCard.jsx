import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, ChevronRight } from 'lucide-react';
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

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -10 }}
      className="group relative flex flex-col h-full bg-white rounded-3xl md:rounded-[2.5rem] p-2 md:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-stone-100/50"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/5] bg-stone-50 rounded-2xl md:rounded-[2rem] overflow-hidden mb-3 md:mb-6">
        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product); }}
          className={`absolute top-2 right-2 md:top-4 md:right-4 z-30 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg transition-all duration-300 cursor-pointer ${isInWishlist(product._id)
            ? "bg-secondary text-white scale-110"
            : "bg-white/90 backdrop-blur-md text-stone-400 hover:text-secondary hover:scale-110"
            }`}
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-2 z-20 pointer-events-none">
          {product.stock === 0 ? (
            <span className="bg-text-main text-white text-[10px] font-bold px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-lg">
              Sold Out
            </span>
          ) : hasDiscount && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-lg">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <Link to={`/products/${product._id}`} className="block w-full h-full group">
          <img
            src={product.image || product.images?.[0] || "https://via.placeholder.com/300x400?text=No+Image"}
            alt={product.name}
            className="w-full h-full object-contain p-4 md:p-8 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply"
            onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image"; }}
          />

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="hidden md:flex bg-white/90 backdrop-blur-md px-6 py-3 rounded-full font-bold text-primary items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
              Details <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col px-1 md:px-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-primary opacity-60">
            {product.category || "Essentials"}
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-amber-50 rounded-md md:rounded-lg text-amber-600 text-[10px] font-bold">
            <Star className="w-3 h-3 fill-current" />
            <span>{typeof product.rating === 'number' ? product.rating.toFixed(1) : "0.0"}</span>
          </div>
        </div>

        <Link to={`/products/${product._id}`} className="block mb-1 md:mb-2 group-hover:text-primary transition-colors">
          <h3 className="font-bold text-text-main text-sm md:text-xl leading-tight font-display line-clamp-1">
            {product.name || product.title}
          </h3>
        </Link>

        <p className="hidden md:block text-xs md:text-sm text-text-muted font-medium line-clamp-2 mb-3 md:mb-6 h-8 md:h-10 leading-relaxed">
          {product.description || "The perfect choice for your baby's comfort and style."}
        </p>

        <div className="mt-auto pt-3 md:pt-6 border-t border-stone-50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[10px] md:text-xs text-stone-300 line-through mb-0.5">
                ${product.price?.toFixed(2)}
              </span>
            )}
            <span className="text-lg md:text-2xl font-extrabold text-text-main font-display">
              ${finalPrice?.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!user || product.stock === 0}
            className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center group ${!user
              ? "bg-stone-100 text-stone-300"
              : product.stock === 0
                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark hover:scale-110 active:scale-95 shadow-primary/20"
              }`}
          >
            <ShoppingBag className={`w-5 h-5 md:w-6 md:h-6 ${product.stock !== 0 && user ? "group-hover:rotate-12 transition-transform" : ""}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
