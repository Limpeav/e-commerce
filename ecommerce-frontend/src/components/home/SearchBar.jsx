import React, { useRef } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../hooks";

export default function SearchBar({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories }) {
    const [isDark] = useDarkMode();
    const categoriesRef = useRef(null);

    const scrollCategories = () => {
        if (!categoriesRef.current) return;
        categoriesRef.current.scrollBy({ left: 220, behavior: "smooth" });
    };

    return (
        <div className="w-full py-2.5 sm:py-4 px-3 sm:px-4 md:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                {/* Search Input Box */}
                <div className={`flex-1 w-full p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border flex items-center gap-2 transition-colors ${
                    isDark
                        ? "bg-slate-900 border-slate-700 shadow-[0_12px_36px_rgba(2,6,23,0.45)]"
                        : "bg-white border-stone-100/80 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
                }`}>
                    <div className={`flex-1 flex items-center px-3 sm:px-4 h-9 sm:h-11 rounded-lg sm:rounded-xl group transition-all ${
                        isDark
                            ? "bg-slate-800 focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/20"
                            : "bg-stone-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/5"
                    }`}>
                        <Search className={`w-4 h-4 mr-2 sm:mr-3 group-focus-within:text-primary transition-colors shrink-0 ${isDark ? "text-slate-400" : "text-stone-400"}`} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className={`bg-transparent border-none outline-none w-full font-medium text-sm ${isDark ? "text-slate-100 placeholder:text-slate-500" : "text-text-main placeholder-stone-400"}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className={`p-1 sm:p-1.5 transition-colors shrink-0 ${isDark ? "text-slate-500 hover:text-primary" : "text-stone-300 hover:text-primary"}`}>
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories Wrapper */}
                <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-none">
                    <div
                        ref={categoriesRef}
                        className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar sm:max-w-[430px] sm:gap-2 sm:pb-1 md:max-w-[510px] lg:max-w-[560px] xl:max-w-[620px]"
                    >
                        {categories.map((cat) => (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : isDark
                                        ? 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-primary/40 hover:bg-slate-800'
                                        : 'bg-white text-stone-500 border border-stone-100 hover:border-primary/30 hover:bg-stone-50'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={scrollCategories}
                        className={`shrink-0 rounded-lg border p-2.5 transition-all duration-300 active:scale-95 ${isDark
                            ? "bg-slate-900 text-slate-300 border-slate-700 hover:border-primary/40 hover:bg-slate-800"
                            : "bg-white text-text-muted border-stone-100 hover:border-primary/30 hover:bg-stone-50 hover:text-primary"
                            }`}
                        aria-label="Show more categories"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
