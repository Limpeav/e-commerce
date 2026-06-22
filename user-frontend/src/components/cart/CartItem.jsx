import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { getLocalizedProductText } from '../../utils/productLocalization';
import { translateCategory } from '../../utils/translationKeys';

const CartItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  getEffectivePrice
}) => {
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProductText(item.product, language);

  return (
    <div className={`rounded-2xl sm:rounded-[2.5rem] border p-3 sm:p-6 flex gap-3 sm:gap-8 transition-all duration-500 group ${isDark ? "bg-slate-900 border-slate-800 hover:shadow-[0_24px_60px_-28px_rgba(79,70,229,0.4)]" : "bg-white border-stone-100 hover:shadow-2xl hover:shadow-primary/5"}`}>
      {/* Product Image */}
      <div className={`rounded-xl sm:rounded-[2rem] p-2 sm:p-4 flex items-center justify-center w-20 h-20 sm:w-40 sm:h-40 flex-shrink-0 relative overflow-hidden ${isDark ? "bg-slate-800" : "bg-stone-50"}`}>
        <img
          src={item.product.image}
          alt={localizedProduct.title}
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <Link data-no-static-translation to={`/products/${item.product._id}`} className="font-bold text-sm sm:text-xl text-text-main hover:text-primary line-clamp-1 transition-colors tracking-tight">
            {localizedProduct.title}
          </Link>
          <p className="font-bold text-sm sm:text-xl text-text-main ml-2 sm:ml-4 tracking-tight whitespace-nowrap">
            ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className={`flex items-center gap-2 mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium ${isDark ? "text-slate-400" : "text-stone-500"}`}>
          <span className="truncate">{translateCategory(item.product.category, t)}</span>
          <div className={`h-1 w-1 rounded-full shrink-0 ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
          <span className="text-green-600 font-bold whitespace-nowrap">{t("cart.inStock")}</span>
          {item.size && (
            <>
              <div className={`h-1 w-1 rounded-full shrink-0 ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
              <span className="font-bold whitespace-nowrap">{t("cart.sizeValue", { size: item.size })}</span>
            </>
          )}
        </div>

        {/* Product Description */}
        <p data-no-static-translation className={`text-[10px] sm:text-xs line-clamp-3 mb-3 sm:mb-4 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
          {localizedProduct.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-6">
          {/* Price Per Item */}
          <div className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
            {item.product.discountPrice && item.product.discountPrice < item.product.price ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-secondary font-bold text-xs sm:text-sm">${item.product.discountPrice.toFixed(2)}</span>
                <span className="line-through text-stone-400 text-[10px] sm:text-xs">${item.product.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className={`font-medium text-xs sm:text-sm ${isDark ? "text-slate-300" : "text-stone-500"}`}>${item.product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Controls */}
          <div className={`flex items-center gap-2 sm:gap-4 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
            {/* Quantity */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => {
                  if (item.quantity - 1 === 0) {
                    onRemove(item.product._id, { size: item.size });
                  } else {
                    onUpdateQuantity(item.product._id, item.quantity - 1, { size: item.size });
                  }
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg shadow-sm border transition-all active:scale-95 ${isDark ? "bg-slate-900 border-slate-600 text-slate-300 hover:text-red-400" : "bg-white border-stone-200 text-stone-500 hover:text-red-500"}`}
                aria-label={t("cart.decrease")}
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className="w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-text-main">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1, { size: item.size })}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg bg-primary text-white shadow-md transition-all active:scale-95"
                aria-label={t("cart.increase")}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className={`w-px h-4 sm:h-5 ${isDark ? "bg-slate-700" : "bg-stone-200"}`}></div>

            <button
              onClick={() => onRemove(item.product._id, { size: item.size })}
              className={`transition-colors p-1 sm:p-1.5 rounded-lg ${isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" : "text-stone-400 hover:text-red-500 hover:bg-red-50"}`}
              title={t("cart.removeItem")}
              aria-label={t("cart.removeItem")}
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
