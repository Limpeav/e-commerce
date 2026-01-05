import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  Check,
  Lock,
  AlertCircle,
} from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/api/products/${id}`)
      .then((res) => res.json())
      .then(setProduct);
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      // Show login prompt
      setShowLoginPrompt(true);
      // Hide prompt and redirect after delay
      setTimeout(() => {
        setShowLoginPrompt(false);
        navigate("/login");
      }, 2000);
      return;
    }

    // User is logged in, add to cart
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = () => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => {
        setShowLoginPrompt(false);
        navigate("/login");
      }, 2000);
      return;
    }
    // Add wishlist functionality here
    alert("Added to wishlist!");
  };

  if (!product)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );

  const rating = (Math.random() * 2 + 3).toFixed(1);
  const reviewCount = Math.floor(Math.random() * 500) + 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Login Required Alert */}
      {showLoginPrompt && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-amber-400">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold text-lg">Login Required!</p>
              <p className="text-sm text-amber-100">
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100 sticky top-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-6">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-96 object-contain transform hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleWishlist}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${
                  user
                    ? "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                }`}
              >
                {user ? (
                  <>
                    <Heart className="w-5 h-5" />
                    Add to Wishlist
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Login to Add Wishlist
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            {/* Login Warning for Non-Logged Users */}
            {!user && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-900 font-bold text-sm">
                    Login Required
                  </p>
                  <p className="text-amber-700 text-xs">
                    Please{" "}
                    <Link to="/login" className="underline font-semibold">
                      login
                    </Link>{" "}
                    to add items to your cart
                  </p>
                </div>
              </div>
            )}

            {/* Category Badge */}
            <div>
              <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                {product.category}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-700 font-semibold">{rating}</span>
              <span className="text-gray-500">({reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-gray-900">
                  ${product.price}
                </span>
                <span className="text-gray-500 line-through text-xl">
                  ${(product.price * 1.3).toFixed(2)}
                </span>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Save 23%
                </span>
              </div>
              <p className="text-green-600 font-medium mt-2 flex items-center gap-2">
                <Check className="w-5 h-5" />
                In Stock - Ready to Ship
              </p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm font-bold text-gray-700"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-bold text-xl text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm font-bold text-gray-700"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  Total:{" "}
                  <span className="font-bold text-gray-900 text-xl">
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transform transition-all duration-200 flex items-center justify-center gap-3 ${
                addedToCart
                  ? "bg-green-500 text-white"
                  : user
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-2xl hover:scale-105"
                  : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-2xl hover:scale-105"
              }`}
            >
              {addedToCart ? (
                <>
                  <Check className="w-6 h-6" />
                  Added to Cart!
                </>
              ) : user ? (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  Add to Cart
                </>
              ) : (
                <>
                  <Lock className="w-6 h-6" />
                  Login to Add to Cart
                </>
              )}
            </button>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Free Shipping
                </p>
                <p className="text-xs text-gray-500 mt-1">On orders over $50</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Secure Payment
                </p>
                <p className="text-xs text-gray-500 mt-1">100% protected</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Easy Returns
                </p>
                <p className="text-xs text-gray-500 mt-1">30-day guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
