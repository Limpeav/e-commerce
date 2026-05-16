import axios from "axios";
import asyncHandler from "express-async-handler";

const SUPPORTED_LANGUAGES = {
  en: "English",
  km: "Khmer",
};

export const translateText = asyncHandler(async (req, res) => {
  const { text, targetLanguage = "km", sourceLanguage = "auto" } = req.body || {};
  const normalizedTargetLanguage = String(targetLanguage).trim().toLowerCase();
  const normalizedSourceLanguage = String(sourceLanguage || "auto").trim();

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: "OpenAI API key is not configured" });
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
    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are a precise ecommerce translation engine. Translate only the user-provided text. Preserve product names, prices, measurements, brand names, URLs, emojis, and formatting. Do not add explanations.",
          },
          {
            role: "user",
            content: `${sourceInstruction}\nTranslate to ${targetLanguageName}.\n\nText:\n${text.trim()}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const translatedText = response.data?.output_text?.trim();

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
