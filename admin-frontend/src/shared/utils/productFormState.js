import {
  formatProductColorList,
  GENERAL_PRODUCT_DETAIL_IMAGES_KEY,
  parseProductColorList,
  productSupportsExpiry,
  productSupportsGeneralDetailImages,
} from "./productExpiry";
import {
  buildDefaultSizeStocks,
  getSizeStocksTotal,
  productSupportsColorOptions,
  productSupportsOptionalSizeOptions,
} from "./productOptions";

const DETAIL_IMAGE_SCROLL_THRESHOLD = 7;
const NUMERIC_PRODUCT_FIELD_NAMES = new Set([
  "price",
  "discountPrice",
  "costPrice",
  "stock",
  "issueQuantity",
  "minOrderQuantity",
  "leadTimeDays",
]);

export const getDetailImageGridClassName = (imageCount, marginClassName = "mt-3") =>
  `${marginClassName} grid grid-cols-2 gap-2 sm:grid-cols-5 ${
    imageCount > DETAIL_IMAGE_SCROLL_THRESHOLD
      ? "max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin]"
      : ""
  }`;

export const getNextProductFormForFieldChange = (
  currentForm,
  { name, value, checked, type }
) => {
  if (type === "checkbox") {
    return { ...currentForm, [name]: checked };
  }

  if (name === "category") {
    const shouldShowColorOptions = productSupportsColorOptions({ category: value });
    const shouldShowGeneralDetailImages = productSupportsGeneralDetailImages(value);
    const shouldUseOptionalSizeInventory =
      productSupportsOptionalSizeOptions({ category: value }) &&
      productSupportsOptionalSizeOptions(currentForm) &&
      currentForm.trackSizeInventory;
    const nextColors = shouldShowColorOptions
      ? parseProductColorList(currentForm.colors)
      : [];
    const currentGeneralDetailImages = Array.isArray(
      currentForm.productDetailImages?.[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
    )
      ? currentForm.productDetailImages[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
      : [];
    const nextSizeStocks =
      shouldShowColorOptions || shouldUseOptionalSizeInventory
        ? buildDefaultSizeStocks(value, currentForm.sizeStocks, nextColors)
        : [];

    return {
      ...currentForm,
      category: value,
      colors: shouldShowColorOptions ? currentForm.colors : "",
      colorImages: shouldShowColorOptions ? currentForm.colorImages : {},
      productDetailImages: shouldShowColorOptions
        ? currentForm.productDetailImages
        : shouldShowGeneralDetailImages
          ? { [GENERAL_PRODUCT_DETAIL_IMAGES_KEY]: currentGeneralDetailImages }
          : {},
      sizeStocks: nextSizeStocks,
      trackSizeInventory: shouldUseOptionalSizeInventory,
      stock: nextSizeStocks.length > 0
        ? String(getSizeStocksTotal(nextSizeStocks))
        : currentForm.stock,
      expiryDate: productSupportsExpiry(value)
        ? currentForm.expiryDate
        : "",
    };
  }

  if (name === "colors") {
    const nextColors = parseProductColorList(value);
    const nextColorImages = {};
    const nextProductDetailImages = {};
    nextColors.forEach((color) => {
      nextColorImages[color] = currentForm.colorImages?.[color] || "";
      nextProductDetailImages[color] = Array.isArray(currentForm.productDetailImages?.[color])
        ? currentForm.productDetailImages[color]
        : [];
    });
    const nextSizeStocks = buildDefaultSizeStocks(
      currentForm.category,
      currentForm.sizeStocks,
      nextColors
    );

    return {
      ...currentForm,
      colors: value,
      colorImages: nextColorImages,
      productDetailImages: nextProductDetailImages,
      sizeStocks: nextSizeStocks,
      stock: nextSizeStocks.length > 0
        ? String(getSizeStocksTotal(nextSizeStocks))
        : currentForm.stock,
    };
  }

  if (NUMERIC_PRODUCT_FIELD_NAMES.has(name)) {
    return value === "" || /^\d*\.?\d*$/.test(value)
      ? { ...currentForm, [name]: value }
      : currentForm;
  }

  return { ...currentForm, [name]: value };
};

export const getNextProductFormForSizeStockChange = (
  currentForm,
  { size, color, value }
) => {
  const nextSizeStocks = currentForm.sizeStocks.map((entry) =>
    entry.size === size && String(entry.color || "") === String(color || "")
      ? { ...entry, stock: value }
      : entry
  );

  return {
    ...currentForm,
    trackSizeInventory: true,
    sizeStocks: nextSizeStocks,
    stock: String(getSizeStocksTotal(nextSizeStocks)),
  };
};

export const getNextProductFormForColorImageChange = (
  currentForm,
  { color, value }
) => ({
  ...currentForm,
  colorImages: {
    ...currentForm.colorImages,
    [color]: value,
  },
});

export const getNextProductFormAfterDetailImagesAdded = (
  currentForm,
  { color, imageUrls }
) => {
  const existingImages = Array.isArray(currentForm.productDetailImages?.[color])
    ? currentForm.productDetailImages[color]
    : [];

  return {
    ...currentForm,
    productDetailImages: {
      ...currentForm.productDetailImages,
      [color]: [...existingImages, ...imageUrls],
    },
  };
};

export const getNextProductFormAfterDetailImageRemoved = (
  currentForm,
  { color, imageIndex }
) => {
  const currentImages = Array.isArray(currentForm.productDetailImages?.[color])
    ? currentForm.productDetailImages[color]
    : [];

  return {
    ...currentForm,
    productDetailImages: {
      ...currentForm.productDetailImages,
      [color]: currentImages.filter((_, index) => index !== imageIndex),
    },
  };
};

export const getNextProductFormAfterColorAdded = (currentForm, color) => {
  const normalizedColor = String(color || "").trim();
  if (!normalizedColor) {
    return { nextForm: currentForm, wasAdded: false };
  }

  const currentColors = parseProductColorList(currentForm.colors);
  if (
    currentColors.some(
      (currentColor) => currentColor.toLowerCase() === normalizedColor.toLowerCase()
    )
  ) {
    return { nextForm: currentForm, wasAdded: false };
  }

  const nextColors = [...currentColors, normalizedColor];
  const nextSizeStocks = buildDefaultSizeStocks(
    currentForm.category,
    currentForm.sizeStocks,
    nextColors
  );

  return {
    wasAdded: true,
    nextForm: {
      ...currentForm,
      colors: formatProductColorList(nextColors),
      sizeStocks: nextSizeStocks,
      stock: nextSizeStocks.length > 0
        ? String(getSizeStocksTotal(nextSizeStocks))
        : currentForm.stock,
      colorImages: {
        ...currentForm.colorImages,
        [normalizedColor]: currentForm.colorImages?.[normalizedColor] || "",
      },
      productDetailImages: {
        ...currentForm.productDetailImages,
        [normalizedColor]: Array.isArray(currentForm.productDetailImages?.[normalizedColor])
          ? currentForm.productDetailImages[normalizedColor]
          : [],
      },
    },
  };
};

export const getNextProductFormAfterColorRemoved = (currentForm, color) => {
  const nextColors = parseProductColorList(currentForm.colors).filter(
    (currentColor) => currentColor.toLowerCase() !== color.toLowerCase()
  );
  const nextColorImages = { ...currentForm.colorImages };
  const nextProductDetailImages = { ...currentForm.productDetailImages };
  delete nextColorImages[color];
  delete nextProductDetailImages[color];

  const nextSizeStocks = buildDefaultSizeStocks(
    currentForm.category,
    currentForm.sizeStocks,
    nextColors
  );

  return {
    ...currentForm,
    colors: formatProductColorList(nextColors),
    sizeStocks: nextSizeStocks,
    stock: nextSizeStocks.length > 0
      ? String(getSizeStocksTotal(nextSizeStocks))
      : currentForm.stock,
    colorImages: nextColorImages,
    productDetailImages: nextProductDetailImages,
  };
};

export const getNextProductFormWithOptionalSizeInventoryEnabled = (currentForm) => {
  const nextSizeStocks = buildDefaultSizeStocks(
    currentForm.category,
    currentForm.sizeStocks,
    []
  );

  return {
    ...currentForm,
    trackSizeInventory: true,
    sizeStocks: nextSizeStocks,
    stock: String(getSizeStocksTotal(nextSizeStocks)),
  };
};

export const getNextProductFormWithOptionalSizeInventoryDisabled = (currentForm) => ({
  ...currentForm,
  stock: String(getSizeStocksTotal(currentForm.sizeStocks)),
  sizeStocks: [],
  trackSizeInventory: false,
});
