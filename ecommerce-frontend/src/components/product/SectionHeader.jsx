import React from "react";
import { motion } from "framer-motion";

const SectionHeader = ({
  searchQuery,
  filteredProductsLength,
  displayedProductsLength = filteredProductsLength,
  selectedCategory,
}) => {
  const heading = searchQuery
    ? `Results for "${searchQuery}"`
    : selectedCategory && selectedCategory !== "All"
    ? selectedCategory
    : "Featured Products";

  const helperText = searchQuery
    ? "Showing products that match your search and selected filters."
    : "Parent-approved baby essentials with clear prices, ratings, and quick add-to-cart.";

  const itemLabel = displayedProductsLength === 1 ? "item" : "items";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Featured Products</p>
        <h2 className="text-3xl font-bold leading-tight text-text-main md:text-4xl">{heading}</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">{helperText}</p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3.5 py-2 text-xs font-semibold text-text-muted md:text-sm">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        {displayedProductsLength} {itemLabel}
        {filteredProductsLength > displayedProductsLength ? ` shown of ${filteredProductsLength}` : ""}
      </div>
    </motion.div>
  );
};

export default SectionHeader;
