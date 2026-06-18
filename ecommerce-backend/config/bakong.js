const BAKONG_ACCOUNT_TYPES = new Set(["INDIVIDUAL", "MERCHANT"]);

const normalizeUrl = (value = "") => String(value).trim().replace(/\/+$/, "");

export const getBakongConfig = () => ({
  enabled: process.env.BAKONG_ENABLED !== "false",
  accountType: String(
    process.env.BAKONG_ACCOUNT_TYPE || "INDIVIDUAL"
  ).trim().toUpperCase(),
  accountId: String(process.env.BAKONG_ACCOUNT_ID || "").trim(),
  accountUsername: String(
    process.env.BAKONG_ACCOUNT_USERNAME
      || process.env.BAKONG_MERCHANT_NAME
      || "Cherish Baby Store"
  ).trim(),
  merchantCity: String(
    process.env.BAKONG_MERCHANT_CITY || "Phnom Penh"
  ).trim(),
  phoneNumber: String(process.env.BAKONG_PHONE_NUMBER || "").replace(/\D/g, ""),
  merchantId: String(process.env.BAKONG_MERCHANT_ID || "").trim(),
  acquiringBank: String(process.env.BAKONG_ACQUIRING_BANK || "").trim(),
  token: String(process.env.BAKONG_TOKEN || "").trim(),
  apiBaseUrl: normalizeUrl(
    process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh"
  ),
  exchangeRate: Number.parseFloat(process.env.USD_TO_KHR_RATE) || 4100,
  reconciliationIntervalMs: Math.max(
    5000,
    Number.parseInt(process.env.BAKONG_RECONCILIATION_INTERVAL_MS, 10) || 15000
  ),
  reconciliationBatchSize: Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(process.env.BAKONG_RECONCILIATION_BATCH_SIZE, 10) || 25
    )
  ),
});

export const getBakongConfigErrors = (config = getBakongConfig()) => {
  if (!config.enabled) {
    return [];
  }

  const errors = [];

  if (!BAKONG_ACCOUNT_TYPES.has(config.accountType)) {
    errors.push("BAKONG_ACCOUNT_TYPE must be INDIVIDUAL or MERCHANT");
  }

  if (!config.accountId || !config.accountId.includes("@")) {
    errors.push("BAKONG_ACCOUNT_ID is missing or invalid");
  }

  if (!config.accountUsername) {
    errors.push("BAKONG_ACCOUNT_USERNAME is required");
  }

  if (!config.token) {
    errors.push("BAKONG_TOKEN is required for automatic payment verification");
  }

  try {
    const apiUrl = new URL(config.apiBaseUrl);
    if (apiUrl.protocol !== "https:") {
      errors.push("BAKONG_API_URL must use HTTPS");
    }
  } catch {
    errors.push("BAKONG_API_URL must be a valid URL");
  }

  if (
    config.accountType === "MERCHANT"
    && (
      !config.merchantId
      || !config.acquiringBank
      || config.merchantId === "MERCHANT001"
    )
  ) {
    errors.push(
      "Real BAKONG_MERCHANT_ID and BAKONG_ACQUIRING_BANK values are required for merchant KHQR"
    );
  }

  return errors;
};

export const assertBakongConfig = ({
  production = process.env.NODE_ENV === "production",
} = {}) => {
  const config = getBakongConfig();
  const errors = getBakongConfigErrors(config);

  if (errors.length > 0 && production) {
    throw new Error(`Invalid Bakong configuration: ${errors.join("; ")}`);
  }

  return { config, errors };
};
