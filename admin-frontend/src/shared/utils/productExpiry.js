import { normalizeProductCategory } from "../constants/productCategories.js";

const EXPIRY_CATEGORIES = new Set(["Milk", "Bath & Skin"]);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const PRODUCT_COLOR_OPTIONS = [
  "Black",
  "White",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Cream",
  "Navy",
];

export const productSupportsExpiry = (category) =>
  EXPIRY_CATEGORIES.has(normalizeProductCategory(category));

export const getExpiryDateInputValue = (value) => {
  if (!value) return "";

  const stringValue = String(value);
  const dateOnlyValue = stringValue.slice(0, 10);
  return DATE_ONLY_PATTERN.test(dateOnlyValue) ? dateOnlyValue : "";
};

export const formatExpiryDate = (value, options = {}) => {
  const dateOnlyValue = getExpiryDateInputValue(value);
  if (!dateOnlyValue) return "";

  const [year, month, day] = dateOnlyValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat(options.locale, {
    year: "numeric",
    month: options.long ? "long" : "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const parseProductColorList = (colors = "") =>
  String(colors || "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

export const formatProductColorList = (colors = []) =>
  colors.map((color) => String(color || "").trim()).filter(Boolean).join(", ");

export const buildProductRequestData = (form, { includeImage = false } = {}) => {
  const colors = parseProductColorList(form.colors);
  const colorImageEntries = colors
    .map((color) => ({
      color,
      image: String(form.colorImages?.[color] || "").trim(),
    }))
    .filter((entry) => entry.image);

  const productData = {
    title: form.title,
    price: form.price,
    discountPrice: form.discountPrice || "",
    category: normalizeProductCategory(form.category),
    description: form.description,
    stock: form.stock,
    colors: JSON.stringify(colors),
    colorImages: JSON.stringify(colorImageEntries),
    sizeStocks: JSON.stringify(
      Array.isArray(form.sizeStocks)
        ? form.sizeStocks
            .filter((entry) => String(entry.size || "").trim())
            .map((entry) => ({
              size: String(entry.size || "").trim().toUpperCase(),
              color: String(entry.color || "").trim(),
              stock: Math.max(0, Number.parseInt(entry.stock, 10) || 0),
              reservedStock: Math.max(0, Number.parseInt(entry.reservedStock, 10) || 0),
            }))
        : []
    ),
    isNewArrival: Boolean(form.isNewArrival),
    hasProductIssue: Boolean(form.hasProductIssue),
    issueQuantity: form.hasProductIssue ? form.issueQuantity || 0 : 0,
    expiryDate: productSupportsExpiry(form.category)
      ? getExpiryDateInputValue(form.expiryDate)
      : "",
    imageUrl: form.imageUrl || "",
  };

  if (!includeImage) {
    return productData;
  }

  const formData = new FormData();
  Object.entries(productData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  if (
    typeof File !== "undefined" &&
    form.image instanceof File
  ) {
    formData.append("image", form.image);
  }

  return formData;
};
