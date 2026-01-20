import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Baby,
} from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center font-sans overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Main Empty State */}
        <div className="text-center relative z-10 bg-white shadow-[0_64px_128px_-32px_rgba(19,78,74,0.1)] p-16 md:p-24 rounded-[4rem] border border-stone-100 max-w-2xl">
          {/* Animated Icon */}
          <div className="relative inline-block mb-12">
            <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative bg-white w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-stone-100 transform hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-14 h-14 text-primary" strokeWidth={1} />
            </div>
            <div className="absolute -top-4 -right-4 bg-secondary w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce border-4 border-white">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-6 font-display tracking-tight leading-tight">
            Your cart is empty
          </h1>
          <p className="text-lg text-text-muted mb-10 max-w-lg mx-auto leading-relaxed">
            Looks like you haven't added anything to your cart yet. <br className="hidden md:block" />
            Start shopping to find the best essentials for your baby.
          </p>

          {/* CTA Button */}
          <Link
            to="/"
            className="group relative inline-flex items-center gap-3 bg-text-main text-white px-10 py-4 rounded-xl font-bold text-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95"
          >
            <span className="relative z-10">Start Shopping</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
