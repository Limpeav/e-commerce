import React from 'react';
import { Heart } from 'lucide-react';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  return (
    <div className="relative">
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-2xl shadow-primary/5 p-4 sm:p-8 lg:p-16 border border-stone-100 sticky top-32 overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="relative z-10 flex items-center justify-center bg-stone-50 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 h-[280px] sm:h-[400px] lg:h-[500px] transition-all duration-300">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain transform hover:scale-105 sm:hover:scale-110 transition-transform duration-700 drop-shadow-xl sm:drop-shadow-2xl"
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 lg:top-12 lg:right-12 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white shadow-lg sm:shadow-xl border border-stone-100 flex items-center justify-center group/btn transition-all hover:scale-110 active:scale-95 z-20"
        >
          <Heart
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${isInWishlist
              ? "text-secondary fill-secondary"
              : "text-stone-300 group-hover/btn:text-secondary"
              }`}
          />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
