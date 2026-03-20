import React, { useState } from 'react';
import { Star, ShoppingCart, Lock, Check, Truck, Shield, RotateCcw, Baby } from 'lucide-react';
import { useDarkMode } from '../../hooks';

const ProductInfo = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  user
}) => {
  const [isDark] = useDarkMode();
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 flex flex-col justify-center font-sans">
      {/* Category & Status */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 text-indigo-600 border px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-100"}`}>
          <Baby className="w-4 h-4" />
          {product.category || 'Essentials'}
        </span>
        <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
        <span className={`text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-full border ${isDark ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-100"}`}>In Stock</span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-4">
        <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] font-display tracking-tight ${isDark ? "text-slate-50" : "text-stone-900"}`}>
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"}`}>
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
            <span className="ml-1 font-black text-amber-600 text-sm sm:text-base">{product.rating?.toFixed(1) || "0.0"}</span>
          </div>
          <div className={`h-5 w-px hidden sm:block ${isDark ? "bg-slate-700" : "bg-stone-200"}`}></div>
          <a href="#reviews" className={`text-sm font-bold hover:text-indigo-600 transition-colors underline underline-offset-4 flex items-center gap-2 ${isDark ? "text-slate-400 decoration-slate-700" : "text-text-muted decoration-stone-200"}`}>
            <span>{product.numReviews || 0} Reviews</span>
          </a>
        </div>
      </div>

      <div className={`h-px w-full ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

      {/* Price */}
      <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
        {hasDiscount ? (
          <>
            <span className={`text-4xl sm:text-5xl font-black font-display tracking-tighter ${isDark ? "text-white" : "text-stone-900"}`}>
              ${product.discountPrice?.toFixed(2)}
            </span>
            <span className={`line-through text-xl sm:text-2xl font-bold mb-1 sm:mb-1.5 decoration-2 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
              ${product.price?.toFixed(2)}
            </span>
            <div className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wide uppercase shadow-sm shadow-rose-200 mb-2 sm:mb-2.5">
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <span className={`text-4xl sm:text-5xl font-black font-display tracking-tighter ${isDark ? "text-white" : "text-stone-900"}`}>
            ${product.price?.toFixed(2) || "0.00"}
          </span>
        )}
      </div>

      {/* Description */}
      <div className={`prose prose-stone max-w-none p-5 sm:p-6 rounded-[1.5rem] border shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-stone-50/50 border-stone-100"}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-slate-100" : "text-stone-900"}`}>Product Description</h3>
        <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? "text-slate-300" : "text-stone-600"}`}>
          {product.description}
        </p>
      </div>

      {/* Quantity & Action */}
      <div className="space-y-4 pt-4 sm:pt-6">
        <label className={`text-xs font-black uppercase tracking-widest block pl-1 ${isDark ? "text-slate-100" : "text-stone-900"}`}>Quantity</label>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Quantity Selector */}
          <div className={`flex items-center justify-between sm:justify-start gap-4 sm:gap-3 rounded-[1.25rem] p-1.5 w-full sm:w-fit border-2 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className={`w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all font-black text-xl active:scale-95 border ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-100 hover:shadow-sm"}`}
            >
              −
            </button>
            <span className={`w-12 sm:w-14 text-center font-black text-xl sm:text-2xl font-display ${isDark ? "text-white" : "text-stone-900"}`}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className={`w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all font-black text-xl active:scale-95 border ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-100 hover:shadow-sm"}`}
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            className={`flex-1 py-4 sm:py-0 w-full rounded-[1.25rem] font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 overflow-hidden relative group border-2 ${user
              ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-xl shadow-indigo-600/20'
              : isDark ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-stone-100 border-stone-100 text-stone-400 cursor-not-allowed'
              }`}
          >
            {user ? (
              <>
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                <span className="tracking-wide">Add to Cart</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                <span className="tracking-wide">Log in to Buy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Value Props */}
      <div className={`grid grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8 mt-2 border-t ${isDark ? "border-slate-800" : "border-stone-100"}`}>
        <div className={`flex flex-col items-center gap-3 p-3 sm:p-4 rounded-[1.5rem] border shadow-sm hover:shadow-md transition-shadow ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wide text-center leading-tight ${isDark ? "text-slate-300" : "text-stone-600"}`}>Free<br />Shipping</span>
        </div>

        <div className={`flex flex-col items-center gap-3 p-3 sm:p-4 rounded-[1.5rem] border shadow-sm hover:shadow-md transition-shadow ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wide text-center leading-tight ${isDark ? "text-slate-300" : "text-stone-600"}`}>Secure<br />Payment</span>
        </div>

        <div className={`flex flex-col items-center gap-3 p-3 sm:p-4 rounded-[1.5rem] border shadow-sm hover:shadow-md transition-shadow ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wide text-center leading-tight ${isDark ? "text-slate-300" : "text-stone-600"}`}>Easy<br />Returns</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
