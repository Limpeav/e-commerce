import { normalizeProductCategory } from "./productCategories.js";

const EXPIRY_CATEGORIES = new Set(["Milk", "Bath & Skin"]);
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const productSupportsExpiry = (category) =>
  EXPIRY_CATEGORIES.has(normalizeProductCategory(category));

export const parseProductExpiryDate = (value, category) => {
  if (!productSupportsExpiry(category)) {
    return { value: null };
  }

  const stringValue = String(value || "").trim();
  if (!stringValue) {
    return { value: null };
  }

  const match = DATE_ONLY_PATTERN.exec(stringValue);
  if (!match) {
    return { error: "Expiry date must use YYYY-MM-DD format" };
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: "Expiry date is invalid" };
  }

  return { value: date };
};
