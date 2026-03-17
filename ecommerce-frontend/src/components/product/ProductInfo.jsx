import React, { useState } from 'react';
import { Star, ShoppingCart, Lock, Check, Truck, Shield, RotateCcw, Baby } from 'lucide-react';

const ProductInfo = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  user
}) => {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 flex flex-col justify-center font-sans">
      {/* Category & Status */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
          <Baby className="w-4 h-4" />
          {product.category || 'Essentials'}
        </span>
        <div className="h-1.5 w-1.5 bg-stone-300 rounded-full"></div>
        <span className="text-xs font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">In Stock</span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 leading-[1.1] font-display tracking-tight">
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
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
          <div className="h-5 w-px bg-stone-200 hidden sm:block"></div>
          <a href="#reviews" className="text-text-muted text-sm font-bold hover:text-indigo-600 transition-colors underline decoration-stone-200 underline-offset-4 flex items-center gap-2">
            <span>{product.numReviews || 0} Reviews</span>
          </a>
        </div>
      </div>

      <div className="h-px w-full bg-stone-100"></div>

      {/* Price */}
      <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
        {hasDiscount ? (
          <>
            <span className="text-4xl sm:text-5xl font-black text-stone-900 font-display tracking-tighter">
              ${product.discountPrice?.toFixed(2)}
            </span>
            <span className="text-stone-400 line-through text-xl sm:text-2xl font-bold mb-1 sm:mb-1.5 decoration-2">
              ${product.price?.toFixed(2)}
            </span>
            <div className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wide uppercase shadow-sm shadow-rose-200 mb-2 sm:mb-2.5">
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <span className="text-4xl sm:text-5xl font-black text-stone-900 font-display tracking-tighter">
            ${product.price?.toFixed(2) || "0.00"}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="prose prose-stone max-w-none bg-stone-50/50 p-5 sm:p-6 rounded-[1.5rem] border border-stone-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 mb-3">Product Description</h3>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
          {product.description}
        </p>
      </div>

      {/* Quantity & Action */}
      <div className="space-y-4 pt-4 sm:pt-6">
        <label className="text-xs font-black uppercase tracking-widest text-stone-900 block pl-1">Quantity</label>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-3 bg-white rounded-[1.25rem] p-1.5 w-full sm:w-fit border-2 border-stone-100 shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-stone-50 hover:bg-stone-100 hover:shadow-sm transition-all font-black text-xl text-stone-600 active:scale-95 border border-stone-100"
            >
              −
            </button>
            <span className="w-12 sm:w-14 text-center font-black text-xl sm:text-2xl text-stone-900 font-display">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-stone-50 hover:bg-stone-100 hover:shadow-sm transition-all font-black text-xl text-stone-600 active:scale-95 border border-stone-100"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            className={`flex-1 py-4 sm:py-0 w-full rounded-[1.25rem] font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 overflow-hidden relative group border-2 ${user
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-xl shadow-indigo-600/20'
                : 'bg-stone-100 border-stone-100 text-stone-400 cursor-not-allowed'
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
      <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8 mt-2 border-t border-stone-100">
        <div className="flex flex-col items-center gap-3 bg-white p-3 sm:p-4 rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-stone-600 text-center leading-tight">Free<br/>Shipping</span>
        </div>

        <div className="flex flex-col items-center gap-3 bg-white p-3 sm:p-4 rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-stone-600 text-center leading-tight">Secure<br/>Payment</span>
        </div>

        <div className="flex flex-col items-center gap-3 bg-white p-3 sm:p-4 rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-stone-600 text-center leading-tight">Easy<br/>Returns</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
