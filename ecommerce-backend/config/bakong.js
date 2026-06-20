import crypto from "crypto";

const BAKONG_ACCOUNT_TYPES = new Set(["INDIVIDUAL", "MERCHANT"]);

const normalizeUrl = (value = "") => String(value).trim().replace(/\/+$/, "");
const normalizeToken = (value = "") =>
  String(value)
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();

export const getBakongTokenDiagnostic = (tokenValue = process.env.BAKONG_TOKEN) => {
  const token = normalizeToken(tokenValue);
  let expiresAt = null;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8")
    );
    expiresAt = payload.exp
      ? new Date(Number(payload.exp) * 1000).toISOString()
      : null;
  } catch {
    // A token can still be valid even when it is not a JWT.
  }

  return {
    present: Boolean(token),
    length: token.length,
    hash: token
      ? crypto.createHash("sha256").update(token).digest("hex").slice(0, 12)
      : null,
    expiresAt,
  };
};

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
  token: normalizeToken(process.env.BAKONG_TOKEN),
  apiBaseUrl: normalizeUrl(
    process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh"
  ),
  deepLinkUrl: String(process.env.BAKONG_DEEP_LINK_URL || "").trim(),
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
  reconciliationLookbackMs: Math.max(
    5 * 60 * 1000,
    Number.parseInt(process.env.BAKONG_RECONCILIATION_LOOKBACK_MS, 10)
      || 24 * 60 * 60 * 1000
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

  if (config.deepLinkUrl) {
    try {
      const deepLinkUrl = new URL(config.deepLinkUrl);
      if (
        deepLinkUrl.protocol !== "https:"
        || deepLinkUrl.pathname !== "/v1/generate_deeplink_by_qr"
      ) {
        errors.push(
          "BAKONG_DEEP_LINK_URL must use HTTPS and end with /v1/generate_deeplink_by_qr"
        );
      }
    } catch {
      errors.push("BAKONG_DEEP_LINK_URL must be a valid URL");
    }
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
