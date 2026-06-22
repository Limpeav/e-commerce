import asyncHandler from "express-async-handler";
import { isGeminiConfigured, translateTextWithGemini } from "../utils/geminiTranslation.js";

const SUPPORTED_LANGUAGES = {
  en: "English",
  km: "Khmer",
};

export const translateText = asyncHandler(async (req, res) => {
  const { text, targetLanguage = "km", sourceLanguage = "auto" } = req.body || {};
  const normalizedTargetLanguage = String(targetLanguage).trim().toLowerCase();
  const normalizedSourceLanguage = String(sourceLanguage || "auto").trim();

  if (!isGeminiConfigured()) {
    return res.status(500).json({ message: "Gemini API key is not configured" });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ message: "Text is required" });
  }

  if (!SUPPORTED_LANGUAGES[normalizedTargetLanguage]) {
    return res.status(400).json({ message: "Unsupported target language" });
  }

  if (text.length > 5000) {
    return res.status(400).json({ message: "Text must be 5000 characters or fewer" });
  }

  const targetLanguageName = SUPPORTED_LANGUAGES[normalizedTargetLanguage];
  const sourceInstruction =
    normalizedSourceLanguage === "auto"
      ? "Detect the source language automatically."
      : `The source language is ${SUPPORTED_LANGUAGES[normalizedSourceLanguage] || normalizedSourceLanguage}.`;

  try {
    const translatedText = await translateTextWithGemini({
      text: text.trim(),
      targetLanguageName,
      sourceInstruction,
    });

    if (!translatedText) {
      return res.status(502).json({ message: "Translation service returned an empty response" });
    }

    res.json({
      sourceLanguage: normalizedSourceLanguage,
      targetLanguage: normalizedTargetLanguage,
      translatedText,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Translation failed";

    res.status(status >= 400 && status < 500 ? status : 502).json({ message });
  }
});
