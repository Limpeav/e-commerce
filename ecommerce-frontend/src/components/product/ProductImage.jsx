import React from 'react';
import { Heart } from 'lucide-react';
import { useDarkMode } from '../../hooks';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  const [isDark] = useDarkMode();
  return (
    <div className="relative font-sans">
      <div className={`rounded-[2rem] sm:rounded-[3rem] p-3 sm:p-5 lg:p-6 border sticky top-28 overflow-hidden transition-all duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.95)]" : "bg-white border-stone-100 shadow-xl"}`}>
        <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -mr-32 -mt-32 opacity-70 ${isDark ? "bg-gradient-to-br from-indigo-900/40 to-rose-900/30" : "bg-gradient-to-br from-indigo-50 to-rose-50"}`}></div>

        <div className={`relative z-10 flex items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 h-[320px] sm:h-[450px] lg:h-[550px] transition-all duration-300 border shadow-inner ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50/50 border-stone-100"}`}>
          <img
            src={product.image}
            alt={product.title}
            className={`w-full h-full object-contain transform hover:scale-105 transition-transform duration-700 drop-shadow-2xl ${isDark ? "" : "mix-blend-multiply"}`}
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
