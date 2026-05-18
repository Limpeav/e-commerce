import { useWishlist } from "../../context/useWishlist";
import { useCart } from "../../context/useCart";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useDarkMode } from "../../hooks";
import { isClothingProduct } from "../../utils/productOptions";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isDark] = useDarkMode();

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // Empty Wishlist State
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

          <div
            className={`relative z-10 mx-auto max-w-lg overflow-hidden rounded-3xl border p-8 text-center shadow-2xl sm:rounded-[4rem] sm:p-16 ${isDark ? "bg-bg-card shadow-[0_34px_90px_-28px_rgba(12,16,12,0.68)]" : "bg-bg-card shadow-[0_34px_90px_-28px_rgba(122,150,126,0.18)]"}`}
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

            <div className="relative mb-8 sm:mb-10">
              <div
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border bg-[color:var(--color-surface-soft)] shadow-inner sm:h-32 sm:w-32 sm:rounded-[2.5rem]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Heart className="h-10 w-10 text-primary/30 sm:h-14 sm:w-14" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-main mb-4 sm:mb-6 font-display tracking-tight leading-tight">
              Your wishlist is empty
            </h2>
            <p className="text-base sm:text-lg text-text-muted mb-8 sm:mb-10 max-w-lg mx-auto leading-relaxed px-2 sm:px-0">
              Save your favorite items here to find them easily later. <br className="hidden md:block" />
              Start exploring our collection today.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark active:scale-95 sm:px-10 sm:py-4"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Start Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Wishlist with Items
  return (
    <div className="min-h-screen bg-bg-base pt-24 pb-20 font-sans transition-colors duration-300 sm:pt-24 sm:py-12 md:pt-32 md:pb-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border bg-bg-card px-4 py-2 shadow-sm sm:mb-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-primary font-bold text-xs uppercase tracking-wide">My Wishlist</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-main mb-2 tracking-tight font-display">Saved Items</h1>
          <p className="text-text-muted font-bold text-xs sm:text-sm flex items-center gap-2">
            <span>{wishlist.length} {wishlist.length === 1 ? "item" : "items"}</span>
            <div className="h-1 w-1 rounded-full bg-primary/40"></div>
            <span>saved for later</span>
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {wishlist.map((product) => (
            <div
              key={product._id}
              className={`group relative flex flex-col rounded-[1.5rem] border bg-bg-card p-3 transition-all duration-300 hover:-translate-y-1 sm:rounded-[2rem] sm:p-4 ${isDark ? "hover:shadow-[0_24px_60px_-28px_rgba(12,16,12,0.5)]" : "hover:shadow-[0_24px_60px_-28px_rgba(122,150,126,0.18)]"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Product Image */}
              <Link
                to={`/products/${product._id}`}
                className="relative mb-3 block aspect-square overflow-hidden rounded-[1.2rem] bg-[color:var(--color-surface-soft)] p-4 sm:mb-4 sm:rounded-[1.5rem] sm:p-6"
              >
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(product._id);
                    }}
                    className="transform rounded-lg border bg-bg-card/90 p-2.5 text-text-muted shadow-sm backdrop-blur-sm transition-all active:scale-95 hover:bg-secondary/12 hover:text-secondary sm:rounded-xl sm:p-2"
                    style={{ borderColor: "var(--color-border)" }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category Badge Overlay */}
                <div className="absolute bottom-3 left-3 hidden sm:block">
                  <span
                    className="rounded-full border bg-bg-card/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-text-main shadow-sm backdrop-blur-sm"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {product.category}
                  </span>
                </div>
              </Link>

              {/* Product Info */}
              <div className="px-1 sm:px-2 flex-1 flex flex-col">
                <div className="mb-3 sm:mb-4 flex-1">
                  <Link to={`/products/${product._id}`}>
                    <h3 className="font-bold text-text-main text-sm sm:text-lg mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-1 hover:text-primary transition-colors tracking-tight">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="hidden sm:block text-text-muted text-xs font-medium leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex flex-col">
                    <span className="mb-0.5 text-[8px] font-bold uppercase tracking-wide text-text-muted sm:mb-1 sm:text-[10px]">Price</span>
                    <span className="text-base sm:text-xl font-black text-text-main tracking-tight font-display">
                      ${product.price ? product.price.toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div
                    className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wide sm:px-3 sm:py-1 sm:text-[10px] ${product.stock > 0 ? "bg-primary/10 text-primary" : "bg-secondary/12 text-secondary"}`}
                    style={{ borderColor: product.stock > 0 ? "color-mix(in srgb, var(--color-primary) 28%, transparent)" : "color-mix(in srgb, var(--color-secondary) 30%, transparent)" }}
                  >
                    {product.stock > 0 ? "Stock" : "Sold"}
                  </div>
                </div>

                {/* Add to Cart Button */}
                {isClothingProduct(product) && product.stock > 0 ? (
                  <Link
                    to={`/products/${product._id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[10px] font-black text-white shadow-sm transition-all duration-300 hover:bg-primary-dark hover:shadow-md active:scale-95 sm:py-3 sm:text-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 h-4" />
                    <span>Choose Size</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-sm shadow-sm transition-all duration-300 group/btn ${product.stock > 0
                      ? "bg-primary text-white hover:bg-primary-dark hover:shadow-md active:scale-95 cursor-pointer"
                      : "cursor-not-allowed border bg-[color:var(--color-surface-soft)] text-text-muted"
                      }`}
                    style={product.stock > 0 ? undefined : { borderColor: "var(--color-border)" }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 h-4" />
                    <span>{product.stock > 0 ? "Add to Cart" : "Sold Out"}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border bg-bg-card px-6 py-3 text-sm font-bold text-text-muted shadow-sm transition-all hover:border-primary/25 hover:text-primary hover:shadow-md active:scale-95"
            style={{ borderColor: "var(--color-border)" }}
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
