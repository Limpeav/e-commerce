import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Baby,
} from "lucide-react";
import { useDarkMode } from "../../hooks";

export default function EmptyCart() {
  const [isDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Main Empty State */}
        <div
          className={`relative z-10 max-w-2xl rounded-[4rem] border p-16 text-center ${isDark ? "bg-bg-card shadow-[0_64px_128px_-40px_rgba(12,16,12,0.7)]" : "bg-bg-card shadow-[0_64px_128px_-32px_rgba(122,150,126,0.14)]"} md:p-24`}
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Animated Icon */}
          <div className="relative inline-block mb-12">
            <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-40 animate-pulse"></div>
            <div
              className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] border bg-bg-card shadow-2xl transition-transform duration-300 hover:scale-110"
              style={{ borderColor: "var(--color-border)" }}
            >
              <ShoppingBag className="w-14 h-14 text-primary" strokeWidth={1} />
            </div>
            <div
              className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-2xl border-4 bg-secondary shadow-2xl animate-bounce"
              style={{ borderColor: "var(--color-bg-card)" }}
            >
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
            className="group inline-flex items-center gap-3 rounded-xl bg-primary px-10 py-4 text-sm font-bold text-white shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark active:scale-95"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
