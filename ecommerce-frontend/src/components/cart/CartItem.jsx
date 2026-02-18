import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  getEffectivePrice
}) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-stone-100 p-3 sm:p-6 flex gap-3 sm:gap-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
      {/* Product Image */}
      <div className="bg-stone-50 rounded-xl sm:rounded-[2rem] p-2 sm:p-4 flex items-center justify-center w-20 h-20 sm:w-40 sm:h-40 flex-shrink-0 relative overflow-hidden">
        <img
          src={item.product.image}
          alt={item.product.title}
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <Link to={`/products/${item.product._id}`} className="font-bold text-sm sm:text-xl text-text-main hover:text-primary line-clamp-1 transition-colors tracking-tight">
            {item.product.title}
          </Link>
          <p className="font-bold text-sm sm:text-xl text-text-main ml-2 sm:ml-4 tracking-tight whitespace-nowrap">
            ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-2 sm:mb-6 text-[10px] sm:text-xs font-medium text-stone-500">
          <span className="truncate">{item.product.category}</span>
          <div className="h-1 w-1 bg-stone-300 rounded-full shrink-0"></div>
          <span className="text-green-600 font-bold whitespace-nowrap">In Stock</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-6">
          {/* Price Per Item */}
          <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-stone-50 rounded-lg border border-stone-100">
            {item.product.discountPrice && item.product.discountPrice < item.product.price ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-secondary font-bold text-xs sm:text-sm">${item.product.discountPrice.toFixed(2)}</span>
                <span className="line-through text-stone-400 text-[10px] sm:text-xs">${item.product.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-stone-500 font-medium text-xs sm:text-sm">${item.product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-4 bg-stone-50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-stone-100">
            {/* Quantity */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => {
                  if (item.quantity - 1 === 0) {
                    onRemove(item.product._id);
                  } else {
                    onUpdateQuantity(item.product._id, item.quantity - 1);
                  }
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg bg-white text-stone-500 hover:text-red-500 shadow-sm border border-stone-200 transition-all active:scale-95"
                aria-label="Decrease"
              >
                {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              <span className="w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-text-main">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg bg-primary text-white shadow-md transition-all active:scale-95"
                aria-label="Increase"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="w-px h-4 sm:h-5 bg-stone-200"></div>

            <button
              onClick={() => onRemove(item.product._id)}
              className="text-stone-400 hover:text-red-500 transition-colors p-1 sm:p-1.5 hover:bg-red-50 rounded-lg"
              title="Remove Item"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
