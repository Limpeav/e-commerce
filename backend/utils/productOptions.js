import { normalizeProductCategory } from "./productCategories.js";

export const BABY_CLOTHING_SIZES = [
  "NB",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2T",
  "3T",
  "4T",
];

export const BABY_SHOE_SIZES = [
  "EU 16",
  "EU 17",
  "EU 18",
  "EU 19",
  "EU 20",
  "EU 21",
  "EU 22",
  "EU 23",
  "EU 24",
  "EU 25",
  "EU 26",
];

export const BABY_DIAPERING_CARE_SIZES = [
  "NB",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export const CLOTHING_SIZES = BABY_CLOTHING_SIZES;

const SHOE_CATEGORY_NAMES = ["shoe", "shoes", "sneaker", "sneakers", "sandal", "sandals", "boot", "boots", "footwear"];
const COLOR_ONLY_STOCK_SIZE = "ONE SIZE";

export const isClothingCategory = (category = "") => {
  return normalizeProductCategory(category) === "Clothing";
};

export const isDiaperingCareCategory = (category = "") =>
  normalizeProductCategory(category) === "Diapering & Care";

export const isShoeProduct = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  const searchableText = `${product.category || ""} ${product.title || ""}`.toLowerCase();
  return category === "Shoes" || SHOE_CATEGORY_NAMES.some((name) => searchableText.includes(name));
};

export const getProductSizes = (product = {}) => {
  const sizeStockSizes = Array.isArray(product.sizeStocks)
    ? [
        ...new Set(
          product.sizeStocks
            .map((entry) => normalizeSelectedSize(entry.size))
            .filter((size) => size && size !== COLOR_ONLY_STOCK_SIZE)
        ),
      ]
    : [];

  if (sizeStockSizes.length > 0) return sizeStockSizes;

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => normalizeSelectedSize(size)).filter(Boolean)
    : [];

  if (customSizes.length > 0) return customSizes;

  if (isShoeProduct(product)) return BABY_SHOE_SIZES;
  if (isClothingCategory(product.category)) return BABY_CLOTHING_SIZES;

  return [];
};

export const normalizeSelectedSize = (size = "") => String(size || "").trim().toUpperCase();

export const parseProductColorsPayload = (value) => {
  if (value === null || value === undefined) return [];

  let rawColors = value;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      rawColors = JSON.parse(trimmedValue);
    } catch {
      rawColors = trimmedValue.split(",");
    }
  }

  if (!Array.isArray(rawColors)) return [];

  const uniqueColors = new Map();
  rawColors.forEach((color) => {
    const label =
      typeof color === "object" && color !== null
        ? color.name || color.label || color.value
        : color;
    const normalizedLabel = String(label || "").trim();
    if (!normalizedLabel) return;

    uniqueColors.set(normalizedLabel.toLowerCase(), normalizedLabel);
  });

  return [...uniqueColors.values()];
};

export const getProductColors = (product = {}) =>
  Array.isArray(product.colors)
    ? product.colors.map((color) => String(color || "").trim()).filter(Boolean)
    : [];

export const normalizeSelectedColor = (color = "") => String(color || "").trim();

export const parseProductColorImagesPayload = (value, colors = []) => {
  if (value === null || value === undefined) return [];

  let rawColorImages = value;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      rawColorImages = JSON.parse(trimmedValue);
    } catch {
      return [];
    }
  }

  const allowedColors = parseProductColorsPayload(colors);
  const allowedColorMap = new Map(
    allowedColors.map((color) => [color.toLowerCase(), color])
  );
  const colorImages = Array.isArray(rawColorImages)
    ? rawColorImages
    : Object.entries(rawColorImages || {}).map(([color, image]) => ({ color, image }));

  const uniqueColorImages = new Map();
  colorImages.forEach((entry) => {
    const rawColor =
      typeof entry === "object" && entry !== null
        ? entry.color || entry.name || entry.label
        : "";
    const image =
      typeof entry === "object" && entry !== null
        ? String(entry.image || entry.imageUrl || "").trim()
        : "";
    const normalizedColor = normalizeSelectedColor(rawColor);
    if (!normalizedColor || !image) return;

    const colorKey = normalizedColor.toLowerCase();
    const canonicalColor = allowedColorMap.get(colorKey);
    if (!canonicalColor) return;

    uniqueColorImages.set(colorKey, {
      color: canonicalColor,
      image,
    });
  });

  return [...uniqueColorImages.values()];
};

export const parseProductDetailImagesPayload = (value, colors = []) => {
  if (value === null || value === undefined) return [];

  let rawProductDetailImages = value;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      rawProductDetailImages = JSON.parse(trimmedValue);
    } catch {
      return [];
    }
  }

  const allowedColors = parseProductColorsPayload(colors);
  const allowedColorMap = new Map(
    allowedColors.map((color) => [color.toLowerCase(), color])
  );
  const shouldRestrictToAllowedColors = allowedColors.length > 0;
  const productDetailImages = Array.isArray(rawProductDetailImages)
    ? rawProductDetailImages
    : Object.entries(rawProductDetailImages || {}).map(([color, images]) => ({
        color,
        images,
      }));

  const uniqueDetailImages = new Map();
  productDetailImages.forEach((entry) => {
    const rawColor =
      typeof entry === "object" && entry !== null
        ? entry.color || entry.name || entry.label
        : "";
    const normalizedColor = normalizeSelectedColor(rawColor);
    if (!normalizedColor) return;

    const colorKey = normalizedColor.toLowerCase();
    const canonicalColor = shouldRestrictToAllowedColors
      ? allowedColorMap.get(colorKey)
      : normalizedColor;
    if (!canonicalColor) return;

    const rawImages =
      typeof entry === "object" && entry !== null
        ? entry.images || entry.detailImages || entry.imageUrls || []
        : [];
    const images = (Array.isArray(rawImages) ? rawImages : [rawImages])
      .map((image) => String(image || "").trim())
      .filter(Boolean);
    if (images.length === 0) return;

    uniqueDetailImages.set(colorKey, {
      color: canonicalColor,
      images,
    });
  });

  return [...uniqueDetailImages.values()];
};

export const getProductImageForColor = (product = {}, color = "") => {
  const selectedColor = normalizeSelectedColor(color).toLowerCase();
  if (!selectedColor) return product?.image || "";

  const colorImage = Array.isArray(product?.colorImages)
    ? product.colorImages.find(
        (entry) => normalizeSelectedColor(entry?.color).toLowerCase() === selectedColor
      )
    : null;

  return colorImage?.image || product?.image || "";
};

export const getProductDetailImagesForColor = (product = {}, color = "") => {
  const selectedColor = normalizeSelectedColor(color).toLowerCase();
  if (!selectedColor) return [];

  const detailImages = Array.isArray(product?.productDetailImages)
    ? product.productDetailImages.find(
        (entry) => normalizeSelectedColor(entry?.color).toLowerCase() === selectedColor
      )
    : null;

  return Array.isArray(detailImages?.images)
    ? detailImages.images
        .map((image) => String(image || "").trim())
        .filter(Boolean)
    : [];
};

export const validateProductColor = (product, color) => {
  const allowedColors = getProductColors(product);
  if (allowedColors.length === 0) return "";

  const selectedColor = normalizeSelectedColor(color);
  if (!selectedColor) return "Please choose a color for this item.";

  const normalizedAllowedColors = allowedColors.map((allowedColor) =>
    allowedColor.toLowerCase()
  );
  if (!normalizedAllowedColors.includes(selectedColor.toLowerCase())) {
    return `Invalid color. Choose one of: ${allowedColors.join(", ")}.`;
  }

  return "";
};

export const validateProductSize = (product, size) => {
  const allowedSizes = getProductSizes(product).map(normalizeSelectedSize);
  if (allowedSizes.length === 0) return "";

  const selectedSize = normalizeSelectedSize(size);
  if (!selectedSize) return "Please choose a size for this item.";

  if (!allowedSizes.includes(selectedSize)) {
    return `Invalid size. Choose one of: ${allowedSizes.join(", ")}.`;
  }

  return "";
};
