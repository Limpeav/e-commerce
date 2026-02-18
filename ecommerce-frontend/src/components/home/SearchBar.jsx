import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchBar({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories }) {
    return (
        <div className="w-full py-2.5 sm:py-4 px-3 sm:px-4 md:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                {/* Search Input Box */}
                <div className="flex-1 w-full bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-stone-100/80 flex items-center gap-2">
                    <div className="flex-1 flex items-center px-3 sm:px-4 h-9 sm:h-11 bg-stone-50/50 rounded-lg sm:rounded-xl group focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/5 transition-all">
                        <Search className="w-4 h-4 text-stone-400 mr-2 sm:mr-3 group-focus-within:text-primary transition-colors shrink-0" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="bg-transparent border-none outline-none w-full text-text-main placeholder-stone-400 font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-1 sm:p-1.5 text-stone-300 hover:text-primary transition-colors shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories Wrapper */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 sm:pb-1 no-scrollbar w-full">
                        {categories.map((cat) => (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white text-stone-500 border border-stone-100 hover:border-primary/30 hover:bg-stone-50'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
