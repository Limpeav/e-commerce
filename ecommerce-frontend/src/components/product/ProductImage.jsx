import React from 'react';
import { Heart } from 'lucide-react';

const ProductImage = ({ product, onWishlist, isInWishlist }) => {
  return (
    <div className="relative">
      <div className="bg-white rounded-[4rem] shadow-2xl shadow-primary/5 p-8 lg:p-16 border border-stone-100 sticky top-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="relative z-10 flex items-center justify-center bg-stone-50 rounded-[3rem] p-10 h-[500px]">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-700 drop-shadow-2xl"
          />
        </div>

        {/* Wishlist Button Overlay */}
        <button
          onClick={onWishlist}
          className="absolute top-12 right-12 w-14 h-14 rounded-2xl bg-white shadow-xl border border-stone-100 flex items-center justify-center group/btn transition-all hover:scale-110 active:scale-95 z-20"
        >
          <Heart
            className={`w-6 h-6 transition-all ${isInWishlist
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
