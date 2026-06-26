import asyncHandler from "express-async-handler";
import axios from "axios";
import { isGeminiConfigured, translateTextWithGemini } from "../utils/geminiTranslation.js";

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const SUPPORTED_LANGUAGES = {
  en: "English",
  km: "Khmer",
  kh: "Khmer",
};

const createTranslationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toGoogleLanguageCode = (language) => {
  if (language === "kh") {
    return "km";
  }

  return language || "auto";
};

const translateTextWithGoogle = async ({
  text,
  sourceLanguage,
  targetLanguage,
}) => {
  const response = await axios.get(GOOGLE_TRANSLATE_URL, {
    params: {
      client: "gtx",
      sl: toGoogleLanguageCode(sourceLanguage),
      tl: toGoogleLanguageCode(targetLanguage),
      dt: "t",
      q: text,
    },
    timeout: 15000,
  });

  return (
    response.data?.[0]
      ?.map((segment) => segment?.[0] || "")
      .join("")
      .trim() || ""
  );
};

export const translatePlainText = async ({
  text,
  targetLanguage = "km",
  sourceLanguage = "auto",
} = {}) => {
  const normalizedTargetLanguage = String(targetLanguage || "km").trim().toLowerCase();
  const normalizedSourceLanguage = String(sourceLanguage || "auto").trim().toLowerCase();

  if (!text || typeof text !== "string" || !text.trim()) {
    throw createTranslationError("Text is required", 400);
  }

  if (!SUPPORTED_LANGUAGES[normalizedTargetLanguage]) {
    throw createTranslationError("Unsupported target language", 400);
  }

  if (text.length > 5000) {
    throw createTranslationError("Text must be 5000 characters or fewer", 400);
  }

  const targetLanguageName = SUPPORTED_LANGUAGES[normalizedTargetLanguage];
  const sourceInstruction =
    normalizedSourceLanguage === "auto"
      ? "Detect the source language automatically."
      : `The source language is ${SUPPORTED_LANGUAGES[normalizedSourceLanguage] || normalizedSourceLanguage}.`;

  let translatedText = "";
  let primaryError = null;

  if (isGeminiConfigured()) {
    try {
      translatedText = await translateTextWithGemini({
        text: text.trim(),
        targetLanguageName,
        sourceInstruction,
      });
    } catch (error) {
      primaryError = error;
      console.warn("Gemini plain-text translation failed:", error.message);
    }
  }

  if (!translatedText) {
    try {
      translatedText = await translateTextWithGoogle({
        text: text.trim(),
        sourceLanguage: normalizedSourceLanguage,
        targetLanguage: normalizedTargetLanguage,
      });
    } catch (error) {
      const message =
        primaryError?.response?.data?.error?.message ||
        primaryError?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Translation failed";

      throw createTranslationError(message, primaryError?.statusCode || error.response?.status || 502);
    }
  }

  if (!translatedText) {
    throw createTranslationError("Translation service returned an empty response", 502);
  }

  return {
    sourceLanguage: normalizedSourceLanguage,
    targetLanguage: normalizedTargetLanguage,
    originalText: text.trim(),
    translatedText,
  };
};

export const translateText = asyncHandler(async (req, res) => {
  try {
    res.json(await translatePlainText(req.body));
  } catch (error) {
    const status = error.statusCode || error.response?.status || 500;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Translation failed";

    res.status(error.statusCode || (status >= 400 && status < 500 ? status : 502)).json({ message });
  }
});
