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
    <div className={`min-h-screen flex items-center justify-center font-sans overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Main Empty State */}
        <div className={`text-center relative z-10 p-16 md:p-24 rounded-[4rem] border max-w-2xl ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_64px_128px_-40px_rgba(2,6,23,0.95)]" : "bg-white border-stone-100 shadow-[0_64px_128px_-32px_rgba(19,78,74,0.1)]"}`}>
          {/* Animated Icon */}
          <div className="relative inline-block mb-12">
            <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-40 animate-pulse"></div>
            <div className={`relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl border transform hover:scale-110 transition-transform duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-stone-100"}`}>
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
            className={`group inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-sm shadow-xl transform hover:-translate-y-1 transition-all duration-300 active:scale-95 border-[2px] border-transparent ${isDark ? "[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]" : "[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]"}`}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
              Start Shopping
            </span>
            <ArrowRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
