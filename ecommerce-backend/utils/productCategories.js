export const PRODUCT_CATEGORY_ALIASES = {
  Milk: ["Milk", "Formula"],
  Clothing: ["Clothing", "Cloth", "Clothes"],
  Shoes: ["Shoes", "Shoe", "Footwear", "Sneakers", "Sandals", "Boots"],
  "Feeding & Nursing": ["Feeding & Nursing", "Feeding", "Nursing"],
  "Diapering & Care": ["Diapering & Care", "Diaper", "Care"],
  Furniture: ["Furniture", "Nursery & Decor", "Nursery", "Decor", "Decore"],
  "Travel & Gear": ["Travel & Gear", "Travel", "Gear"],
  "Bath & Skin": ["Bath & Skin", "Bath", "Skin"],
};

export const PRODUCT_CATEGORY_OPTIONS = Object.keys(PRODUCT_CATEGORY_ALIASES);
export const REMOVED_PRODUCT_CATEGORIES = ["Toy", "Toys", "Play & Learn", "Play", "Learn"];

const CATEGORY_NORMALIZATION_MAP = Object.entries(PRODUCT_CATEGORY_ALIASES).reduce(
  (result, [canonicalCategory, aliases]) => {
    aliases.forEach((alias) => {
      result[alias.toLowerCase()] = canonicalCategory;
    });

    return result;
  },
  {}
);

export const normalizeProductCategory = (category = "") => {
  const trimmedCategory = String(category || "").trim();
  if (!trimmedCategory) return "";

  return CATEGORY_NORMALIZATION_MAP[trimmedCategory.toLowerCase()] || trimmedCategory;
};

export const isRemovedProductCategory = (category = "") =>
  REMOVED_PRODUCT_CATEGORIES.some(
    (removedCategory) =>
      removedCategory.toLowerCase() === String(category || "").trim().toLowerCase()
  );

export const isAllowedProductCategory = (category = "") => {
  const normalizedCategory = normalizeProductCategory(category);
  return (
    Boolean(normalizedCategory) &&
    PRODUCT_CATEGORY_OPTIONS.includes(normalizedCategory) &&
    !isRemovedProductCategory(normalizedCategory)
  );
};

export const getProductCategoryLookupValues = (category = "") => {
  const normalizedCategory = normalizeProductCategory(category);
  if (!normalizedCategory) return [];

  return [
    ...new Set([
      normalizedCategory,
      ...(PRODUCT_CATEGORY_ALIASES[normalizedCategory] || []),
    ]),
  ];
};
