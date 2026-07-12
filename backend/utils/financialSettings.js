import FinancialSettings from "../models/FinancialSettings.js";

export const DEFAULT_FINANCIAL_SETTINGS = {
  usdToKhrRate: 4100,
  khrToUsdRate: 1 / 4100,
  taxPercentage: 8,
  deliveryFee: 0,
};

const toFiniteNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const sanitizeFinancialSettings = (settings = {}) => {
  const usdToKhrRate = Math.max(
    1,
    toFiniteNumber(settings.usdToKhrRate, DEFAULT_FINANCIAL_SETTINGS.usdToKhrRate)
  );
  const khrToUsdRate = Math.max(
    0.000001,
    toFiniteNumber(settings.khrToUsdRate, 1 / usdToKhrRate)
  );
  const taxPercentage = Math.min(
    100,
    Math.max(
      0,
      toFiniteNumber(settings.taxPercentage, DEFAULT_FINANCIAL_SETTINGS.taxPercentage)
    )
  );
  const deliveryFee = Math.max(
    0,
    toFiniteNumber(settings.deliveryFee, DEFAULT_FINANCIAL_SETTINGS.deliveryFee)
  );

  return {
    usdToKhrRate,
    khrToUsdRate,
    taxPercentage,
    deliveryFee,
  };
};

export const getFinancialSettings = async () => {
  const settings = await FinancialSettings.findOne({ key: "default" }).lean();
  return sanitizeFinancialSettings(settings || DEFAULT_FINANCIAL_SETTINGS);
};

export const upsertFinancialSettings = async (payload = {}, updatedBy = null) => {
  const settings = sanitizeFinancialSettings(payload);

  return FinancialSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        ...settings,
        updatedBy,
      },
      $setOnInsert: { key: "default" },
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();
};

export const calculateFinancialTotals = (
  subtotal = 0,
  settings = DEFAULT_FINANCIAL_SETTINGS
) => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeSettings = sanitizeFinancialSettings(settings);
  const taxPrice = safeSubtotal * (safeSettings.taxPercentage / 100);
  const shippingPrice = safeSettings.deliveryFee;

  return {
    subtotal: safeSubtotal,
    shippingPrice,
    taxPrice,
    totalPrice: safeSubtotal + shippingPrice + taxPrice,
  };
};
