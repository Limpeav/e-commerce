import React from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../../hooks';

const SectionHeader = ({ searchQuery, filteredProductsLength }) => {
  const [isDark] = useDarkMode();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <span className="w-8 h-[2px] bg-primary/30"></span>
          Curated Selection
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-text-main font-display tracking-tight">
          {searchQuery ? `Results for "${searchQuery}"` : "New Arrivals"}
        </h2>
        <p className="text-text-muted font-normal max-w-lg text-lg">
          {searchQuery
            ? "We found these items matching your search."
            : "Discover our latest collection of premium baby essentials."}
        </p>
      </div>

      {/* Item Count Pill */}
      <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border text-sm font-bold tracking-tight ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.8)]' : 'bg-white border-stone-100 text-text-muted shadow-sm'}`}>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        {filteredProductsLength} Exclusive Pieces
      </div>
    </motion.div>
  );
};

export default SectionHeader;
