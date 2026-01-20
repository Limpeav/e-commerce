import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchBar({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories }) {
    return (
        <div className="w-full py-4 px-4 md:px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
                {/* Search Input Box */}
                <div className="flex-1 w-full bg-white p-1.5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-stone-100/80 flex items-center gap-2">
                    <div className="flex-1 flex items-center px-4 h-11 bg-stone-50/50 rounded-xl group focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/5 transition-all">
                        <Search className="w-4 h-4 text-stone-400 mr-3 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find something special for your baby..."
                            className="bg-transparent border-none outline-none w-full text-text-main placeholder-stone-400 font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-1.5 text-stone-300 hover:text-primary transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories Wrapper */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {categories.map((cat) => (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
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

