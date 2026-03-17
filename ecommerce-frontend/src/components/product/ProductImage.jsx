import React from 'react';
import { Heart } from 'lucide-react';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  return (
    <div className="relative font-sans">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl p-3 sm:p-5 lg:p-6 border border-stone-100 sticky top-28 overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-50 to-rose-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-70"></div>

        <div className="relative z-10 flex items-center justify-center bg-stone-50/50 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 h-[320px] sm:h-[450px] lg:h-[550px] transition-all duration-300 border border-stone-100 shadow-inner">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-700 drop-shadow-2xl mix-blend-multiply"
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className={`absolute top-6 right-6 sm:top-8 sm:right-8 lg:top-10 lg:right-10 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl sm:rounded-[1.5rem] transition-all hover:scale-110 active:scale-95 z-20 flex items-center justify-center border-2 bg-white/80 backdrop-blur-md ${isInWishlist
            ? 'border-transparent shadow-lg [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box] text-indigo-600'
            : 'border-stone-200 text-stone-400 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
            }`}
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 transition-all" />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
