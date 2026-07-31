import {
  getProductCategoryLookupValues,
  normalizeProductCategory,
} from "./productCategories.js";

export const PRODUCT_EXPIRY_CATEGORIES = ["Milk", "Bath & Skin"];

const EXPIRY_CATEGORIES = new Set(PRODUCT_EXPIRY_CATEGORIES);
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parsePositiveInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const startOfUtcDay = (value = new Date()) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

export const productSupportsExpiry = (category) =>
  EXPIRY_CATEGORIES.has(normalizeProductCategory(category));

export const getProductExpiryCategoryLookupValues = () => [
  ...new Set(PRODUCT_EXPIRY_CATEGORIES.flatMap(getProductCategoryLookupValues)),
];

export const getProductExpiryAlertWindowDays = () =>
  parsePositiveInteger(process.env.PRODUCT_EXPIRY_ALERT_DAYS, 60);

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

export const getProductExpiryAlertCutoffDate = ({
  now = new Date(),
  windowDays = getProductExpiryAlertWindowDays(),
} = {}) => {
  const today = startOfUtcDay(now) || startOfUtcDay();

  return new Date(today.getTime() + windowDays * MS_PER_DAY);
};

export const getDaysUntilProductExpiry = (expiryDate, now = new Date()) => {
  const expiryDay = startOfUtcDay(expiryDate);
  const today = startOfUtcDay(now);

  if (!expiryDay || !today) {
    return null;
  }

  return Math.round((expiryDay.getTime() - today.getTime()) / MS_PER_DAY);
};

export const getProductExpiryAlertStatus = (
  product = {},
  {
    now = new Date(),
    windowDays = getProductExpiryAlertWindowDays(),
  } = {}
) => {
  if (!productSupportsExpiry(product.category) || !product.expiryDate) {
    return null;
  }

  const daysUntilExpiry = getDaysUntilProductExpiry(product.expiryDate, now);

  if (daysUntilExpiry === null || daysUntilExpiry > windowDays) {
    return null;
  }

  return {
    eligible: true,
    daysUntilExpiry,
    kind:
      daysUntilExpiry < 0
        ? "expired"
        : daysUntilExpiry === 0
          ? "expires-today"
          : "near-expiry",
  };
};

export const shouldSendProductExpiryAlert = (product = {}, options = {}) =>
  Boolean(
    getProductExpiryAlertStatus(product, options)?.eligible &&
      !product.expiryAlertSent
  );

const getExpiryDateKey = (value) => {
  const expiryDay = startOfUtcDay(value);

  return expiryDay ? expiryDay.toISOString().slice(0, 10) : "";
};

export const syncProductExpiryAlertFlag = (
  product,
  previousExpiryDate = product?.expiryDate,
  options = {}
) => {
  if (!product) {
    return product;
  }

  const previousDateKey = getExpiryDateKey(previousExpiryDate);
  const currentDateKey = getExpiryDateKey(product.expiryDate);
  const dateChanged = previousDateKey !== currentDateKey;
  const isOutsideAlertWindow = !getProductExpiryAlertStatus(product, options);

  if (dateChanged || isOutsideAlertWindow) {
    product.expiryAlertSent = false;
    product.expiryAlertSentAt = null;
  }

  return product;
};
