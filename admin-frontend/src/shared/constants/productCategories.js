export const PRODUCT_CATEGORY_OPTIONS = [
  "Milk",
  "Toy",
  "Clothing",
  "Feeding & Nursing",
  "Diapering & Care",
  "Nursery & Decor",
  "Travel & Gear",
  "Bath & Skin",
  "Play & Learn",
];

export const PRODUCT_CATEGORY_OPTIONS_WITH_ALL = [
  "All",
  ...PRODUCT_CATEGORY_OPTIONS,
];

export const PRODUCT_CATEGORY_ALIASES = {
  Milk: ["Milk", "Formula"],
  Toy: ["Toy", "Toys"],
  Clothing: ["Clothing", "Cloth", "Clothes"],
  "Feeding & Nursing": ["Feeding & Nursing", "Feeding", "Nursing"],
  "Diapering & Care": ["Diapering & Care", "Diaper", "Care"],
  "Nursery & Decor": ["Nursery & Decor", "Nursery", "Decor"],
  "Travel & Gear": ["Travel & Gear", "Travel", "Gear"],
  "Bath & Skin": ["Bath & Skin", "Bath", "Skin"],
  "Play & Learn": ["Play & Learn", "Play", "Learn"],
};

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
