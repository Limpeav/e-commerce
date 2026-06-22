const EXPIRY_CATEGORIES = new Set(["Milk", "Bath & Skin"]);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const productSupportsExpiry = (category) =>
  EXPIRY_CATEGORIES.has(String(category || "").trim());

export const getExpiryDateValue = (value) => {
  if (!value) return "";

  const dateOnlyValue = String(value).slice(0, 10);
  return DATE_ONLY_PATTERN.test(dateOnlyValue) ? dateOnlyValue : "";
};

export const formatExpiryDate = (value, options = {}) => {
  const dateOnlyValue = getExpiryDateValue(value);
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
