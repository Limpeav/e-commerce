import { normalizeProductCategory } from "../constants/productCategories.js";
import {
  productSupportsColorOptions,
  productSupportsOptionalSizeOptions,
} from "./productOptions.js";

const EXPIRY_CATEGORIES = new Set(["Milk", "Bath & Skin"]);
const GENERAL_DETAIL_IMAGE_CATEGORIES = new Set(["Milk", "Diapering & Care"]);
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
export const MAX_PRODUCT_DETAIL_IMAGES_PER_COLOR = 5;
export const GENERAL_PRODUCT_DETAIL_IMAGES_KEY = "Product";
export const PRODUCT_DETAIL_IMAGE_SIZE_GUIDANCE =
  "For full cover: upload 1200 x 1200 px square, minimum 900 x 900 px.";

export const productSupportsExpiry = (category) =>
  EXPIRY_CATEGORIES.has(normalizeProductCategory(category));

export const productSupportsGeneralDetailImages = (category) =>
  GENERAL_DETAIL_IMAGE_CATEGORIES.has(normalizeProductCategory(category));

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
  const supportsColorOptions = productSupportsColorOptions(form);
  const supportsOptionalSizeOptions = productSupportsOptionalSizeOptions(form);
  const supportsGeneralDetailImages = productSupportsGeneralDetailImages(form.category);
  const colors = supportsColorOptions ? parseProductColorList(form.colors) : [];
  const shouldSubmitSizeStocks =
    !supportsOptionalSizeOptions || Boolean(form.trackSizeInventory);
  const colorImageEntries = colors
    .map((color) => ({
      color,
      image: String(form.colorImages?.[color] || "").trim(),
    }))
    .filter((entry) => entry.image);
  const detailImageGroups = supportsColorOptions
    ? colors
    : supportsGeneralDetailImages
      ? [GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
      : [];
  const productDetailImageEntries = detailImageGroups
    .map((groupName) => ({
      color: groupName,
      images: (Array.isArray(form.productDetailImages?.[groupName])
        ? form.productDetailImages[groupName]
        : [])
        .map((image) => String(image || "").trim())
        .filter(Boolean)
        .slice(0, MAX_PRODUCT_DETAIL_IMAGES_PER_COLOR),
    }))
    .filter((entry) => entry.images.length > 0);

  const productData = {
    title: form.title,
    price: form.price,
    discountPrice: form.discountPrice || "",
    category: normalizeProductCategory(form.category),
    description: form.description,
    stock: form.stock,
    colors: JSON.stringify(colors),
    colorImages: JSON.stringify(colorImageEntries),
    productDetailImages: JSON.stringify(productDetailImageEntries),
    sizeStocks: JSON.stringify(
      shouldSubmitSizeStocks && Array.isArray(form.sizeStocks)
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
