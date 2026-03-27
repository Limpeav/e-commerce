import { Link } from "react-router-dom";
import { useRef } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useFlyToCart } from "../../context/FlyToCartContext";
import { useDarkMode } from "../../hooks";

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

const getPricing = (product) => {
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  return {
    hasDiscount,
    basePrice: Number(product.price || 0),
    finalPrice: hasDiscount ? Number(product.discountPrice || 0) : Number(product.price || 0),
  };
};

function CompactProductCard({ product, badge, user, onAddToCart, onWishlistToggle, isInWishlist }) {
  const { hasDiscount, basePrice, finalPrice } = getPricing(product);
  const rating = typeof product.rating === "number" ? product.rating.toFixed(1) : "0.0";
  const imageRef = useRef(null);
  const { flyToCart } = useFlyToCart();
  const [isDark] = useDarkMode();

  const handleAdd = () => {
    if (!user || Number(product.stock || 0) < 1) return;
    flyToCart(imageRef.current);
    onAddToCart(product);
  };

  return (
    <article className={`relative rounded-2xl border p-2 shadow-sm ${isDark ? "border-slate-700 bg-slate-900" : "border-primary/12 bg-white"}`}>
      <div className="absolute right-2.5 top-2.5 z-10">
        <button
          type="button"
          onClick={() => onWishlistToggle(product)}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
            isInWishlist(product._id)
              ? "border-secondary bg-secondary text-white"
              : isDark
              ? "border-slate-600 bg-slate-800 text-slate-300 hover:text-secondary"
              : "border-primary/15 bg-white text-text-muted hover:text-secondary"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-3.5 w-3.5 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex items-start gap-2.5 pr-8">
        <Link to={`/products/${product._id}`} className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl p-1 md:h-16 md:w-16 ${isDark ? "bg-slate-800" : "bg-blue-soft/35"}`}>
          <img
            src={product.image || product.images?.[0] || "https://via.placeholder.com/160?text=No+Image"}
            alt={product.name || product.title}
            className="h-full w-full object-contain"
            ref={imageRef}
            onError={(event) => {
              event.target.src = "https://via.placeholder.com/160?text=No+Image";
            }}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-blue-soft/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            {badge}
          </span>

          <Link to={`/products/${product._id}`} className="mt-1 block">
            <h3 className="line-clamp-1 text-sm font-semibold text-text-main hover:text-primary">
              {product.name || product.title}
            </h3>
          </Link>

          <div className="mt-1 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? "border-slate-600 bg-slate-800 text-slate-300" : "border-primary/15 bg-white text-text-muted"}`}>
              <Star className="h-3 w-3 fill-current text-secondary" />
              {rating}
            </span>

            <div className="flex items-end gap-1">
              {hasDiscount && (
                <span className="text-[10px] font-medium text-text-muted/70 line-through">{formatPrice(basePrice)}</span>
              )}
              <span className="text-sm font-bold text-text-main md:text-base">{formatPrice(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!user || Number(product.stock || 0) < 1}
        className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${
          !user
            ? "border-primary/10 bg-primary/10 text-primary/55 cursor-pointer"
            : Number(product.stock || 0) < 1
            ? "cursor-not-allowed border-text-muted/20 bg-text-muted/20 text-text-muted"
            : isDark
            ? "border-primary bg-primary text-white hover:bg-primary-dark cursor-pointer"
            : "border-primary bg-primary text-text-main hover:bg-primary-hover cursor-pointer"
        }`}
      >
        <ShoppingBag className="h-4 w-4" />
        {user ? "Add to Cart" : "Login to Add"}
      </button>
    </article>
  );
}

export default function ProductCollections({
  bestSellers,
  newArrivals,
  user,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
}) {
  const [isDark] = useDarkMode();

  const sections = [
    {
      title: "Best Sellers",
      subtitle: "Most-loved picks by parents this week.",
      badge: "Popular",
      products: bestSellers,
    },
    {
      title: "New Arrivals",
      subtitle: "Fresh essentials added for growing babies.",
      badge: "New",
      products: newArrivals,
    },
  ];

  return (
    <section className={`rounded-3xl border p-4 md:p-5 ${isDark ? "border-slate-800 bg-slate-900 shadow-[0_22px_60px_-30px_rgba(2,6,23,0.9)]" : "border-primary/12 bg-white shadow-[0_10px_22px_rgba(116,178,226,0.12)]"}`}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Curated For You</p>
        <h2 className="mt-1 text-2xl font-bold text-text-main md:text-3xl">Best Sellers & New Arrivals</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className={`rounded-2xl border p-3 md:p-3.5 ${isDark ? "border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" : "border-primary/12 bg-gradient-to-br from-white via-blue-soft/18 to-secondary-light/18"}`}>
            <div className="mb-2">
              <div>
                <h3 className="text-base font-bold text-text-main md:text-lg">{section.title}</h3>
                <p className="line-clamp-1 text-xs text-text-muted">{section.subtitle}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {section.products.map((product) => (
                <CompactProductCard
                  key={`${section.title}-${product._id}`}
                  product={product}
                  badge={section.badge}
                  user={user}
                  onAddToCart={onAddToCart}
                  onWishlistToggle={onWishlistToggle}
                  isInWishlist={isInWishlist}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
