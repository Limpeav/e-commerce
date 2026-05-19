import React from "react";
import { LoaderCircle } from "lucide-react";
import { useDarkMode } from "../../hooks";

const ProductLoadingPlaceholder = ({ title = "Loading products..." }) => {
  const [isDark] = useDarkMode();
  const cardClass = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100";
  const blockClass = isDark ? "bg-slate-800" : "bg-stone-100";

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border p-4 shadow-2xl shadow-primary/10 backdrop-blur-md sm:p-6 ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-stone-100 bg-white/70"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-2xl" />
      <div className="relative mb-6 flex items-center justify-between gap-4">
        <div>
          <div className={`mb-3 h-3 w-24 rounded-full ${blockClass} animate-pulse`} />
          <div className={`h-8 w-48 rounded-2xl ${blockClass} animate-pulse sm:w-72`} />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm font-bold text-primary shadow-lg shadow-primary/10">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {title}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-[1.5rem] border p-3 shadow-xl shadow-black/5 ${cardClass} animate-pulse`}
          >
            <div className={`aspect-square rounded-[1.25rem] ${blockClass}`} />
            <div className={`mt-4 h-3 w-20 rounded-full ${blockClass}`} />
            <div className={`mt-3 h-5 w-full rounded-xl ${blockClass}`} />
            <div className={`mt-2 h-5 w-2/3 rounded-xl ${blockClass}`} />
            <div className={`mt-5 h-8 w-24 rounded-xl ${blockClass}`} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductLoadingPlaceholder;
