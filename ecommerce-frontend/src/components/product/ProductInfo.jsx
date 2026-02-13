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
    <div className="space-y-8 flex flex-col justify-center font-sans">
      {/* Category & Status */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
          <Baby className="w-4 h-4" />
          {product.category}
        </span>
        <div className="h-1 w-1 bg-stone-300 rounded-full"></div>
        <span className="text-xs font-medium text-green-600">In Stock</span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-text-main leading-tight font-display tracking-tight">
          {product.title}
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-200"
                    }`}
                />
              ))}
            </div>
            <span className="ml-2 font-bold text-text-main text-sm">{product.rating?.toFixed(1) || "0.0"}</span>
          </div>
          <span className="text-text-muted text-sm font-medium">{product.numReviews} Reviews</span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end gap-3 flex-wrap">
        {hasDiscount ? (
          <>
            <span className="text-4xl font-bold text-text-main font-display">
              ${product.discountPrice.toFixed(2)}
            </span>
            <span className="text-stone-400 line-through text-xl font-medium mb-1">
              ${product.price.toFixed(2)}
            </span>
            <div className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs font-bold mb-2">
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <span className="text-4xl font-bold text-text-main font-display">
            ${product.price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="prose prose-stone max-w-none">
        <p className="text-base text-text-muted leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Quantity & Action */}
      <div className="space-y-6 pt-6 border-t border-stone-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-1.5 w-fit border border-stone-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-stone-100 transition-all font-bold text-xl text-stone-600"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-lg text-text-main">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-stone-100 transition-all font-bold text-xl text-stone-600"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            className={`flex-1 py-4 px-8 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 transform transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-primary to-primary-light text-white overflow-hidden relative group`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            {user ? (
              <>
                <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Add to Cart</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Log in to Buy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-3 gap-4 pt-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-stone-600">Free Shipping</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-stone-600">Secure Payment</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-stone-600">Easy Returns</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
