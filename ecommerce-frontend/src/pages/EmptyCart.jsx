import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Heart,
  ArrowRight,
} from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Main Empty State */}
        <div className="text-center mb-16">
          {/* Animated Icon */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-16 h-16 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet. Start
            shopping and find something you love!
          </p>

          {/* CTA Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
