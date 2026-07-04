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

export const CLOTHING_SIZES = BABY_CLOTHING_SIZES;

const SHOE_CATEGORY_NAMES = ["shoe", "shoes", "sneaker", "sneakers", "sandal", "sandals", "boot", "boots", "footwear"];

export const isClothingCategory = (category = "") => {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  return ["clothing", "cloth", "clothes"].includes(normalizedCategory);
};

export const isShoeProduct = (product = {}) => {
  const searchableText = `${product.category || ""} ${product.title || ""}`.toLowerCase();
  return SHOE_CATEGORY_NAMES.some((name) => searchableText.includes(name));
};

export const getProductSizes = (product = {}) => {
  const needsSize = isClothingCategory(product.category) || isShoeProduct(product);
  if (!needsSize) return [];

  const customSizes = Array.isArray(product.sizes)
    ? product.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];

  if (customSizes.length > 0) return customSizes;

  return isShoeProduct(product) ? BABY_SHOE_SIZES : BABY_CLOTHING_SIZES;
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
  if (!isClothingCategory(product?.category) && !isShoeProduct(product)) return "";

  const selectedSize = normalizeSelectedSize(size);
  if (!selectedSize) return "Please choose a size for this item.";

  const allowedSizes = getProductSizes(product).map(normalizeSelectedSize);
  if (!allowedSizes.includes(selectedSize)) {
    return `Invalid size. Choose one of: ${allowedSizes.join(", ")}.`;
  }

  return "";
};
