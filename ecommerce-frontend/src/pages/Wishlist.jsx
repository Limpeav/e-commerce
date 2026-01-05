import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // Empty Wishlist State
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-20">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-500 rounded-full blur-3xl opacity-20"></div>
            <div className="relative bg-gradient-to-br from-pink-100 to-red-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-16 h-16 text-pink-500" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Wishlist is Empty
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Start adding products you love to your wishlist and never lose track
            of them!
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <ShoppingBag className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Wishlist with Items
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-pink-500 to-red-500 p-3 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
          </div>
          <p className="text-gray-600 ml-[60px]">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product._id}
              className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
            >
              {/* Remove Button */}
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-500 transition-colors" />
              </button>

              {/* Product Image */}
              <Link to={`/products/${product._id}`}>
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-48 w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                    {product.category}
                  </span>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${product.price}
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          product.stock > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-600">
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Add to Cart Button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold shadow-md transition-all duration-200 ${
                    product.stock > 0
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
