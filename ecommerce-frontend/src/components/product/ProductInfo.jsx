import React, { useState } from 'react';
import { Star, ShoppingCart, Lock, Baby } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { getProductSizes, isClothingProduct } from '../../utils/productOptions';
import { useLanguage } from '../../context/useLanguage';
import { getLocalizedProductText } from '../../utils/productLocalization';
import { useToast } from '../../context/ToastContext';

const ProductInfo = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onLoginRequired,
  user
}) => {
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const { info } = useToast();
  const localizedProduct = getLocalizedProductText(product, language);
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const isInStock = Number(product.stock || 0) > 0;
  const sizeOptions = getProductSizes(product);
  const needsSize = isClothingProduct(product);
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div className="flex flex-col justify-center space-y-4 font-sans sm:space-y-4.5">
      {/* Category & Status */}
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1.5 text-indigo-600 border px-3 py-1 rounded-full text-[11px] font-black tracking-[0.18em] uppercase ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-100"}`}>
          <Baby className="w-4 h-4" />
          {product.category || 'Essentials'}
        </span>
        <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
        <span
          className={`text-[11px] font-black tracking-[0.18em] uppercase px-3 py-1 rounded-full border ${
            isInStock
              ? isDark
                ? "text-primary bg-primary/10 border-primary/25"
                : "text-primary-dark bg-primary/10 border-primary/25"
              : isDark
                ? "text-rose-300 bg-rose-500/10 border-rose-500/20"
                : "text-rose-700 bg-rose-50 border-rose-200"
          }`}
        >
          {isInStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-2.5">
        <h1 data-no-static-translation className={`text-2xl sm:text-[2.2rem] lg:text-[2.8rem] font-black leading-[1.05] font-display tracking-tight ${isDark ? "text-slate-50" : "text-stone-900"}`}>
          {localizedProduct.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 pt-0">
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-sm ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"}`}>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(product.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-amber-200 fill-amber-50"
                    }`}
                />
              ))}
            </div>
            <span className="ml-1 text-sm font-black text-amber-600 sm:text-base">{product.rating?.toFixed(1) || "0.0"}</span>
          </div>
          <div className={`h-5 w-px hidden sm:block ${isDark ? "bg-slate-700" : "bg-stone-200"}`}></div>
          <a href="#reviews" className={`text-sm font-bold hover:text-indigo-600 transition-colors underline underline-offset-4 flex items-center gap-2 ${isDark ? "text-slate-400 decoration-slate-700" : "text-text-muted decoration-stone-200"}`}>
            <span>{t("product.reviewCount", { count: product.numReviews || 0 })}</span>
          </a>
        </div>
      </div>

      <div className={`h-px w-full ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

      {/* Price */}
      <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
        {hasDiscount ? (
          <>
            <span className={`text-3xl sm:text-4xl lg:text-[3rem] font-black font-display tracking-tighter ${isDark ? "text-white" : "text-stone-900"}`}>
              ${discountPrice.toFixed(2)}
            </span>
            <span className={`mb-1 line-through text-lg font-bold decoration-2 sm:mb-1.5 sm:text-xl ${isDark ? "text-slate-500" : "text-stone-400"}`}>
              ${price.toFixed(2)}
            </span>
            <div className="mb-1.5 rounded-xl bg-[#FF3B30] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm shadow-[#FF3B30]/30 sm:mb-2">
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <span className={`text-3xl sm:text-4xl lg:text-[3rem] font-black font-display tracking-tighter ${isDark ? "text-white" : "text-stone-900"}`}>
            ${price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Description */}
      <div className={`prose prose-stone max-w-none rounded-[1.2rem] border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-stone-50/50 border-stone-100"}`}>
        <h3 className={`mb-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>Product Description</h3>
        <p data-no-static-translation className={`text-sm leading-relaxed font-medium sm:text-[15px] ${isDark ? "text-slate-300" : "text-stone-600"}`}>
          {localizedProduct.description}
        </p>
      </div>

      {/* Quantity & Action */}
      <div className="space-y-3 pt-1 sm:pt-2">
        {needsSize && (
          <div className="space-y-2">
            <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>Size</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {sizeOptions.map((size) => {
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 rounded-xl border text-sm font-black transition-all active:scale-95 ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-md"
                        : isDark
                          ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-primary"
                          : "border-stone-200 bg-white text-stone-700 hover:border-primary"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>Quantity</label>
        <div className="flex flex-row items-stretch gap-2 sm:gap-4">
          {/* Quantity Selector */}
          <div className={`flex shrink-0 items-center justify-between gap-1 rounded-[1.15rem] border-2 p-1.5 shadow-sm sm:gap-3 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
            <button
              onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:h-10 sm:w-10 ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-100 hover:shadow-sm"}`}
            >
              −
            </button>
            <span className={`w-9 text-center font-display text-lg font-black sm:w-14 sm:text-2xl ${isDark ? "text-white" : "text-stone-900"}`}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:h-10 sm:w-10 ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-100 hover:shadow-sm"}`}
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => {
              if (!user) {
                onLoginRequired?.();
                return;
              }

              if (needsSize && !selectedSize) {
                info(t("product.selectSize"), t("product.selectSizeMessage"));
                return;
              }

              onAddToCart({ size: selectedSize });
            }}
            className={`group relative flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[1.15rem] border-2 px-3 py-3 text-sm font-bold transition-all duration-300 active:scale-95 sm:gap-3 sm:px-4 sm:text-base ${user
              ? needsSize && !selectedSize
                ? isDark ? 'bg-slate-800 border-slate-700 text-slate-300 cursor-pointer hover:border-primary' : 'bg-stone-100 border-stone-200 text-stone-600 cursor-pointer hover:border-primary'
                : 'bg-primary border-primary text-white hover:bg-primary-dark hover:border-primary-dark shadow-[0_20px_44px_-18px_rgba(122,150,126,0.42)] cursor-pointer'
              : isDark ? 'bg-primary/15 border-primary/30 text-primary-light cursor-pointer hover:bg-primary hover:text-slate-950' : 'bg-primary/10 border-primary/25 text-primary cursor-pointer hover:bg-primary hover:text-white'
              }`}
          >
            {user ? (
              <>
                <ShoppingCart className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} />
                <span className="truncate tracking-wide">Add to Cart</span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} />
                <span className="truncate tracking-wide">Log in to Buy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
