import React from 'react';
import { Heart } from 'lucide-react';
import { useDarkMode } from '../../hooks';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  const [isDark] = useDarkMode();
  return (
    <div className="relative font-sans">
      <div className={`sticky top-22 overflow-hidden rounded-[1.75rem] p-3 sm:rounded-[2rem] sm:p-4 lg:p-5 transition-all duration-300 ${isDark ? "shadow-[0_24px_56px_-28px_rgba(12,16,12,0.9)]" : "shadow-[0_20px_48px_-26px_rgba(122,150,126,0.18)]"}`}>
        <div className={`relative z-10 flex min-h-[260px] sm:min-h-[340px] lg:min-h-[430px] items-center justify-center overflow-hidden rounded-[1.35rem] sm:rounded-[1.6rem] transition-all duration-300 ${isDark ? "ring-1 ring-inset ring-white/6" : "ring-1 ring-inset ring-stone-200/80"}`}>
          <img
            src={product.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-2xl"
          />
          <div className={`absolute inset-0 ${isDark ? "bg-[linear-gradient(180deg,rgba(15,23,42,0.35),rgba(15,23,42,0.12))]" : "bg-[linear-gradient(180deg,rgba(248,250,252,0.35),rgba(255,255,255,0.18))]"}`}></div>
          <img
            src={product.image}
            alt={product.title}
            className={`relative z-10 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02] ${isDark ? "drop-shadow-[0_20px_36px_rgba(15,23,42,0.65)]" : "drop-shadow-[0_18px_30px_rgba(148,163,184,0.35)]"}`}
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className={`absolute top-5 right-5 sm:top-6 sm:right-6 lg:top-8 lg:right-8 flex h-11 w-11 items-center justify-center rounded-[1.1rem] border-2 backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 sm:h-12 sm:w-12 sm:rounded-[1.25rem] lg:h-14 lg:w-14 ${isInWishlist
            ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-lg text-indigo-600`
            : `${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400' : 'bg-white/80 border-stone-200 text-stone-400 hover:border-indigo-600 hover:text-indigo-600'} shadow-sm`
            }`}
        >
          <Heart className="h-5 w-5 transition-all sm:h-5.5 sm:w-5.5" />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
