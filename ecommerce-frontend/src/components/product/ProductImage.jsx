import React from 'react';
import { Heart } from 'lucide-react';
import { useDarkMode } from '../../hooks';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  const [isDark] = useDarkMode();
  return (
    <div className="relative font-sans">
      <div className={`sticky top-28 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border p-4 sm:p-5 lg:p-6 transition-all duration-300 ${isDark ? "border-slate-800 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.92))] shadow-[0_28px_70px_-30px_rgba(2,6,23,0.95)]" : "border-stone-200 bg-[linear-gradient(160deg,#ffffff,#f8fafc)] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.2)]"}`}>
        <div className={`absolute inset-x-0 top-0 h-40 opacity-80 ${isDark ? "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_70%)]" : "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_70%)]"}`}></div>

        <div className={`relative z-10 flex min-h-[320px] sm:min-h-[450px] lg:min-h-[560px] items-center justify-center overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 ${isDark ? "bg-slate-900/75 ring-1 ring-inset ring-white/6" : "bg-white/80 ring-1 ring-inset ring-stone-200/80"}`}>
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
            className={`relative z-10 block max-h-full w-auto max-w-full object-contain object-center px-3 py-3 sm:px-4 sm:py-4 transition-transform duration-700 hover:scale-[1.02] ${isDark ? "drop-shadow-[0_24px_44px_rgba(15,23,42,0.65)]" : "drop-shadow-[0_20px_36px_rgba(148,163,184,0.35)]"}`}
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className={`absolute top-6 right-6 sm:top-8 sm:right-8 lg:top-10 lg:right-10 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl sm:rounded-[1.5rem] transition-all hover:scale-110 active:scale-95 z-20 flex items-center justify-center border-2 backdrop-blur-md ${isInWishlist
            ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-lg text-indigo-600`
            : `${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400' : 'bg-white/80 border-stone-200 text-stone-400 hover:border-indigo-600 hover:text-indigo-600'} shadow-sm`
            }`}
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 transition-all" />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
