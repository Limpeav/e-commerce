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
    <div className="bg-white rounded-[2.5rem] border border-stone-100 p-6 flex flex-col md:flex-row gap-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
      {/* Product Image */}
      <div className="bg-stone-50 rounded-[2rem] p-4 flex items-center justify-center md:w-40 md:h-40 flex-shrink-0 relative overflow-hidden">
        <img
          src={item.product.image}
          alt={item.product.title}
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-2 group/title">
          <Link to={`/products/${item.product._id}`} className="font-bold text-xl text-text-main hover:text-primary line-clamp-1 transition-colors tracking-tight">
            {item.product.title}
          </Link>
          <p className="font-bold text-xl text-text-main ml-4 tracking-tight">
            ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs font-medium text-stone-500">
          <span>{item.product.category}</span>
          <div className="h-1 w-1 bg-stone-300 rounded-full"></div>
          <span className="text-green-600 font-bold">In Stock</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Price Per Item */}
          <div className="inline-flex items-center px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-100">
            {item.product.discountPrice && item.product.discountPrice < item.product.price ? (
              <div className="flex items-center gap-2">
                <span className="text-secondary font-bold text-sm">${item.product.discountPrice.toFixed(2)}</span>
                <span className="line-through text-stone-400 text-xs">${item.product.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-stone-500 font-medium text-sm">${item.product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 bg-stone-50 p-1.5 rounded-xl border border-stone-100">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (item.quantity - 1 === 0) {
                    onRemove(item.product._id);
                  } else {
                    onUpdateQuantity(item.product._id, item.quantity - 1);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-500 hover:text-red-500 shadow-sm border border-stone-200 transition-all hover:scale-105 active:scale-95"
                aria-label="Decrease"
              >
                {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>
              <span className="w-6 text-center font-bold text-base text-text-main">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-md transition-all hover:scale-105 active:scale-95"
                aria-label="Increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-5 bg-stone-200"></div>

            <button
              onClick={() => onRemove(item.product._id)}
              className="text-stone-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
              title="Remove Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
