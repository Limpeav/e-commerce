import React from 'react';
import { Heart } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { getProductImageForColor } from '../../utils/productOptions';

const ProductImage = ({ product, selectedColor = "", onWishlist, isInWishlist }) => {
  const [isDark] = useDarkMode();
  const imageSrc = getProductImageForColor(product, selectedColor);

  return (
    <div className="relative font-sans">
      <div className={`sticky top-22 overflow-hidden rounded-[1.75rem] border p-2 transition-all duration-300 sm:rounded-[2rem] sm:p-3 lg:p-4 ${
        isDark
          ? "border-slate-800 bg-slate-900 shadow-[0_24px_56px_-28px_rgba(2,6,23,0.9)]"
          : "border-stone-200/80 bg-white shadow-[0_20px_48px_-26px_rgba(120,113,108,0.22)]"
      }`}>
        <div className={`relative z-10 flex min-h-[280px] items-center justify-center overflow-hidden rounded-[1.4rem] px-5 py-7 transition-all duration-300 sm:min-h-[390px] sm:rounded-[1.7rem] sm:px-8 sm:py-10 lg:min-h-[520px] lg:px-10 lg:py-12 ${
          isDark ? "bg-slate-800" : "bg-[#f1ebe5]"
        }`}>
          <img
            src={imageSrc}
            alt={product.title}
            decoding="async"
            fetchPriority="high"
            className={`relative z-10 block max-h-[235px] w-auto max-w-full object-contain object-center transition-transform duration-500 hover:scale-[1.02] sm:max-h-[335px] lg:max-h-[450px] ${
              isDark
                ? "drop-shadow-[0_20px_32px_rgba(2,6,23,0.55)]"
                : "drop-shadow-[0_18px_24px_rgba(120,113,108,0.18)]"
            }`}
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className={`absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border-[3px] transition-all hover:scale-105 active:scale-95 sm:right-7 sm:top-7 sm:h-14 sm:w-14 lg:right-9 lg:top-9 lg:h-16 lg:w-16 ${isInWishlist
            ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-lg text-indigo-600`
            : `${isDark ? 'border-slate-600 bg-slate-900 text-slate-300 hover:border-primary hover:text-primary-light' : 'border-stone-300 bg-transparent text-[#6f7b71] hover:border-primary hover:text-primary'}`
            }`}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className="h-5 w-5 fill-none transition-all sm:h-6 sm:w-6"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
