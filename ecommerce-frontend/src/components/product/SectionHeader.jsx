import React from 'react';
import { motion } from 'framer-motion';

const SectionHeader = ({ searchQuery, filteredProductsLength }) => {
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
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-white shadow-sm rounded-2xl border border-stone-100 text-sm font-bold text-text-muted tracking-tight">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        {filteredProductsLength} Exclusive Pieces
      </div>
    </motion.div>
  );
};

export default SectionHeader;
