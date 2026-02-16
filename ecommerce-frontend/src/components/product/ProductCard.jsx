import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Heart, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useFlyToCart } from "../../context/FlyToCartContext";

const ProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
  user,
  variants
}) => {
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const imageRef = useRef(null);
  const { flyToCart } = useFlyToCart();

  const handleAdd = () => {
    if (!user || product.stock === 0) return;
    flyToCart(imageRef.current);
    onAddToCart(product);
  };

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col rounded-2xl border border-primary/14 bg-white p-2.5 shadow-sm transition-all duration-300 hover:shadow-md md:p-3"
    >
      <div className="relative mb-2.5 aspect-[4/5] overflow-hidden rounded-xl bg-blue-soft/35">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product); }}
          className={`absolute right-2 top-2 z-30 rounded-lg border p-2 transition-colors ${isInWishlist(product._id)
              ? "bg-secondary text-white border-secondary"
              : "bg-white text-text-muted border-primary/20 hover:text-secondary"
            }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
        </button>

        <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-col gap-1">
          {product.stock === 0 ? (
            <span className="rounded-md bg-text-main px-2 py-0.5 text-[10px] font-bold text-white">
              Sold Out
            </span>
          ) : hasDiscount && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-white">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <Link to={`/products/${product._id}`} className="block h-full w-full group">
          <img
            src={product.image || product.images?.[0] || "https://via.placeholder.com/300x400?text=No+Image"}
            alt={product.name}
            className="h-full w-full object-contain p-2.5 transition-transform duration-300 ease-out group-hover:scale-105 md:p-3"
            ref={imageRef}
            onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image"; }}
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
            {product.category || "Essentials"}
          </span>
          <div className="flex items-center gap-1 rounded-md border border-primary/10 bg-white px-2 py-0.5 text-[10px] font-bold text-secondary">
            <Star className="w-3 h-3 fill-current" />
            <span>{typeof product.rating === "number" ? product.rating.toFixed(1) : "0.0"}</span>
          </div>
        </div>

        <Link to={`/products/${product._id}`} className="mb-1 block transition-colors group-hover:text-primary">
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-text-main md:text-base">
            {product.name || product.title}
          </h3>
        </Link>

        <p className="mb-1.5 line-clamp-1 text-[12px] text-text-muted">
          {product.description || "The perfect choice for your baby's comfort and style."}
        </p>

        <div className="mt-auto space-y-1.5 border-t border-primary/12 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="mb-0.5 text-[10px] text-text-muted/60 line-through">
                  ${product.price?.toFixed(2)}
                </span>
              )}
              <span className="font-display text-lg font-bold text-text-main md:text-xl">
                ${finalPrice?.toFixed(2)}
              </span>
            </div>

            <Link
              to={`/products/${product._id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover md:text-sm"
            >
              Details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={handleAdd}
            disabled={!user || product.stock === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-200 md:text-sm ${!user
              ? "bg-primary/10 text-primary/50 border-primary/10"
              : product.stock === 0
                ? "bg-text-muted/20 text-text-muted cursor-not-allowed border-text-muted/20"
                : "bg-primary text-text-main border-primary hover:bg-primary-hover"
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{user ? "Add to Cart" : "Login to Add"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
