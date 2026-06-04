import { normalizeProductCategory } from "../constants/productCategories";

const CATEGORY_TRANSLATION_KEYS = {
  All: "categories.all",
  Milk: "categories.milk",
  Toy: "categories.toy",
  Clothing: "categories.clothing",
  Shoes: "categories.shoes",
  "Feeding & Nursing": "categories.feedingNursing",
  "Diapering & Care": "categories.diaperingCare",
  Furniture: "categories.furniture",
  "Travel & Gear": "categories.travelGear",
  "Bath & Skin": "categories.bathSkin",
  "Play & Learn": "categories.playLearn",
};

export const getCategoryTranslationKey = (category = "") => {
  const normalizedCategory =
    category === "All" ? "All" : normalizeProductCategory(category);

  return CATEGORY_TRANSLATION_KEYS[normalizedCategory] || null;
};

export const translateCategory = (category, t) => {
  const translationKey = getCategoryTranslationKey(category);
  return translationKey ? t(translationKey) : category;
};
