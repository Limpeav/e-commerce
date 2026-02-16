import React from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";

const CartItem = ({ item, onRemove, onUpdateQuantity, getEffectivePrice }) => {
  const availableStock = Number(item?.product?.stock || 0);
  const inStock = availableStock > 0;
  const atStockLimit = item.quantity >= availableStock;

  return (
    <div className="bg-white rounded-xl border border-primary/15 p-4 md:p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to={`/products/${item.product._id}`}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-blue-soft/35 border border-primary/10 p-2 flex-shrink-0"
        >
          <img
            src={item.product.image}
            alt={item.product.title}
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 mb-2">
            <Link
              to={`/products/${item.product._id}`}
              className="font-semibold text-base md:text-lg text-text-main hover:text-primary line-clamp-2"
            >
              {item.product.title}
            </Link>
            <p className="font-semibold text-text-main">
              ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
            </p>
          </div>

          <p className="text-xs text-text-muted mb-4">
            {item.product.category} • {inStock ? `${availableStock} in stock` : "Out of stock"}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 border border-primary/15 rounded-lg p-1">
              <button
                onClick={() => {
                  if (item.quantity - 1 === 0) {
                    onRemove(item.product._id);
                  } else {
                    onUpdateQuantity(item.product._id, item.quantity - 1);
                  }
                }}
                className="w-8 h-8 rounded-md text-text-main hover:bg-primary/10 transition-colors flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>

              <span className="w-8 text-center font-semibold text-text-main">{item.quantity}</span>

              <button
                onClick={() => {
                  if (!atStockLimit) {
                    onUpdateQuantity(item.product._id, item.quantity + 1);
                  }
                }}
                disabled={!inStock || atStockLimit}
                className="w-8 h-8 rounded-md text-text-main hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onRemove(item.product._id)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
