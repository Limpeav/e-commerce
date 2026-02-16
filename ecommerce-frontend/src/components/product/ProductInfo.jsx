import React from "react";
import { Lock, RotateCcw, ShoppingCart, Shield, Star, Truck } from "lucide-react";
import { useFlyToCart } from "../../context/FlyToCartContext";

const ProductInfo = ({ product, quantity, setQuantity, onAddToCart, user, imageRef }) => {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const availableStock = Number(product.stock || 0);
  const inStock = availableStock > 0;
  const canIncreaseQuantity = quantity < availableStock;
  const canAddToCart = Boolean(user) && inStock;
  const { flyToCart } = useFlyToCart();

  const handleAdd = () => {
    if (!canAddToCart) return;
    flyToCart(imageRef?.current);
    onAddToCart();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-primary/14 bg-white/96 p-3.5 shadow-sm md:p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
          {product.category || "Baby"}
        </span>
        <span className={`text-xs font-semibold ${inStock ? "text-green-600" : "text-red-500"}`}>
          {inStock ? `${availableStock} in stock` : "Out of stock"}
        </span>
      </div>

      <div>
        <h1 className="mb-2 text-2xl font-bold leading-tight text-text-main md:text-3xl">{product.title || product.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < Math.floor(product.rating || 0) ? "fill-secondary text-secondary" : "text-primary/20"
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-text-main">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-text-muted">({product.numReviews || 0} reviews)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2.5">
        {hasDiscount ? (
          <>
            <span className="font-display text-3xl font-bold text-text-main">${product.discountPrice.toFixed(2)}</span>
            <span className="text-lg text-text-muted/70 line-through">${product.price.toFixed(2)}</span>
            <span className="rounded-md bg-blue-soft px-2 py-1 text-xs font-semibold text-secondary">Save {discountPercent}%</span>
          </>
        ) : (
          <span className="font-display text-3xl font-bold text-text-main">${product.price.toFixed(2)}</span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-text-muted md:text-base">{product.description}</p>

      <div className="space-y-3 border-t border-primary/12 pt-3">
        <div className="flex items-center gap-3">
          <span className="min-w-14 text-sm font-semibold text-text-main">Qty</span>
          <div className="inline-flex items-center gap-1 rounded-xl border border-primary/20 p-1">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-white text-text-main transition-colors hover:bg-primary/10"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-semibold text-text-main">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(availableStock || 1, quantity + 1))}
              disabled={!canIncreaseQuantity}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-white text-text-main transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAddToCart}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
            canAddToCart ? "bg-primary text-text-main hover:bg-primary-hover" : "cursor-not-allowed bg-primary/10 text-primary/50"
          }`}
        >
          {user ? (
            inStock ? (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Out of Stock
              </>
            )
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Login to Buy
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs text-text-muted sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg bg-blue-soft/55 px-3 py-2">
          <Truck className="h-4 w-4 text-primary" />
          Free shipping
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-soft/55 px-3 py-2">
          <Shield className="h-4 w-4 text-primary" />
          Secure payment
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-soft/55 px-3 py-2">
          <RotateCcw className="h-4 w-4 text-primary" />
          Easy returns
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
