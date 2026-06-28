import axios from "axios";

const THAI_SCRIPT_PATTERN = /[\u0E00-\u0E7F]/;
const DEFAULT_AZURE_TRANSLATOR_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

const normalizeAzureLanguageCode = (language = "") => {
  const normalizedLanguage = String(language || "").trim().toLowerCase();

  if (!normalizedLanguage || normalizedLanguage === "auto") {
    return "auto";
  }

  if (normalizedLanguage === "kh") {
    return "km";
  }

  return normalizedLanguage;
};

export const containsThaiScript = (text = "") => THAI_SCRIPT_PATTERN.test(String(text || ""));

export const isAzureTranslatorConfigured = () => Boolean(process.env.AZURE_TRANSLATOR_KEY);

export const translateTextWithAzure = async ({
  text,
  targetLanguage = "km",
  sourceLanguage = "auto",
}) => {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    return "";
  }

  if (!isAzureTranslatorConfigured()) {
    throw new Error("Azure Translator key is not configured");
  }

  const endpoint = String(
    process.env.AZURE_TRANSLATOR_ENDPOINT || DEFAULT_AZURE_TRANSLATOR_ENDPOINT
  ).replace(/\/+$/, "");
  const normalizedSourceLanguage = normalizeAzureLanguageCode(sourceLanguage);
  const normalizedTargetLanguage = normalizeAzureLanguageCode(targetLanguage);
  const params = {
    "api-version": "3.0",
    to: normalizedTargetLanguage,
  };

  if (normalizedSourceLanguage !== "auto") {
    params.from = normalizedSourceLanguage;
  }

  const headers = {
    "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
    "Content-Type": "application/json; charset=UTF-8",
  };

  if (process.env.AZURE_TRANSLATOR_REGION) {
    headers["Ocp-Apim-Subscription-Region"] = process.env.AZURE_TRANSLATOR_REGION;
  }

  const response = await axios.post(
    `${endpoint}/translate`,
    [{ Text: trimmedText }],
    {
      params,
      headers,
      timeout: 30000,
    }
  );

  return response.data?.[0]?.translations?.[0]?.text?.trim() || "";
};
