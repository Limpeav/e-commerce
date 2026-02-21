import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // Empty Wishlist State
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center py-20 px-4 sm:px-6 pb-24 md:pb-20 font-sans">
        <div className="text-center max-w-lg mx-auto bg-white p-8 sm:p-16 rounded-3xl sm:rounded-[4rem] border border-stone-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

          <div className="relative mb-8 sm:mb-10">
            <div className="bg-stone-50 w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-stone-100">
              <Heart className="w-10 h-10 sm:w-14 sm:h-14 text-primary/20" />
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
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl font-bold text-sm shadow-xl transform hover:-translate-y-1 transition-all duration-300 active:scale-95 border-[2px] border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]"
          >
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
              Start Shopping
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Wishlist with Items
  return (
    <div className="min-h-screen bg-bg-base py-6 sm:py-12 pt-24 sm:pt-24 md:pt-32 pb-20 md:pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-primary font-bold text-xs uppercase tracking-wide">My Wishlist</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-main mb-2 tracking-tight font-display">Saved Items</h1>
          <p className="text-text-muted font-bold text-xs sm:text-sm flex items-center gap-2">
            <span>{wishlist.length} {wishlist.length === 1 ? "item" : "items"}</span>
            <div className="w-1 h-1 bg-stone-300 rounded-full"></div>
            <span>saved for later</span>
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {wishlist.map((product) => (
            <div
              key={product._id}
              className="relative bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-stone-100 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 group flex flex-col"
            >
              {/* Product Image */}
              <Link to={`/products/${product._id}`} className="block relative bg-stone-50 rounded-[1.2rem] sm:rounded-[1.5rem] p-4 sm:p-6 aspect-square mb-3 sm:mb-4 overflow-hidden">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(product._id);
                    }}
                    className="bg-white/90 backdrop-blur-sm p-2.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm border border-white hover:bg-red-50 hover:text-red-500 transition-all text-stone-300 transform active:scale-95"
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
                  <span className="bg-white/90 backdrop-blur-sm text-text-main text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border border-white shadow-sm">
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
                    <span className="text-[8px] sm:text-[10px] text-stone-400 font-bold uppercase tracking-wide mb-0.5 sm:mb-1">Price</span>
                    <span className="text-base sm:text-xl font-black text-text-main tracking-tight font-display">
                      ${product.price ? product.price.toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wide border ${product.stock > 0
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-red-50 text-red-500 border-red-100"
                    }`}>
                    {product.stock > 0 ? "Stock" : "Sold"}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-sm shadow-sm transition-all duration-300 group/btn ${product.stock > 0
                    ? "bg-primary text-white hover:bg-primary-dark hover:shadow-md active:scale-95"
                    : "bg-stone-50 text-stone-300 cursor-not-allowed border border-stone-100"
                    }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>{product.stock > 0 ? "Add to Cart" : "Sold Out"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold text-sm bg-white px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all border border-stone-100 active:scale-95">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
