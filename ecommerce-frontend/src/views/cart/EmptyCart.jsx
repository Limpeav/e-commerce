import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-primary/15 p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-soft flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-text-main mb-2">Your cart is empty</h1>
        <p className="text-text-muted text-sm mb-6">
          Browse products and add your favorite items to continue checkout.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 w-full bg-primary text-text-main py-3 rounded-lg font-semibold text-sm hover:bg-primary-hover transition-colors"
        >
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
